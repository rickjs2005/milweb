"""
MATÉRIA · esculturas — base de modelagem por distância assinada (numpy).

Primitivas, uniões suaves, referenciais de osso (Frame), ruído para a pedra bruta e a malha por surface nets
com avaliação em faixa estreita (só as células perto da superfície pagam a conta inteira).

Convenção: x para a direita de quem olha, y para cima, z para quem olha. A cabeça mede ~1,1.
"""
from __future__ import annotations

import numpy as np

F = np.float32


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
    """Cápsula de `a` a `b`, com raio de `ra` a `rb`."""
    a = vec(*a)
    b = vec(*b)
    pa = p - a
    ba = b - a
    h = np.clip((pa @ ba) / max(float(ba @ ba), 1e-9), 0, 1)
    r = ra if rb is None else ra + (rb - ra) * h
    return length(pa - h[:, None] * ba) - r


def box(p, c, b, r=0.0):
    q = np.abs(p - vec(*c)) - (vec(*b) - r)
    return length(np.maximum(q, 0)) + np.minimum(q.max(axis=1), 0) - r


def cyl(p, a, b, r, rnd=0.0):
    """Cilindro reto de `a` a `b` (tampas planas, quina arredondada por `rnd`)."""
    a = vec(*a)
    b = vec(*b)
    ba = b - a
    L = float(np.sqrt(ba @ ba))
    ax = ba / L
    pa = p - a
    y = pa @ ax
    rad = length(pa - y[:, None] * ax)
    d = np.stack([rad - (r - rnd), np.abs(y - L / 2) - (L / 2 - rnd)], axis=1)
    return length(np.maximum(d, 0)) + np.minimum(d.max(axis=1), 0) - rnd


def torus(p, c, n, R, r):
    """Aro de raio `R` e espessura `r`, no plano de normal `n` que passa por `c`."""
    n = vec(*n)
    n = n / np.sqrt(n @ n)
    q = p - vec(*c)
    y = q @ n
    rad = length(q - y[:, None] * n)
    return np.sqrt((rad - R) ** 2 + y * y) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def union(parts, k):
    d = parts[0]
    for q in parts[1:]:
        d = smin(d, q, k)
    return d


def rot(yaw=0.0, pitch=0.0, roll=0.0):
    """Colunas = eixos locais no mundo. Ordem: giro (y), inclinação (x), rolagem (z); graus."""
    y, x, z = np.radians([yaw, pitch, roll])
    ry = np.array([[np.cos(y), 0, np.sin(y)], [0, 1, 0], [-np.sin(y), 0, np.cos(y)]])
    rx = np.array([[1, 0, 0], [0, np.cos(x), -np.sin(x)], [0, np.sin(x), np.cos(x)]])
    rz = np.array([[np.cos(z), -np.sin(z), 0], [np.sin(z), np.cos(z), 0], [0, 0, 1]])
    return ry @ rx @ rz


class Frame:
    """Um referencial (osso): `R` tem os eixos locais nas colunas; `t` é a origem no mundo."""

    def __init__(self, R=None, t=(0, 0, 0)):
        self.R = np.eye(3) if R is None else np.asarray(R, float)
        self.t = np.asarray(t, float)

    def loc(self, p):
        """Pontos do mundo → locais."""
        return ((p - self.t.astype(F)) @ self.R.astype(F)).astype(F)

    def pt(self, q):
        """Um ponto local → mundo."""
        return self.t + self.R @ np.asarray(q, float)

    def dir(self, q):
        return self.R @ np.asarray(q, float)

    def child(self, at=(0, 0, 0), yaw=0.0, pitch=0.0, roll=0.0):
        return Frame(self.R @ rot(yaw, pitch, roll), self.pt(at))


# ───────────────────────────── ruído (pedra bruta, cachos, fios)
def _hash(i):
    i = (i ^ (i >> 15)) * np.uint32(0x2C1B3C6D)
    i = (i ^ (i >> 12)) * np.uint32(0x297A2D39)
    return (i ^ (i >> 15)).astype(np.float64) / 4294967295.0


