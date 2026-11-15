"""
MilWeb OS — a entidade (personagem 3D do portfólio).

Constrói do zero, de forma reproduzível: malha de placas rígidas, armadura,
animações-base, o .blend editável e o GLB usado no site.

    blender --background --factory-startup --python assets/entity/build_entity.py -- [--render] [--no-export]

Convenções (valem para o Blender e para o runtime em three.js):
  · Espaço do personagem: X = esquerda do personagem, −Y = frente, Z = cima (Blender);
    o glTF sai com Y para cima e a frente em +Z.
  · Cada osso aponta pelo +Y local. Nos ossos verticais (tronco, cabeça): X = esquerda,
    Z = frente. Nos braços (pose T): Z = frente; o cotovelo dobra levando o antebraço
    para o +Z do braço. Nos dedos, a flexão é uma rotação em torno do Z local
    (+ no lado direito, − no esquerdo).
  · Placas rígidas: cada vértice pesa 100% em UM osso — o metal não deforma.
  · Nomes sem ponto (o GLTFLoader do three remove pontos): upper_arm_R, index_02_L…
"""
import bpy, bmesh, math, os, sys, json, random
from math import sin, cos, pi, radians
from mathutils import Vector, Matrix, Quaternion

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT_BLEND = os.path.join(HERE, "entity.blend")
OUT_GLB = os.path.normpath(os.path.join(HERE, "..", "..", "public", "models", "entity.glb"))
OUT_RENDERS = os.path.join(HERE, "renders")

# --------------------------------------------------------------------------------------
# cena limpa
# --------------------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
SC = bpy.context.scene
SC.render.fps = 24
COL = bpy.data.collections.new("Entity")
SC.collection.children.link(COL)


def material(name, color, metallic, rough, emission=None, strength=0.0, double=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = strength
    m.use_backface_culling = not double
    m.diffuse_color = (*color, 1)
    return m


# Quatro materiais, sem textura (aparência reproduzível em glTF só com fatores PBR).
M_GRAPHITE = material("MW_Graphite", (0.030, 0.032, 0.036), 0.55, 0.44, double=True)   # placas de grafite
M_METAL = material("MW_DarkMetal", (0.008, 0.008, 0.010), 0.95, 0.26)                    # núcleo e juntas (metal escurecido)
M_STEEL = material("MW_Steel", (0.115, 0.118, 0.128), 0.90, 0.30, double=True)            # frisos e lâminas (aço gasto)
M_GLOW = material("MW_Glow", (0.02, 0.0, 0.0), 0.0, 0.5, emission=(1.0, 0.07, 0.05), strength=3.2)  # juntas e fenda

# --------------------------------------------------------------------------------------
# superfícies paramétricas
# --------------------------------------------------------------------------------------
def _cr(p0, p1, p2, p3, t):
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)


class Surf:
    """Superfície de um membro em coordenadas locais do osso: P(θ, y).
    rings: (y, rx, rz[, cx, cz, n]) — raios em X/Z, centro, expoente da superelipse (2 = elipse, 4 = quase caixa).
    θ = 0 aponta para +X, θ = 90° para +Z."""

    def __init__(self, rings, mod=None):
        self.r = sorted([tuple(list(r) + [0, 0, 2.5][len(r) - 3:]) if len(r) < 6 else tuple(r) for r in rings])
        self.mod = mod

    def at(self, y):
        r = self.r
        if y <= r[0][0]:
            return r[0][1:]
        if y >= r[-1][0]:
            return r[-1][1:]
        for i in range(len(r) - 1):
            a, b = r[i], r[i + 1]
            if a[0] <= y <= b[0]:
                t = (y - a[0]) / (b[0] - a[0])
                p0, p3 = r[max(i - 1, 0)], r[min(i + 2, len(r) - 1)]
                v = [_cr(p0[k], a[k], b[k], p3[k], t) for k in range(1, 6)]
                lo = [min(a[k], b[k]) for k in range(1, 6)]
                hi = [max(a[k], b[k]) for k in range(1, 6)]
                # sem ultrapassar muito os anéis vizinhos (evita barrigas)
                return [min(max(v[k], lo[k] - 0.15 * (hi[k] - lo[k])), hi[k] + 0.15 * (hi[k] - lo[k])) for k in range(5)]

    def pt(self, th, y, off=0.0, scale=1.0):
        rx, rz, cx, cz, n = self.at(y)
        rx, rz = max(rx, 1e-5), max(rz, 1e-5)
        c, s = cos(th), sin(th)
        e = 2.0 / max(n, 1.0)
        ux = math.copysign(abs(c) ** e, c)
        uz = math.copysign(abs(s) ** e, s)
        m = (self.mod(th, y) if self.mod else 1.0) * scale
        x, z = cx + rx * ux * m, cz + rz * uz * m
        if off:
            nx = math.copysign(abs(c) ** (2 - e), c) / rx
            nz = math.copysign(abs(s) ** (2 - e), s) / rz
            l = math.hypot(nx, nz) or 1.0
            x += off * nx / l
            z += off * nz / l
        return Vector((x, y, z))


def _f(v, t):
    return v(t) if callable(v) else v


