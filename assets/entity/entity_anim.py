# Poses, animações-base, renders de revisão, .blend e GLB — executado por build_entity.py (mesmo namespace).
#
# As poses são escritas em direções no espaço do personagem (para onde cada osso aponta), não em ângulos
# de Euler: `aim(osso, direção, frente)`. `rel` faz a direção acompanhar o tronco (braços) ou o quadril
# (pernas). Rotações pequenas em torno dos eixos locais usam `rot`. Nada depende de constraints: o que
# sai daqui são quaternions locais com keyframes — é isso que o glTF carrega.
#
# Sinais dos ossos centrais (X esquerda, Y cima, Z frente):  +x inclina para a frente · +y vira para a
# esquerda do personagem · +z tomba para a direita do personagem.

RREST = {n: REST[n].to_3x3() for n in REST}
PARENT = {b[0]: b[3] for b in BONES}
SIDE_BONES = [b[0] for b in BONES]
SKIP_KEYS = {"root"} | {b[0] for b in BONES if b[0].startswith("frag_") or b[0].startswith("tip_")}


class Pose:
    def __init__(self, spec=None):
        self.spec = dict(spec or {})

    def aim(self, bone, y, z=None, twist=0.0, rel=None):
        self.spec[bone] = ("aim", Vector(y).normalized(), Vector(z) if z is not None else None, twist, rel)
        return self

    def rot(self, bone, *axis_deg):
        self.spec[bone] = ("rot", tuple(axis_deg))
        return self

    def copy(self):
        return Pose(self.spec)

    def mirrored(self):
        out = {}
        for name, s in self.spec.items():
            n2 = name[:-2] + ("_L" if name.endswith("_R") else "_R") if name[-2:] in ("_R", "_L") else name
            if s[0] == "aim":
                fx = lambda v: None if v is None else Vector((-v.x, v.y, v.z))
                out[n2] = ("aim", fx(s[1]), fx(s[2]), -s[3], s[4])
            else:
                out[n2] = ("rot", tuple((ax, d if ax == "x" else -d) for ax, d in s[1]))
        return Pose(out)

    def solve(self):
        Rp, out = {}, {}
        for name, head, tail, parent, zh in BONES:
            R0 = (Rp[parent] @ (RREST[parent].inverted() @ RREST[name])) if parent else RREST[name].copy()
            s = self.spec.get(name)
            if s is None:
                Rd = R0
            elif s[0] == "aim":
                y, zhint, twist, rel = s[1], s[2], s[3], s[4]
                if rel:
                    D = Rp[rel] @ RREST[rel].inverted()
                    y = D @ y
                    zhint = (D @ zhint) if zhint is not None else None
                if zhint is None:
                    Rd = R0.col[1].rotation_difference(y).to_matrix() @ R0
                else:
                    z = (zhint - y * zhint.dot(y)).normalized()
                    x = y.cross(z)
                    Rd = Matrix((x, y, z)).transposed()
                if twist:
                    Rd = Rd @ Matrix.Rotation(radians(twist), 3, "Y")
            else:
                Rd = R0.copy()
                for ax, deg in s[1]:
                    Rd = Rd @ Matrix.Rotation(radians(deg), 3, ax.upper())
            Rp[name] = Rd
            out[name] = (R0.inverted() @ Rd).to_quaternion()
        return out


def mix(A, B, t):
    return {k: A[k].slerp(B[k], t) for k in A}


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def fingers(P, side, curl, thumb=(10, 14, 10), spread=0.0):
    """curl: {dedo: (a1, a2, a3)} em graus de flexão."""
    sg = 1.0 if side == "R" else -1.0
    for f, (a, b, c) in curl.items():
        P.rot(f"{f}_01_{side}", ("z", sg * a), ("x", spread if f == "index" else (-spread if f == "pinky" else 0.0)))
        P.rot(f"{f}_02_{side}", ("z", sg * b))
        P.rot(f"{f}_03_{side}", ("z", sg * c))
    a, b, c = thumb
    P.rot(f"thumb_01_{side}", ("z", sg * a))
    P.rot(f"thumb_02_{side}", ("z", sg * b))
    P.rot(f"thumb_03_{side}", ("z", sg * c))


