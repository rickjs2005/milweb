"""
MATÉRIA — os braços das esculturas: um braço (ombro → cotovelo → punho → mão) que o motor usa duas vezes,
o direito (espelhado) e o esquerdo de cada figura, articulados por rig.ts. O corpo de cada figura é esculpido à
parte, já na pose (assets/materia/sculpt); a cabeça e o tronco definidos aqui servem de base para elas e para a
prévia (`--preview`), e não vão mais para o arquivo.

Superfície contínua (malha), esculpida por distância assinada com numpy:

  corpo   cabeça de perfil, pescoço e tronco, já na pose da cena (a origem é a PONTA DA DOBRA em repouso,
          x para a direita, y para cima, z para quem olha; a cabeça mede ~1). Dois ossos: tronco e cabeça.
  braço   em repouso, esticado no eixo +X a partir do ombro (origem): braço (L1), antebraço (L2). Dois ossos,
          com a pele repartida entre eles no cotovelo.
  mão     no mesmo espaço do braço, a partir do punho (com o fim do antebraço, para a pele se repartir ali);
          Y é o dorso e Z o lado do polegar. A mesma malha em TRÊS FORMAS (pinça, aberta, relaxada): os
          vértices de uma são levados à outra pelos ossos dos dedos e assentados na superfície da nova pose —
          o motor mistura duas formas por vez.

  python assets/materia/build_figure.py            # gera public/models/materia-figure{,-lite}.bin e rig-data.ts
  python assets/materia/build_figure.py --preview  # só a prévia da pose da home (.audit/materia/figure-*.png)

Formato (little-endian): "MTF2", uint32 partes; cada parte: uint32 vértices, uint32 índices, uint32 formas,
float32 centro[3], float32 escala; por forma: posição int16[3n] (alinhada em 4 bytes) e normal + oclusão
int8[4n]; depois meta uint8[4n] = (caminho da luz: 0 na ponta dos dedos … 255 no alto da cabeça, dissolução,
semente, 0), pele uint8[4n] = (osso A, osso B, peso de A, 0) e os índices uint16 (alinhados em 4 bytes).
Ossos: 0 tronco · 1 cabeça · 2 braço · 3 antebraço · 4 mão (o segundo braço usa 5, 6 e 7).
As medidas do esqueleto e a pose da home vão para src/features/os/materia/rig-data.ts.
"""
from __future__ import annotations

import os
import struct
import sys

import numpy as np

F = np.float32
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
OUT = os.path.join(ROOT, "public", "models")
RIG_TS = os.path.join(ROOT, "src", "features", "os", "materia", "rig-data.ts")


# ───────────────────────────── distância assinada
def length(v):
    return np.sqrt((v * v).sum(axis=1))


def vec(*a):
    return np.asarray(a, F)


def ell(p, c, r):
    r = vec(*r)
    k = length((p - vec(*c)) / r)
    return (k - 1.0) * r.min()


def sph(p, c, r):
    return length(p - vec(*c)) - r


def cap(p, a, b, ra, rb=None):
    """Cápsula com raio que varia de `ra` a `rb`."""
    a = vec(*a)
    b = vec(*b)
    pa = p - a
    ba = b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    r = ra if rb is None else ra + (rb - ra) * h
    return length(pa - h[:, None] * ba) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def rot(yaw=0.0, pitch=0.0, roll=0.0):
    """Colunas = eixos locais no mundo. Ordem: giro (y), inclinação (x), rolagem (z); graus."""
    y, x, z = np.radians([yaw, pitch, roll])
    ry = np.array([[np.cos(y), 0, np.sin(y)], [0, 1, 0], [-np.sin(y), 0, np.cos(y)]])
    rx = np.array([[1, 0, 0], [0, np.cos(x), -np.sin(x)], [0, np.sin(x), np.cos(x)]])
    rz = np.array([[np.cos(z), -np.sin(z), 0], [np.sin(z), np.cos(z), 0], [0, 0, 1]])
    return (ry @ rx @ rz).astype(F)


# ───────────────────────────── esqueleto e pose da home (tudo o que se ajusta está aqui)
POSE = dict(
    # cabeça: centro, e para onde o rosto olha (giro −90 = perfil para a esquerda; +: vira para quem olha)
    head=(1.45, 0.8, 0.15),
    head_rot=(-66.0, 17.0, -6.0),
    # a mão que segura a dobra: onde fica a ponta da pinça e a orientação (dedos, dorso); o lado do polegar
    # fica para quem olha (o eixo Z da mão é espelhado)
    pinch=(0.0, 0.0, 0.95),
    hand_rot=(194.0, -24.0, 40.0),
    hand_scale=1.3,
    # ombros: o da frente sai do quadro pela direita; o de trás fica escondido atrás do pescoço
    shoulder_a=(2.78, 0.5, -0.05),
    shoulder_b=(1.72, 0.12, -0.7),
    # o volume do ombro e do peito que se vê na borda (parte do tronco)
    bulk=(2.4, 0.12, 0.3),
    chest=(3.05, -0.62, -0.2),
)
L1 = 1.3  # braço
L2 = 1.3  # antebraço
HS = POSE["hand_scale"]
WRIST = np.array([L1 + L2, 0.0, 0.0])