def patch(surf, th0, th1, y0, y1, nu=8, nv=6, off=0.0, scale=1.0, closed=False):
    """Placa: grade de quads sobre a superfície. th0/th1 (graus) podem ser funções de v; y0/y1, funções de u —
    é assim que os recortes ficam inclinados, em V, assimétricos."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    cols = nu if closed else nu + 1
    grid = []
    for i in range(cols):
        u = i / nu
        row = []
        for j in range(nv + 1):
            v = j / nv
            th = radians(_f(th0, v) + (_f(th1, v) - _f(th0, v)) * u)
            y = _f(y0, u) + (_f(y1, u) - _f(y0, u)) * v
            vert = bm.verts.new(surf.pt(th, y, off, scale))
            row.append((vert, (th * 0.12, y)))
        grid.append(row)
    for i in range(nu):
        i2 = (i + 1) % cols
        for j in range(nv):
            quad = [grid[i][j], grid[i][j + 1], grid[i2][j + 1], grid[i2][j]]
            f = bm.faces.new([q[0] for q in quad])
            for loop, q in zip(f.loops, quad):
                loop[uv].uv = q[1]
    return bm


def tube(surf, y0, y1, nu=12, nv=6, off=0.0, scale=1.0, cap0=True, cap1=True):
    """Tubo fechado (núcleo, falange, lâmina) com tampas."""
    bm = patch(surf, 0, 360, y0, y1, nu, nv, off, scale, closed=True)
    bm.verts.ensure_lookup_table()
    for cap, y, flip in ((cap0, y0, False), (cap1, y1, True)):
        if not cap:
            continue
        rx, rz, cx, cz, n = surf.at(y)
        c = bm.verts.new((cx, y, cz))
        ring = [v for v in bm.verts if abs(v.co.y - y) < 1e-7 and v is not c]
        ring.sort(key=lambda v: math.atan2(v.co.z - cz, v.co.x - cx))
        for k in range(len(ring)):
            a, b = ring[k], ring[(k + 1) % len(ring)]
            bm.faces.new([c, a, b] if flip else [c, b, a])
    return bm


def cyl_x(center, r, half, n=14):
    """Cilindro ao longo do X local — o eixo da dobradiça (cotovelo, joelho)."""
    bm = bmesh.new()
    cx, cy, cz = center
    ends = []
    for sx in (-half, half):
        ring = [bm.verts.new((cx + sx, cy + r * cos(2 * pi * k / n), cz + r * sin(2 * pi * k / n))) for k in range(n)]
        ends.append(ring)
    for k in range(n):
        k2 = (k + 1) % n
        bm.faces.new([ends[0][k], ends[1][k], ends[1][k2], ends[0][k2]])
    bm.faces.new(ends[0])
    bm.faces.new(list(reversed(ends[1])))
    return bm


def cyl_axis(center, axis, r, half, n=12):
    """Cilindro num eixo qualquer (nós dos dedos: eixo Z local)."""
    bm = cyl_x((0, 0, 0), r, half, n)
    q = Vector((1, 0, 0)).rotation_difference(Vector(axis).normalized())
    bmesh.ops.rotate(bm, verts=bm.verts[:], cent=(0, 0, 0), matrix=q.to_matrix())
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=center)
    return bm


def sphere(center, r, u=14, v=9):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=center)
    return bm


def torus(center, axis, R, r, n=20, m=6):
    """Anel (friso luminoso das juntas) em volta de um eixo."""
    bm = bmesh.new()
    rings = []
    for i in range(n):
        a = 2 * pi * i / n
        ring = []
        for j in range(m):
            b = 2 * pi * j / m
            rr = R + r * cos(b)
            ring.append(bm.verts.new((r * sin(b), rr * cos(a), rr * sin(a))))  # eixo = X
        rings.append(ring)
    for i in range(n):
        for j in range(m):
            bm.faces.new([rings[i][j], rings[(i + 1) % n][j], rings[(i + 1) % n][(j + 1) % m], rings[i][(j + 1) % m]])
    q = Vector((1, 0, 0)).rotation_difference(Vector(axis).normalized())
    bmesh.ops.rotate(bm, verts=bm.verts[:], cent=(0, 0, 0), matrix=q.to_matrix())
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=center)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def shard(size, stretch, seed):
    """Fragmento: icosaedro esticado e irregular, facetado."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=size)
    for v in bm.verts:
        k = 0.62 + rnd.random() * 0.7
        v.co = Vector((v.co.x * k * stretch[0], v.co.y * k * stretch[1], v.co.z * k * stretch[2]))
    tilt = Quaternion(Vector((rnd.random() - 0.5, rnd.random() - 0.5, rnd.random() - 0.5)).normalized(), radians(18 + 30 * rnd.random()))
    bmesh.ops.rotate(bm, verts=bm.verts[:], cent=(0, 0, 0), matrix=tilt.to_matrix())
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


# --------------------------------------------------------------------------------------
# armadura
# --------------------------------------------------------------------------------------
FRONT = Vector((0, -1, 0))
UP = Vector((0, 0, 1))

BONES = []  # (nome, head, tail, pai, z_hint)


def bone(name, head, tail, parent, zhint=FRONT):
    BONES.append((name, Vector(head), Vector(tail), parent, Vector(zhint)))


bone("root", (0, 0, 0), (0, 0, 0.20), None)
bone("hips", (0, 0, 1.10), (0, 0, 1.18), "root")
bone("spine", (0, 0, 1.18), (0, 0, 1.37), "hips")
bone("chest", (0, 0, 1.37), (0, 0, 1.63), "spine")
bone("neck", (0, 0, 1.63), (0, 0, 1.72), "chest")
bone("head", (0, 0, 1.72), (0, 0, 1.96), "neck")

FINGERS = {
    # nó (local da mão: x cima, y para os dedos, z frente/polegar), direção local, comprimentos, raio
    "index": ((0.000, 0.102, 0.030), (0.0, 0.9976, 0.0698), (0.047, 0.031, 0.028), 0.0105),
    "middle": ((0.001, 0.106, 0.010), (0.0, 1.0, 0.0), (0.051, 0.034, 0.029), 0.0108),
    "ring": ((0.000, 0.102, -0.010), (0.0, 0.998, -0.060), (0.047, 0.031, 0.027), 0.0102),
    "pinky": ((-0.001, 0.094, -0.029), (0.0, 0.990, -0.140), (0.037, 0.025, 0.023), 0.0090),
    "thumb": ((-0.006, 0.026, 0.032), (-0.10, 0.60, 0.79), (0.045, 0.035, 0.031), 0.0115),
}
ARM = {"shoulder": 0.195, "upper": 0.35, "fore": 0.33, "palm": 0.10, "z": 1.595}

