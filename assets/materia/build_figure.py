"""
MATÉRIA — a figura da home: rosto de perfil, ombro, braço e a mão que segura a dobra da tela.

Superfície contínua (malha), esculpida por distância assinada com numpy, na pose da composição:
a origem é a PONTA DA DOBRA (onde o polegar e o indicador se encontram), x para a direita, y para
cima, z para quem olha; a cabeça mede ~1.

  python assets/materia/build_figure.py            # gera public/models/materia-figure.bin (e -lite)
  python assets/materia/build_figure.py --preview  # só a prévia (.audit/materia/figure-*.png), sem malha
  python assets/materia/build_figure.py --preview --phone

Formato (little-endian): "MTF1", uint32 partes, float32 centro[3], float32 escala, float32 pinça[3];
cada parte: uint32 vértices, uint32 índices, posição int16[3n], normal + oclusão int8[4n], meta
uint8[4n] = (caminho da luz: 0 na ponta dos dedos … 255 no alto da cabeça, quanto segue a mão,
dissolução, semente) e os índices uint16 (alinhados em 4 bytes). Duas partes: o corpo e a mão (mais fina).
"""
from __future__ import annotations

import os
import struct
import sys

import numpy as np

F = np.float32
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "models")


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


# ───────────────────────────── pose (tudo o que se ajusta está aqui)
POSE = dict(
    # cabeça: centro, e para onde o rosto olha (giro −90 = perfil para a esquerda; +: vira para quem olha)
    head=(1.45, 0.8, 0.15),
    head_rot=(-66.0, 17.0, -6.0),
    # mão: onde fica a ponta da pinça, a orientação (dedos, dorso) e o tamanho (a mão está perto de quem olha)
    pinch=(0.0, 0.0, 0.95),
    hand_rot=(194.0, -24.0, 40.0),
    hand_scale=1.3,
    # o cotovelo fica fora do quadro, à direita; o ombro avança na borda e o tronco desce além da borda de baixo
    elbow=(2.62, -0.6, 0.72),
    shoulder=(2.4, 0.12, 0.3),
    chest=(3.05, -0.62, -0.2),
)


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
    # pescoço e esternocleidomastóideo (o resto do corpo entra em coordenadas do mundo)
    d = smin(d, cap(p, (0, -0.4, -0.085), (0, -0.82, -0.14), 0.165, 0.175), 0.11)
    d = smin(d, cap(m, (0.2, -0.33, -0.1), (0.06, -0.86, 0.05), 0.045), 0.06)
    return d


# ───────────────────────────── mão (locais: X para os dedos, Y o dorso, Z o lado do polegar; origem no punho)
def chain(base, lengths, angles, spread=0.0):
    """Falanges: cada ângulo (graus) dobra a direção de +X para −Y; `spread` desvia em Z."""
    pts = [np.asarray(base, float)]
    a = 0.0
    for L, da in zip(lengths, angles):
        a += np.radians(da)
        pts.append(pts[-1] + L * np.array([np.cos(a), -np.sin(a), spread]))
    return pts


FINGERS = dict(
    #        base (nó)               falanges              dobras          desvio  raios
    index=((0.42, 0.0, 0.125), (0.18, 0.106, 0.094), (50, 50, 25), -0.035, (0.044, 0.041, 0.037, 0.032)),
    middle=((0.435, 0.008, 0.04), (0.195, 0.118, 0.098), (57, 60, 32), -0.012, (0.045, 0.042, 0.038, 0.033)),
    ring=((0.415, 0.0, -0.045), (0.18, 0.11, 0.094), (66, 70, 38), 0.015, (0.042, 0.039, 0.035, 0.03)),
    pinky=((0.375, -0.018, -0.118), (0.14, 0.085, 0.082), (74, 78, 40), 0.045, (0.036, 0.033, 0.03, 0.026)),
)
THUMB_R = (0.062, 0.05, 0.046, 0.04)


