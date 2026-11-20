"""
MATÉRIA — gerador da escultura do MilWeb OS.

Gera, com numpy, duas nuvens de moléculas com correspondência estável (a molécula i do busto é a
molécula i do cérebro):

  busto   · cabeça, pescoço e ombros esculpidos por distância assinada (SDF), mais o ARCO — um
            tubo de matéria que sai do ombro, contorna a nuca e entra na cabeça. É a assinatura da
            silhueta e reaparece no cérebro.
  cérebro · dois hemisférios com sulcos (giroide deformado), cerebelo, tronco e o mesmo arco.

Saída (public/models/): materia-a.bin (celular: concentra as moléculas no rosto e nos ombros) e
materia-b.bin (o resto: o desktop soma os dois). Cada arquivo traz um cérebro inteiro casado com as
suas moléculas do busto; semente fixa, ordem embaralhada dentro de cada um.

  python assets/materia/build_materia.py            # gera os .bin
  python assets/materia/build_materia.py --preview  # e grava prévias em .audit/materia/

Formato (little-endian): "MTR1", uint32 n, float32 escala do busto, float32 escala do cérebro;
depois, em blocos: busto int16[3n], cérebro int16[3n], normal do busto int8[3n], normal do
cérebro int8[3n], meta uint8[4n] = (semente, dissolução, borda de sulco, região).
Regiões: 0 rosto/crânio · 1 pescoço e ombros · 2 arco.

Eixos: y para cima, +z para a frente do rosto, +x para a esquerda do personagem. Unidade: a cabeça
mede ~1 de altura; a origem fica no centro da cabeça.
"""
from __future__ import annotations

import os
import struct
import sys

import numpy as np

SEED = 20261120
N_A = 22000  # celular
N_B = 30000  # desktop soma
N_ARC = 3600  # dentro do total
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "models")
rng = np.random.default_rng(SEED)


# ───────────────────────────── distância assinada
def length(v):
    return np.sqrt((v * v).sum(axis=1))


def ell(p, c, r):
    r = np.asarray(r, float)
    k = length((p - c) / r)
    return (k - 1.0) * r.min()


def sph(p, c, r):
    return length(p - np.asarray(c, float)) - r


def cap(p, a, b, r):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    pa = p - a
    ba = b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return length(pa - h[:, None] * ba) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def mirror(p):
    q = p.copy()
    q[:, 0] = np.abs(q[:, 0])
    return q