def noise3(p, seed=0):
    """Ruído de valor 3D, 0..1."""
    p = np.asarray(p, np.float64)
    i = np.floor(p).astype(np.int64)
    f = p - i
    f = f * f * (3 - 2 * f)
    out = 0.0
    with np.errstate(over="ignore"):
        for dx in (0, 1):
            for dy in (0, 1):
                for dz in (0, 1):
                    k = ((i[:, 0] + dx) * 73856093 ^ (i[:, 1] + dy) * 19349663 ^ (i[:, 2] + dz) * 83492791 ^ seed * 2654435761).astype(np.uint32)
                    w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                    out = out + w * _hash(k)
    return out.astype(F)


def fbm(p, octaves=3, seed=0):
    a = 0.5
    out = 0.0
    q = np.asarray(p, np.float64)
    for o in range(octaves):
        out = out + a * noise3(q, seed + o)
        q = q * 2.03 + 11.7
        a *= 0.5
    return out


def chunked(f, p, chunk=300000):
    p = np.asarray(p, F)
    if len(p) <= chunk:
        return np.asarray(f(p), F)
    return np.concatenate([np.asarray(f(p[i : i + chunk]), F) for i in range(0, len(p), chunk)])


def normal(f, p, e=0.004):
    g = np.zeros_like(p)
    for i in range(3):
        o = np.zeros(3, F)
        o[i] = e
        g[:, i] = chunked(f, p + o) - chunked(f, p - o)
    return g / np.maximum(length(g), 1e-9)[:, None]


# ───────────────────────────── malha
CORNERS = np.array([(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1), (0, 1, 1), (1, 1, 1)])
EDGES = [(0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)]


def grid(f, lo, hi, h, coarse=4, slack=2.4):
    """Valores de `f` na grade fina; longe da superfície vale o valor da grade grossa (só o sinal importa)."""
    lo = np.asarray(lo, float)
    n = np.ceil((np.asarray(hi, float) - lo) / h).astype(int)
    n = (np.ceil(n / coarse) * coarse).astype(int)
    nc = n // coarse
    H = h * coarse
    ax = [lo[i] + H * np.arange(nc[i] + 1) for i in range(3)]
    gx, gy, gz = np.meshgrid(*ax, indexing="ij")
    Vc = chunked(f, np.stack([gx.ravel(), gy.ravel(), gz.ravel()], axis=1)).reshape(gx.shape)
    near = np.abs(Vc) < H * slack
    cell = np.zeros(tuple(nc), bool)
    for cx, cy, cz in CORNERS:
        cell |= near[cx : cx + nc[0], cy : cy + nc[1], cz : cz + nc[2]]
    V = np.repeat(np.repeat(np.repeat(Vc[:-1, :-1, :-1], coarse, 0), coarse, 1), coarse, 2)
    V = np.pad(V, ((0, 1), (0, 1), (0, 1)), mode="edge")
    mask = np.repeat(np.repeat(np.repeat(cell, coarse, 0), coarse, 1), coarse, 2)
    mask = np.pad(mask, ((0, 1), (0, 1), (0, 1)), mode="edge")
    # as células grossas vizinhas compartilham a face: dilata um ponto para cobrir a borda
    m2 = mask.copy()
    m2[1:] |= mask[:-1]
    m2[:, 1:] |= mask[:, :-1]
    m2[:, :, 1:] |= mask[:, :, :-1]
    idx = np.argwhere(m2)
    V[tuple(idx.T)] = chunked(f, lo + h * idx)
    return V.astype(F), lo, n


def nets(f, lo, hi, h, keep=None, coarse=4):
    """Malha de `f` dentro da caixa [lo, hi], com células de lado `h` (surface nets)."""
    V, lo, n = grid(f, lo, hi, h, coarse)
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
    verts = (lo + h * (cells + acc / np.maximum(num, 1)[:, None])).astype(F)
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
    used = np.unique(tris)
    remap = np.full(len(verts), -1, np.int64)
    remap[used] = np.arange(len(used))
    return verts[used], nrm[used], remap[tris]