# ───────────────────────────── cabeça (coordenadas locais: y para cima, +z é a frente do rosto, +x a esquerda dela)
def head_local(p):
    m = p.copy()
    m[:, 0] = np.abs(m[:, 0])
    d = ell(p, (0, 0.13, -0.05), (0.365, 0.42, 0.455))
    d = smin(d, ell(p, (0, -0.16, 0.07), (0.285, 0.37, 0.325)), 0.16)
    d = smin(d, ell(p, (0, 0.22, 0.2), (0.27, 0.2, 0.2)), 0.12)
    # mandíbula e queixo
    d = smin(d, sph(m, (0.225, -0.31, -0.02), 0.095), 0.12)
    d = smin(d, cap(m, (0.215, -0.34, 0.0), (0.06, -0.47, 0.2), 0.075), 0.09)
    d = smin(d, ell(p, (0, -0.475, 0.215), (0.1, 0.085, 0.09)), 0.08)
    # maçãs do rosto e arcada da sobrancelha
    d = smin(d, ell(m, (0.205, -0.07, 0.215), (0.1, 0.075, 0.1)), 0.09)
    d = smin(d, cap(m, (0.045, 0.105, 0.345), (0.215, 0.115, 0.275), 0.05), 0.06)
    # órbitas, pálpebras fechadas e a linha dos cílios
    d = smax(d, -sph(m, (0.142, 0.03, 0.418), 0.072), 0.06)
    d = smin(d, ell(m, (0.142, 0.012, 0.318), (0.074, 0.046, 0.066)), 0.03)
    d = smax(d, -cap(m, (0.085, -0.006, 0.39), (0.2, -0.002, 0.345), 0.006), 0.012)
    # nariz: dorso, ponta, asas e o vinco com a bochecha
    d = smin(d, cap(p, (0, 0.085, 0.365), (0, -0.115, 0.468), 0.04), 0.055)
    d = smin(d, ell(p, (0, -0.14, 0.462), (0.05, 0.045, 0.058)), 0.035)
    d = smin(d, ell(m, (0.052, -0.168, 0.405), (0.036, 0.03, 0.045)), 0.03)
    d = smax(d, -cap(m, (0.085, -0.1, 0.42), (0.1, -0.2, 0.39), 0.022), 0.03)
    # boca e sulco do queixo
    d = smin(d, ell(p, (0, -0.268, 0.375), (0.088, 0.03, 0.055)), 0.03)
    d = smin(d, ell(p, (0, -0.325, 0.368), (0.076, 0.034, 0.052)), 0.03)
    d = smax(d, -cap(p, (-0.085, -0.296, 0.42), (0.085, -0.296, 0.42), 0.012), 0.018)
    d = smax(d, -ell(p, (0, -0.395, 0.345), (0.09, 0.022, 0.04)), 0.03)
    # orelha: concha, hélice e o vão
    ear = ell(m, (0.372, -0.02, -0.055), (0.04, 0.115, 0.075))
    ear = smax(ear, -ell(m, (0.405, -0.01, -0.04), (0.03, 0.075, 0.044)), 0.02)
    ear = smin(ear, sph(m, (0.385, -0.035, -0.02), 0.022), 0.02)
    d = smin(d, ear, 0.035)
    # pescoço e esternocleidomastóideo (o tronco entra em coordenadas da cena)
    d = smin(d, cap(p, (0, -0.4, -0.085), (0, -0.82, -0.14), 0.165, 0.175), 0.11)
    d = smin(d, cap(m, (0.2, -0.33, -0.1), (0.06, -0.86, 0.05), 0.045), 0.06)
    return d


def body_parts(p):
    """Cabeça e tronco na pose da cena (sem os braços: eles são articulados à parte)."""
    Rh = rot(*POSE["head_rot"])
    H = vec(*POSE["head"])
    S = vec(*POSE["bulk"])
    C = vec(*POSE["chest"])
    head = head_local((p - H) @ Rh)
    neck = (H + Rh @ vec(0, -0.82, -0.14)).astype(F)
    body = ell(p, C, (1.38, 1.5, 0.62))
    body = smin(body, cap(p, neck, C + vec(-0.75, 0.6, 0.1), 0.2, 0.3), 0.22)
    body = smin(body, cap(p, neck + vec(0.12, 0.0, -0.08), S + vec(0.0, 0.16, -0.12), 0.15, 0.2), 0.2)
    body = smin(body, cap(p, neck + vec(-0.05, -0.12, 0.16), S + vec(-0.12, 0.2, 0.08), 0.04, 0.045), 0.07)
    body = smin(body, ell(p, S, (0.33, 0.36, 0.34)), 0.18)
    return head, body


