"""
MATÉRIA · esculturas — o estágio do Blender (roda dentro dele):

  blender -b --python assets/materia/sculpt/stage.py -- entrada.npz roteiro.json saida.npz [fonte.blend] [prévia.png]

Recebe as partes esculpidas (pele, cabelo, adereços, bloco…) e os braços na pose de contato, veste a figura
(panejamento por simulação de tecido: túnicas em tubo presas ao peito e à cintura, mantos e aventais em folha),
tira o que a câmera nunca vê, simplifica cada parte até o orçamento de vértices, e calcula por vértice a
oclusão e a sombra da luz principal. Devolve tudo em unidades da cena (x direita, y cima, z para quem olha) e
guarda a fonte editável (.blend) com as partes, os moldes e os tecidos assentados.
"""
import json
import math
import sys
import time

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index("--") + 1 :]
SRC, SPEC, OUT = args[0], args[1], args[2]
BLEND = args[3] if len(args) > 3 and args[3] != "-" else None
PREVIEW = args[4] if len(args) > 4 else None
spec = json.load(open(SPEC, encoding="utf-8"))
T0 = time.time()
log = lambda *a: print("STAGE", f"{time.time() - T0:6.1f}s", *a, flush=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
to_b = lambda v: np.stack([v[:, 0], -v[:, 2], v[:, 1]], axis=1)  # cena → Blender (z para cima)
to_s = lambda v: np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1)  # Blender → cena