def bust_sdf(p):
    """Busto estilizado: anatomia própria, planos largos (lê bem como metal polido)."""
    m = mirror(p)
    # crânio e massa do rosto
    d = ell(p, (0, 0.13, -0.05), (0.365, 0.42, 0.455))
    d = smin(d, ell(p, (0, -0.16, 0.07), (0.285, 0.37, 0.325)), 0.16)
    # testa mais reta, têmporas
    d = smin(d, ell(p, (0, 0.22, 0.2), (0.27, 0.2, 0.2)), 0.12)
    # mandíbula: ângulo, linha e queixo
    d = smin(d, sph(m, (0.225, -0.31, -0.02), 0.095), 0.12)
    d = smin(d, cap(m, (0.215, -0.34, 0.0), (0.06, -0.47, 0.2), 0.075), 0.09)
    d = smin(d, ell(p, (0, -0.475, 0.215), (0.1, 0.085, 0.09)), 0.08)
    # maçãs do rosto e arcada da sobrancelha
    d = smin(d, ell(m, (0.205, -0.07, 0.215), (0.1, 0.075, 0.1)), 0.09)
    d = smin(d, cap(m, (0.045, 0.105, 0.345), (0.215, 0.115, 0.275), 0.05), 0.06)
    # órbitas (escavadas) e pálpebras fechadas, lisas
    d = smax(d, -sph(m, (0.142, 0.03, 0.418), 0.072), 0.06)
    d = smin(d, ell(m, (0.142, 0.012, 0.318), (0.074, 0.046, 0.066)), 0.03)
    d = smax(d, -cap(m, (0.085, -0.006, 0.39), (0.2, -0.002, 0.345), 0.006), 0.012)
    # nariz: dorso, ponta e asas; depois o vinco entre nariz e bochecha
    d = smin(d, cap(p, (0, 0.085, 0.365), (0, -0.115, 0.468), 0.04), 0.055)
    d = smin(d, ell(p, (0, -0.14, 0.462), (0.05, 0.045, 0.058)), 0.035)
    d = smin(d, ell(m, (0.052, -0.168, 0.405), (0.036, 0.03, 0.045)), 0.03)
    d = smax(d, -cap(m, (0.085, -0.1, 0.42), (0.1, -0.2, 0.39), 0.022), 0.03)
    # boca: lábios e a linha entre eles; sulco do queixo
    d = smin(d, ell(p, (0, -0.268, 0.375), (0.088, 0.03, 0.055)), 0.03)
    d = smin(d, ell(p, (0, -0.325, 0.368), (0.076, 0.034, 0.052)), 0.03)
    d = smax(d, -cap(p, (-0.085, -0.296, 0.42), (0.085, -0.296, 0.42), 0.012), 0.018)
    d = smax(d, -ell(p, (0, -0.395, 0.345), (0.09, 0.022, 0.04)), 0.03)
    # orelhas: concha simples
    ear = ell(m, (0.372, -0.02, -0.055), (0.038, 0.105, 0.07))
    ear = smax(ear, -ell(m, (0.4, -0.015, -0.04), (0.03, 0.07, 0.042)), 0.02)
    d = smin(d, ear, 0.035)
    # pescoço, esternocleidomastóideo e trapézio
    d = smin(d, cap(p, (0, -0.4, -0.085), (0, -0.98, -0.15), 0.165), 0.11)
    d = smin(d, cap(m, (0.2, -0.33, -0.1), (0.045, -0.93, 0.07), 0.045), 0.06)
    d = smin(d, cap(m, (0.09, -0.62, -0.2), (0.5, -0.98, -0.17), 0.085), 0.14)
    # ombros, peito e clavículas (com a fúrcula entre elas)
    body = ell(p, (0, -1.3, -0.07), (0.6, 0.36, 0.27))
    body = smin(body, sph(m, (0.62, -1.11, -0.11), 0.185), 0.16)
    body = smin(body, cap(m, (0.045, -0.955, 0.105), (0.56, -0.99, -0.0), 0.034), 0.045)
    body = smax(body, -sph(p, (0, -0.93, 0.19), 0.06), 0.06)
    d = smin(d, body, 0.12)
    return d


def gyri(p, f=44.0):
    """Giroide deformado: |g| ≈ 0 desenha linhas sinuosas na superfície — os sulcos."""
    w = np.stack([np.sin(3.1 * p[:, 1] + 1.3 * np.sin(2.3 * p[:, 2])), np.sin(2.7 * p[:, 2] + 1.9 * np.sin(3.3 * p[:, 0])), np.sin(3.7 * p[:, 0] + 1.1 * np.sin(2.9 * p[:, 1]))], axis=1)
    q = f * p * np.array([1.0, 0.82, 0.7]) + 2.1 * w
    g = np.sin(q[:, 0]) * np.cos(q[:, 1]) + np.sin(q[:, 1]) * np.cos(q[:, 2]) + np.sin(q[:, 2]) * np.cos(q[:, 0])
    return np.abs(g)