def hand_points():
    """Juntas de cada dedo, em coordenadas da mão. O polegar chega por baixo e encosta na polpa do indicador."""
    out = {}
    for name, (base, lengths, angles, spread, radii) in FINGERS.items():
        out[name] = (chain(base, lengths, angles, spread), radii)
    # a ponta do polegar fica logo abaixo da ponta do indicador COMO SE VÊ NA TELA (deslocamento no mundo → mão)
    Rm = rot(*POSE["hand_rot"]) * vec(1, 1, -1)[None, :]
    below = (Rm.T @ vec(-0.006, -0.066, 0.03)).astype(float)
    tip = out["index"][0][-1] + below
    back = (Rm.T @ vec(0.118, 0.012, -0.02)).astype(float)  # a última falange vem quase deitada
    ip = tip + back
    out["thumb"] = ([np.array((0.11, -0.05, 0.14)), np.array((0.235, -0.17, 0.235)), ip, tip], THUMB_R)
    return out


HAND = hand_points()
# a ponta da pinça, em coordenadas da mão: entre a polpa do indicador e a do polegar, um pouco à frente
PINCH_LOCAL = 0.5 * (HAND["index"][0][-1] + HAND["thumb"][0][-1]) + (rot(*POSE["hand_rot"]) * vec(1, 1, -1)[None, :]).T.astype(float) @ np.array([-0.03, 0.0, 0.0])


def hand_local(p):
    # palma: metacarpos unidos, a eminência do polegar e o calcanhar da mão
    d = cap(p, (0.0, 0.0, 0.02), (0.42, 0.0, 0.125), 0.078, 0.052)
    d = smin(d, cap(p, (0.0, 0.0, 0.0), (0.435, 0.008, 0.04), 0.078, 0.054), 0.05)
    d = smin(d, cap(p, (0.0, 0.0, -0.02), (0.415, 0.0, -0.045), 0.074, 0.05), 0.05)
    d = smin(d, cap(p, (0.0, -0.005, -0.05), (0.375, -0.018, -0.118), 0.068, 0.044), 0.05)
    d = smin(d, ell(p, (0.17, -0.06, 0.12), (0.16, 0.07, 0.085)), 0.06)
    # nós dos dedos no dorso
    for name in ("index", "middle", "ring", "pinky"):
        b = np.array(FINGERS[name][0]) + np.array([0.0, 0.014, 0.0])
        d = smin(d, sph(p, b, 0.048 if name != "pinky" else 0.04), 0.03)
    # cada dedo é liso por dentro; entre dedos a união é dura (o vinco onde encostam)
    fingers = None
    for name, (pts, radii) in HAND.items():
        f = None
        for i in range(len(pts) - 1):
            c = cap(p, pts[i], pts[i + 1], radii[i], radii[i + 1])
            f = c if f is None else smin(f, c, 0.014)
        for i in range(1, len(pts) - 1):
            f = smin(f, sph(p, pts[i], radii[i] * 1.05), 0.012)
        fingers = f if fingers is None else np.minimum(fingers, f)
    return smin(d, fingers, 0.035)


def frames():
    """Matrizes da pose: cabeça e mão (colunas = eixos locais no mundo) e os pontos do braço."""
    Rh = rot(*POSE["head_rot"])
    # o lado do polegar fica para quem olha: o eixo Z da mão é espelhado
    Rm = rot(*POSE["hand_rot"]) * vec(1, 1, -1)[None, :]
    pinch = vec(*POSE["pinch"])
    wrist = pinch - Rm @ (PINCH_LOCAL.astype(F) * F(POSE["hand_scale"]))
    return Rh, vec(*POSE["head"]), Rm, wrist


