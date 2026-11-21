"""
MATÉRIA · esculturas — anatomia paramétrica (distância assinada).

Um corpo humano construído JÁ NA POSE: o esqueleto (pelve → cintura → peito → pescoço → cabeça; quadril → joelho →
tornozelo) é resolvido por cinemática direta e as massas (caixa torácica, peitorais, deltoides, quadríceps,
panturrilhas, maléolos, pés) são somadas no referencial de cada osso. Sem pele esticada: o joelho dobrado e o
quadril sentado nascem limpos. Os BRAÇOS não entram aqui: no site eles são articulados (rig.ts) e usam a malha
de assets/materia/build_figure.py; `arm()` os reconstrói na pose para o panejamento, a silhueta e as prévias.

Lados: "L" é a esquerda DA FIGURA (x local positivo; à direita de quem a vê de frente), "R" a direita dela.
Unidades: a cabeça mede ~1,1; a figura em pé, ~8,2.
"""
from __future__ import annotations

import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import build_figure as bf  # noqa: E402  (a cabeça, o braço e a mão já esculpidos)

from sdf import F, Frame, cap, ell, fbm, length, smax, smin, sph, vec  # noqa: E402

L1, L2, HS = bf.L1, bf.L2, bf.HS

SHAPE = dict(
    sw=1.0,  # largura dos ombros
    hw=1.0,  # largura do quadril
    build=1.0,  # espessura de membros e massas
    depth=1.0,  # profundidade do tronco
    waist=1.0,
    bust=0.0,  # 0 = peitorais; > 0 = seios (raio relativo)
    legs=1.0,  # comprimento das pernas
    neck=1.0,
    head=1.0,
    jaw=0.0,  # mandíbula mais larga (+) ou mais fina (−)
    brow=0.0,  # arcada da sobrancelha
    age=0.0,  # faces encovadas, sulcos
    cut=0.0,  # definição dos músculos do tronco (0 liso … 1 marcado)
)
POSE = dict(
    root=(0.0, 0.0, 0.0),  # centro da pelve
    turn=(0.0, 0.0, 0.0),  # giro, inclinação, rolagem da pelve
    waist=(0.0, 0.0, 0.0),
    chest=(0.0, 0.0, 0.0),
    neck=(0.0, 0.0, 0.0),
    head=(0.0, 0.0, 0.0),
    # quadril: (flexão para a frente, abertura para fora, giro para fora); joelho: dobra; tornozelo: (ponta para cima, giro para fora)
    hipL=(0.0, 0.0, 0.0),
    kneeL=0.0,
    ankleL=(0.0, 0.0),
    hipR=(0.0, 0.0, 0.0),
    kneeR=0.0,
    ankleR=(0.0, 0.0),
)


def rx(a):
    a = np.radians(a)
    return np.array([[1, 0, 0], [0, np.cos(a), -np.sin(a)], [0, np.sin(a), np.cos(a)]])


def ry(a):
    a = np.radians(a)
    return np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]])


def rz(a):
    a = np.radians(a)
    return np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]])


def ypr(yaw, pitch, roll):
    return ry(yaw) @ rx(pitch) @ rz(roll)


def mirror(q):
    m = q.copy()
    m[:, 0] = np.abs(m[:, 0])
    return m


# ───────────────────────────── cabeça: o rosto esculpido em build_figure, com variações
def face(q, S):
    """`q` em coordenadas da cabeça (y para cima, +z a frente do rosto)."""
    q = q.copy()
    if S["jaw"]:
        low = np.clip((-q[:, 1] - 0.08) / 0.3, 0, 1)
        q[:, 0] = q[:, 0] / (1 + S["jaw"] * low)
    d = bf.head_local(q)
    m = mirror(q)
    if S["brow"]:
        d = smin(d, cap(m, (0.03, 0.12, 0.36), (0.23, 0.13, 0.28), 0.045 * S["brow"]), 0.06)
    if S["age"]:
        a = S["age"]
        # faces encovadas, o sulco do nariz à boca e a têmpora funda
        d = smax(d, -ell(m, (0.2, -0.2, 0.3), (0.075, 0.11, 0.06)), 0.08 / max(a, 0.5))
        d = smax(d, -cap(m, (0.075, -0.17, 0.42), (0.13, -0.3, 0.37), 0.014 * a), 0.03)
        d = smax(d, -ell(m, (0.3, 0.12, 0.2), (0.05, 0.1, 0.09)), 0.07)
        d = smin(d, cap(m, (0.06, 0.03, 0.4), (0.19, 0.0, 0.36), 0.022 * a), 0.03)  # bolsa sob o olho
    return d