def add_mesh(name, v, f, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(to_b(np.asarray(v, float)).tolist(), [], np.asarray(f).tolist())
    me.update()
    if smooth:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    ob = bpy.data.objects.new(name, me)
    scn.collection.objects.link(ob)
    return ob


def read_mesh(ob):
    """Malha avaliada (modificadores aplicados), triangulada, em unidades da cena."""
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    me.calc_loop_triangles()
    v = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", v)
    t = np.empty(len(me.loop_triangles) * 3, np.int32)
    me.loop_triangles.foreach_get("vertices", t)
    ev.to_mesh_clear()
    return to_s(v.reshape(-1, 3)).astype(np.float32), t.reshape(-1, 3)


data = np.load(SRC)
parts = {}
for name in sorted({k.split("__")[0] for k in data.files}):
    parts[name] = (data[name + "__v"].astype(np.float32), data[name + "__f"].astype(np.int32))
log("partes:", ", ".join(f"{k} {len(v)}" for k, (v, _) in parts.items()))

# ───────────────────────────── o panejamento
garments = spec.get("garments", [])
cloth_objs = []
if garments:
    solid = [k for k in parts if not k.startswith("arm") or k in spec.get("collide_arms", [])]
    vs, fs, off = [], [], 0
    for k in solid:
        v, f = parts[k]
        vs.append(v)
        fs.append(f + off)
        off += len(v)
    body = add_mesh("collision", np.concatenate(vs), np.concatenate(fs))
    body.modifiers.new("col", "COLLISION")
    body.collision.thickness_outer = 0.045
    body.collision.thickness_inner = 0.12
    body.collision.cloth_friction = 14
    ring_src = {}

    def ring(st, M, names):
        """O contorno do corpo num plano: a função de suporte (convexa) das partes, com folga."""
        key = tuple(names)
        if key not in ring_src:
            ring_src[key] = np.concatenate([parts[k][0] for k in names if k in parts])
        V = ring_src[key]
        c = np.asarray(st["c"], float)
        n = np.asarray(st["n"], float)
        n = n / np.linalg.norm(n)
        d = (V - c) @ n
        P = V[np.abs(d) < st.get("band", 0.14)]
        P = P - np.outer((P - c) @ n, n)
        front = np.array([0.0, 0.0, 1.0])
        e1 = front - (front @ n) * n
        e1 = e1 / np.linalg.norm(e1)
        e2 = np.cross(n, e1)
        if "rmax" in st:
            P = P[np.linalg.norm(P - c, axis=1) < st["rmax"]]
        if len(P) < 8:
            return None
        q = np.stack([(P - c) @ e1, (P - c) @ e2], axis=1)
        mid = 0.5 * (q.max(axis=0) + q.min(axis=0))
        q = q - mid
        th = np.linspace(0, 2 * math.pi, M, endpoint=False)
        u = np.stack([np.cos(th), np.sin(th)], axis=1)
        if st.get("pin"):
            # até onde o corpo vai em cada direção (com os vizinhos, para não serrilhar)
            ang = np.arctan2(q[:, 1], q[:, 0]) % (2 * math.pi)
            rad = np.linalg.norm(q, axis=1)
            b = np.minimum((ang / (2 * math.pi) * M).astype(int), M - 1)
            h = np.zeros(M)
            np.maximum.at(h, b, rad)
            h = np.maximum.reduce([np.roll(h, k) for k in (-2, -1, 0, 1, 2)])
            hull = (q @ u.T).max(axis=0)
            h = np.where(h > 0, h, hull)
            h = np.convolve(np.concatenate([h[-3:], h, h[:3]]), np.ones(5) / 5, mode="same")[3:-3]
            h = h * st.get("slack", 1.0) + st.get("margin", 0.05)
        else:
            h = (q @ u.T).max(axis=0) * st.get("slack", 1.0) + st.get("margin", 0.05)
        pts = mid + u * h[:, None]
        return c + np.outer(pts[:, 0], e1) + np.outer(pts[:, 1], e2)

    for gi, g in enumerate(garments):
        if g["type"] == "gown":
            M = g.get("around", 132)
            rings, pins = [], []
            for st in g["stations"]:
                r = ring(st, M, g.get("ring_parts", ["skin"]))
                if r is None:
                    continue
                rings.append(r)
                pins.append(st.get("pin", 0))
            # entre duas estações, fiadas intermediárias (o tecido precisa de malha para dobrar)
            V, pin_w = [], []
            for i in range(len(rings) - 1):
                gap = float(np.linalg.norm(rings[i + 1].mean(axis=0) - rings[i].mean(axis=0)))
                steps = max(1, int(round(gap / g.get("row", 0.055))))
                for s in range(steps):
                    t = s / steps
                    V.append(rings[i] * (1 - t) + rings[i + 1] * t)
                    pin_w.append(pins[i] if s == 0 else 0)
            V.append(rings[-1])
            pin_w.append(pins[-1])
            K = len(V)
            verts = np.concatenate(V)
            faces = [(k * M + j, k * M + (j + 1) % M, (k + 1) * M + (j + 1) % M, (k + 1) * M + j) for k in range(K - 1) for j in range(M)]
            ob = add_mesh(f"cloth{gi}", verts, faces)
            vg = ob.vertex_groups.new(name="pin")
            for k, w in enumerate(pin_w):
                if w:
                    vg.add(list(range(k * M, (k + 1) * M)), float(w), "REPLACE")
        else:  # folha: manto, avental
            w, h = g["size"]
            nx, ny = max(2, int(w / g.get("row", 0.06))), max(2, int(h / g.get("row", 0.06)))
            R = np.asarray(g["frame"], float).reshape(3, 3)
            c = np.asarray(g["center"], float)
            gx, gy = np.meshgrid(np.linspace(-w / 2, w / 2, nx + 1), np.linspace(h / 2, -h / 2, ny + 1))
            local = np.stack([gx.ravel(), gy.ravel(), np.zeros(gx.size)], axis=1)
            if g.get("bow"):
                local[:, 2] = g["bow"] * np.cos(local[:, 0] / w * math.pi)  # nasce arqueada em volta do corpo
            verts = c + local @ R.T
            faces = [(j * (nx + 1) + i, j * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i) for j in range(ny) for i in range(nx)]
            ob = add_mesh(f"cloth{gi}", verts, faces)
            vg = ob.vertex_groups.new(name="pin")
            pr = g.get("pin_r", 0.14)
            for p in g.get("pins", []):
                near = np.nonzero(np.linalg.norm(verts - np.asarray(p, float), axis=1) < pr)[0]
                if len(near) == 0:
                    near = [int(np.argmin(np.linalg.norm(verts - np.asarray(p, float), axis=1)))]
                vg.add([int(i) for i in near], 1.0, "REPLACE")
        m = ob.modifiers.new("cloth", "CLOTH")
        s = m.settings
        s.quality = g.get("quality", 9)
        s.mass = g.get("mass", 0.3)
        st = g.get("stiff", 1.0)
        s.tension_stiffness = 18 * st
        s.compression_stiffness = 18 * st
        s.shear_stiffness = 6 * st
        s.bending_stiffness = g.get("bend", 0.8)
        s.tension_damping = 6
        s.compression_damping = 6
        s.bending_damping = 0.6
        s.air_damping = 1.5
        s.vertex_group_mass = "pin"
        if g.get("shrink"):
            s.shrink_min = g["shrink"]
        m.collision_settings.use_collision = True
        m.collision_settings.distance_min = 0.03
        m.collision_settings.collision_quality = 3
        m.collision_settings.use_self_collision = False
        ob["thick"] = g.get("thick", 0.035)
        cloth_objs.append(ob)
    for w in spec.get("wind", []):
        bpy.ops.object.effector_add(type="WIND", location=(0, 0, 3))
        fld = bpy.context.active_object
        d = Vector(to_b(np.asarray([w["dir"]], float))[0]).normalized()
        fld.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        fld.field.strength = w.get("strength", 400)
        fld.field.flow = 0.2
        fld.field.noise = w.get("noise", 0.6)
    frames = spec.get("frames", 70)
    scn.frame_start = 1
    scn.frame_end = frames
    for ob in cloth_objs:
        ob.modifiers["cloth"].point_cache.frame_start = 1
        ob.modifiers["cloth"].point_cache.frame_end = frames
    for f in range(1, frames + 1):
        scn.frame_set(f)
    log("tecido assentado:", frames, "quadros")
    # o tecido vira pedra: ganha espessura para dentro
    cv, cf, off = [], [], 0
    for ob in cloth_objs:
        sm = ob.modifiers.new("smooth", "SMOOTH")
        sm.iterations = 2
        sm.factor = 0.5
        so = ob.modifiers.new("solid", "SOLIDIFY")
        so.thickness = float(ob["thick"])
        so.offset = -1.0
        so.use_even_offset = False
        v, f = read_mesh(ob)
        cv.append(v)
        cf.append(f + off)
        off += len(v)
    parts["cloth"] = (np.concatenate(cv), np.concatenate(cf))
    body.hide_render = True

# ───────────────────────────── o que a câmera vê
solid_names = [k for k in parts if not k.startswith("arm")]
vs, fs, off = [], [], 0
for k in solid_names:
    v, f = parts[k]
    vs.append(v)
    fs.append(f + off)
    off += len(v)
ALLV = np.concatenate(vs).astype(float)
ALLF = np.concatenate(fs)
bvh = BVHTree.FromPolygons(ALLV.tolist(), ALLF.tolist())


def normals(v, f):
    n = np.zeros_like(v, dtype=float)
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    for i in range(3):
        np.add.at(n, f[:, i], fn)
    return n / np.maximum(np.linalg.norm(n, axis=1), 1e-12)[:, None]


def rot_dir(yaw, pitch):
    y, p = math.radians(yaw), math.radians(pitch)
    return np.array([math.sin(y) * math.cos(p), math.sin(p), math.cos(y) * math.cos(p)])


VIEWS = [rot_dir(*a) for a in ((0, 0), (11, 0), (-11, 0), (0, 9), (0, -7), (8, 6), (-8, 6))]
visible = {}
for k in solid_names:
    v, f = parts[k]
    v = v.astype(float)
    n = normals(v, f)
    seen = np.zeros(len(v), bool)
    for d in VIEWS:
        cand = np.nonzero(~seen & (n @ d > -0.12))[0]
        dv = Vector(d)
        for i in cand:
            p = v[i] + n[i] * 0.012 + d * 0.012
            if bvh.ray_cast(Vector(p), dv, 60.0)[0] is None:
                seen[i] = True
    keep = seen[f].any(axis=1)
    for _ in range(2):  # uma margem em volta do que se vê (a figura respira, a cabeça gira)
        vk = np.zeros(len(v), bool)
        vk[f[keep].ravel()] = True
        keep = vk[f].any(axis=1)
    f2 = f[keep]
    used = np.unique(f2)
    remap = np.full(len(v), -1)
    remap[used] = np.arange(len(used))
    visible[k] = (v[used], remap[f2])
    log(f"{k}: {len(v)} vértices → {len(used)} à vista")

rng = np.random.default_rng(20261120)
KEY = np.asarray(spec.get("key", [-0.62, 0.56, 0.55]), float)
KEY /= np.linalg.norm(KEY)
DIRS = rng.normal(size=(20, 3))
DIRS /= np.linalg.norm(DIRS, axis=1)[:, None]
JIT = KEY + 0.09 * rng.normal(size=(6, 3))
JIT /= np.linalg.norm(JIT, axis=1)[:, None]
res = {}


def finish(budget, prefix, keep_objects):
    total = 0
    for k in solid_names:
        v2, f2 = visible[k]
        want = budget.get(k, budget.get("*", 9000))
        if len(v2) > want:
            ob = add_mesh(prefix + k, v2, f2)
            dm = ob.modifiers.new("dec", "DECIMATE")
            dm.ratio = want / len(v2)
            v3, f3 = read_mesh(ob)
            ob.modifiers.remove(dm)
            if keep_objects:
                ob.data.clear_geometry()
                ob.data.from_pydata(to_b(v3.astype(float)).tolist(), [], f3.tolist())
                ob.data.update()
                ob.data.polygons.foreach_set("use_smooth", [True] * len(ob.data.polygons))
            else:
                bpy.data.objects.remove(ob)
            v2, f2 = v3.astype(float), f3
        elif keep_objects:
            add_mesh(prefix + k, v2, f2)
        # oclusão e a sombra da luz principal, por vértice
        n = normals(v2, f2)
        ao = np.ones(len(v2))
        sh = np.ones(len(v2))
        for i in range(len(v2)):
            p = Vector(v2[i] + n[i] * 0.015)
            hit = 0.0
            cnt = 0
            for d in DIRS:
                c = float(d @ n[i])
                if c < 0:
                    d = -d
                    c = -c
                if c < 0.12:
                    continue
                cnt += 1
                h = bvh.ray_cast(p, Vector(d), 1.6)
                if h[0] is not None:
                    hit += 1.0 - 0.5 * h[3] / 1.6
            ao[i] = 1.0 - hit / max(cnt, 1)
            sh[i] = sum(1 for d in JIT if bvh.ray_cast(p, Vector(d), 40.0)[0] is None) / len(JIT) if n[i] @ KEY > -0.05 else 0.0
        key = prefix + k
        res[key + "__v"] = v2.astype(np.float32)
        res[key + "__f"] = f2.astype(np.int32)
        res[key + "__n"] = n.astype(np.float32)
        res[key + "__ao"] = ao.astype(np.float32)
        res[key + "__sh"] = sh.astype(np.float32)
        total += len(v2)
    log(("leve" if prefix else "completa") + f": {total} vértices, com oclusão e sombra")


finish(spec.get("budget", {}), "", True)
if "budget_lite" in spec:
    finish(spec["budget_lite"], "lite_", False)
np.savez(OUT, **res)

# os braços na pose de contato entram na fonte e nas prévias
for k in parts:
    if k.startswith("arm"):
        add_mesh(k, *parts[k])
if BLEND:
    # a fonte editável guarda o que interessa reabrir: as partes já simplificadas, os tecidos assentados (como malha) e
    # os braços na pose de contato. A malha densa de colisão sai — ela se refaz com build.py --stage.
    for ob in cloth_objs:
        v, f = read_mesh(ob)
        ob.modifiers.clear()
        ob.data.clear_geometry()
        ob.data.from_pydata(to_b(v.astype(float)).tolist(), [], f.tolist())
        ob.data.update()
    if garments:
        bpy.data.objects.remove(body, do_unlink=True)
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=BLEND, compress=True)