def figure_parts(p):
    """Distância de cada parte (cabeça, corpo, braço, mão), sem unir."""
    Rh, H, Rm, W = frames()
    E = vec(*POSE["elbow"])
    S = vec(*POSE["shoulder"])
    C = vec(*POSE["chest"])
    head = head_local((p - H) @ Rh)
    hs = F(POSE["hand_scale"])
    hand = hand_local((p - W) @ Rm / hs) * hs
    # antebraço: do punho (achatado, na direção do dorso) ao cotovelo, com o ventre do músculo
    ax = (E - W) / np.linalg.norm(E - W)
    fore = cap(p, W + ax * 0.02, E, 0.102, 0.19)
    fore = smin(fore, ell(p, W + ax * 1.05, (0.42, 0.185, 0.19)), 0.14)
    upper = cap(p, E, S, 0.17, 0.2)
    upper = smin(upper, ell(p, S, (0.33, 0.36, 0.34)), 0.18)
    # tronco: peito largo, trapézio e a base do pescoço
    neck = (H + Rh @ vec(0, -0.82, -0.14)).astype(F)
    body = ell(p, C, (1.38, 1.5, 0.62))
    body = smin(body, cap(p, neck, C + vec(-0.75, 0.6, 0.1), 0.2, 0.3), 0.22)
    body = smin(body, cap(p, neck + vec(0.12, 0.0, -0.08), S + vec(0.0, 0.16, -0.12), 0.15, 0.2), 0.2)
    # clavícula: a linha que liga o pescoço ao ombro
    body = smin(body, cap(p, neck + vec(-0.05, -0.12, 0.16), S + vec(-0.12, 0.2, 0.08), 0.04, 0.045), 0.07)
    return head, body, fore, upper, hand


def figure(p):
    head, body, fore, upper, hand = figure_parts(p)
    arm = smin(fore, upper, 0.1)
    d = smin(head, body, 0.14)
    d = smin(d, arm, 0.16)
    d = smin(d, hand, 0.07)
    return d


def sdf(p, chunk=400000):
    p = np.asarray(p, F)
    if len(p) <= chunk:
        return figure(p)
    return np.concatenate([figure(p[i : i + chunk]) for i in range(0, len(p), chunk)])


def normal(p, e=0.0025):
    g = np.zeros_like(p)
    for i in range(3):
        o = np.zeros(3, F)
        o[i] = e
        g[:, i] = sdf(p + o) - sdf(p - o)
    return g / np.maximum(length(g), 1e-9)[:, None]


# ───────────────────────────── câmera e prévia (a mesma composição do navegador: materia/config.ts › COMPOSE)
VIEWS = dict(
    desktop=dict(w=1440, h=864, k=356.0, tip=(0.445, 0.565)),
    phone=dict(w=390, h=430, k=300.0, tip=(0.3, 0.7)),
)
FOV = 24.0


def env(r, n, pos, light):
    """O que o metal reflete na PRÉVIA (aproxima o estúdio do shader, hero-shaders.ts › STUDIO_LIB): serve para ajustar a pose, não a luz."""
    az = np.arctan2(r[:, 0], r[:, 2])
    el = r[:, 1]
    sky = np.clip(0.5 + 0.5 * el, 0, 1)
    base = 0.035 + 0.2 * sky**2
    # faixa larga de luz, à esquerda e à frente: testa, nariz, maçã do rosto, nós dos dedos
    wide = np.clip(1 - np.abs((az + 0.95) / 0.62), 0, 1)
    wide = wide * wide * (3 - 2 * wide) * np.clip((el + 0.55) / 0.5, 0, 1) * np.clip((1.02 - el) / 0.3, 0, 1)
    box = wide
    # faixa longa (reflexos compridos nos membros) e um recorte por trás
    strip = np.exp(-(((az - 0.75) / 0.1) ** 2)) * np.clip(1.1 - np.abs(el), 0, 1)
    strip2 = np.exp(-(((az - 2.4) / 0.25) ** 2)) * np.clip(1.0 - np.abs(el), 0, 1) * 0.6
    # o plano da página atrás (claro no tema claro)
    page = np.clip(-r[:, 2] - 0.15, 0, 1) * (0.3 if light else 0.05)
    col = (base + 1.05 * box + 0.9 * strip + strip2 + page)[:, None] * np.array([1.0, 1.02, 1.06], F)
    # luz de baixo, da fenda: cobalto no claro, carmesim no escuro; mais forte perto da ponta da dobra
    near = np.exp(-((pos[:, 0] - 0.15) ** 2 + (pos[:, 1] + 0.3) ** 2) / 0.55)
    under = np.clip(-el - 0.25, 0, 1) ** 1.5 * (0.12 + 1.9 * near)
    acc = np.array([0.1, 0.33, 1.0] if light else [1.0, 0.12, 0.14], F)
    col = col + under[:, None] * acc
    return col