RELAX = {"index": (12, 18, 10), "middle": (18, 24, 14), "ring": (23, 29, 17), "pinky": (27, 32, 19)}
POINT = {"index": (3, 4, 2), "middle": (74, 88, 52), "ring": (78, 90, 54), "pinky": (80, 86, 50)}
OPEN = {"index": (2, 5, 3), "middle": (5, 8, 4), "ring": (9, 12, 6), "pinky": (13, 15, 8)}


def scale_curl(c, k, add=0.0):
    return {f: tuple(v * k + add for v in vals) for f, vals in c.items()}


# ---------------------------------------------------------------- repouso (laço de 6 s)
IDLE_LEN = 6.0


def idle(t=0.0, lift=0.0):
    """Flutuando: uma perna recolhida, braços soltos e assimétricos, cabeça levemente inclinada — curiosa.
    `lift` (0..1) abre o corpo: é a base da pose de atenção."""
    w = 2 * pi / IDLE_LEN
    s1, s2, s3, s4 = sin(w * t), sin(2 * w * t), sin(w * t + 1.3), sin(2 * w * t + 0.7)
    P = Pose()
    P.rot("hips", ("y", -5 + 2.0 * s1), ("x", -2 + 0.8 * s2), ("z", -3 + 1.2 * s3))
    P.rot("spine", ("x", 3 + 1.0 * s2 - 3 * lift), ("y", -2 - 1.5 * s1), ("z", 3 - 1.2 * s3))
    P.rot("chest", ("x", -5 - 1.4 * s2 - 4 * lift), ("y", -4 - 1.0 * s1), ("z", 3))
    P.rot("neck", ("x", 7 + 1.0 * s4 - 6 * lift), ("y", -4 + 3 * s3))
    P.rot("head", ("x", 6 + 1.5 * s4 - 8 * lift), ("y", -7 + 4 * s3), ("z", 7 - 2 * s1 - 5 * lift))
    # braço direito: antebraço levantado à frente, mão meio aberta — pronto para apontar
    P.aim("clavicle_R", (-1, 0.0, 0.03 + 0.012 * s2 + 0.05 * lift), (0, -1, 0), rel="chest")
    P.aim("upper_arm_R", (-(0.42 + 0.03 * s1 + 0.10 * lift), -0.10 + 0.02 * s2, -0.90), (0, -1, 0), rel="chest")
    P.aim("forearm_R", (-(0.30 + 0.03 * s1 + 0.14 * lift), -0.62 + 0.04 * s2 - 0.10 * lift, -0.30 + 0.25 * lift), (0.2, -0.5, 0.85), rel="chest")
    P.aim("hand_R", (-0.34 - 0.12 * lift, -0.74, 0.10 + 0.30 * lift), (0.3, -0.2, 0.93), rel="chest")
    fingers(P, "R", scale_curl(RELAX, 0.8 - 0.4 * lift, 2.5 * s2), thumb=(6, 10, 8))
    # braço esquerdo: solto, um pouco para trás
    P.aim("clavicle_L", (1, 0.0, 0.02 + 0.012 * s4 + 0.05 * lift), (0, -1, 0), rel="chest")
    P.aim("upper_arm_L", (0.50 + 0.03 * s3 + 0.10 * lift, 0.12 + 0.02 * s4, -0.86), (0, -1, 0), rel="chest")
    P.aim("forearm_L", (0.44 + 0.03 * s3 + 0.14 * lift, -0.16 + 0.04 * s4 - 0.25 * lift, -0.88 + 0.30 * lift), (0.3, -1, 0.3), rel="chest")
    P.aim("hand_L", (0.36 + 0.10 * lift, -0.26 - 0.20 * lift, -0.90 + 0.30 * lift), (0.45, -1, 0.4), rel="chest")
    fingers(P, "L", scale_curl(RELAX, 1.1 - 0.5 * lift, 2.5 * s4), thumb=(8, 13, 9))
    # pernas: a direita quase estendida, a esquerda recolhida — flutuando, nunca apoiada
    P.aim("thigh_R", (-0.02 + 0.012 * s1, 0.02 + 0.02 * s2, -1), (0, -1, 0), rel="hips")
    P.aim("shin_R", (0.03, 0.20 + 0.03 * s2 - 0.08 * lift, -1), (0, -1, 0), rel="hips")
    P.aim("foot_R", (0.03, 0.10, -1), (0, -1, 0.1), rel="hips")
    # a perna esquerda dobra para fora e o pé cruza por trás da outra canela (lê de frente)
    P.aim("thigh_L", (0.30 + 0.015 * s3, -0.52 + 0.03 * s4 + 0.12 * lift, -1), (0.1, -1, 0), rel="hips")
    P.aim("shin_L", (-0.50 + 0.02 * s3, 0.66 + 0.04 * s4 - 0.16 * lift, -1), (0, -1, 0), rel="hips")
    P.aim("foot_L", (-0.50, 0.80, -1), (0, -1, 0.6), rel="hips")
    return P