def brain_parts(p):
    """Devolve (distância, sulco 0..1, borda 0..1). O sulco é 1 no fundo das dobras; a borda, 1 rente a elas."""
    m = mirror(p)
    hemi = ell(m, (0.155, 0.03, 0.0), (0.195, 0.235, 0.43))
    hemi = smin(hemi, ell(m, (0.165, 0.01, 0.22), (0.165, 0.2, 0.2)), 0.08)  # lobo frontal
    hemi = smin(hemi, ell(m, (0.235, -0.14, 0.08), (0.115, 0.1, 0.24)), 0.07)  # lobo temporal
    hemi = smin(hemi, ell(m, (0.14, 0.0, -0.29), (0.15, 0.19, 0.17)), 0.08)  # occipital
    g = gyri(p)
    groove = 1.0 - np.clip(g / 0.3, 0, 1)
    groove = groove * groove * (3 - 2 * groove)
    d = hemi + 0.018 * groove
    # fissura longitudinal entre os hemisférios e sulco lateral
    d = d + 0.034 * np.exp(-((p[:, 0] / 0.016) ** 2))
    d = smax(d, -cap(m, (0.38, -0.07, 0.2), (0.33, -0.01, -0.12), 0.016), 0.03)
    # cerebelo (folhas finas, horizontais) e tronco
    cer = ell(m, (0.11, -0.225, -0.29), (0.17, 0.105, 0.14)) + 0.008 * (0.5 + 0.5 * np.sin(95 * p[:, 1] + 6 * p[:, 2]))
    stem = cap(p, (0, -0.16, -0.1), (0, -0.4, -0.07), 0.06)
    body = smin(cer, stem, 0.05)
    leaves = 0.5 + 0.5 * np.sin(95 * p[:, 1] + 6 * p[:, 2])
    fold = np.where(body < d, 0.0, groove)
    edge = np.where(body < d, 0.5 * leaves, 1.0 - np.clip((g - 0.3) / 0.5, 0, 1))
    return smin(d, body, 0.04), fold, edge


def brain_sdf(p):
    return brain_parts(p)[0]


def slope(f, p, e=0.002):
    """Gradiente por diferença central (não normalizado)."""
    g = np.zeros_like(p)
    for i in range(3):
        o = np.zeros(3)
        o[i] = e
        g[:, i] = (f(p + o) - f(p - o)) / (2 * e)
    return g


def grad(f, p, e=0.002):
    g = slope(f, p, e)
    return g / np.maximum(length(g), 1e-9)[:, None]


def sample_surface(f, lo, hi, count, band=0.03, weight=None, batch=600000, steps=4, tol=6e-4):
    """Pontos uniformes numa casca fina em volta da superfície, projetados nela (Newton)."""
    pts = []
    have = 0
    lo = np.asarray(lo, float)
    hi = np.asarray(hi, float)
    while have < count:
        p = lo + rng.random((batch, 3)) * (hi - lo)
        d = f(p)
        p = p[np.abs(d) < band]
        # Newton de verdade (divide pelo quadrado do gradiente): nos sulcos o campo é mais íngreme que uma
        # distância, e o passo cheio fazia as moléculas de dentro deles oscilarem e serem descartadas.
        for _ in range(steps):
            g = slope(f, p)
            p = p - (f(p) / np.maximum((g * g).sum(axis=1), 1e-9))[:, None] * g
        p = p[np.abs(f(p)) < tol]
        if weight is not None:
            p = p[rng.random(len(p)) < weight(p)]
        pts.append(p)
        have += len(p)
    p = np.concatenate(pts)[:count]
    return p, grad(f, p)


# ───────────────────────────── o arco
def catmull(points, t):
    """Curva de Catmull-Rom por `points`, t em 0..1."""
    pts = np.asarray(points, float)
    n = len(pts) - 1
    x = np.clip(t, 0, 1) * n
    i = np.minimum(x.astype(int), n - 1)
    u = (x - i)[:, None]
    p0 = pts[np.maximum(i - 1, 0)]
    p1 = pts[i]
    p2 = pts[i + 1]
    p3 = pts[np.minimum(i + 2, n)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u**3)


