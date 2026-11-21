"""
MATÉRIA · esculturas — as sete figuras.

  rest      a Matéria em repouso: em pé, o peso sobre uma perna, um ombro ainda preso ao bloco bruto
  projects  a Curadora     ajoelhada, uma mão na borda do chão, a outra levantando a ponta oposta
  profile   o Arquivista   sentado, o fólio em pé sobre um joelho, a outra mão deslizando a folha
  services  a Arquiteta    alta, de perfil, abrindo um compasso sobre o pedestal
  studio    o Gravador     curvado sobre a bancada, girando a prensa e puxando a folha
  lab       a Inventora    agachada, o indicador no aro do giroscópio suspenso
  contact   a Mensageira   em passada larga, o manto para trás, o envelope estendido

Cada figura devolve as PARTES (pele, cabelo, bloco, adereço…: uma distância assinada cada), os ombros e a escala
dos braços, e as poses dos braços (repouso, antecipação, contato, liberação). O chão é y = 0; a figura olha para
+z (para quem vê) antes de girar. Os números de pose estão todos aqui.
"""
from __future__ import annotations

import numpy as np

from anatomy import Body, arm, solve_arm, stone, ypr
from sdf import F, Frame, box, cap, cyl, ell, smax, smin, sph, torus, vec


def _plinth(p, c, half, seed=3, rough=1.0):
    """Um bloco de pedra por lavrar: caixa de quinas quebradas e faces de ponteiro."""
    return box(p, c, half, 0.12) + rough * (stone(p, seed) - F(0.06))


def _base(c=(0.0, 0.0), half=(2.4, 1.45), seed=9):
    return lambda p: _plinth(p, (c[0], -0.22, c[1]), (half[0], 0.24, half[1]), seed=seed, rough=0.5)


ALIGN = 0.45  # quanto a mão segue a linha ombro → alvo (o resto é a direção pedida para os dedos)


def _goal(at, contact, fingers, back, pole, shape, align=ALIGN):
    return dict(at=tuple(float(x) for x in at), contact=contact, fingers=tuple(fingers), back=tuple(back), pole=tuple(pole), shape=shape, align=align)


def gown(body, top="chest", hem=0.2, belt=True, parts=("skin",), slack=1.18, rmax=1.3, wide=None, **kw):
    """Uma túnica em tubo: presa no peito (ou na cintura, ou no quadril), com cinto opcional, solta até a barra."""
    C, W, R = body.chest, body.waist, body.root
    up = lambda fr: [float(x) for x in fr.dir((0, 1, 0))]
    at = lambda fr, q: [float(x) for x in fr.pt(q)]
    st = []
    if top == "chest":
        st.append(dict(c=at(C, (0, 0.47, 0)), n=up(C), slack=1.0, margin=0.028, pin=1, rmax=rmax, band=0.09))
        st.append(dict(c=at(C, (0, 0.24, 0)), n=up(C), slack=1.03, margin=0.05, rmax=rmax))
        st.append(dict(c=at(C, (0, -0.08, 0)), n=up(C), slack=1.1, margin=0.07, rmax=rmax))
    if top in ("chest", "waist"):
        tight = (belt or top == "waist") and not wide
        st.append(dict(c=at(W, (0, 0.12, 0)), n=up(W), slack=1.0 if tight else 1.12, margin=0.03 if tight else 0.07, pin=1 if tight else 0, rmax=wide or min(rmax, 1.25), band=0.09 if tight else (0.6 if wide else 0.16)))
    hip = top == "pelvis"
    st.append(dict(c=at(R, (0, 0.3 if hip else 0.12, 0)), n=up(R), slack=1.0 if hip else 1.14, margin=0.03 if hip else 0.08, pin=1 if hip else 0, rmax=wide or rmax + 0.15, band=0.09 if hip else (0.95 if wide else 0.14)))
    y = float(R.t[1]) - 0.38
    while y > hem + 0.12:
        st.append(dict(c=[float(R.t[0]), y, float(R.t[2])], n=[0, 1, 0], slack=slack, margin=0.1, band=0.17))
        y -= 0.3
    st.append(dict(c=[float(R.t[0]), hem, float(R.t[2])], n=[0, 1, 0], slack=slack * 1.03, margin=0.11, band=0.17))
    return dict(type="gown", stations=st, ring_parts=list(parts), **kw)