# ---------------------------------------------------------------- alcance (mão direita; a esquerda é o espelho)
def reach(t=0.0, press=0.0):
    """Braço direito estendido apontando para o lado/à frente. No site, ombro–cotovelo–pulso são resolvidos
    por IK em direção ao ícone real; esta pose dá o tronco, o braço de contrapeso e o gesto dos dedos."""
    w = 2 * pi / 2.0
    s = sin(w * t)
    P = idle(0.0, lift=0.35)
    P.rot("hips", ("y", -5), ("z", 4), ("x", -2))
    P.rot("spine", ("y", -6), ("z", 4), ("x", 4))
    P.rot("chest", ("y", -8 + 0.6 * s), ("z", 4), ("x", 2))
    # o olhar é do runtime (mira o ícone real): aqui a cabeça só acompanha o tronco
    P.rot("neck", ("y", -4), ("x", 4))
    P.rot("head", ("y", -6), ("x", 5), ("z", 5))
    P.aim("clavicle_R", (-1, -0.10, 0.10), (0, -1, 0), rel="chest")
    P.aim("upper_arm_R", (-0.90, -0.34, -0.26), (0.0, -1, 0.25), rel="chest")
    P.aim("forearm_R", (-0.94, -0.30, -0.14 + 0.01 * s), (0.0, -0.9, -0.45), rel="chest")
    P.aim("hand_R", (-0.96, -0.24, -0.12 - 0.05 * press), (0.0, -0.86, -0.5), rel="chest")
    pt = dict(POINT)
    pt["index"] = (3 + 9 * press, 4 + 12 * press, 2 + 8 * press)
    fingers(P, "R", pt, thumb=(30, 38, 26))
    # contrapeso: o braço esquerdo abre para trás, a perna de trás estica
    P.aim("upper_arm_L", (0.50, 0.22, -0.84), (0, -1, 0), rel="chest")
    P.aim("forearm_L", (0.42, 0.02, -0.90), (0.3, -1, 0.2), rel="chest")
    P.aim("hand_L", (0.30, -0.10, -0.95), (0.4, -1, 0.3), rel="chest")
    fingers(P, "L", scale_curl(RELAX, 0.7), thumb=(8, 12, 8))
    # pernas recolhidas para trás (voando para o alvo): o corpo fica mais curto e não invade o rodapé
    P.aim("thigh_R", (-0.10, -0.62, -1), (0, -1, 0), rel="hips")
    P.aim("shin_R", (0.04, 1.25, -1), (0, -1, 0), rel="hips")
    P.aim("foot_R", (0.04, 1.6, -1), (0, -1, 0.6), rel="hips")
    P.aim("thigh_L", (0.14, -0.20, -1), (0, -1, 0), rel="hips")
    P.aim("shin_L", (0.34, 1.7, -1), (0, -1, 0), rel="hips")
    P.aim("foot_L", (0.34, 2.4, -1), (0, -1, 0.8), rel="hips")
    return P