def preview(name, view="desktop", light=True, scale=0.5, yaw=0.0, zoom=None):
    from PIL import Image

    V = VIEWS[view]
    w, h = int(V["w"] * scale), int(V["h"] * scale)
    k = V["k"] * scale
    tip = (V["tip"][0] * w, V["tip"][1] * h)
    if zoom:  # (x, y, lado em unidades): um quadrado em volta de um ponto da cena
        w = h = 560
        k = w / zoom[2]
        tip = (w / 2 - zoom[0] * k, h / 2 + zoom[1] * k)
    D = (h / k) / (2 * np.tan(np.radians(FOV) / 2))
    cx = (w / 2 - tip[0]) / k
    cy = -(h / 2 - tip[1]) / k
    cam = np.array([cx, cy, D], F)
    px, py = np.meshgrid(np.arange(w) + 0.5, np.arange(h) + 0.5)
    tgt = np.stack([(px.ravel() - w / 2) / k + cx, -(py.ravel() - h / 2) / k + cy, np.zeros(w * h)], axis=1).astype(F)
    rd = tgt - cam
    rd /= length(rd)[:, None]
    if yaw:  # gira a cena em volta da ponta (para conferir a anatomia de outros lados)
        R = rot(yaw)
        cam = (R @ cam).astype(F)
        rd = rd @ R.T
    t = np.full(w * h, (D - 2.2) / np.maximum(-rd[:, 2] if not yaw else 1.0, 0.2), F) if not yaw else np.full(w * h, max(D - 3.2, 0.5), F)
    alive = np.ones(w * h, bool)
    hit = np.zeros(w * h, bool)
    far = D + 2.6
    for _ in range(90):
        idx = np.nonzero(alive)[0]
        if len(idx) == 0:
            break
        p = cam + rd[idx] * t[idx, None]
        d = sdf(p)
        t[idx] += d * 0.85
        done = d < 0.0018
        hit[idx[done]] = True
        alive[idx[done]] = False
        alive[idx[t[idx] > far]] = False
    img = np.zeros((w * h, 3), F)
    bg = np.array([0.945, 0.957, 0.973] if light else [0.055, 0.056, 0.066], F)
    img[:] = bg
    hi = np.nonzero(hit)[0]
    p = cam + rd[hi] * t[hi, None]
    n = normal(p)
    v = -rd[hi]
    r = 2 * (n * v).sum(axis=1)[:, None] * n - v
    col = env(r, n, p, light)
    # oclusão barata pela própria distância
    ao = np.ones(len(p), F)
    for dist in (0.05, 0.12, 0.25):
        ao *= np.clip(0.35 + 0.65 * sdf(p + n * dist) / dist, 0, 1)
    fres = (1 - np.clip((n * v).sum(axis=1), 0, 1)) ** 4
    col = col * (0.35 + 0.65 * ao)[:, None] * (1 - 0.55 * fres)[:, None]
    img[hi] = np.clip(col, 0, 1)
    os.makedirs(".audit/materia", exist_ok=True)
    out = (np.clip(img, 0, 1) ** (1 / 2.2) * 255).astype("u1").reshape(h, w, 3)
    Image.fromarray(out).save(f".audit/materia/{name}.png")
    return f".audit/materia/{name}.png"


# ───────────────────────────── malha (surface nets: um vértice por célula cortada pela superfície)
CORNERS = np.array([(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1), (0, 1, 1), (1, 1, 1)])
EDGES = [(0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)]