def sheet(center, frame, size, pins=(), **kw):
    """Uma folha de tecido (manto, avental): nasce plana no referencial dado (colunas = largura, altura, normal)."""
    return dict(type="sheet", center=[float(x) for x in center], frame=[float(x) for x in np.asarray(frame).ravel()], size=list(size), pins=[[float(x) for x in q] for q in pins], **kw)


BUDGET = dict(skin=12500, hair=3600, cloth=15500, block=5200, base=2200, seat=2600, bench=2600, pedestal=2600)
BUDGET["*"] = 2600
LITE = {k: int(v * 0.46) for k, v in BUDGET.items()}
RES = dict(skin=0.024, hair=0.02, block=0.05, base=0.06, seat=0.05, bench=0.045, pedestal=0.05)
RES["*"] = 0.02


def rest():
    body = Body(
        pose=dict(
            root=(-0.2, 4.44, 0.0), turn=(-20.0, -2.0, -9.0), waist=(6.0, 4.0, 7.5), chest=(14.0, -5.0, 8.0), neck=(8.0, 4.0, -4.0), head=(24.0, 10.0, -5.0),
            hipR=(3.0, -6.0, 6.0), kneeR=3.0, ankleR=(1.0, 10.0),
            hipL=(30.0, 12.0, 24.0), kneeL=52.0, ankleL=(-24.0, 8.0),
        ),
        shape=dict(sw=1.04, hw=0.96, build=1.1, depth=1.04, waist=0.98, brow=0.6, cut=0.42, head=1.07, neck=0.94),
        hair_style="crop",
    )
    sL = body.shoulder["L"]
    # o bloco: a figura ainda está presa a ele pelo ombro esquerdo (à direita de quem vê); ele desce até o chão por trás
    top = sL[1] + 0.62
    c = (sL[0] + 0.52, top / 2 - 0.05, sL[2] - 0.6)

    def block(p):
        d = _plinth(p, c, (1.2, top / 2 + 0.05, 0.95), seed=5)
        # a pedra cede em volta do corpo que já saiu dela — menos no ombro, que ainda é bloco
        q = p - vec(sL[0] + 0.1, sL[1] - 0.1, sL[2] - 0.1)
        held = np.exp(-(q * q).sum(axis=1) / 1.3)
        return smax(d, -(body.skin(p) - (F(0.34) - F(0.66) * held)), 0.3)

    arms = dict(R=dict(scale=1.0, thick=1.1, poses=dict(rest=_goal((-2.25, 5.35, 1.3), "tips", (-0.78, 0.36, 0.5), (0.2, 0.7, 0.68), (-0.25, -1.0, -0.25), "relax"))))
    # o pano do quadril desce abaixo dos joelhos: o joelho da perna livre o empurra para a frente e abre as pregas
    return dict(body=body, parts=dict(skin=body.skin, hair=body.hair, block=block, base=_base((0.3, 0.0))), arms=arms, gap=dict(side="R", span=(2.16, 2.42)), garments=[gown(body, "pelvis", hem=1.2, slack=1.36, bend=0.7)], cam=[0.2, 4.3, 4.7])