def coil():
    """Antecipação: o corpo recolhe um instante antes de ir."""
    P = idle(0.0, lift=0.1)
    P.rot("hips", ("y", 3), ("x", -4))
    P.rot("spine", ("x", 6), ("y", 4))
    P.rot("chest", ("x", 3), ("y", 6))
    P.rot("head", ("x", 10), ("y", -12), ("z", 4))
    for side, sx in (("R", -1.0), ("L", 1.0)):
        P.aim(f"clavicle_{side}", (sx, 0.0, 0.16), (0, -1, 0), rel="chest")
        P.aim(f"upper_arm_{side}", (sx * 0.30, 0.16, -0.92), (0, -1, 0), rel="chest")
        P.aim(f"forearm_{side}", (sx * 0.05, -0.80, -0.50), (sx * 0.4, -0.6, 0.7), rel="chest")
        P.aim(f"hand_{side}", (-sx * 0.10, -0.85, -0.30), (sx * 0.5, -0.4, 0.8), rel="chest")
        fingers(P, side, scale_curl(RELAX, 1.5), thumb=(16, 20, 14))
    P.aim("thigh_R", (-0.05, -0.30, -1), (0, -1, 0), rel="hips")
    P.aim("shin_R", (-0.03, 0.50, -1), (0, -1, 0), rel="hips")
    P.aim("thigh_L", (0.07, -0.46, -1), (0, -1, 0), rel="hips")
    P.aim("shin_L", (0.03, 0.70, -1), (0, -1, 0), rel="hips")
    return P


# ---------------------------------------------------------------- apresentação (janela aberta; laço de 4 s)
def present(t=0.0):
    """Recolhido ao lado da janela: tronco virado para ela, mão direita aberta apresentando, a esquerda atrás."""
    w = 2 * pi / 4.0
    s1, s2 = sin(w * t), sin(2 * w * t + 0.6)
    P = idle(0.0, lift=0.5)
    P.rot("hips", ("y", -12 + 1.0 * s1), ("z", -3), ("x", -2))
    P.rot("spine", ("y", -8), ("x", 2 + 0.6 * s2), ("z", -2))
    P.rot("chest", ("y", -8 + 0.8 * s1), ("x", -6 - 0.8 * s2))
    P.rot("neck", ("y", -10), ("x", 2))
    P.rot("head", ("y", -18 + 2 * s1), ("x", 4 + 1.0 * s2), ("z", -8))
    P.aim("clavicle_R", (-1, -0.05, 0.08), (0, -1, 0), rel="chest")
    P.aim("upper_arm_R", (-0.50, -0.30 + 0.01 * s2, -0.80), (-0.2, -1, 0.2), rel="chest")
    P.aim("forearm_R", (-0.72, -0.56, 0.38 + 0.03 * s1), (0.3, -0.5, 0.8), rel="chest")
    P.aim("hand_R", (-0.86, -0.42, 0.26 + 0.03 * s1), (0.1, 0.1, 1.0), rel="chest")
    fingers(P, "R", OPEN, thumb=(-4, 4, 2), spread=4)
    P.aim("upper_arm_L", (0.30, 0.34, -0.88), (0, -1, 0), rel="chest")
    P.aim("forearm_L", (-0.20, 0.52, -0.82), (-0.6, -0.4, 0.5), rel="chest")
    P.aim("hand_L", (-0.45, 0.50, -0.74), (-0.5, -0.2, 0.7), rel="chest")
    fingers(P, "L", scale_curl(RELAX, 1.3), thumb=(14, 18, 12))
    P.aim("thigh_R", (-0.02, -0.16 + 0.01 * s2, -1), (0, -1, 0), rel="hips")
    P.aim("shin_R", (0.10, 0.20, -1), (0, -1, 0), rel="hips")
    P.aim("thigh_L", (0.02, -0.10, -1), (0, -1, 0), rel="hips")
    P.aim("shin_L", (-0.12, 0.34 + 0.02 * s1, -1), (0, -1, 0), rel="hips")
    return P