def _bumps(q, k, seed=0.0):
    return np.sin(q[:, 0] * k + 1.3 + seed) * np.sin(q[:, 1] * k * 1.07 + 0.4 + seed) * np.sin(q[:, 2] * k * 0.93 + 2.1 + seed)


def _scalp(q, grow=0.045, front=0.5, nape=0.42, base=0.11):
    """A calota do cabelo: a caixa craniana um pouco maior, cortada na linha do cabelo (testa, têmporas, nuca)."""
    shell = ell(q, (0, 0.14, -0.06), (0.365 + grow, 0.42 + grow, 0.455 + grow))
    line = base + front * np.clip(q[:, 2], 0, 1) - 1.25 * np.clip(-q[:, 2] - 0.08, 0, nape)
    return smax(shell, line - q[:, 1], 0.05)


def hair(q, style):
    """Cabelo e barba, em coordenadas da cabeça. Devolve None quando não há."""
    m = mirror(q)
    if style == "curls":  # curto, esculpido em cachos miúdos
        d = _scalp(q, 0.06)
        w = q + 0.02 * np.stack([np.sin(q[:, 1] * 9), np.sin(q[:, 2] * 8), np.sin(q[:, 0] * 10)], axis=1).astype(F)
        return d - 0.03 * _bumps(w, 21.0) - 0.012 * _bumps(w, 43.0, 1.7)
    if style == "crop":  # rente, penteado para trás em mechas largas
        d = _scalp(q, 0.04, front=0.46)
        return d - 0.014 * np.sin(q[:, 0] * 26 + 7 * q[:, 2] + 3 * np.sin(q[:, 1] * 7))
    if style == "elder":  # cabelo comprido em ondas, barba cheia e bigode
        d = _scalp(q, 0.07, front=0.42, nape=0.5)
        d = smin(d, cap(m, (0.31, 0.12, -0.12), (0.4, -0.72, -0.22), 0.19, 0.15), 0.14)
        d = smin(d, cap(q, (0, 0.0, -0.42), (0, -0.82, -0.36), 0.3, 0.26), 0.16)
        beard = ell(q, (0, -0.56, 0.2), (0.285, 0.4, 0.22))
        beard = smin(beard, cap(m, (0.26, -0.2, 0.06), (0.14, -0.5, 0.2), 0.11, 0.13), 0.1)
        beard = smin(beard, cap(m, (0.02, -0.235, 0.41), (0.16, -0.3, 0.34), 0.038), 0.04)  # bigode
        beard = smax(beard, -cap(q, (-0.07, -0.3, 0.44), (0.07, -0.3, 0.44), 0.018), 0.02)  # a boca
        d = smin(d, beard, 0.07)
        strand = np.sin(q[:, 0] * 30 + 5 * np.sin(q[:, 1] * 6.5 + q[:, 2] * 3)) * 0.5 + 0.5 * np.sin(q[:, 0] * 13 + q[:, 1] * 9 + 2 * np.sin(q[:, 1] * 5))
        return d - 0.02 * strand
    if style == "bun":  # preso, com um coque atrás
        d = _scalp(q, 0.035, front=0.46)
        d = smin(d, sph(q, (0, 0.3, -0.52), 0.21), 0.06)
        d = smin(d, sph(m, (0.2, 0.38, 0.1), 0.2), 0.12)  # a onda que sai da risca
        return d - 0.008 * np.sin(q[:, 0] * 58 + 6 * q[:, 2])
    if style == "cap":  # touca de oficina e barba curta
        d = _scalp(q, 0.05, front=0.34, base=0.2)
        d = smin(d, ell(q, (0.03, 0.47, -0.08), (0.42, 0.14, 0.46)), 0.06)
        beard = ell(q, (0, -0.4, 0.14), (0.3, 0.2, 0.26))
        beard = smax(beard, -ell(q, (0, -0.3, 0.46), (0.09, 0.03, 0.06)), 0.03)
        return smin(d, beard - 0.012 * _bumps(q, 30.0), 0.05)
    if style == "tail":  # preso no alto, com um rabo que desce pela nuca
        d = _scalp(q, 0.03, front=0.4)
        d = smin(d, sph(q, (0, 0.52, -0.3), 0.13), 0.06)
        pts = [(0, 0.52, -0.38), (0, 0.4, -0.62), (0.03, 0.05, -0.7), (0.06, -0.4, -0.6)]
        for a, b, r0, r1 in ((pts[0], pts[1], 0.1, 0.12), (pts[1], pts[2], 0.12, 0.1), (pts[2], pts[3], 0.1, 0.05)):
            d = smin(d, cap(q, a, b, r0, r1), 0.06)
        return d - 0.007 * np.sin(q[:, 0] * 50 + 8 * q[:, 1])
    if style == "wind":  # solto, levado para trás pelo movimento
        d = _scalp(q, 0.04, front=0.44)
        for x0, y0, x1, y1, z1, r in ((0.2, 0.3, 0.34, 0.5, -1.15, 0.13), (-0.2, 0.3, -0.3, 0.42, -1.25, 0.13), (0.0, 0.42, 0.05, 0.72, -1.05, 0.14), (0.28, 0.02, 0.4, 0.14, -1.0, 0.11), (-0.28, 0.02, -0.36, 0.2, -1.1, 0.11), (0, 0.05, -0.02, 0.26, -1.3, 0.14)):
            d = smin(d, cap(q, (x0, y0, -0.3), (x1, y1, z1), r, 0.035), 0.09)
        return d - 0.012 * np.sin(q[:, 1] * 34 + q[:, 0] * 21 + 5 * np.sin(q[:, 2] * 4))
    return None