def body_sdf(p):
    head, body = body_parts(p)
    return smin(head, body, 0.14)


# ───────────────────────────── braço em repouso (ombro na origem, +X até o punho)
def fore_sdf(p):
    fore = cap(p, (L1, 0, 0), (L1 + L2 + 0.06, 0, 0), 0.172, 0.1)
    return smin(fore, ell(p, (L1 + 0.34, 0.0, 0.0), (0.4, 0.185, 0.19)), 0.14)


def arm_sdf(p):
    d = cap(p, (0, 0, 0), (L1, 0, 0), 0.215, 0.165)
    d = smin(d, sph(p, (0, 0, 0), 0.27), 0.12)
    d = smin(d, ell(p, (L1 * 0.42, 0.02, 0), (0.42, 0.21, 0.2)), 0.12)
    return smin(d, fore_sdf(p), 0.1)


# ───────────────────────────── mão (locais: X para os dedos, Y o dorso, Z o lado do polegar; origem no punho)
def chain(base, lengths, angles, spread=0.0):
    """Falanges: cada ângulo (graus) dobra a direção de +X para −Y; `spread` desvia em Z."""
    pts = [np.asarray(base, float)]
    a = 0.0
    for L, da in zip(lengths, angles):
        a += np.radians(da)
        pts.append(pts[-1] + L * np.array([np.cos(a), -np.sin(a), spread]))
    return pts


#        base (nó)               falanges                raios
FINGERS = dict(
    index=((0.42, 0.0, 0.125), (0.18, 0.106, 0.094), (0.044, 0.041, 0.037, 0.032)),
    middle=((0.435, 0.008, 0.04), (0.195, 0.118, 0.098), (0.045, 0.042, 0.038, 0.033)),
    ring=((0.415, 0.0, -0.045), (0.18, 0.11, 0.094), (0.042, 0.039, 0.035, 0.03)),
    pinky=((0.375, -0.018, -0.118), (0.14, 0.085, 0.082), (0.036, 0.033, 0.03, 0.026)),
)
THUMB_R = (0.062, 0.05, 0.046, 0.04)
THUMB_BASE = (0.11, -0.05, 0.14)
ORDER = ("index", "middle", "ring", "pinky", "thumb")
# o polegar da pinça encosta na polpa do indicador, logo abaixo dela COMO SE VÊ NA TELA na pose da home
RM_HOME = rot(*POSE["hand_rot"]) * vec(1, 1, -1)[None, :]


def pinch_thumb(index_tip):
    tip = index_tip + (RM_HOME.T @ vec(-0.006, -0.066, 0.03)).astype(float)
    ip = tip + (RM_HOME.T @ vec(0.118, 0.012, -0.02)).astype(float)
    return [np.array(THUMB_BASE), np.array((0.235, -0.17, 0.235)), ip, tip]


# cada forma: dobras (graus) e desvio lateral por dedo, e os pontos do polegar
SHAPES = dict(
    pinch=dict(index=((50, 50, 25), -0.035), middle=((57, 60, 32), -0.012), ring=((66, 70, 38), 0.015), pinky=((74, 78, 40), 0.045), thumb=None),
    open=dict(index=((6, 8, 5), -0.1), middle=((4, 7, 5), -0.02), ring=((6, 9, 6), 0.07), pinky=((9, 12, 8), 0.19), thumb=[THUMB_BASE, (0.25, -0.075, 0.29), (0.385, -0.085, 0.385), (0.49, -0.085, 0.455)]),
    relax=dict(index=((20, 26, 15), -0.06), middle=((26, 31, 18), -0.015), ring=((31, 35, 20), 0.04), pinky=((36, 40, 22), 0.12), thumb=[THUMB_BASE, (0.24, -0.115, 0.265), (0.365, -0.16, 0.325), (0.46, -0.2, 0.36)]),
)
SHAPE_ORDER = ("pinch", "open", "relax")


def hand_joints(shape):
    """Juntas de cada dedo (em unidades da mão, sem a escala) para uma forma."""
    S = SHAPES[shape]
    out = {}
    for name, (base, lengths, radii) in FINGERS.items():
        angles, spread = S[name]
        out[name] = (chain(base, lengths, angles, spread), radii)
    thumb = S["thumb"]
    out["thumb"] = (pinch_thumb(out["index"][0][-1]) if thumb is None else [np.asarray(q, float) for q in thumb], THUMB_R)
    return out