def projects():
    """A Curadora: sentada sobre o calcanhar direito, o joelho esquerdo flexionado e aberto para o lado; o tronco desce até a borda do chão."""
    body = Body(
        pose=dict(
            root=(-0.1, 1.17, -0.4), turn=(22.0, 8.0, 2.0), waist=(-8.0, 27.0, -3.0), chest=(-12.0, 25.0, -4.0), neck=(4.0, -22.0, 2.0), head=(-10.0, -16.0, 3.0),
            hipR=(62.0, 8.0, 0.0), kneeR=152.0, ankleR=(-70.0, 0.0),
            hipL=(72.0, 38.0, 26.0), kneeL=142.0, ankleL=(-60.0, 10.0),
        ),
        shape=dict(sw=1.06, hw=1.0, build=1.0, depth=0.96, waist=0.9, bust=0.9, jaw=-0.06, cut=0.3, head=1.04),
        hair_style="curls",
    )
    # onde as mãos encontram a borda do chão, à frente dos joelhos
    edge = [[-1.45, 0.42, 2.25], [1.6, 0.45, 2.25]]
    arms = dict(
        R=dict(scale=1.0, thick=1.0, poses=dict(contact=_goal(edge[0], "pinch", (-0.15, -0.85, 0.5), (-0.5, 0.35, 0.8), (-0.9, 0.3, -0.5), "pinch"))),
        L=dict(scale=1.0, thick=1.0, poses=dict(contact=_goal((2.0, 2.5, 2.35), "pinch", (0.2, -0.82, 0.5), (0.5, 0.35, 0.8), (0.9, 0.35, -0.5), "pinch"))),
    )
    return dict(body=body, parts=dict(skin=body.skin, hair=body.hair, base=_base((0.0, 0.7), (2.9, 2.2))), arms=arms, garments=[gown(body, "chest", hem=0.16, slack=1.2, belt=False, wide=2.9)], cam=[0.0, 2.2, 3.1], marks=dict(edge=edge))


def profile():
    """O Arquivista: sentado num bloco, o tronco inclinado; o fólio em pé sobre o joelho direito, a folha saindo pela esquerda."""
    body = Body(
        pose=dict(
            root=(0.0, 2.72, -0.6), turn=(8.0, -4.0, 0.0), waist=(4.0, 16.0, 2.0), chest=(6.0, 15.0, 3.0), neck=(-4.0, 12.0, 0.0), head=(-12.0, 20.0, -3.0),
            hipR=(84.0, 14.0, 4.0), kneeR=84.0, ankleR=(0.0, 8.0),
            hipL=(70.0, 16.0, 8.0), kneeL=58.0, ankleL=(-12.0, 10.0),
        ),
        shape=dict(sw=1.06, hw=1.02, build=1.14, depth=1.1, waist=1.1, brow=1.0, age=1.0, jaw=0.05, cut=0.2, head=1.06),
        hair_style="elder",
    )
    thigh, shin, _, _ = body.leg["R"]
    knee = shin.t
    # o fólio: um livro grosso em pé sobre a coxa, a lombada para cima e para fora
    folio = Frame(ypr(-24.0, -8.0, 14.0), knee + np.array([-0.05, 0.86, -0.45]))

    def book(p):
        q = folio.loc(p)
        cover = box(q, (0, 0, 0), (0.2, 0.74, 0.56), 0.035)
        pages = box(q, (0.03, 0, 0.02), (0.15, 0.7, 0.57), 0.01) + F(0.006) * np.sin(q[:, 0] * 160)
        d = smin(cover, pages, 0.01)
        d = smin(d, cyl(q, (-0.19, -0.7, -0.56), (-0.19, 0.7, -0.56), 0.05), 0.03)  # a lombada
        for y in (-0.4, 0.0, 0.4):
            d = smin(d, cyl(q, (-0.24, y, -0.57), (0.2, y, -0.57), 0.03), 0.015)  # nervuras
        return d

    def seat(p):
        return _plinth(p, (0.0, 1.02, -0.85), (1.45, 1.06, 0.95), seed=4)

    arms = dict(
        R=dict(scale=1.0, thick=1.1, poses=dict(contact=_goal(folio.pt((-0.02, 0.76, -0.2)), "palm", (0.1, -0.5, 0.86), (-0.35, 0.86, 0.36), (-1.0, 0.1, -0.3), "relax"))),
        L=dict(scale=1.0, thick=1.1, poses=dict(contact=_goal((1.7, 1.55, 2.3), "pinch", (0.5, -0.62, 0.6), (0.45, 0.76, 0.46), (0.95, -0.1, -0.3), "pinch"))),
    )
    kneeL = body.leg["L"][1].t
    mantle = sheet(kneeL + np.array([0.15, 0.5, -0.25]), [[1, 0, 0], [0, 0, 1], [0, -1, 0]], (1.9, 3.0), pins=[kneeL + np.array([0.0, 0.42, -0.1])], pin_r=0.2, bend=3.0, mass=0.5, thick=0.05, row=0.065)
    return dict(body=body, parts=dict(skin=body.skin, hair=body.hair, book=book, seat=seat, base=_base((0.0, 0.3), (2.7, 1.9))), arms=arms, garments=[gown(body, "pelvis", hem=0.5, parts=("skin", "seat"), slack=1.14, bend=1.6), mantle], cam=[0.0, 3.0, 3.9],
                marks=dict(spine=folio.pt((-0.02, 0.76, -0.2)), sheet=[folio.pt((0.22, 0.72, -0.56)), folio.pt((0.22, 0.72, 0.56)), folio.pt((0.22, -0.72, 0.56)), folio.pt((0.22, -0.72, -0.56))]))