# ───────────────────────────── o corpo
class Body:
    """O corpo na pose: referenciais dos ossos, a pele (`skin`), o cabelo (`hair`) e os ombros (para os braços)."""

    def __init__(self, pose=None, shape=None, hair_style=None):
        P = {**POSE, **(pose or {})}
        S = {**SHAPE, **(shape or {})}
        self.P, self.S, self.hair_style = P, S, hair_style
        legs = S["legs"]
        self.TH, self.SH = 2.1 * legs, 1.95 * legs
        self.root = Frame(ypr(*P["turn"]), P["root"])
        self.waist = self.root.child((0, 0.55, 0), *P["waist"])
        self.chest = self.waist.child((0, 0.75, 0), *P["chest"])
        self.neck = self.chest.child((0, 0.97, -0.03), *P["neck"])
        self.atlas = self.neck.child((0, 0.4 * S["neck"], 0.03), *P["head"])
        self.head = Frame(self.atlas.R, self.atlas.pt((0, 0.5 * S["head"], 0.09 * S["head"])))
        self.leg = {}
        for side, sx in (("L", 1.0), ("R", -1.0)):
            flex, abd, twist = P["hip" + side]
            thigh = Frame(self.root.R @ rz(abd * sx) @ rx(-flex) @ ry(twist * sx), self.root.pt((0.42 * S["hw"] * sx, -0.12, 0.0)))
            shin = Frame(thigh.R @ rx(P["knee" + side]), thigh.pt((0, -self.TH, 0)))
            up, out = P["ankle" + side]
            foot = Frame(shin.R @ rx(-up) @ ry(out * sx), shin.pt((0, -self.SH, 0)))
            self.leg[side] = (thigh, shin, foot, sx)
        self.shoulder = {"L": self.chest.pt((1.02 * S["sw"], 0.78, -0.02)), "R": self.chest.pt((-1.02 * S["sw"], 0.78, -0.02))}

    # a pele: tronco, pescoço, cabeça, pernas e pés (sem os braços)
    def torso(self, p):
        S = self.S
        b, sw, hw, dp, wa, cut = S["build"], S["sw"], S["hw"], S["depth"], S["waist"], S["cut"]
        pr = self.root.loc(p)
        mr = mirror(pr)
        d = ell(pr, (0, 0.05, -0.02), (0.74 * hw, 0.48, 0.44 * dp))
        d = smin(d, sph(mr, (0.52 * hw, -0.14, -0.02), 0.34 * b), 0.2)  # trocânter
        d = smin(d, sph(mr, (0.3 * hw, -0.2, -0.3), 0.4 * b), 0.18)  # glúteo
        d = smin(d, cap(mr, (0.3 * hw, 0.38, 0.14), (0.68 * hw, 0.3, -0.06), 0.11), 0.12)  # crista ilíaca
        d = smin(d, ell(pr, (0, 0.12, 0.2 * dp), (0.42, 0.36, 0.25)), 0.16)
        d = smin(d, ell(pr, (0, -0.32, 0.08), (0.24, 0.22, 0.22)), 0.14)
        pw = self.waist.loc(p)
        mw = mirror(pw)
        d = smin(d, ell(pw, (0, 0.22, 0.03), (0.6 * wa, 0.64, 0.36 * dp)), 0.22)
        d = smin(d, ell(mw, (0.47 * wa, 0.0, 0.02), (0.2, 0.34, 0.3 * dp)), 0.14)  # oblíquos
        if cut > 0:
            for j in range(3):
                d = smin(d, ell(mw, (0.15, -0.02 + 0.27 * j, 0.335 * dp), (0.15, 0.13, 0.075 * cut)), 0.06)
            d = smax(d, -cap(pw, (0, -0.2, 0.46 * dp), (0, 0.75, 0.47 * dp), 0.03 * cut), 0.1)
            d = smax(d, -cap(mw, (0.06, -0.52, 0.36 * dp), (0.6 * hw, -0.22, 0.16), 0.02 * cut), 0.06)  # a virilha
        pc = self.chest.loc(p)
        mc = mirror(pc)
        d = smin(d, ell(pc, (0, 0.26, -0.02), (0.72 + 0.04 * sw, 0.84, 0.48 * dp)), 0.22)
        d = smax(d, -ell(pc, (0, -0.36, 0.5 * dp), (0.2, 0.3, 0.1)), 0.2)  # o arco das costelas
        d = smin(d, cap(mc, (0.86 * sw, 0.5, -0.12), (0.5 * wa, -0.5, -0.08), 0.24 * b, 0.16), 0.16)  # grande dorsal
        d = smin(d, cap(pc, (-0.68 * sw, 0.76, -0.04), (0.68 * sw, 0.76, -0.04), 0.27 * b), 0.2)
        d = smin(d, sph(mc, (1.0 * sw, 0.78, -0.02), 0.29 * b), 0.14)  # deltoide
        d = smin(d, cap(mc, (0.1, 1.08, -0.12), (0.8 * sw, 0.92, -0.06), 0.22, 0.16), 0.14)  # trapézio
        d = smin(d, cap(mc, (0.07, 0.92, 0.32 * dp), (0.88 * sw, 0.94, 0.1), 0.05), 0.05)  # clavícula
        if S["bust"] > 0:
            d = smin(d, sph(mc, (0.3, 0.36, 0.3 * dp), 0.25 * S["bust"]), 0.12)
        else:
            d = smin(d, ell(mc, (0.36, 0.52, 0.27 * dp), (0.4, 0.27, 0.13 * (0.7 + 0.3 * b))), 0.12)
            if cut > 0:
                d = smax(d, -cap(pc, (0, 0.34, 0.56 * dp), (0, 0.8, 0.5 * dp), 0.05 * cut), 0.12)  # o esterno entre os peitorais
        d = smax(d, -sph(pc, (0, 0.97, 0.4 * dp), 0.075), 0.06)
        pn = self.neck.loc(p)
        return smin(d, cap(pn, (0, -0.12, 0.0), (0, 0.44 * S["neck"], 0.03), 0.25 * (0.6 + 0.4 * b), 0.2), 0.14)

    def skin(self, p):
        S = self.S
        d = smin(self.torso(p), face(self.head.loc(p) / F(S["head"]), S) * F(S["head"]), 0.1)
        return smin(d, self.legs(p), 0.16)

    def legs(self, p):
        b = self.S["build"]
        lg = self.S["legs"]
        out = None
        for side in ("L", "R"):
            thigh, shin, foot, sx = self.leg[side]
            pt = thigh.loc(p)
            t = cap(pt, (0, 0, 0), (0, -self.TH, 0), 0.47 * b, 0.27 * b)
            t = smin(t, ell(pt, (0.02 * sx, -0.8 * lg, 0.12), (0.34 * b, 0.85 * lg, 0.33 * b)), 0.15)  # quadríceps
            t = smin(t, ell(pt, (-0.12 * sx, -1.72 * lg, 0.1), (0.16 * b, 0.3, 0.16 * b)), 0.1)  # vasto medial
            t = smin(t, ell(pt, (0, -0.9 * lg, -0.14), (0.3 * b, 0.8 * lg, 0.28 * b)), 0.15)  # posteriores
            t = smin(t, ell(pt, (-0.16 * sx, -0.5 * lg, -0.02), (0.3 * b, 0.66 * lg, 0.34 * b)), 0.15)  # adutores
            ps = shin.loc(p)
            t = smin(t, sph(ps, (0, 0, 0.02), 0.27 * b), 0.12)
            t = smin(t, ell(ps, (0, 0.02, 0.22 * b), (0.14, 0.18, 0.09)), 0.07)  # patela
            s = cap(ps, (0, 0, 0), (0, -self.SH, 0), 0.24 * b, 0.125 * b)
            s = smin(s, ell(ps, (0.02 * sx, -0.58 * lg, -0.14), (0.24 * b, 0.6 * lg, 0.28 * b)), 0.12)  # panturrilha
            s = smin(s, ell(ps, (0.07 * sx, -0.6 * lg, 0.08), (0.1 * b, 0.5 * lg, 0.1 * b)), 0.08)  # tibial
            s = smin(s, sph(ps, (0.13 * sx, -self.SH + 0.04, 0.0), 0.075), 0.05)  # maléolos
            s = smin(s, sph(ps, (-0.125 * sx, -self.SH + 0.09, 0.02), 0.075), 0.05)
            s = smin(s, cap(ps, (0, -self.SH + 0.5, -0.1), (0, -self.SH - 0.12, -0.13), 0.05, 0.06), 0.05)  # tendão do calcanhar
            pf = foot.loc(p)
            ft = sph(pf, (0, -0.17, -0.14), 0.17)
            ft = smin(ft, cap(pf, (0, -0.04, 0.0), (0.0, -0.22, 0.62), 0.16, 0.09), 0.1)
            ft = smin(ft, ell(pf, (0.02 * sx, -0.25, 0.42), (0.21, 0.085, 0.42)), 0.08)
            for i, (tx, tl, tr) in enumerate(((-0.13, 0.26, 0.058), (-0.04, 0.24, 0.047), (0.035, 0.2, 0.044), (0.1, 0.16, 0.04), (0.16, 0.1, 0.037))):
                ft = smin(ft, cap(pf, (tx * sx, -0.275, 0.72), (tx * sx * 1.05, -0.29, 0.72 + tl), tr, tr * 0.85), 0.025)
            ft = smax(ft, -(pf[:, 1] + F(0.33)), 0.03)
            leg = smin(smin(t, s, 0.1), ft, 0.07)
            out = leg if out is None else smin(out, leg, 0.1)
        return out

    def hair(self, p):
        if not self.hair_style:
            return None
        S = self.S["head"]
        return hair(self.head.loc(p) / F(S), self.hair_style) * F(S)

    def sdf(self, p):
        d = self.skin(p)
        h = self.hair(p)
        return d if h is None else smin(d, h, 0.03)

    def floor(self):
        """A altura do chão sob o pé mais baixo."""
        return min(f.pt((0, -0.33, 0.2))[1] for _, _, f, _ in self.leg.values())