def nets(lo, hi, h, keep=None):
    """Malha da figura dentro da caixa [lo, hi], com células de lado `h`. `keep(centros)` limita a região."""
    lo = np.asarray(lo, float)
    n = np.ceil((np.asarray(hi, float) - lo) / h).astype(int)
    ax = [lo[i] + h * np.arange(n[i] + 1) for i in range(3)]
    V = np.empty((n[0] + 1, n[1] + 1, n[2] + 1), F)
    gx, gy = np.meshgrid(ax[0], ax[1], indexing="ij")
    for k in range(n[2] + 1):
        pts = np.stack([gx.ravel(), gy.ravel(), np.full(gx.size, ax[2][k])], axis=1).astype(F)
        V[:, :, k] = sdf(pts).reshape(gx.shape)
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
    # vértice: média dos cruzamentos nas 12 arestas da célula
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
    # faces: cada aresta da grade com troca de sinal liga as quatro células que a compartilham
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
    # assenta os vértices na superfície e orienta as faces para fora
    for _ in range(2):
        verts = verts - sdf(verts)[:, None] * normal(verts)
    nrm = normal(verts)
    face = np.cross(verts[tris[:, 1]] - verts[tris[:, 0]], verts[tris[:, 2]] - verts[tris[:, 0]])
    flip = (face * nrm[tris[:, 0]]).sum(axis=1) < 0
    tris[flip] = tris[flip][:, [0, 2, 1]]
    # a câmera é fixa (só a mão se mexe um pouco): faces que olham para trás nunca aparecem
    tris = tris[(nrm[tris][:, :, 2] > -0.34).any(axis=1)]
    used = np.unique(tris)
    remap = np.full(len(verts), -1, np.int64)
    remap[used] = np.arange(len(used))
    return verts[used], nrm[used], remap[tris]


def attributes(p, n):
    """Por vértice: oclusão, o caminho da luz (0 na ponta dos dedos … 1 no alto da cabeça), quanto segue a mão, dissolução."""
    Rh, H, Rm, W = frames()
    E = vec(*POSE["elbow"])
    S = vec(*POSE["shoulder"])
    P = vec(*POSE["pinch"])
    head, body, fore, upper, hand = figure_parts(p)
    w = np.exp(-np.stack([hand, fore, upper, body, head], axis=1) / 0.05)
    w /= w.sum(axis=1, keepdims=True)

    def along(a, b):
        return np.clip(((p - a) @ (b - a)) / float((b - a) @ (b - a)), 0, 1)

    neck = (H + Rh @ vec(0, -0.82, -0.14)).astype(F)
    top = (H + Rh @ vec(0, 0.56, 0.0)).astype(F)
    path = np.stack([0.17 * along(P, W), 0.17 + 0.33 * along(W, E), 0.5 + 0.06 * along(E, S), 0.56 + 0.1 * along(S, neck), 0.66 + 0.34 * along(neck, top)], axis=1)
    follow = np.stack([np.ones(len(p)), 1 - along(W, E), np.zeros(len(p)), np.zeros(len(p)), np.zeros(len(p))], axis=1)
    q = (p - H) @ Rh
    # a matéria se desfaz atrás da cabeça, na borda direita e abaixo do quadro: é dali que as moléculas saem
    back = np.clip((-q[:, 2] - 0.02 + 0.22 * q[:, 1]) / 0.5, 0, 1) * np.clip((q[:, 1] + 0.62) / 0.3, 0, 1)
    edge = np.maximum(np.clip((p[:, 0] - 2.02) / 0.42, 0, 1), np.clip((-0.86 - p[:, 1]) / 0.34, 0, 1))
    dissolve = np.clip(w[:, 4] * back + (1 - w[:, 4]) * edge * (1 - w[:, 0]) * np.clip((p[:, 0] - 1.5) / 0.4, 0, 1), 0, 1)
    ao = np.ones(len(p), F)
    for dist in (0.04, 0.1, 0.22):
        ao *= np.clip(0.3 + 0.7 * sdf(p + n * F(dist)) / dist, 0, 1)
    return ao, (w * path).sum(axis=1), (w * follow).sum(axis=1), dissolve