def services():
    """A Arquiteta: alta, de perfil para a esquerda de quem vê, uma perna à frente; abre o compasso sobre o pedestal."""
    body = Body(
        pose=dict(
            root=(1.05, 4.6, -0.1), turn=(-68.0, 0.0, 0.0), waist=(6.0, 9.0, 0.0), chest=(10.0, 8.0, 0.0), neck=(0.0, 8.0, 0.0), head=(6.0, 14.0, 0.0),
            hipL=(26.0, 4.0, 4.0), kneeL=14.0, ankleL=(8.0, 4.0),
            hipR=(-14.0, 3.0, 8.0), kneeR=10.0, ankleR=(-16.0, 6.0),
        ),
        shape=dict(sw=0.96, hw=0.96, build=0.9, depth=0.94, waist=0.86, bust=0.8, legs=1.07, jaw=-0.08, neck=1.1),
        hair_style="bun",
    )
    # o pedestal à frente dela e o compasso de pé sobre ele, aberto no plano de quem vê
    top = 3.05
    px = -1.05  # ao alcance das duas mãos
    hinge = np.array([px, top + 2.25, 0.75])
    spread = 0.62
    tips = [np.array([px - spread, top, 0.75]), np.array([px + spread, top, 0.75])]

    def pedestal(p):
        d = _plinth(p, (px, top / 2 - 0.1, 0.55), (1.0, top / 2 + 0.1, 0.85), seed=6, rough=0.6)
        return smin(d, box(p, (px, top - 0.09, 0.55), (1.12, 0.1, 0.95), 0.04), 0.05)

    def hinge_part(p):
        d = cyl(p, hinge + [0, 0, -0.09], hinge + [0, 0, 0.09], 0.11, 0.02)
        return smin(d, cap(p, hinge + [0, 0.1, 0], hinge + [0, 0.36, 0], 0.045, 0.06), 0.03)

    def leg(t):
        return lambda p: np.minimum(cap(p, hinge, t + [0, 0.22, 0], 0.062, 0.04), cap(p, t + [0, 0.22, 0], t, 0.03, 0.006))

    arms = dict(
        R=dict(scale=1.04, thick=0.9, poses=dict(contact=_goal(hinge + [0.02, 0.3, 0.1], "pinch", (-0.75, -0.6, 0.25), (-0.45, 0.75, 0.48), (0.2, -0.5, 0.9), "pinch"))),
        L=dict(scale=1.04, thick=0.9, poses=dict(contact=_goal(0.42 * hinge + 0.58 * tips[1] + [0.0, 0.0, 0.08], "pinch", (-0.8, -0.45, -0.1), (-0.2, 0.6, 0.78), (0.3, -0.8, 0.5), "pinch"))),
    )
    return dict(body=body, parts=dict(skin=body.skin, hair=body.hair, pedestal=pedestal, hinge=hinge_part, legA=leg(tips[0]), legB=leg(tips[1]), base=_base((-0.2, 0.3), (2.9, 1.7))), arms=arms, garments=[gown(body, "chest", hem=0.5, slack=1.16)], cam=[-0.2, 4.4, 4.9],
                bones=dict(legA=9, legB=10, hinge=11), marks=dict(hinge=hinge, tips=tips, top=[px, top, 0.75]))