if PREVIEW:
    cx, cy, half = spec.get("cam", [0.0, 3.6, 4.6])
    FOV = 24.0
    cam_d = bpy.data.cameras.new("cam")
    cam_d.sensor_fit = "VERTICAL"
    cam_d.angle_y = math.radians(FOV)
    cam_d.clip_end = 400
    cam = bpy.data.objects.new("cam", cam_d)
    scn.collection.objects.link(cam)
    cam.location = (cx, -half / math.tan(math.radians(FOV) / 2), cy)
    cam.rotation_euler = (math.pi / 2, 0, 0)
    scn.camera = cam
    scn.render.engine = "BLENDER_WORKBENCH"
    scn.render.resolution_x, scn.render.resolution_y = spec.get("size", [900, 1100])
    scn.view_settings.view_transform = "Standard"
    scn.world = bpy.data.worlds.new("w")
    sh = scn.display.shading
    sh.color_type = "SINGLE"
    for sil in (False, True):
        if sil:
            scn.world.color = (1, 1, 1)
            sh.light = "FLAT"
            sh.single_color = (0, 0, 0)
            sh.show_shadows = False
            sh.show_cavity = False
        else:
            scn.world.color = (0.035, 0.035, 0.04)
            sh.light = "STUDIO"
            sh.single_color = (0.86, 0.83, 0.78)
            sh.show_shadows = True
            sh.shadow_intensity = 0.55
            scn.display.light_direction = (-0.62, 0.35, 0.7)
            sh.show_cavity = True
            sh.cavity_type = "BOTH"
            sh.show_specular_highlight = False
        scn.render.filepath = PREVIEW.replace(".png", "-sil.png") if sil else PREVIEW
        bpy.ops.render.render(write_still=True)
log("pronto")