# ───────────────────────────── os braços, na pose (a mesma cinemática de rig.ts)
def _n(v):
    v = np.asarray(v, float)
    return v / max(np.linalg.norm(v), 1e-9)


def _ortho(y, x):
    y = np.asarray(y, float)
    return _n(y - (y @ x) * x)


CONTACT = dict(pinch=np.asarray(bf.pinch_point(), float), palm=np.array([0.26, -0.085, 0.02]) * HS, tips=np.array([0.72, -0.05, 0.02]) * HS)


def solve_arm(shoulder, at, contact, fingers, back, pole, side, scale=1.0, align=0.0):
    """Os três ossos (braço, antebraço, mão) como (R, t): p_cena = R @ (p_repouso · escala) + t. `side`: "R" usa a malha espelhada."""
    sign = -1.0 if side == "R" else 1.0
    S = np.asarray(shoulder, float)
    l1, l2 = L1 * scale, L2 * scale
    X = _n(fingers)
    if align:
        X = _n(X * (1 - align) + _n(np.asarray(at, float) - S) * align)
    Y = _ortho(back, X)
    Z = np.cross(X, Y) * sign
    off = CONTACT[contact] * scale
    off = X * off[0] + Y * off[1] + Z * off[2]
    W = np.asarray(at, float) - off
    d = W - S
    dist = np.linalg.norm(d)
    far = float(np.clip(dist, abs(l1 - l2) + 0.08, (l1 + l2) * 0.995))
    dirn = d / dist
    W = S + dirn * far
    a = (l1 * l1 - l2 * l2 + far * far) / (2 * far)
    h = np.sqrt(max(l1 * l1 - a * a, 0))
    E = S + dirn * a + _ortho(pole, dirn) * h
    fx = _n(W - E)
    fy = _ortho(Y, fx)
    fz = np.cross(fx, fy) * sign
    ux = _n(E - S)
    uy = _ortho(fy, ux)
    uz = np.cross(ux, uy) * sign
    return dict(upper=(np.stack([ux, uy, uz], axis=1), S), fore=(np.stack([fx, fy, fz], axis=1), E - fx * l1), hand=(np.stack([X, Y, Z], axis=1), W - X * (l1 + l2)), elbow=E, wrist=W, touch=W + off, reach=min(1.0, (l1 + l2) * 0.995 / dist))