def hand_unit(p, J):
    # palma: metacarpos unidos, a eminência do polegar e o calcanhar da mão
    d = cap(p, (0.0, 0.0, 0.02), (0.42, 0.0, 0.125), 0.078, 0.052)
    d = smin(d, cap(p, (0.0, 0.0, 0.0), (0.435, 0.008, 0.04), 0.078, 0.054), 0.05)
    d = smin(d, cap(p, (0.0, 0.0, -0.02), (0.415, 0.0, -0.045), 0.074, 0.05), 0.05)
    d = smin(d, cap(p, (0.0, -0.005, -0.05), (0.375, -0.018, -0.118), 0.068, 0.044), 0.05)
    d = smin(d, ell(p, (0.17, -0.06, 0.12), (0.16, 0.07, 0.085)), 0.06)
    for name in ("index", "middle", "ring", "pinky"):
        b = np.array(FINGERS[name][0]) + np.array([0.0, 0.014, 0.0])
        d = smin(d, sph(p, b, 0.048 if name != "pinky" else 0.04), 0.03)
    # cada dedo é liso por dentro; entre dedos a união é dura (o vinco onde encostam)
    fingers = None
    for name in ORDER:
        pts, radii = J[name]
        f = None
        for i in range(len(pts) - 1):
            c = cap(p, pts[i], pts[i + 1], radii[i], radii[i + 1])
            f = c if f is None else smin(f, c, 0.014)
        for i in range(1, len(pts) - 1):
            f = smin(f, sph(p, pts[i], radii[i] * 1.05), 0.012)
        fingers = f if fingers is None else np.minimum(fingers, f)
    return smin(d, fingers, 0.035)


def hand_sdf(shape):
    """A mão (na escala dela) unida ao fim do antebraço, no espaço de repouso do braço."""
    J = hand_joints(shape)

    def f(p):
        p = np.asarray(p, F)
        return smin(fore_sdf(p), hand_unit((p - WRIST.astype(F)) / F(HS), J) * F(HS), 0.07)

    return f


def chunked(f, p, chunk=400000):
    p = np.asarray(p, F)
    if len(p) <= chunk:
        return f(p)
    return np.concatenate([f(p[i : i + chunk]) for i in range(0, len(p), chunk)])


def normal(f, p, e=0.0025):
    g = np.zeros_like(p)
    for i in range(3):
        o = np.zeros(3, F)
        o[i] = e
        g[:, i] = chunked(f, p + o) - chunked(f, p - o)
    return g / np.maximum(length(g), 1e-9)[:, None]


# ───────────────────────────── malha (surface nets: um vértice por célula cortada pela superfície)
CORNERS = np.array([(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1), (0, 1, 1), (1, 1, 1)])
EDGES = [(0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)]


def nets(f, lo, hi, h, keep=None, facing=None):
    """Malha de `f` dentro da caixa [lo, hi], com células de lado `h`. `keep(centros)` limita a região."""
    lo = np.asarray(lo, float)
    n = np.ceil((np.asarray(hi, float) - lo) / h).astype(int)
    ax = [lo[i] + h * np.arange(n[i] + 1) for i in range(3)]
    V = np.empty((n[0] + 1, n[1] + 1, n[2] + 1), F)
    gx, gy = np.meshgrid(ax[0], ax[1], indexing="ij")
    for k in range(n[2] + 1):
        pts = np.stack([gx.ravel(), gy.ravel(), np.full(gx.size, ax[2][k])], axis=1).astype(F)
        V[:, :, k] = chunked(f, pts).reshape(gx.shape)
    inside = V < 0
    cnt = np.zeros((n[0], n[1], n[2]), np.uint8)
    for cx, cy, cz in CORNERS:
        cnt += inside[cx : cx + n[0], cy : cy + n[1], cz : cz + n[2]]
    active = (cnt > 0) & (cnt < 8)
    cells = np.argwhere(active)
    if keep is not None:
        ok = keep(lo + h * (cells + 0.5))
        active[tuple(cells[~ok].T)] = False
        cells = cells[ok]
    index = np.full(active.shape, -1, np.int64)
    index[tuple(cells.T)] = np.arange(len(cells))
    vals = np.stack([V[cells[:, 0] + c[0], cells[:, 1] + c[1], cells[:, 2] + c[2]] for c in CORNERS], axis=1)
    acc = np.zeros((len(cells), 3))
    num = np.zeros(len(cells))
    for i, j in EDGES:
        va, vb = vals[:, i], vals[:, j]
        cross = (va < 0) != (vb < 0)
        t = np.where(cross, va / np.where(cross, va - vb, 1), 0)
        pt = CORNERS[i] + t[:, None] * (CORNERS[j] - CORNERS[i])
        acc += np.where(cross[:, None], pt, 0)
        num += cross
    verts = (lo + h * (cells + acc / num[:, None])).astype(F)
    quads = []
    for axis in range(3):
        u, v = [(1, 2), (0, 2), (0, 1)][axis]
        sl0 = [slice(None)] * 3
        sl1 = [slice(None)] * 3
        sl0[axis] = slice(0, -1)
        sl1[axis] = slice(1, None)
        sl0[u] = sl1[u] = slice(1, -1)
        sl0[v] = sl1[v] = slice(1, -1)
        cross = inside[tuple(sl0)] != inside[tuple(sl1)]
        e = np.argwhere(cross)
        e[:, u] += 1
        e[:, v] += 1
        e = e[(e[:, axis] < n[axis])]
        q = []
        for du, dv in ((-1, -1), (0, -1), (0, 0), (-1, 0)):
            c = e.copy()
            c[:, u] += du
            c[:, v] += dv
            q.append(index[c[:, 0], c[:, 1], c[:, 2]])
        q = np.stack(q, axis=1)
        quads.append(q[(q >= 0).all(axis=1)])
    q = np.concatenate(quads)
    tris = np.concatenate([q[:, [0, 1, 2]], q[:, [0, 2, 3]]])
    for _ in range(2):
        verts = verts - chunked(f, verts)[:, None] * normal(f, verts)
    nrm = normal(f, verts)
    face = np.cross(verts[tris[:, 1]] - verts[tris[:, 0]], verts[tris[:, 2]] - verts[tris[:, 0]])
    flip = (face * nrm[tris[:, 0]]).sum(axis=1) < 0
    tris[flip] = tris[flip][:, [0, 2, 1]]
    if facing is not None:  # só o corpo: a câmera quase não muda, o que olha para trás nunca aparece
        tris = tris[(nrm[tris][:, :, 2] > facing).any(axis=1)]
    used = np.unique(tris)
    remap = np.full(len(verts), -1, np.int64)
    remap[used] = np.arange(len(used))
    return verts[used], nrm[used], remap[tris]