# ---------------------------------------------------------------- reverência (fim da apresentação)
def bow(depth=1.0):
    """Reverência: o tronco inclina, a mão direita vem ao peito, a esquerda abre para trás, uma perna recua."""
    d = depth
    P = idle(0.0, lift=0.15)
    P.rot("hips", ("x", 12 * d), ("y", -2))
    P.rot("spine", ("x", 3 + 20 * d), ("y", -1))
    P.rot("chest", ("x", -5 + 24 * d), ("y", -2))
    P.rot("neck", ("x", 7 + 8 * d))
    P.rot("head", ("x", 6 + 12 * d), ("y", -2), ("z", 7 * (1 - d)))
    # mão direita ao peito: o antebraço cruza na frente do tronco
    P.aim("clavicle_R", (-1, -0.18 * d, 0.03), (0, -1, 0), rel="chest")
    P.aim("upper_arm_R", (-0.42 + 0.10 * d, -0.10 - 0.42 * d, -0.90 + 0.12 * d), (0, -1, 0.2 * d), rel="chest")
    P.aim("forearm_R", (-0.30 + 1.10 * d, -0.62 + 0.20 * d, -0.30 + 0.62 * d), (0.2, -0.8, 0.5), rel="chest")
    P.aim("hand_R", (-0.34 + 1.20 * d, -0.74 + 0.44 * d, 0.10 + 0.22 * d), (0.3 - 0.3 * d, -0.4, 0.9), rel="chest")
    fingers(P, "R", scale_curl(RELAX, 0.8 - 0.45 * d), thumb=(6, 10, 8))
    # braço esquerdo abre para o lado e para trás
    P.aim("clavicle_L", (1, 0.10 * d, 0.02), (0, -1, 0), rel="chest")
    P.aim("upper_arm_L", (0.50 + 0.30 * d, 0.12 + 0.30 * d, -0.86 + 0.26 * d), (0, -1, 0), rel="chest")
    P.aim("forearm_L", (0.44 + 0.40 * d, -0.16 + 0.50 * d, -0.88 + 0.36 * d), (0.3, -1, 0.3), rel="chest")
    P.aim("hand_L", (0.36 + 0.50 * d, -0.26 + 0.50 * d, -0.90 + 0.40 * d), (0.45, -1, 0.4), rel="chest")
    fingers(P, "L", scale_curl(RELAX, 1.1 - 0.75 * d), thumb=(4, 8, 6), spread=3 * d)
    # perna direita recua, a esquerda desce e estica
    P.aim("thigh_R", (-0.02, 0.02 + 0.30 * d, -1), (0, -1, 0), rel="hips")
    P.aim("shin_R", (0.03, 0.20 + 0.55 * d, -1), (0, -1, 0), rel="hips")
    P.aim("foot_R", (0.03, 0.10 + 0.9 * d, -1), (0, -1, 0.1 + 0.5 * d), rel="hips")
    P.aim("thigh_L", (0.30 - 0.20 * d, -0.52 + 0.22 * d, -1), (0.1, -1, 0), rel="hips")
    P.aim("shin_L", (-0.50 + 0.52 * d, 0.66 - 0.50 * d, -1), (0, -1, 0), rel="hips")
    P.aim("foot_L", (-0.50 + 0.50 * d, 0.80 - 0.70 * d, -1), (0, -1, 0.6 - 0.4 * d), rel="hips")
    return P


BOW_LEN = 2.1


def clip_bow(t):  # desce (0,55 s), segura, volta ao repouso
    if t < 0.55:
        k = ease(t / 0.55)
    elif t < 1.15:
        k = 1.0
    else:
        k = 1.0 - ease((t - 1.15) / 0.85)
    return bow(k).solve()