for side, sx in (("R", -1.0), ("L", 1.0)):
    z = ARM["z"]
    xs = sx * ARM["shoulder"]
    xe = xs + sx * ARM["upper"]
    xw = xe + sx * ARM["fore"]
    bone(f"clavicle_{side}", (sx * 0.04, 0, z - 0.01), (xs, 0, z), "chest")
    bone(f"upper_arm_{side}", (xs, 0, z), (xe, 0, z), f"clavicle_{side}")
    bone(f"forearm_{side}", (xe, 0, z), (xw, 0, z), f"upper_arm_{side}")
    bone(f"hand_{side}", (xw, 0, z), (xw + sx * ARM["palm"], 0, z), f"forearm_{side}")
    H = Vector((xw, 0, z))

    def hw(p, _sx=sx, _H=H):  # local da mão → espaço do personagem (direita: y→−X, z→−Y(frente), x→+Z)
        return _H + Vector((_sx * p[1], -p[2], p[0]))

    def hd(d, _sx=sx):
        return Vector((_sx * d[1], -d[2], d[0])).normalized()

    for fname, (root_l, dir_l, lens, rad_) in FINGERS.items():
        p = hw(root_l)
        d = hd(dir_l)
        if fname == "thumb":
            # o polegar fecha para dentro e por baixo da palma: X local = −(direção da flexão).
            # Calculado no lado direito e espelhado, para o esquerdo seguir a MESMA convenção dos outros dedos.
            d_r = hd(dir_l, -1.0)
            flex = hd((-0.62, 0.45, -0.62), -1.0)
            flex = (flex - d_r * flex.dot(d_r)).normalized()
            zh = (-flex).cross(d_r)
            if side == "L":
                zh = Vector((-zh.x, zh.y, zh.z))
        else:
            zh = FRONT
        parent = f"hand_{side}"
        for k, ln in enumerate(lens):
            nm = f"{fname}_0{k + 1}_{side}"
            bone(nm, p, p + d * ln, parent, zh)
            parent = nm
            p = p + d * ln
        if fname == "index":
            bone(f"tip_index_{side}", p, p + d * 0.012, parent, zh)

    lx = sx * 0.082
    bone(f"thigh_{side}", (lx, 0, 1.075), (lx * 1.06, -0.005, 0.60), "hips")
    bone(f"shin_{side}", (lx * 1.06, -0.005, 0.60), (lx * 1.06, 0.015, 0.155), f"thigh_{side}")
    bone(f"foot_{side}", (lx * 1.06, 0.015, 0.155), (lx * 1.06, -0.040, -0.02), f"shin_{side}")

FRAGS = [
    ((-0.48, 0.10, 1.88), 0.105, (0.30, 0.22, 1.7)),
    ((0.52, 0.08, 1.38), 0.090, (0.26, 0.30, 1.6)),
    ((0.35, -0.04, 2.06), 0.060, (1.5, 0.26, 0.34)),
    ((-0.45, 0.12, 0.96), 0.080, (0.24, 0.32, 1.7)),
    ((0.40, 0.10, 0.54), 0.095, (0.32, 0.24, 1.6)),
    ((-0.30, 0.06, 0.30), 0.055, (0.28, 0.28, 1.5)),
]
for i, (p, s, st) in enumerate(FRAGS):
    bone(f"frag_0{i + 1}", p, (p[0], p[1], p[2] + 0.08), "root")

arm_data = bpy.data.armatures.new("EntityRig")
ARM_OB = bpy.data.objects.new("Entity", arm_data)
COL.objects.link(ARM_OB)
bpy.context.view_layer.objects.active = ARM_OB
bpy.ops.object.mode_set(mode="EDIT")
for name, head, tail, parent, zh in BONES:
    eb = arm_data.edit_bones.new(name)
    eb.head, eb.tail = head, tail
    if parent:
        eb.parent = arm_data.edit_bones[parent]
        eb.use_connect = False
    eb.align_roll(zh)
bpy.ops.object.mode_set(mode="OBJECT")
arm_data.display_type = "STICK"
REST = {b.name: b.matrix_local.copy() for b in arm_data.bones}
LEN = {b.name: b.length for b in arm_data.bones}

# --------------------------------------------------------------------------------------
# acabamento de cada peça: espessura, chanfro, normais ponderadas, peso rígido no osso
# --------------------------------------------------------------------------------------
PARTS = []