def occlusion(f, p, n):
    ao = np.ones(len(p), F)
    for dist in (0.04, 0.1, 0.22):
        ao *= np.clip(0.3 + 0.7 * chunked(f, p + n * F(dist)) / dist, 0, 1)
    return ao


# ───────────────────────────── as três partes
def build_body(h):
    v, n, t = nets(body_sdf, (0.2, -1.62, -0.75), (2.62, 1.5, 1.2), h, keep=lambda c: c[:, 1] > -1.58, facing=-0.5)
    Rh = rot(*POSE["head_rot"])
    H = vec(*POSE["head"])
    head, body = body_parts(v)
    w = np.exp(-np.stack([body, head], axis=1) / 0.05)
    w /= w.sum(axis=1, keepdims=True)
    neck = (H + Rh @ vec(0, -0.82, -0.14)).astype(F)
    top = (H + Rh @ vec(0, 0.56, 0.0)).astype(F)
    S = vec(*POSE["bulk"])

    def along(a, b):
        return np.clip(((v - a) @ (b - a)) / float((b - a) @ (b - a)), 0, 1)

    path = w[:, 0] * (0.56 + 0.1 * along(S, neck)) + w[:, 1] * (0.66 + 0.34 * along(neck, top))
    q = (v - H) @ Rh
    # a matéria se desfaz atrás da cabeça, na borda direita e abaixo do quadro: é dali que as moléculas saem
    back = np.clip((-q[:, 2] - 0.02 + 0.22 * q[:, 1]) / 0.5, 0, 1) * np.clip((q[:, 1] + 0.62) / 0.3, 0, 1)
    edge = np.maximum(np.clip((v[:, 0] - 2.02) / 0.42, 0, 1), np.clip((-0.86 - v[:, 1]) / 0.34, 0, 1))
    dissolve = np.clip(w[:, 1] * back + w[:, 0] * edge * np.clip((v[:, 0] - 1.5) / 0.4, 0, 1), 0, 1)
    # a cabeça gira em volta do alto do pescoço: a pele do pescoço se reparte entre os dois ossos
    hw = np.clip((q[:, 1] + 0.86) / 0.42, 0, 1)
    hw = hw * hw * (3 - 2 * hw) * np.clip(w[:, 1] * 2, 0, 1)
    skin = np.stack([np.ones(len(v)), np.zeros(len(v)), hw], axis=1)  # osso A = cabeça (1), B = tronco (0), peso de A
    return dict(shapes=[(v, n, occlusion(body_sdf, v, n))], t=t, path=path, dissolve=dissolve, skin=skin)


TOTAL = L1 + L2 + 0.62 * HS  # do ombro à ponta dos dedos esticados


def wrist_weight(x):
    """Quanto é da mão (o resto é do antebraço): 0 antes do punho, 1 depois."""
    w = np.clip((x - (L1 + L2 - 0.14)) / 0.3, 0, 1)
    return w * w * (3 - 2 * w)


def build_arm(h, cut):
    v, n, t = nets(arm_sdf, (-0.34, -0.36, -0.36), (L1 + L2 - cut + 3 * h, 0.36, 0.36), h, keep=lambda c: c[:, 0] < L1 + L2 - cut + 1.5 * h)
    path = 0.5 * (1 - np.clip(v[:, 0] / TOTAL, 0, 1))
    # cotovelo: braço (2) ↔ antebraço (3)
    e = np.clip((v[:, 0] - (L1 - 0.2)) / 0.4, 0, 1)
    e = e * e * (3 - 2 * e)
    skin = np.stack([np.full(len(v), 2), np.full(len(v), 3), 1 - e], axis=1)
    return dict(shapes=[(v, n, occlusion(arm_sdf, v, n))], t=t, path=path, dissolve=np.zeros(len(v)), skin=skin)