def studio():
    """O Gravador: atarracado, curvado sobre a bancada; uma mão no braço da prensa, a outra puxando a folha."""
    body = Body(
        pose=dict(
            root=(-0.9, 3.9, -0.5), turn=(34.0, 0.0, 0.0), waist=(-4.0, 26.0, 0.0), chest=(-8.0, 22.0, -3.0), neck=(0.0, 4.0, 0.0), head=(-10.0, 12.0, 0.0),
            hipL=(26.0, 8.0, 6.0), kneeL=30.0, ankleL=(8.0, 6.0),
            hipR=(14.0, 10.0, 10.0), kneeR=26.0, ankleR=(12.0, 12.0),
        ),
        shape=dict(sw=1.12, hw=1.04, build=1.24, depth=1.14, waist=1.16, legs=0.93, brow=0.9, jaw=0.08, age=0.4, neck=0.86, head=1.05),
        hair_style="cap",
    )
    top = 3.0
    bx, bz = 1.05, 1.05

    def bench(p):
        d = box(p, (bx, top - 0.14, bz), (1.75, 0.15, 0.95), 0.03)
        for sx in (-1.4, 1.4):
            d = smin(d, _plinth(p, (bx + sx, (top - 0.3) / 2, bz), (0.3, (top - 0.3) / 2, 0.8), seed=8, rough=0.35), 0.05)
        return d

    # a prensa de parafuso: base, duas colunas, travessa, o fuso e o braço que gira
    c = np.array([bx - 0.2, top, bz - 0.1])

    def press(p):
        d = box(p, c + [0, 0.07, 0], (0.72, 0.07, 0.5), 0.02)
        for sx in (-0.6, 0.6):
            d = np.minimum(d, cyl(p, c + [sx, 0.1, 0], c + [sx, 1.3, 0], 0.07, 0.01))
        d = smin(d, box(p, c + [0, 1.36, 0], (0.74, 0.1, 0.2), 0.03), 0.02)
        d = np.minimum(d, box(p, c + [0, 0.42, 0], (0.52, 0.06, 0.42), 0.015))  # o prato
        d = np.minimum(d, cyl(p, c + [0, 0.45, 0], c + [0, 1.75, 0], 0.06, 0.01))  # o fuso
        return d

    handle = c + [0, 1.78, 0]
    ends = [handle + [-0.62, 0.03, 0.3], handle + [0.62, -0.03, -0.3]]

    def lever(p):
        d = cap(p, ends[0], ends[1], 0.04)
        for e in ends:
            d = smin(d, sph(p, e, 0.085), 0.02)
        return smin(d, sph(p, handle, 0.09), 0.02)

    arms = dict(
        R=dict(scale=0.98, thick=1.22, poses=dict(contact=_goal(ends[0] + [0, 0.02, 0.02], "palm", (0.55, -0.35, 0.75), (-0.3, 0.9, 0.3), (-0.9, -0.2, -0.3), "pinch"))),
        L=dict(scale=0.98, thick=1.22, poses=dict(contact=_goal(c + [1.25, 0.5, 0.75], "pinch", (0.7, -0.45, 0.55), (0.3, 0.86, 0.4), (0.6, -0.4, -0.7), "pinch"))),
    )
    C, W = body.chest, body.waist
    apron = sheet(C.pt((0, -0.62, 0.62)), np.stack([C.dir((1, 0, 0)), C.dir((0, 1, 0)), C.dir((0, 0, 1))], axis=1), (1.3, 3.0), pins=[C.pt((0.42, 0.84, 0.5)), C.pt((-0.42, 0.84, 0.5)), W.pt((0.62, 0.1, 0.4)), W.pt((-0.62, 0.1, 0.4))], pin_r=0.13, bend=2.4, mass=0.45, thick=0.05)
    return dict(body=body, parts=dict(skin=body.skin, hair=body.hair, bench=bench, press=press, lever=lever, base=_base((0.2, 0.4), (3.0, 1.8))), arms=arms, garments=[gown(body, "waist", hem=1.9, slack=1.14, bend=1.4), apron], cam=[0.2, 3.3, 4.2],
                bones=dict(lever=9), marks=dict(handle=handle, ends=ends, slot=[c + [-0.52, 0.5, 0.44], c + [0.52, 0.5, 0.44], c + [0.52, 0.46, 0.44], c + [-0.52, 0.46, 0.44]]))