# Sai do ombro esquerdo do personagem, sobe por trás, contorna a nuca com folga e entra no alto do crânio.
ARC_BUST = [(0.6, -1.0, -0.02), (0.66, -0.74, -0.3), (0.42, -0.4, -0.6), (0.0, -0.16, -0.72), (-0.4, 0.14, -0.56), (-0.44, 0.42, -0.2), (-0.2, 0.5, 0.02)]
# No cérebro: sai da base do tronco, contorna por trás e mergulha entre os hemisférios — a mesma curva.
ARC_BRAIN = [(0.03, -0.4, -0.06), (0.3, -0.38, -0.3), (0.42, -0.14, -0.5), (0.0, 0.06, -0.63), (-0.38, 0.16, -0.42), (-0.33, 0.2, -0.14), (-0.14, 0.1, -0.02)]


def arc_points(path, count, r0, r1):
    t = np.sort(rng.random(count))
    phi = rng.random(count) * 2 * np.pi
    c = catmull(path, t)
    tan = catmull(path, t + 1e-3) - catmull(path, t - 1e-3)
    tan /= length(tan)[:, None]
    up = np.tile(np.array([0.0, 1.0, 0.0]), (count, 1))
    side = np.cross(tan, up)
    side /= length(side)[:, None]
    up2 = np.cross(side, tan)
    # afina nas pontas e engrossa de leve no meio: lê como metal escorrendo
    r = (r0 + (r1 - r0) * np.sin(np.pi * t) ** 0.8)[:, None]
    n = np.cos(phi)[:, None] * side + np.sin(phi)[:, None] * up2
    return c + r * n, n, t


# ───────────────────────────── correspondência
def match(a, b):
    """Bijeção coerente no espaço: bisseção por mediana, no eixo mais longo do subconjunto do busto."""
    out = np.empty(len(a), dtype=np.int64)
    stack = [(np.arange(len(a)), np.arange(len(b)))]
    while stack:
        ia, ib = stack.pop()
        if len(ia) <= 1:
            out[ia] = ib
            continue
        axis = int(np.argmax(a[ia].max(axis=0) - a[ia].min(axis=0)))
        ia = ia[np.argsort(a[ia, axis], kind="stable")]
        ib = ib[np.argsort(b[ib, axis], kind="stable")]
        h = len(ia) // 2
        stack.append((ia[:h], ib[:h]))
        stack.append((ia[h:], ib[h:]))
    return out


def noise3(p, f):
    return np.sin(p[:, 0] * f + 1.7) * np.sin(p[:, 1] * f * 1.13 + 0.3) * np.sin(p[:, 2] * f * 0.91 + 2.1)


def dissolution(pos, region, t_arc):
    """A nuca se desfaz para trás, do lado que a câmera vê; a base do busto também. O rosto fica íntegro."""
    back = np.clip((-pos[:, 2] - 0.07 + 0.38 * pos[:, 0]) / 0.4, 0, 1)
    low = np.clip((-1.02 - pos[:, 1]) / 0.42, 0, 1)
    grain = 0.5 + 0.5 * noise3(pos, 9.0) * np.sign(noise3(pos, 23.0) + 0.2)
    d = np.clip(np.maximum(back * back * (0.55 + 0.75 * grain), low * (0.5 + 0.7 * grain)), 0, 1)
    arc = region == 2
    d[arc] = np.clip((0.08 - t_arc[arc]) / 0.08, 0, 1) * 0.5  # o arco é inteiro; só a raiz no ombro se solta
    d[(pos[:, 2] > -0.04) & (region == 0)] = 0.0
    return d