def build(h_body, h_hand, clip_x=2.62):
    Rh, H, Rm, W = frames()
    E = vec(*POSE["elbow"])
    ax = (E - W) / np.linalg.norm(E - W)
    cut = 0.2  # a mão vai, em malha fina, até um pouco depois do punho; as duas malhas se sobrepõem numa faixa
    hs = POSE["hand_scale"]
    lo = W + np.array([-0.95, -0.75, -0.6]) * hs
    hi = W + np.array([0.45, 0.45, 0.6]) * hs
    hand = nets(lo, hi, h_hand, keep=lambda c: (c - W) @ ax < cut + h_body)
    # o corpo fica com tudo o que está além do punho — e com o que está fora da caixa da mão (o plano do punho,
    # prolongado, cortaria a testa)
    outside = lambda c: ((c < lo) | (c > hi)).any(axis=1)
    body = nets((0.2, -1.62, -0.75), (clip_x, 1.5, 1.35), h_body, keep=lambda c: (((c - W) @ ax > cut - h_body) | outside(c)) & (c[:, 1] > -1.58))
    parts = []
    rng = np.random.default_rng(20261120)
    for v, n, t in (body, hand):
        ao, path, follow, dissolve = attributes(v, n)
        parts.append(dict(v=v, n=n, t=t, ao=ao, path=path, follow=follow, dissolve=dissolve, seed=rng.random(len(v))))
    return parts


def write(path, parts):
    allv = np.concatenate([d["v"] for d in parts])
    center = 0.5 * (allv.max(axis=0) + allv.min(axis=0))
    scale = float(np.abs(allv - center).max()) * 1.001
    with open(path, "wb") as f:
        f.write(b"MTF1" + struct.pack("<I3ff3f", len(parts), *center, scale, *POSE["pinch"]))
        for d in parts:
            assert len(d["v"]) < 65536, len(d["v"])
            f.write(struct.pack("<II", len(d["v"]), d["t"].size))
            f.write(np.round((d["v"] - center) / scale * 32767).astype("<i2").tobytes())
            nq = np.concatenate([np.round(np.clip(d["n"], -1, 1) * 127), np.round(d["ao"] * 127)[:, None]], axis=1).astype("i1")
            f.write(nq.tobytes())
            meta = np.stack([d["path"], d["follow"], d["dissolve"], d["seed"]], axis=1)
            f.write(np.round(np.clip(meta, 0, 1) * 255).astype("u1").tobytes())
            idx = d["t"].astype("<u2").tobytes()
            f.write(idx + b"\0" * (len(idx) % 4))
    return os.path.getsize(path)


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--preview" in args:
        view = "phone" if "--phone" in args else "desktop"
        sc = 0.5 if view == "desktop" else 1.0
        print(preview(f"figure-{view}-light", view, True, sc))
        if "--dark" in args:
            print(preview(f"figure-{view}-dark", view, False, sc))
        for a in args:
            if a.startswith("--yaw="):
                print(preview(f"figure-yaw{a[6:]}", view, True, sc, float(a[6:])))
        if "--hand" in args:
            print(preview("figure-hand", view, True, 1, zoom=(0.38, 0.12, 1.3)))
        if "--head" in args:
            H = POSE["head"]
            print(preview("figure-head", view, True, 1, zoom=(H[0] * 1.03, H[1] * 1.03, 1.7)))
        sys.exit(0)
    os.makedirs(OUT, exist_ok=True)
    for name, hb, hh in (("materia-figure.bin", 0.015, 0.0098), ("materia-figure-lite.bin", 0.021, 0.013)):
        parts = build(hb, hh)
        size = write(os.path.join(OUT, name), parts)
        print(name, " + ".join(f"{len(d['v'])} vértices / {len(d['t'])} faces" for d in parts), f"· {size / 1024:.0f} KB")