# ---------------------------------------------------------------- clipes
def clip_idle(t):
    return idle(t).solve()


def clip_attention(t):  # "olhar": o corpo abre e a cabeça levanta (a direção do olhar é do runtime)
    return idle(t * 3.0, lift=0.8 + 0.05 * sin(2 * pi * t / 2.0)).solve()


_IDLE0 = idle(0.0).solve()
_COIL = coil().solve()


def clip_anticipate(t):
    return mix(_IDLE0, _COIL, ease(t / 0.28))


def clip_reach(t, mirror=False):
    P = reach(t)
    return (P.mirrored() if mirror else P).solve()


def clip_touch(t, mirror=False):  # o indicador pressiona e volta
    k = ease(t / 0.10) if t < 0.10 else 1.0 - ease((t - 0.10) / 0.22)
    over = -0.18 * sin(pi * max(0.0, min(1.0, (t - 0.32) / 0.18))) if t > 0.32 else 0.0
    P = reach(0.0, press=max(-0.3, k + over))
    return (P.mirrored() if mirror else P).solve()


_OVER = idle(0.0, lift=-0.25).solve()
_OPEN = idle(0.0, lift=0.45).solve()


def clip_return(t):  # volta com um leve excesso antes de assentar
    if t < 0.36:
        return mix(_OPEN, _OVER, ease(t / 0.36))
    return mix(_OVER, _IDLE0, ease((t - 0.36) / 0.34))


CLIPS = [
    ("Idle", IDLE_LEN, clip_idle),
    ("Attention", 2.0, clip_attention),
    ("Anticipate", 0.5, clip_anticipate),
    ("Reach_R", 2.0, lambda t: clip_reach(t)),
    ("Reach_L", 2.0, lambda t: clip_reach(t, True)),
    ("Touch_R", 0.5, lambda t: clip_touch(t)),
    ("Touch_L", 0.5, lambda t: clip_touch(t, True)),
    ("Present", 4.0, lambda t: present(t).solve()),
    ("Return", 0.7, clip_return),
    ("Bow", BOW_LEN, clip_bow),
]

PB = ARM_OB.pose.bones
for pb in PB:
    pb.rotation_mode = "QUATERNION"

# Limites articulares (graus), nos eixos locais de cada osso — gravados no .blend (limites de IK dos ossos) e
# repetidos no runtime (src/features/os/entity/entity.config.ts › LIMITS). Cotovelo e joelho são dobradiças.
LIMITS = {
    "upper_arm": {"x": (-95, 95), "y": (-70, 70), "z": (-40, 150)},
    "forearm": {"x": (0, 150), "y": (-80, 80), "z": (0, 0)},
    "hand": {"x": (-70, 70), "y": (-10, 10), "z": (-35, 35)},
    "thigh": {"x": (-110, 40), "y": (-35, 35), "z": (-45, 45)},
    "shin": {"x": (0, 150), "y": (0, 0), "z": (0, 0)},
    "neck": {"x": (-35, 35), "y": (-45, 45), "z": (-25, 25)},
    "head": {"x": (-40, 40), "y": (-60, 60), "z": (-30, 30)},
}
for pb in PB:
    key = next((k for k in LIMITS if pb.name.startswith(k)), None)
    if not key:
        continue
    for ax in "xyz":
        lo, hi = LIMITS[key][ax]
        setattr(pb, f"use_ik_limit_{ax}", True)
        setattr(pb, f"ik_min_{ax}", radians(lo))
        setattr(pb, f"ik_max_{ax}", radians(hi))


def apply_pose(quats):
    for name, q in quats.items():
        PB[name].rotation_quaternion = q
    bpy.context.view_layer.update()