def _apply(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def finish(bm, name, bone_name, mat, thick=0.0, bevel=0.0, rim_only=False, mirror=False, seg=2, flat=False):
    if mirror:
        for v in bm.verts:
            v.co.x = -v.co.x
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    me.materials.append(mat)
    if thick:
        m = ob.modifiers.new("Solid", "SOLIDIFY")
        m.thickness, m.offset, m.use_rim, m.use_rim_only, m.use_even_offset = thick, -1.0, True, rim_only, True
    if bevel:
        m = ob.modifiers.new("Bevel", "BEVEL")
        m.width, m.segments, m.limit_method, m.angle_limit = bevel, seg, "ANGLE", radians(40)
    if thick or bevel:
        _apply(ob)
    me = ob.data
    b2 = bmesh.new()
    b2.from_mesh(me)
    lim = radians(1 if flat else 50)
    for e in b2.edges:
        e.smooth = (not e.is_boundary) and len(e.link_faces) == 2 and e.calc_face_angle(0.0) < lim
    for f in b2.faces:
        f.smooth = True
    b2.to_mesh(me)
    b2.free()
    m = ob.modifiers.new("WN", "WEIGHTED_NORMAL")
    m.keep_sharp, m.weight, m.mode = True, 60, "FACE_AREA"
    _apply(ob)
    ob.data.transform(REST[bone_name])
    vg = ob.vertex_groups.new(name=bone_name)
    vg.add(list(range(len(ob.data.vertices))), 1.0, "REPLACE")
    PARTS.append(ob)
    return ob


def plate(name, bone_name, surf, th0, th1, y0, y1, nu=8, nv=6, off=0.006, thick=0.011, bevel=0.0032, mat=None, mirror=False, rim_only=True, scale=1.0):
    return finish(patch(surf, th0, th1, y0, y1, nu, nv, off, scale), name, bone_name, mat or M_GRAPHITE, thick, bevel, rim_only, mirror)


def glow(name, bone_name, bm, mirror=False):
    return finish(bm, name, bone_name, M_GLOW, mirror=mirror)


tri = lambda u: 1.0 - abs(2.0 * u - 1.0)  # 0 nas pontas, 1 no meio


# --------------------------------------------------------------------------------------
# TRONCO  (ossos verticais: X = esquerda do personagem, Y = cima, Z = frente; θ: 0 esq · 90 frente · 180 dir · 270 costas)
# --------------------------------------------------------------------------------------
S_HIPS = Surf([(-0.115, 0.030, 0.040, 0, 0, 2.2), (-0.06, 0.085, 0.066, 0, 0, 2.5), (0.0, 0.112, 0.078, 0, 0, 2.9), (0.045, 0.098, 0.070, 0, 0, 2.8), (0.08, 0.070, 0.055, 0, 0, 2.5)])
finish(tube(S_HIPS, -0.115, 0.08, 16, 6, scale=0.88), "hips_core", "hips", M_METAL, bevel=0.003)
plate("hips_front", "hips", S_HIPS, 40, 140, lambda u: -0.098 + 0.075 * abs(2 * u - 1) ** 1.3, 0.062, 10, 5)
plate("hips_left", "hips", S_HIPS, -45, 32, lambda u: -0.03 - 0.04 * u, lambda u: 0.07 - 0.012 * u, 7, 4, off=0.009)
plate("hips_right", "hips", S_HIPS, 148, 216, lambda u: -0.04 + 0.035 * u, 0.066, 6, 4, off=0.007)
plate("hips_back", "hips", S_HIPS, 224, 316, lambda u: -0.06 + 0.03 * tri(u), 0.064, 8, 4)
# tasset: lâmina longa pendurada no quadril esquerdo — a assimetria da silhueta na cintura
S_TASSET = Surf([(-0.40, 0.005, 0.009, 0.176, -0.012, 2.2), (-0.33, 0.014, 0.032, 0.176, -0.008, 2.9), (-0.17, 0.017, 0.054, 0.170, 0, 3.1), (-0.03, 0.019, 0.060, 0.152, 0, 3.1), (0.05, 0.016, 0.046, 0.128, 0, 2.9)])
finish(tube(S_TASSET, -0.40, 0.05, 10, 8), "hips_tasset", "hips", M_GRAPHITE, bevel=0.003)
glow("hips_tasset_glow", "hips", tube(Surf([(-0.29, 0.0028, 0.004, 0.1935, 0.0, 2), (-0.09, 0.0028, 0.004, 0.1905, 0.0, 2)]), -0.29, -0.09, 6, 2))

# cintura vazada: só a coluna (metal) no meio e costelas flutuantes dos lados — espaço negativo na silhueta
S_SPINE = Surf([(-0.02, 0.052, 0.044, 0, 0, 2.3), (0.07, 0.038, 0.034, 0, -0.004, 2.3), (0.14, 0.040, 0.036, 0, -0.004, 2.3), (0.21, 0.062, 0.050, 0, 0, 2.4)])
S_RIBS = Surf([(-0.01, 0.098, 0.070, 0, 0, 2.7), (0.06, 0.086, 0.064, 0, 0, 2.6), (0.13, 0.094, 0.068, 0, 0, 2.7), (0.21, 0.120, 0.082, 0, 0, 2.8)])
finish(tube(S_SPINE, -0.02, 0.21, 12, 6, cap0=False, cap1=False), "spine_core", "spine", M_METAL)
for k in range(4):
    plate(f"spine_vert_{k}", "spine", S_SPINE, 246, 294, 0.004 + k * 0.05, 0.040 + k * 0.05, 3, 2, off=0.007, thick=0.008, bevel=0.0026, mat=M_STEEL)
    plate(f"spine_keel_{k}", "spine", S_SPINE, 74, 106, 0.010 + k * 0.05, 0.042 + k * 0.05, 2, 2, off=0.005, thick=0.007, bevel=0.0024)
for k, (base, th_a) in enumerate(((0.030, 126), (0.092, 118), (0.156, 110))):  # costelas direitas (três)
    plate(f"rib_R_{k}", "spine", S_RIBS, th_a, 242,
          lambda u, b=base: b + 0.034 * (1 - u) - 0.5 * (0.012 + 0.030 * u ** 0.7) - 0.03,
          lambda u, b=base: b + 0.034 * (1 - u) + 0.5 * (0.012 + 0.030 * u ** 0.7) - 0.03, 9, 2, off=0.004, thick=0.009, bevel=0.0028)
for k, (base, th_b) in enumerate(((0.060, 58), (0.132, 68))):  # costelas esquerdas (duas, desencontradas)
    plate(f"rib_L_{k}", "spine", S_RIBS, -60, th_b,
          lambda u, b=base: b + 0.034 * u - 0.5 * (0.012 + 0.030 * (1 - u) ** 0.7) - 0.03,
          lambda u, b=base: b + 0.034 * u + 0.5 * (0.012 + 0.030 * (1 - u) ** 0.7) - 0.03, 9, 2, off=0.004, thick=0.009, bevel=0.0028)
glow("spine_glow", "spine", patch(S_SPINE, 268.6, 271.4, 0.0, 0.20, 1, 6, off=0.0005))

S_CHEST = Surf([(-0.015, 0.082, 0.064, 0, 0, 2.6), (0.06, 0.124, 0.088, 0, 0.004, 2.9), (0.15, 0.166, 0.100, 0, 0.006, 3.1), (0.222, 0.158, 0.088, 0, 0, 2.9), (0.258, 0.078, 0.064, 0, -0.004, 2.4), (0.285, 0.045, 0.045, 0, -0.006, 2.0)], mod=lambda th, y: 1.0 + 0.07 * math.exp(-((math.degrees(th) % 360 - 90) / 24.0) ** 2))
finish(tube(S_CHEST, -0.015, 0.285, 18, 8, scale=0.92), "chest_core", "chest", M_METAL)
# peitoral direito: uma placa só, com a base em chanfro subindo para o lado
plate("chest_pec_R", "chest", S_CHEST, 96, 184, lambda u: 0.118 + 0.050 * u, lambda u: 0.236 - 0.02 * u, 10, 4, off=0.009, thick=0.013)
plate("chest_pec_R2", "chest", S_CHEST, 96, 176, lambda u: 0.030 + 0.075 * u ** 1.4, lambda u: 0.104 + 0.050 * u, 9, 3, off=0.007, thick=0.011)
# peitoral esquerdo: duas placas separadas por um recorte diagonal
plate("chest_pec_L", "chest", S_CHEST, -4, 82, lambda u: 0.152 - 0.044 * u, lambda u: 0.212 + 0.024 * u, 10, 4, off=0.009, thick=0.013)
plate("chest_rib_L", "chest", S_CHEST, 6, 82, lambda u: 0.108 - 0.070 * u, lambda u: 0.138 - 0.042 * u, 9, 2, off=0.006, thick=0.010)
plate("chest_rib_L2", "chest", S_CHEST, -20, 46, lambda u: 0.020, lambda u: 0.090 - 0.050 * u, 7, 3, off=0.005, thick=0.009)
glow("chest_glow", "chest", patch(S_CHEST, 88.2, 89.8, 0.050, 0.205, 1, 6, off=0.0008, scale=0.92))
# costas: duas escápulas com cortes diferentes e a coluna aparente entre elas
plate("chest_scap_R", "chest", S_CHEST, 196, 262, lambda u: 0.055 + 0.05 * (1 - u), lambda u: 0.230 - 0.015 * (1 - u), 8, 6, off=0.008, thick=0.012)
plate("chest_scap_L", "chest", S_CHEST, 279, 346, lambda u: 0.11 - 0.05 * (1 - u), lambda u: 0.224 - 0.03 * u, 8, 6, off=0.008, thick=0.012)
plate("chest_low_back", "chest", S_CHEST, 222, 320, 0.0, lambda u: 0.042 + 0.02 * tri(u), 8, 2, off=0.005, thick=0.009)
glow("chest_spine_glow", "chest", patch(S_CHEST, 269.2, 270.8, 0.0, 0.232, 1, 6, off=0.0008, scale=0.92))
# gola: mais alta do lado direito, aberta atrás à esquerda
S_COLLAR = Surf([(0.222, 0.104, 0.084, 0, -0.004, 2.7), (0.266, 0.074, 0.068, 0, -0.006, 2.5), (0.320, 0.062, 0.062, 0, -0.008, 2.4)])
plate("chest_collar", "chest", S_COLLAR, 26, 262, 0.232, lambda u: 0.266 + 0.050 * u ** 2, 14, 3, off=0.010, thick=0.008, bevel=0.0026, mat=M_STEEL, rim_only=False)

S_NECK = Surf([(-0.02, 0.044, 0.044, 0, 0, 2.2), (0.045, 0.034, 0.036, 0, 0.002, 2.2), (0.10, 0.038, 0.042, 0, 0.004, 2.2)])
finish(tube(S_NECK, -0.02, 0.10, 12, 4, cap0=False, cap1=False), "neck_core", "neck", M_METAL)
for k, (a, b) in enumerate(((0.006, 0.030), (0.046, 0.072))):
    finish(patch(S_NECK, 0, 360, a, b, 12, 1, off=0.004, closed=True), f"neck_ring_{k}", "neck", M_GRAPHITE, thick=0.006, bevel=0.002, rim_only=False)
glow("neck_glow", "neck", patch(S_NECK, 0, 360, 0.035, 0.041, 12, 1, off=0.0006, closed=True))

# --------------------------------------------------------------------------------------
# CABEÇA — elmo escultórico assimétrico: placas curvas, perfil varrido para trás, queixo em ponta,
# fenda estreita e inclinada sob a aba da testa, crista só do lado esquerdo
# --------------------------------------------------------------------------------------
S_SKULL = Surf([(-0.02, 0.020, 0.022, 0, 0.020, 2.2), (0.02, 0.046, 0.056, 0, 0.012, 2.3), (0.07, 0.062, 0.082, 0, 0.006, 2.4), (0.125, 0.068, 0.094, 0, -0.004, 2.5), (0.18, 0.062, 0.098, 0, -0.020, 2.5), (0.225, 0.040, 0.075, 0, -0.045, 2.3), (0.25, 0.012, 0.030, 0, -0.070, 2.0)])
prow = lambda th, y: 1.0 + 0.11 * math.exp(-((math.degrees(th) % 360 - 90) / 13.0) ** 2) * max(0.0, min(1.0, (0.20 - y) / 0.10))
S_HELM = Surf([(-0.06, 0.008, 0.012, 0, 0.040, 2.2), (0.0, 0.034, 0.048, 0, 0.022, 2.6), (0.05, 0.058, 0.084, 0, 0.012, 2.9), (0.115, 0.076, 0.104, 0, 0.0, 3.1), (0.175, 0.072, 0.114, 0, -0.022, 3.0), (0.225, 0.050, 0.098, 0, -0.052, 2.6), (0.258, 0.014, 0.036, 0, -0.090, 2.2)], mod=prow)
slit = lambda th: 0.118 + 0.00042 * (th - 90.0)  # linha da fenda (sobe para o lado direito)
GAP = 0.0095
finish(tube(S_SKULL, -0.02, 0.25, 16, 9), "head_core", "head", M_METAL)
glow("head_slit", "head", patch(S_SKULL, 28, 166, lambda u: slit(28 + 138 * u) - 0.006, lambda u: slit(28 + 138 * u) + 0.006, 16, 1, off=0.0012))
plate("head_crown", "head", S_HELM, 19, 202, lambda u: slit(19 + 183 * u) + GAP, 0.246, 16, 6, off=0.005, thick=0.011)
finish(tube(S_HELM, 0.236, 0.258, 14, 2, off=0.003, cap0=False), "head_apex", "head", M_STEEL, bevel=0.002)  # fecha o topo do elmo
plate("head_temple_L", "head", S_HELM, -62, 14, lambda u: 0.108 - 0.02 * u, lambda u: 0.226 + 0.012 * u, 7, 5, off=0.005, thick=0.010)
plate("head_back", "head", S_HELM, 206, 294, lambda u: 0.070 + 0.03 * tri(u), 0.240, 8, 6, off=0.005, thick=0.010)
# máscara em duas metades, com a emenda inclinada e fora do centro
plate("head_mask_L", "head", S_HELM, 33, lambda v: 85.5 + 6.0 * v, lambda u: -0.050 + 0.118 * (1 - u) ** 1.4, lambda u: slit(33 + 55 * u) - GAP, 8, 6, off=0.0, thick=0.010)
plate("head_mask_R", "head", S_HELM, lambda v: 89.5 + 6.0 * v, 148, lambda u: -0.050 + 0.118 * u ** 1.4, lambda u: slit(92 + 56 * u) - GAP, 8, 6, off=0.0, thick=0.010)
# aba da testa (aço): sombreia a fenda e quebra a cúpula
plate("head_brow", "head", S_HELM, 36, 158, lambda u: slit(36 + 122 * u) + GAP - 0.002, lambda u: slit(36 + 122 * u) + GAP + 0.010 + 0.026 * tri(u) ** 0.8, 12, 2, off=0.014, thick=0.008, bevel=0.0026, mat=M_STEEL, rim_only=False)
plate("head_cheek_R", "head", S_HELM, 152, 222, lambda u: 0.030 + 0.02 * u, lambda u: 0.136 - 0.036 * u, 7, 4, off=0.010, thick=0.009, mat=M_STEEL)
plate("head_jaw_L", "head", S_HELM, -52, 28, lambda u: 0.056 - 0.04 * u, lambda u: 0.094 - 0.016 * u, 7, 3, off=0.006, thick=0.009)
plate("head_nape", "head", S_HELM, 228, 312, 0.012, lambda u: 0.056 + 0.01 * tri(u), 7, 2, off=0.004, thick=0.009)
# crista: lâmina que nasce na têmpora esquerda e varre para trás, acima do topo do elmo
S_FIN = Surf([(0.04, 0.012, 0.050, 0.076, 0.008, 3.0), (0.13, 0.013, 0.068, 0.086, -0.012, 3.0), (0.23, 0.011, 0.050, 0.082, -0.050, 3.0), (0.32, 0.007, 0.024, 0.072, -0.090, 2.5), (0.375, 0.002, 0.005, 0.064, -0.112, 2.0)])
finish(tube(S_FIN, 0.04, 0.375, 10, 9), "head_fin", "head", M_GRAPHITE, bevel=0.0028)
glow("head_fin_glow", "head", tube(Surf([(0.07, 0.0026, 0.0034, 0.0995, 0.050, 2), (0.17, 0.0026, 0.0034, 0.0995, 0.030, 2)]), 0.07, 0.17, 6, 2))

# --------------------------------------------------------------------------------------
# BRAÇOS  (local do lado direito: Y ao longo do braço, X = cima na pose T, Z = frente; o esquerdo é espelhado em X)
# --------------------------------------------------------------------------------------
S_PAULD = Surf([(0.05, 0.026, 0.038, 0.034, 0, 2.8), (0.10, 0.056, 0.064, 0.022, 0, 3.0), (0.16, 0.070, 0.072, 0.012, 0, 3.0), (0.22, 0.058, 0.062, 0.006, 0, 2.9), (0.32, 0.034, 0.040, 0.0, 0, 2.7)])
S_UARM = Surf([(0.0, 0.044, 0.044, 0, 0, 2.8), (0.05, 0.042, 0.044, 0, 0, 2.9), (0.16, 0.039, 0.042, 0, 0, 2.9), (0.28, 0.032, 0.035, 0, 0, 2.9), (0.35, 0.030, 0.032, 0, 0, 2.8)])
S_FARM = Surf([(-0.045, 0.032, 0.034, 0, 0, 2.8), (0.0, 0.034, 0.036, 0, 0, 2.8), (0.06, 0.042, 0.042, 0, 0, 3.0), (0.15, 0.039, 0.039, 0, 0, 3.0), (0.26, 0.028, 0.030, 0, 0, 2.9), (0.33, 0.024, 0.027, 0, 0, 2.8)])
S_PALM = Surf([(0.0, 0.0125, 0.026, 0, 0, 3.0), (0.03, 0.0140, 0.036, 0, 0.002, 3.2), (0.07, 0.0130, 0.0435, 0, 0.002, 3.4), (0.103, 0.0110, 0.0435, 0, 0.0, 3.4)])


def phalanx(name, bone_name, ln, r0, r1, mirror, tip=False):
    if tip:
        s = Surf([(0.0, r0, r0 * 0.94, 0, 0, 3.0), (ln * 0.5, r0 * 0.86, r0 * 0.84, -r0 * 0.05, 0, 2.8), (ln * 0.86, r0 * 0.46, r0 * 0.50, -r0 * 0.22, 0, 2.5), (ln, r0 * 0.10, r0 * 0.12, -r0 * 0.34, 0, 2.0)])
    else:
        s = Surf([(0.0, r0, r0 * 0.94, 0, 0, 3.0), (ln * 0.5, (r0 + r1) * 0.5, (r0 + r1) * 0.47, 0, 0, 3.0), (ln, r1, r1 * 0.94, 0, 0, 3.0)])
    finish(tube(s, 0.004 if not tip else 0.003, ln - (0.003 if not tip else 0.0), 8, 4 if tip else 2), name, bone_name, M_GRAPHITE, bevel=0.0012, mirror=mirror, seg=1)
    finish(cyl_axis((0, 0, 0), (0, 0, 1), r0 * 0.92, r0 * 0.86, 10), name + "_knuckle", bone_name, M_METAL, mirror=mirror)


for side in ("R", "L"):
    mx = side == "L"
    big = side == "R"
    cl, ua, fa, hd_ = f"clavicle_{side}", f"upper_arm_{side}", f"forearm_{side}", f"hand_{side}"
    sh = LEN[cl]  # a junta do ombro fica em y = comprimento da clavícula

    # ombro: esfera da junta + ombreira (grande e em duas camadas à direita; pequena à esquerda)
    finish(sphere((0, sh, 0), 0.044), f"shoulder_ball_{side}", cl, M_METAL, mirror=mx)
    if big:
        plate(f"pauldron_{side}", cl, S_PAULD, -100, 98, 0.056, lambda u: 0.200 + 0.125 * tri(u) ** 1.4, 12, 6, off=0.012, thick=0.014, bevel=0.004, mirror=mx, rim_only=False)
        plate(f"pauldron_top_{side}", cl, S_PAULD, -54, 44, lambda u: 0.050 + 0.02 * u, lambda u: 0.140 + 0.045 * tri(u), 7, 3, off=0.028, thick=0.010, mirror=mx, mat=M_STEEL, rim_only=False)
    else:
        plate(f"pauldron_{side}", cl, S_PAULD, -62, 56, 0.080, lambda u: 0.185 + 0.045 * tri(u), 8, 4, off=0.010, thick=0.012, mirror=mx, rim_only=False)

    # braço
    finish(tube(S_UARM, 0.0, 0.35, 12, 5, scale=0.78, cap0=False, cap1=False), f"uarm_core_{side}", ua, M_METAL, mirror=mx)
    plate(f"uarm_outer_{side}", ua, S_UARM, -78, 76, lambda u: 0.046 + 0.034 * abs(2 * u - 1), lambda u: 0.318 - 0.06 * u, 9, 6, off=0.004, mirror=mx)
    plate(f"uarm_front_{side}", ua, S_UARM, 82, 152, 0.062, lambda u: 0.255 + 0.04 * u, 6, 5, off=0.003, thick=0.010, mirror=mx)
    plate(f"uarm_back_{side}", ua, S_UARM, 192, 278, lambda u: 0.10 - 0.03 * u, lambda u: 0.24 + 0.05 * u, 6, 4, off=0.003, thick=0.010, mirror=mx)

    # cotovelo: dobradiça (eixo X local) com as pontas acesas
    finish(cyl_x((0, 0, 0), 0.029, 0.038), f"elbow_{side}", fa, M_METAL, bevel=0.003, mirror=mx)
    for sx_ in (-1, 1):
        glow(f"elbow_glow_{side}_{sx_}", fa, cyl_x((sx_ * 0.0386, 0, 0), 0.011, 0.0012, 12), mirror=mx)

    # antebraço: braçadeira que passa do cotovelo (guarda) e afina até o pulso
    finish(tube(S_FARM, 0.0, 0.33, 12, 5, scale=0.76, cap0=False, cap1=False), f"farm_core_{side}", fa, M_METAL, mirror=mx)
    guard = 0.080 if big else 0.045
    plate(f"farm_bracer_{side}", fa, S_FARM, -104, 100, lambda u: 0.035 - guard * tri(u) ** 1.2, lambda u: 0.302 - 0.045 * (1 - u), 11, 7, off=0.004, thick=0.012, mirror=mx)
    plate(f"farm_inner_{side}", fa, S_FARM, 118, 244, lambda u: 0.055 + 0.03 * u, lambda u: 0.272 - 0.03 * u, 7, 5, off=0.003, thick=0.010, mirror=mx)
    if big:
        glow(f"farm_glow_{side}", fa, patch(S_FARM, 107.5, 110.5, 0.10, 0.24, 1, 5, off=0.0008, scale=0.76), mirror=mx)

    # pulso
    finish(sphere((0, 0, 0), 0.022, 12, 7), f"wrist_{side}", hd_, M_METAL, mirror=mx)
    glow(f"wrist_glow_{side}", hd_, torus((0, -0.012, 0), (0, 1, 0), 0.0245, 0.0020, 16, 5), mirror=mx)

    # mão: palma (metal) + placa do dorso (grafite), cinco dedos com três falanges cada
    finish(tube(S_PALM, 0.0, 0.103, 12, 5), f"palm_{side}", hd_, M_METAL, bevel=0.002, mirror=mx)
    plate(f"hand_back_{side}", hd_, S_PALM, -66, 62, lambda u: 0.012 + 0.022 * u, lambda u: 0.094 - 0.016 * (1 - u), 6, 4, off=0.003, thick=0.005, bevel=0.0016, mirror=mx)
    glow(f"hand_glow_{side}", hd_, cyl_x((0.0185, 0.05, 0.004), 0.0045, 0.0012, 10), mirror=mx)
    for fname, (root_l, dir_l, lens, rad_) in FINGERS.items():
        for k, ln in enumerate(lens):
            r0 = rad_ * (1.0 - 0.10 * k)
            r1 = rad_ * (1.0 - 0.10 * (k + 1))
            phalanx(f"{fname}_{k + 1}_{side}", f"{fname}_0{k + 1}_{side}", ln, r0, r1, mx, tip=(k == 2))

# --------------------------------------------------------------------------------------
# PERNAS  (local do lado direito: Y para baixo, X = lado de fora, Z = frente; a esquerda é espelhada)
# --------------------------------------------------------------------------------------
keel = lambda amp, wid: (lambda th, y: 1.0 + amp * math.exp(-((math.degrees(th) % 360 - 90) / wid) ** 2))
S_THIGH = Surf([(0.0, 0.064, 0.070, 0, 0, 2.8), (0.08, 0.066, 0.074, 0, 0, 2.9), (0.23, 0.056, 0.064, 0, 0, 2.9), (0.40, 0.043, 0.048, 0, 0, 2.8), (0.475, 0.039, 0.043, 0, 0, 2.7)], mod=keel(0.09, 20.0))
S_SHIN = Surf([(-0.10, 0.032, 0.038, 0, 0.004, 2.7), (0.0, 0.043, 0.046, 0, 0, 2.8), (0.07, 0.049, 0.055, 0, -0.006, 2.9), (0.21, 0.039, 0.046, 0, -0.004, 2.9), (0.36, 0.026, 0.030, 0, 0, 2.7), (0.445, 0.022, 0.024, 0, 0, 2.6)], mod=keel(0.22, 15.0))  # quilha na frente da canela
S_FOOT = Surf([(0.0, 0.022, 0.026, 0, 0, 2.6), (0.04, 0.026, 0.033, 0, 0.006, 2.8), (0.11, 0.019, 0.023, 0, 0.004, 2.7), (0.165, 0.008, 0.010, 0, 0.0, 2.3), (0.186, 0.0015, 0.002, 0, 0.0, 2.0)])
S_HEEL = Surf([(-0.03, 0.010, 0.010, 0, -0.020, 2.6), (0.02, 0.015, 0.019, 0, -0.027, 2.8), (0.075, 0.008, 0.010, 0, -0.036, 2.5), (0.105, 0.0015, 0.002, 0, -0.042, 2.0)])

for side in ("R", "L"):
    mx = side == "L"
    th_, sn, ft = f"thigh_{side}", f"shin_{side}", f"foot_{side}"
    finish(sphere((0, 0, 0), 0.054), f"hip_ball_{side}", th_, M_METAL, mirror=mx)
    finish(tube(S_THIGH, 0.0, 0.475, 12, 5, scale=0.78, cap0=False, cap1=False), f"thigh_core_{side}", th_, M_METAL, mirror=mx)
    # frente da coxa em duas placas, separadas por um recorte diagonal
    plate(f"thigh_front_a_{side}", th_, S_THIGH, 38, 150, lambda u: 0.030 + 0.045 * u, lambda u: 0.195 + 0.075 * u, 10, 4, off=0.004, thick=0.012, mirror=mx)
    plate(f"thigh_front_b_{side}", th_, S_THIGH, 34, 146, lambda u: 0.212 + 0.075 * u, lambda u: 0.405 + 0.05 * tri(u), 10, 4, off=0.004, thick=0.012, mirror=mx)
    plate(f"thigh_outer_{side}", th_, S_THIGH, -74, 26, 0.060, lambda u: 0.385 - 0.085 * u, 8, 6, off=0.004, thick=0.012, mirror=mx)
    plate(f"thigh_back_{side}", th_, S_THIGH, 204, 298, lambda u: 0.07 + 0.02 * tri(u), lambda u: 0.345 - 0.03 * u, 7, 5, off=0.003, thick=0.011, mirror=mx)

    finish(cyl_x((0, 0, 0), 0.034, 0.042), f"knee_{side}", sn, M_METAL, bevel=0.003, mirror=mx)
    for sx_ in (-1, 1):
        glow(f"knee_glow_{side}_{sx_}", sn, cyl_x((sx_ * 0.0426, 0, 0), 0.012, 0.0012, 12), mirror=mx)
    finish(tube(S_SHIN, 0.0, 0.445, 12, 5, scale=0.76, cap0=False, cap1=False), f"shin_core_{side}", sn, M_METAL, mirror=mx)
    plate(f"shin_cap_{side}", sn, S_SHIN, 50, 130, lambda u: 0.016 - 0.10 * tri(u) ** 1.1, 0.070, 7, 4, off=0.012, thick=0.011, mirror=mx, mat=M_STEEL, rim_only=False)
    plate(f"shin_front_{side}", sn, S_SHIN, 28, 152, lambda u: 0.085 + 0.02 * abs(2 * u - 1), lambda u: 0.430 - 0.035 * abs(2 * u - 1), 10, 8, off=0.004, thick=0.012, mirror=mx)
    plate(f"shin_calf_{side}", sn, S_SHIN, 206, 334, lambda u: 0.035 + 0.03 * tri(u), lambda u: 0.33 - 0.07 * tri(u), 9, 6, off=0.004, thick=0.011, mirror=mx)

    finish(sphere((0, 0, 0), 0.022, 12, 7), f"ankle_{side}", ft, M_METAL, mirror=mx)
    glow(f"ankle_glow_{side}", ft, torus((0, -0.011, 0), (0, 1, 0), 0.0245, 0.0020, 16, 5), mirror=mx)
    finish(tube(S_FOOT, 0.0, 0.186, 10, 7), f"foot_{side}", ft, M_GRAPHITE, bevel=0.002, mirror=mx)
    finish(tube(S_HEEL, -0.03, 0.105, 8, 5), f"heel_{side}", ft, M_STEEL, bevel=0.0016, mirror=mx)

# --------------------------------------------------------------------------------------
# FRAGMENTOS — poucos, perto do corpo; cada um no seu osso (o runtime os faz derivar)
# --------------------------------------------------------------------------------------
for i, (p, s, st) in enumerate(FRAGS):
    bn = f"frag_0{i + 1}"
    ob = finish(shard(s, st, 11 + i * 7), f"frag_{i + 1}", bn, M_GRAPHITE if i % 3 else M_STEEL, bevel=0.0022, flat=True, seg=1)

# --------------------------------------------------------------------------------------
# junta tudo numa malha só (um draw call por material) e prende na armadura
# --------------------------------------------------------------------------------------
for ob in bpy.context.view_layer.objects:
    ob.select_set(False)
with bpy.context.temp_override(active_object=PARTS[0], selected_objects=PARTS, selected_editable_objects=PARTS):
    bpy.ops.object.join()
BODY = PARTS[0]
BODY.name = "EntityBody"
BODY.data.name = "EntityBody"
BODY.parent = ARM_OB
mod = BODY.modifiers.new("Armature", "ARMATURE")
mod.object = ARM_OB
me = BODY.data
tris = sum(len(p.vertices) - 2 for p in me.polygons)
print(f"ENTITY mesh: {len(me.vertices)} verts, {tris} tris, {len(me.materials)} materiais, {len(arm_data.bones)} ossos")

exec(open(os.path.join(HERE, "entity_anim.py"), encoding="utf-8").read())