def finger_frames(J):
    """Segmentos de todos os dedos: base, eixos (colunas) e comprimento, em unidades da mão."""
    segs = []
    for name in ORDER:
        pts, _ = J[name]
        for i in range(len(pts) - 1):
            d = pts[i + 1] - pts[i]
            L = np.linalg.norm(d)
            x = d / L
            up = np.array([0.0, 1.0, 0.0]) if name != "thumb" else np.array([0.3, 0.9, -0.3])
            z = np.cross(x, up)
            z /= np.linalg.norm(z)
            y = np.cross(z, x)
            segs.append((pts[i], np.stack([x, y, z], axis=1), L))
    return segs


def build_hand(h, cut):
    """A malha nasce na forma relaxada; as outras formas levam os mesmos vértices pelos ossos dos dedos."""
    base = "relax"
    f0 = hand_sdf(base)
    lo = np.array([L1 + L2 - cut - h, -0.62 * HS, -0.5 * HS])
    hi = WRIST + np.array([0.78, 0.36, 0.6]) * HS
    v, n, t = nets(f0, lo, hi, h, keep=lambda c: c[:, 0] > L1 + L2 - cut)
    u = (v.astype(float) - WRIST) / HS
    J0 = hand_joints(base)
    segs0 = finger_frames(J0)
    radii = [r for name in ORDER for r in J0[name][1][:-1]]
    # a que segmento cada vértice pertence, e onde fica nele; longe de qualquer falange é palma (não se move)
    best = np.zeros(len(u), int)
    dist = np.full(len(u), 1e9)
    local = np.zeros((len(u), 3))
    for k, (o, R, L) in enumerate(segs0):
        q = (u - o) @ R
        d = np.sqrt((q[:, 0] - np.clip(q[:, 0], 0, L)) ** 2 + q[:, 1] ** 2 + q[:, 2] ** 2) - radii[k]
        take = d < dist
        best[take] = k
        dist[take] = d[take]
        local[take] = q[take]
    carry = 1 - np.clip(dist / 0.03, 0, 1)[:, None]  # perto da palma o dedo arrasta só em parte
    shapes = []
    for name in SHAPE_ORDER:
        f = hand_sdf(name)
        if name == base:
            p = v.copy()
            nn = normal(f, p)
        else:
            segs = finger_frames(hand_joints(name))
            moved = u.copy()
            turned = n.astype(float).copy()
            for k, ((_, R0, _), (o1, R1, _)) in enumerate(zip(segs0, segs)):
                m = best == k
                moved[m] = o1 + local[m] @ R1.T
                turned[m] = (n[m].astype(float) @ R0) @ R1.T
            p = ((u + (moved - u) * carry) * HS + WRIST).astype(F)
            turned = n * (1 - carry) + turned * carry
            nn = (turned / np.maximum(length(turned), 1e-9)[:, None]).astype(F)
            # só o que ficou rente à superfície da nova pose é assentado nela; o que foi parar dentro da matéria (o
            # lado do dedo que encosta na palma ou no vizinho) fica onde está, escondido, com a normal que tinha
            for _ in range(5):
                d = chunked(f, p)
                near = np.abs(d) < 0.02
                p[near] = p[near] - d[near, None] * normal(f, p[near])
            near = np.abs(chunked(f, p)) < 0.004
            nn[near] = normal(f, p[near])
        shapes.append((p, nn, occlusion(f, p, nn)))
    path = 0.5 * (1 - np.clip(v[:, 0] / TOTAL, 0, 1))
    skin = np.stack([np.full(len(v), 4), np.full(len(v), 3), wrist_weight(v[:, 0])], axis=1)
    return dict(shapes=shapes, t=t, path=path, dissolve=np.zeros(len(v)), skin=skin)


def write(path, parts):
    rng = np.random.default_rng(20261120)
    with open(path, "wb") as f:
        f.write(b"MTF2" + struct.pack("<I", len(parts)))
        for d in parts:
            n = len(d["shapes"][0][0])
            assert n < 65536, n
            allv = np.concatenate([s[0] for s in d["shapes"]])
            center = 0.5 * (allv.max(axis=0) + allv.min(axis=0))
            scale = float(np.abs(allv - center).max()) * 1.001
            f.write(struct.pack("<III3ff", n, d["t"].size, len(d["shapes"]), *center, scale))
            for v, nrm, ao in d["shapes"]:
                f.write(np.round((v - center) / scale * 32767).astype("<i2").tobytes())
                f.write(bytes((n * 6) % 4))
                f.write(np.concatenate([np.round(np.clip(nrm, -1, 1) * 127), np.round(ao * 127)[:, None]], axis=1).astype("i1").tobytes())
            meta = np.stack([d["path"], d["dissolve"], rng.random(n), np.zeros(n)], axis=1)
            f.write(np.round(np.clip(meta, 0, 1) * 255).astype("u1").tobytes())
            skin = np.stack([d["skin"][:, 0], d["skin"][:, 1], np.round(np.clip(d["skin"][:, 2], 0, 1) * 255), np.zeros(n)], axis=1)
            f.write(skin.astype("u1").tobytes())
            idx = d["t"].astype("<u2").tobytes()
            f.write(idx + bytes(len(idx) % 4))
    return os.path.getsize(path)