def arm(bones, shape="relax", scale=1.0, thick=1.0, gap=None):
    """A distância do braço inteiro na pose. `gap` = (de, até) em x de repouso: o trecho que falta (a pedra por completar)."""
    hand = bf.hand_sdf(shape)
    (Ru, tu), (Rf, tf), (Rm, tm) = bones["upper"], bones["fore"], bones["hand"]
    k = F(scale)
    th = vec(1, 1 / thick, 1 / thick)

    def f(p):
        p = np.asarray(p, F)
        qu = ((p - tu.astype(F)) @ Ru.astype(F)) / k
        qf = ((p - tf.astype(F)) @ Rf.astype(F)) / k
        qm = ((p - tm.astype(F)) @ Rm.astype(F)) / k
        up = smin(cap(qu * th, (0, 0, 0), (L1, 0, 0), 0.215, 0.165), ell(qu * th, (L1 * 0.42, 0.02, 0), (0.42, 0.21, 0.2)), 0.12)
        up = smin(up, sph(qu * th, (0, 0, 0), 0.27), 0.12)
        fore = bf.fore_sdf(qf * th)
        hd = np.maximum(hand(qm), F(L1 + L2 - 0.3) - qm[:, 0])
        if gap is not None:
            cut = np.minimum(qf[:, 0] - F(gap[0]), F(gap[1]) - qf[:, 0])  # > 0 dentro do trecho que falta
            rough = F(0.03) * (fbm(qf * 9.0, 2) - 0.5)
            fore = np.maximum(fore, cut + rough)
            hd = np.maximum(hd, F(gap[1]) - qm[:, 0] + rough)
        return np.minimum(smin(up, fore, 0.1), hd) * k

    return f


def stone(p, seed=3, scale=1.0):
    """Relevo de pedra bruta: facetas de ponteiro e grão, em unidades (somar à distância)."""
    q = np.asarray(p, np.float64) * scale
    facets = np.abs(fbm(q * 1.7, 3, seed) - 0.5) * 2.0
    grain = fbm(q * 9.0, 2, seed + 7) - 0.5
    return (0.16 * facets + 0.03 * grain).astype(F)