def lab():
    """A Inventora: jovem, agachada sobre os calcanhares, de perfil para a esquerda de quem vê; o indicador toca o aro do giroscópio suspenso."""
    body = Body(
        pose=dict(
            root=(1.25, 1.1, -0.1), turn=(-64.0, -4.0, 0.0), waist=(0.0, 18.0, 0.0), chest=(8.0, 10.0, 2.0), neck=(0.0, -10.0, 0.0), head=(10.0, -14.0, 2.0),
            hipL=(116.0, 12.0, 4.0), kneeL=148.0, ankleL=(32.0, 8.0),
            hipR=(122.0, 10.0, 4.0), kneeR=152.0, ankleR=(30.0, 6.0),
        ),
        shape=dict(sw=0.92, hw=0.94, build=0.9, depth=0.92, waist=0.86, bust=0.7, legs=0.98, jaw=-0.1, head=1.1, neck=0.95),
        hair_style="tail",
    )
    c = np.array([-1.35, 3.25, 0.75])
    tilt = Frame(ypr(28.0, 24.0, 0.0), c)

    def rings(p):
        d = torus(p, c, (0, 0, 1), 0.86, 0.05)
        d = np.minimum(d, torus(p, c, tilt.dir((0, 0, 1)), 0.7, 0.042))
        for a in (-1, 1):
            d = np.minimum(d, sph(p, c + [0, 0.86 * a, 0], 0.07))
        return np.minimum(d, cap(p, c + [0, 0.9, 0], c + [0, 6.4, 0], 0.014))  # o fio que o suspende

    def rotor(p):
        q = tilt.loc(p)
        d = cyl(q, (0, -0.045, 0), (0, 0.045, 0), 0.4, 0.03)
        d = smin(d, torus(q, (0, 0, 0), (0, 1, 0), 0.4, 0.06), 0.03)
        return np.minimum(d, cap(q, (0, -0.68, 0), (0, 0.68, 0), 0.028))

    touch = c + [0.86, 0.1, 0.05]
    # o braço esquerdo dela é o que fica do lado de quem vê: é ele que toca o aro; o direito apoia no joelho
    kneeR = body.leg["R"][1].t
    arms = dict(
        L=dict(scale=0.94, thick=0.88, poses=dict(contact=_goal(touch, "tips", (-0.9, 0.3, 0.1), (0.1, 0.5, 0.86), (0.2, -1.0, 0.3), "open"))),
        R=dict(scale=0.94, thick=0.88, poses=dict(contact=_goal(kneeR + np.array([0.0, 0.32, 0.0]), "palm", (-0.8, -0.5, 0.2), (-0.2, 0.9, -0.3), (0.4, 0.3, -0.9), "relax"))),
    )
    return dict(body=body, parts=dict(skin=body.skin, hair=body.hair, rings=rings, rotor=rotor, base=_base((-0.2, 0.4), (2.9, 1.8))), arms=arms, garments=[gown(body, "chest", hem=float(body.root.t[1]) - 0.12, belt=True, slack=1.08, rmax=0.92)], cam=[-0.2, 2.6, 3.6],
                bones=dict(rotor=9), marks=dict(ring=c, radius=[0.86, 0.0, 0.0], axis=tilt.dir((0, 1, 0)), touch=touch))