def build():
    n_total = N_A + N_B
    n_body = n_total - N_ARC
    arc_a = round(N_ARC * N_A / n_total)
    counts = ((N_A - arc_a, arc_a), (N_B - (N_ARC - arc_a), N_ARC - arc_a))

    # ── busto: mais moléculas onde o rosto precisa ler (frente da cabeça), menos atrás e nos ombros
    def weight(p):
        head = np.clip((p[:, 1] + 0.52) / 0.2, 0, 1)
        front = np.clip((p[:, 2] + 0.12) / 0.4, 0, 1)
        return 0.34 + 0.66 * head * (0.42 + 0.58 * front)

    bust, bust_n = sample_surface(bust_sdf, (-0.86, -1.5, -0.6), (0.86, 0.6, 0.56), n_body, weight=weight)
    keep = bust[:, 1] > -1.44
    bust, bust_n = bust[keep], bust_n[keep]
    extra, extra_n = sample_surface(bust_sdf, (-0.4, -0.55, 0.0), (0.4, 0.5, 0.56), n_body - len(bust))
    bust = np.concatenate([bust, extra])
    bust_n = np.concatenate([bust_n, extra_n])

    # O telefone enquadra rosto e ombros: o primeiro arquivo concentra as suas moléculas ali (com um resto no
    # peito, que some no enquadramento). O segundo traz o que falta — juntos, a distribuição é a de cima.
    score = rng.random(len(bust)) * np.where(bust[:, 1] > -0.98, 1.0, 0.16)
    by_score = np.argsort(-score)
    split = (by_score[: counts[0][0]], by_score[counts[0][0] :])

    scale = 1.42  # o cérebro aparece maior que a cabeça de onde saiu
    lift = np.array([0, 0.06, 0])
    parts = []
    for idx, (n_b, n_arc) in zip(split, counts):
        assert len(idx) == n_b
        # cada arquivo tem um cérebro INTEIRO, casado com as suas moléculas do busto
        # Os sulcos ficam vazios: é o vão entre as dobras que desenha a linha. Cada molécula guarda quão rente
        # a um sulco ela está — é por ali que o pulso da resposta corre.
        brain, brain_n = sample_surface(brain_sdf, (-0.45, -0.5, -0.52), (0.45, 0.34, 0.5), n_b, band=0.025, steps=7, tol=1.5e-3, weight=lambda q: (brain_parts(q)[1] < 0.1).astype(float))
        fold = brain_parts(brain)[2]
        pair = match(bust[idx], brain * scale + lift)
        brain, brain_n, fold = brain[pair], brain_n[pair], fold[pair]
        arc_b, arc_bn, t_b = arc_points(ARC_BUST, n_arc, 0.012, 0.04)
        arc_c, arc_cn, _ = arc_points(ARC_BRAIN, n_arc, 0.008, 0.026)

        pos = np.concatenate([bust[idx], arc_b])
        region = np.concatenate([np.where(bust[idx][:, 1] > -0.52, 0, 1), np.full(n_arc, 2)])
        part = dict(
            pos=pos,
            nrm=np.concatenate([bust_n[idx], arc_bn]),
            bpos=np.concatenate([brain, arc_c]) * scale + lift,
            bnrm=np.concatenate([brain_n, arc_cn]),
            seed=rng.random(len(pos)),
            dissolve=dissolution(pos, region, np.concatenate([np.ones(n_b), t_b])),
            sulcus=np.concatenate([fold, np.zeros(n_arc)]),
            region=region,
        )
        order = rng.permutation(len(pos))
        parts.append({k: v[order] for k, v in part.items()})
    return {k: np.concatenate([parts[0][k], parts[1][k]]) for k in parts[0]}


def write(path, d, a, b):
    n = b - a
    s_bust = float(np.abs(d["pos"]).max()) * 1.001
    s_brain = float(np.abs(d["bpos"]).max()) * 1.001
    q16 = lambda v, s: np.round(v / s * 32767).astype("<i2").tobytes()
    q8 = lambda v: np.round(np.clip(v, -1, 1) * 127).astype("i1").tobytes()
    meta = np.stack([d["seed"][a:b] * 255, d["dissolve"][a:b] * 255, d["sulcus"][a:b] * 255, d["region"][a:b]], axis=1)
    with open(path, "wb") as f:
        f.write(b"MTR1" + struct.pack("<Iff", n, s_bust, s_brain))
        f.write(q16(d["pos"][a:b], s_bust))
        f.write(q16(d["bpos"][a:b], s_brain))
        f.write(q8(d["nrm"][a:b]))
        f.write(q8(d["bnrm"][a:b]))
        f.write(np.round(meta).astype("u1").tobytes())
    return os.path.getsize(path)