# ---------------------------------------------------------------- renders de revisão (Cycles em CPU)
def setup_stage():
    SC.render.engine = "CYCLES"
    SC.cycles.device = "CPU"
    SC.cycles.samples = 28
    SC.cycles.use_denoising = True
    SC.cycles.max_bounces = 4
    SC.view_settings.view_transform = "Filmic" if "Filmic" in [v.name for v in bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items] else "Standard"
    world = bpy.data.worlds.new("Stage")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.010, 0.010, 0.012, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    SC.world = world

    def area(name, loc, power, color, size):
        l = bpy.data.lights.new(name, "AREA")
        l.energy, l.color, l.size = power, color, size
        o = bpy.data.objects.new(name, l)
        SC.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (Vector((0, 0, 1.05)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return o

    area("Key", (-2.6, -3.6, 3.4), 560, (1.0, 0.97, 0.94), 3.0)
    area("Fill", (3.0, -2.8, 0.6), 90, (0.75, 0.82, 1.0), 3.5)
    area("Rim", (2.4, 3.0, 2.4), 1000, (1.0, 0.16, 0.10), 2.0)
    area("Top", (0.0, 0.4, 4.2), 240, (1.0, 1.0, 1.0), 4.0)
    cam = bpy.data.cameras.new("Cam")
    cam.lens = 80
    co = bpy.data.objects.new("Cam", cam)
    SC.collection.objects.link(co)
    SC.camera = co
    return co


def shoot(cam, name, yaw_deg, target=(0, 0, 1.05), dist=6.5, res=(460, 720), lens=80, height=0.0):
    a = radians(yaw_deg)
    t = Vector(target)
    cam.data.lens = lens
    cam.location = t + Vector((sin(a) * dist, -cos(a) * dist, height))
    cam.rotation_euler = (t - cam.location).to_track_quat("-Z", "Y").to_euler()
    SC.render.resolution_x, SC.render.resolution_y = res
    SC.render.filepath = os.path.join(OUT_RENDERS, name + ".png")
    bpy.ops.render.render(write_still=True)
    print("RENDER", name)


if "--render" in ARGS:
    os.makedirs(OUT_RENDERS, exist_ok=True)
    cam = setup_stage()
    which = next((a.split("=")[1] for a in ARGS if a.startswith("--views=")), "idle")
    if "tpose" in which:
        apply_pose({n: Quaternion() for n in PB.keys()})
        shoot(cam, "tpose_front", 0, dist=8.6, res=(820, 720))
        shoot(cam, "tpose_back", 180, dist=8.6, res=(820, 720))
    if "idle" in which:
        apply_pose(_IDLE0)
        for nm, yaw in (("idle_front", 0), ("idle_34", -38), ("idle_side", -90), ("idle_back", 180)):
            shoot(cam, nm, yaw)
    if "head" in which:
        apply_pose(_IDLE0)
        shoot(cam, "head_front", -14, target=(0, 0, 1.76), dist=2.4, res=(560, 560))
        shoot(cam, "head_left", 62, target=(0, 0, 1.76), dist=2.4, res=(560, 560))
    if "reach" in which:
        apply_pose(reach().solve())
        shoot(cam, "reach_front", 0, dist=8.0, res=(760, 720))
        shoot(cam, "reach_hand", -30, target=(-0.86, -0.30, 1.40), dist=1.5, res=(620, 560))
        apply_pose(reach().mirrored().solve())
        shoot(cam, "reach_L_front", 0, dist=8.0, res=(760, 720))
    if "bow" in which:
        apply_pose(bow(1.0).solve())
        shoot(cam, "bow_front", 0)
        shoot(cam, "bow_34", -40)
        shoot(cam, "bow_side", -90)
    if "present" in which:
        apply_pose(present().solve())
        shoot(cam, "present_front", 0)
        apply_pose(_COIL)
        shoot(cam, "coil_front", 0)
    if "extreme" in which:  # cotovelos e mãos em poses extremas
        P = idle(0.0)
        P.aim("upper_arm_R", (-0.6, -0.5, 0.6), (0.3, -0.6, -0.6), rel="chest")
        P.aim("forearm_R", (0.5, -0.6, 0.6), (0.6, -0.2, -0.7), rel="chest")
        P.aim("hand_R", (0.6, -0.4, 0.7), (0.5, -0.8, -0.2), rel="chest")
        fingers(P, "R", {f: (88, 96, 60) for f in RELAX}, thumb=(40, 50, 40))
        P.aim("upper_arm_L", (0.7, -0.7, 0.1), (-0.5, -0.5, 0.5), rel="chest")
        P.aim("forearm_L", (0.2, -0.9, 0.5), (-0.6, -0.1, 0.6), rel="chest")
        P.aim("hand_L", (0.0, -0.95, 0.4), (-0.7, 0.0, 0.7), rel="chest")
        fingers(P, "L", OPEN, thumb=(-8, 0, 0), spread=8)
        P.aim("thigh_R", (-0.2, -0.9, -0.4), (0, -0.4, 1), rel="hips")
        P.aim("shin_R", (-0.1, 0.3, -1), (0, -1, -0.2), rel="hips")
        apply_pose(P.solve())
        shoot(cam, "extreme_front", -20, dist=8.0, res=(760, 720))
        shoot(cam, "extreme_handL", 20, target=(0.25, -0.75, 1.72), dist=1.4, res=(620, 560))
        shoot(cam, "extreme_handR", -10, target=(0.1, -0.55, 2.05), dist=1.5, res=(620, 560))
    apply_pose({n: Quaternion() for n in PB.keys()})

# ---------------------------------------------------------------- animações: uma action por clipe, guardadas em faixas NLA
if "--no-export" not in ARGS:
    ARM_OB.animation_data_create()
    ad = ARM_OB.animation_data
    FPS = SC.render.fps
    STEP = 2
    for cname, length, fn in CLIPS:
        act = bpy.data.actions.new(cname)
        act.use_fake_user = True
        ad.action = act
        last = {}
        n = int(round(length * FPS))
        frames = sorted(set(list(range(0, n + 1, STEP)) + [n]))
        for f in frames:
            quats = fn(f / FPS)
            for name, q in quats.items():
                if name in SKIP_KEYS:
                    continue
                if name in last and last[name].dot(q) < 0:
                    q = -q
                last[name] = q.copy()
                PB[name].rotation_quaternion = q
                PB[name].keyframe_insert("rotation_quaternion", frame=f, group=name)
        tr = ad.nla_tracks.new()
        tr.name = cname
        st = tr.strips.new(cname, 0, act)
        st.name = cname
        if hasattr(st, "action_slot") and st.action_slot is None and len(act.slots):
            st.action_slot = act.slots[0]
        tr.mute = cname != "Idle"
        ad.action = None
    apply_pose({n: Quaternion() for n in PB.keys()})
    SC.frame_start, SC.frame_end = 0, int(IDLE_LEN * FPS)
    SC.frame_set(0)

    if SC.camera is None:
        setup_stage()
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    print("SAVED", OUT_BLEND)

    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    for ob in bpy.context.view_layer.objects:
        ob.select_set(ob in (ARM_OB, BODY))
    bpy.context.view_layer.objects.active = ARM_OB
    want = dict(
        filepath=OUT_GLB, export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
        export_texcoords=True, export_normals=True, export_tangents=False, export_materials="EXPORT",
        export_cameras=False, export_lights=False, export_extras=False,
        export_skins=True, export_all_influences=False, export_def_bones=False, export_morph=False,
        export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True, export_frame_step=1,
        export_optimize_animation_size=True, export_optimize_animation_keep_anim_armature=True,
        export_anim_single_armature=True, export_reset_pose_bones=True, export_nla_strips=True,
        export_current_frame=False, export_rest_position_armature=True, export_bake_animation=False,
        export_anim_slide_to_zero=True, export_negative_frame="SLIDE",
    )
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    args = {k: v for k, v in want.items() if k in props}
    print("GLTF args ignorados:", sorted(set(want) - set(args)))
    bpy.ops.export_scene.gltf(**args)
    print("EXPORTED", OUT_GLB, os.path.getsize(OUT_GLB), "bytes")