def pinch_point():
    J = hand_joints("pinch")
    return (0.5 * (J["index"][0][-1] + J["thumb"][0][-1]) + RM_HOME.T.astype(float) @ np.array([-0.03, 0.0, 0.0])) * HS


def rig_data():
    """As medidas do esqueleto e a pose da home, para o motor (rig.ts)."""
    Rh = rot(*POSE["head_rot"])
    H = vec(*POSE["head"])
    fmt = lambda a: "[" + ", ".join(f"{float(x):.4f}" for x in np.asarray(a).ravel()) + "]"
    lines = [
        "// GERADO por assets/materia/build_figure.py — não editar à mão.",
        "// Medidas do esqueleto da figura (unidades da cena: a ponta da dobra em repouso é a origem, a cabeça mede ~1).",
        "export const RIG = {",
        "  /** Comprimento do braço e do antebraço; a mão começa no punho, em x = L1 + L2 do espaço de repouso. */",
        f"  L1: {L1}, L2: {L2},",
        "  /** Ombros (a = o braço que segura a ponta; b = o outro, escondido atrás do pescoço) e o pivô da cabeça. */",
        f"  shoulderA: {fmt(POSE['shoulder_a'])}, shoulderB: {fmt(POSE['shoulder_b'])},",
        f"  neck: {fmt(H + Rh @ vec(0, -0.5, -0.09))},",
        "  /** Onde a pinça fecha na home e a orientação da mão ali (dedos, dorso, lado do polegar — três vetores). */",
        f"  pinch: {fmt(POSE['pinch'])}, homeHand: {fmt(RM_HOME.T)},",
        "  /** Pontos de contato da mão, a partir do punho, nos eixos dela: a pinça, a palma (apoiar) e a ponta dos dedos. */",
        f"  contact: {{ pinch: {fmt(pinch_point())}, palm: {fmt(np.array([0.26, -0.085, 0.02]) * HS)}, tips: {fmt(np.array([0.72, -0.05, 0.02]) * HS)} }},",
        "  /** As formas da mão, na ordem em que vêm no arquivo. */",
        "  shapes: [" + ", ".join(f'"{s}"' for s in SHAPE_ORDER) + "],",
        "} as const;",
        "",
    ]
    with open(RIG_TS, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))


# ───────────────────────────── prévia da pose da home (o mesmo esqueleto do motor, resolvido aqui)
def home_bones():
    """Ossos do braço que segura a ponta, na home: p_cena = R @ p_repouso + t."""
    Rm = RM_HOME.astype(float)
    W = np.array(POSE["pinch"], float) - Rm @ pinch_point()
    S = np.array(POSE["shoulder_a"], float)
    d = W - S
    dist = min(np.linalg.norm(d), (L1 + L2) * 0.999)
    a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist)
    hgt = np.sqrt(max(L1 * L1 - a * a, 0))
    dirn = d / np.linalg.norm(d)
    pole = np.array([0.35, -1.0, 0.45])
    pole = pole - (pole @ dirn) * dirn
    pole /= np.linalg.norm(pole)
    E = S + a * dirn + hgt * pole

    def frame(x, yref):
        x = x / np.linalg.norm(x)
        y = yref - (yref @ x) * x
        y /= np.linalg.norm(y)
        return np.stack([x, y, -np.cross(x, y)], axis=1)  # espelhado, como a mão

    Rf = frame(W - E, Rm[:, 1])
    Ru = frame(E - S, Rf[:, 1])
    return (Ru, S), (Rf, E - Rf @ np.array([L1, 0, 0])), (Rm, W - Rm @ WRIST)


def scene_sdf():
    (Ru, tu), (Rf, tf), (Rm, tm) = home_bones()
    hand = hand_sdf("pinch")

    def f(p):
        p = np.asarray(p, F)
        qu = (p - tu.astype(F)) @ Ru.astype(F)
        qf = (p - tf.astype(F)) @ Rf.astype(F)
        qm = (p - tm.astype(F)) @ Rm.astype(F)
        up = smin(cap(qu, (0, 0, 0), (L1, 0, 0), 0.215, 0.165), ell(qu, (L1 * 0.42, 0.02, 0), (0.42, 0.21, 0.2)), 0.12)
        # da mão só entra o que a malha dela tem: do fim do antebraço em diante
        return np.minimum(np.minimum(body_sdf(p), smin(up, fore_sdf(qf), 0.1)), np.maximum(hand(qm), F(L1 + L2 - 0.3) - qm[:, 0]))

    return f