# ───────────────────────────── prévia (revisão da anatomia sem abrir o navegador)
def preview(d, name, which="bust", yaw=-34.0, size=900, light=False):
    from PIL import Image

    p = d["pos"] if which == "bust" else d["bpos"]
    n = d["nrm"] if which == "bust" else d["bnrm"]
    a = np.radians(yaw)
    rot = np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]])
    p = p @ rot.T
    n = n @ rot.T
    if which == "bust":
        drift = d["dissolve"][:, None] ** 2 * np.array([0.5, 0.06, -0.25]) * (0.3 + d["seed"][:, None])
        p = p + drift
    k = size / (2.5 if which == "bust" else 1.9)
    cy = -0.42 if which == "bust" else 0.0
    x = (size / 2 + p[:, 0] * k).astype(int)
    y = (size / 2 - (p[:, 1] - cy) * k).astype(int)
    # cromo: reflexo de um ambiente escuro com uma faixa estreita de luz e um recorte carmesim
    r = np.stack([2 * n[:, 2] * n[:, 0], 2 * n[:, 2] * n[:, 1], 2 * n[:, 2] * n[:, 2] - 1], axis=1)
    az = np.arctan2(r[:, 0], r[:, 2])
    strip = np.exp(-(((az + 0.55) / 0.16) ** 2)) * np.clip(1.2 - np.abs(r[:, 1]), 0, 1)
    fill = np.clip(0.5 + 0.5 * r[:, 1], 0, 1) ** 2 * 0.28
    rim = np.exp(-(((az - 2.2) / 0.3) ** 2))
    facing = np.clip(n[:, 2] * 3 + 0.4, 0, 1)
    base = 0.07 + fill + 1.25 * strip
    col = np.stack([base + 0.9 * rim, base + 0.08 * rim, base + 0.1 * rim], axis=1)
    if which == "brain":
        col *= (1 - 0.7 * d["sulcus"])[:, None]
    col *= (facing * (1 - 0.55 * d["dissolve"]))[:, None]
    if light:
        col = 0.92 - col * 0.8
    img = np.full((size, size, 3), 0.93 if light else 0.035)
    order = np.argsort(p[:, 2])
    x, y, col = x[order], y[order], np.clip(col[order], 0, 1)
    for dx in (0, 1):
        for dy in (0, 1):
            ok = (x + dx >= 0) & (x + dx < size) & (y + dy >= 0) & (y + dy < size)
            img[y[ok] + dy, x[ok] + dx] = col[ok]
    os.makedirs(".audit/materia", exist_ok=True)
    Image.fromarray((np.clip(img, 0, 1) ** (1 / 2.2) * 255).astype("u1")).save(f".audit/materia/{name}.png")


if __name__ == "__main__":
    data = build()
    os.makedirs(OUT, exist_ok=True)
    size_a = write(os.path.join(OUT, "materia-a.bin"), data, 0, N_A)
    size_b = write(os.path.join(OUT, "materia-b.bin"), data, N_A, N_A + N_B)
    print(f"materia-a.bin {N_A} moléculas, {size_a / 1024:.0f} KB · materia-b.bin {N_B} moléculas, {size_b / 1024:.0f} KB")
    if "--preview" in sys.argv:
        preview(data, "py-bust-34", yaw=-34)
        preview(data, "py-bust-front", yaw=0)
        preview(data, "py-bust-profile", yaw=-88)
        preview(data, "py-bust-back", yaw=150)
        preview(data, "py-brain-34", which="brain", yaw=-34)
        preview(data, "py-brain-top", which="brain", yaw=-70)
        print("prévias em .audit/materia/")