def contact():
    """A Mensageira: esguia, em passada larga para a esquerda de quem vê; estende o envelope e rompe o lacre com o polegar."""
    body = Body(
        pose=dict(
            root=(0.75, 3.92, -0.1), turn=(-46.0, 6.0, 0.0), waist=(8.0, 6.0, 2.0), chest=(14.0, 4.0, 3.0), neck=(-4.0, -4.0, 0.0), head=(10.0, -6.0, 0.0),
            hipL=(50.0, 4.0, 4.0), kneeL=32.0, ankleL=(6.0, 4.0),
            hipR=(-40.0, 4.0, 6.0), kneeR=20.0, ankleR=(-46.0, 4.0),
        ),
        shape=dict(sw=0.94, hw=0.95, build=0.88, depth=0.92, waist=0.84, bust=0.75, legs=1.06, jaw=-0.08, neck=1.06),
        hair_style="wind",
    )
    env = Frame(ypr(-18.0, -14.0, 6.0), (-1.05, 4.85, 1.55))  # ao alcance das duas mãos

    def envelope(p):
        q = env.loc(p)
        d = box(q, (0, 0, 0), (0.78, 0.52, 0.035), 0.012)
        # a aba: um triângulo levemente erguido, do alto até o lacre
        return np.minimum(d, cyl(q, (0, -0.1, 0.03), (0, -0.1, 0.075), 0.13, 0.02))  # o lacre

    def flap(p):
        q = env.loc(p)
        tri = np.maximum(np.abs(q[:, 0]) * F(0.53) - (q[:, 1] + F(0.1)) * F(0.85), q[:, 1] - F(0.52))
        return np.maximum(tri, np.abs(q[:, 2] - F(0.05)) - F(0.014))

    arms = dict(
        R=dict(scale=1.02, thick=0.88, poses=dict(contact=_goal(env.pt((-0.1, -0.5, -0.02)), "palm", (-0.5, 0.5, 0.7), (-0.4, -0.75, 0.52), (0.2, -1.0, 0.1), "open"))),
        L=dict(scale=1.02, thick=0.88, poses=dict(contact=_goal(env.pt((0.16, -0.08, 0.12)), "pinch", (-0.8, 0.1, 0.59), (0.2, 0.9, 0.38), (0.6, -0.7, 0.3), "pinch"))),
    )
    C = body.chest
    cloak = sheet(C.pt((0, -0.75, -0.75)), np.stack([C.dir((1, 0, 0)), C.dir((0, 1, 0)), C.dir((0, 0, 1))], axis=1), (2.5, 3.6), pins=[C.pt((0.6, 0.98, -0.22)), C.pt((-0.6, 0.98, -0.22))], pin_r=0.17, bend=1.2, mass=0.25, thick=0.04, bow=-0.3)
    return dict(body=body, parts=dict(skin=body.skin, hair=body.hair, envelope=envelope, flap=flap, base=_base((-0.3, 0.3), (3.1, 1.7))), arms=arms, garments=[gown(body, "chest", hem=1.95, slack=1.2), cloak], bones=dict(flap=9),
                marks=dict(env=[env.pt((-0.78, 0.52, 0.04)), env.pt((0.78, 0.52, 0.04)), env.pt((0.78, -0.52, 0.04)), env.pt((-0.78, -0.52, 0.04))], seal=env.pt((0, -0.1, 0.08)), hold=env.pt((-0.1, -0.5, -0.02))), wind=[dict(dir=[0.72, 0.22, -0.66], strength=900, noise=1.0)], cam=[0.0, 4.1, 4.7])


FIGURES = dict(rest=rest, projects=projects, profile=profile, services=services, studio=studio, lab=lab, contact=contact)


def arm_sdfs(fig, pose="contact"):
    """Os dois braços na pose pedida, como distâncias (para a prévia, a silhueta e o panejamento)."""
    out = {}
    for side, A in fig["arms"].items():
        g = A["poses"].get(pose) or next(iter(A["poses"].values()))
        bones = solve_arm(fig["body"].shoulder[side], g["at"], g["contact"], g["fingers"], g["back"], g["pole"], side, A["scale"], g.get("align", ALIGN))
        gap = fig.get("gap")
        out["arm" + side] = arm(bones, g["shape"], A["scale"], A["thick"], gap["span"] if gap and gap["side"] == side else None)
    return out