VIEWS = dict(desktop=dict(w=1440, h=864, k=356.0, tip=(0.431, 0.59)), phone=dict(w=390, h=494, k=215.0, tip=(0.19, 0.49)))
FOV = 24.0


def preview(name, view="desktop", scale=0.5, zoom=None):
    from PIL import Image

    f = scene_sdf()
    V = VIEWS[view]
    w, h = int(V["w"] * scale), int(V["h"] * scale)
    k = V["k"] * scale
    tip = np.array([V["tip"][0] * w, V["tip"][1] * h])
    D = (h / k) / (2 * np.tan(np.radians(FOV) / 2))
    # a ponta da pinça (com a perspectiva dela) cai sobre a ponta da dobra, como no motor
    org = np.array([w / 2, h / 2]) + (tip - np.array([w / 2, h / 2])) * (D - POSE["pinch"][2]) / D
    if zoom:  # (x, y, lado em unidades): um quadrado em volta de um ponto da cena
        w = h = 520
        k = w / zoom[2]
        D = (h / k) / (2 * np.tan(np.radians(FOV) / 2))
        org = np.array([w / 2 - zoom[0] * k, h / 2 + zoom[1] * k])
    cx = (w / 2 - org[0]) / k
    cy = -(h / 2 - org[1]) / k
    cam = np.array([cx, cy, D], F)
    px, py = np.meshgrid(np.arange(w) + 0.5, np.arange(h) + 0.5)
    tgt = np.stack([(px.ravel() - w / 2) / k + cx, -(py.ravel() - h / 2) / k + cy, np.zeros(w * h)], axis=1).astype(F)
    rd = tgt - cam
    rd /= length(rd)[:, None]
    t = np.full(w * h, max(D - 2.4, 0.4), F)
    alive = np.ones(w * h, bool)
    hit = np.zeros(w * h, bool)
    for _ in range(90):
        idx = np.nonzero(alive)[0]
        if len(idx) == 0:
            break
        d = chunked(f, cam + rd[idx] * t[idx, None])
        t[idx] += d * 0.85
        done = d < 0.002
        hit[idx[done]] = True
        alive[idx[done]] = False
        alive[idx[t[idx] > D + 2.6]] = False
    img = np.full((w * h, 3), 0.95, F)
    hi = np.nonzero(hit)[0]
    p = cam + rd[hi] * t[hi, None]
    n = normal(f, p)
    v = -rd[hi]
    r = 2 * (n * v).sum(axis=1)[:, None] * n - v
    az = np.arctan2(r[:, 0], r[:, 2])
    el = r[:, 1]
    top = np.clip((el - 0.24) / 0.26, 0, 1) * np.clip((0.98 - el) / 0.22, 0, 1)
    front = np.exp(-(((az - 0.3) / 0.8) ** 2) - ((el - 0.02) / 0.5) ** 2)
    wall = np.exp(-(((az + 1.85) / 0.62) ** 2)) * np.clip((el + 0.8) / 0.65, 0, 1)
    col = 0.05 + 0.2 * np.clip(0.5 + 0.5 * el, 0, 1) ** 2 + 0.64 * top + 0.34 * front + 0.5 * wall
    fres = (1 - np.clip((n * v).sum(axis=1), 0, 1)) ** 3
    img[hi] = (np.clip(col * (1 - 0.72 * fres), 0, 1) ** (1 / 2.2))[:, None]
    os.makedirs(".audit/materia", exist_ok=True)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype("u1").reshape(h, w, 3)).save(f".audit/materia/{name}.png")
    return f".audit/materia/{name}.png"


if __name__ == "__main__":
    args = sys.argv[1:]
    rig_data()
    if "--preview" in args:
        view = "phone" if "--phone" in args else "desktop"
        print(preview(f"figure-{view}", view, 0.5 if view == "desktop" else 1.0))
        if "--hand" in args:
            print(preview("figure-hand", view, 1, zoom=(0.4, 0.12, 1.5)))
        sys.exit(0)
    os.makedirs(OUT, exist_ok=True)
    for name, hb, ha, hh in (("materia-figure.bin", 0.015, 0.02, 0.0115), ("materia-figure-lite.bin", 0.021, 0.027, 0.0155)):
        cut = 0.3
        # o corpo de cada figura vem das esculturas (assets/materia/sculpt); daqui saem só o braço e a mão
        parts = [build_arm(ha, cut), build_hand(hh, cut)]
        size = write(os.path.join(OUT, name), parts)
        print(name, " + ".join(f"{len(d['shapes'][0][0])} vértices / {len(d['t'])} faces" for d in parts), f"· {size / 1024:.0f} KB")
