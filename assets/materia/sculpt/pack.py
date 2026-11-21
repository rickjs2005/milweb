"""
MATÉRIA · esculturas — do estágio do Blender aos arquivos que o navegador baixa.

Formato "MTS1" (little-endian), um arquivo por figura e por nível (completo, leve):

  "MTS1", uint32 vértices, uint32 índices, uint32 grãos, float32 centro[3], float32 escala
  posição   int16[3n]  (÷ 32767 · escala + centro; alinhada em 4 bytes)
  normal    int8[4n]   normal (xyz · 127) e oclusão (0..127)
  meta      uint8[4n]  região, ordem de formação (0 = primeiro … 255), sombra da luz principal, pedra bruta
  pele      uint8[4n]  osso A, osso B, peso de A, semente
  índices   uint16[i]  (uint32 quando n > 65535; alinhados em 4 bytes)
  grãos     int16[3m] posição · int8[4m] normal + região · uint8[4m] ordem, semente, luz, 0

Regiões: 0 rosto e pescoço · 1 tronco · 2 pernas e pés · 3 cabelo · 4 panejamento · 5 adereço · 6 bloco, banco,
pedestal · 7 base. Ossos: 0 parado · 1 peito · 2 cabeça · 3–5 braço direito · 6–8 braço esquerdo · 9… adereços.
O grão i de uma figura corresponde ao grão i de outra: mesma região (rosto com rosto, tecido com tecido) e
mesma posição relativa dentro dela — é o que mantém curtos os trajetos da transformação.
"""
from __future__ import annotations

import struct

import numpy as np

from anatomy import face
from sdf import F, normal

REGION = dict(head=0, torso=1, legs=2, hair=3, cloth=4, prop=5, block=6, base=7)
STONE = ("block", "seat", "bench", "pedestal")
#        rosto  tronco pernas cabelo tecido adereço bloco  base
QUOTA = (0.07, 0.07, 0.06, 0.04, 0.42, 0.08, 0.17, 0.09)
GRAINS = dict(full=26000, lite=13000)
SEED = 20261120


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def _morton(q):
    """Código de Morton de pontos em [0, 1]³ (10 bits por eixo): vizinhos no espaço ficam vizinhos na ordem."""
    q = np.clip((q * 1023).astype(np.uint32), 0, 1023)

    def spread(v):
        v = (v | (v << 16)) & 0x030000FF
        v = (v | (v << 8)) & 0x0300F00F
        v = (v | (v << 4)) & 0x030C30C3
        return (v | (v << 2)) & 0x09249249

    return spread(q[:, 0]) | (spread(q[:, 1]) << 1) | (spread(q[:, 2]) << 2)


def assemble(fig, st, prefix=""):
    """Junta as partes do estágio numa malha só, com região, ossos, pedra bruta e ordem de formação."""
    body = fig["body"]
    names = sorted({k.split("__")[0] for k in st.files if k.startswith(prefix) and (prefix or not k.startswith("lite_"))})
    V, N, AO, SH, REG, BA, BB, BW, RO, T = [], [], [], [], [], [], [], [], [], []
    off = 0
    stone_sdfs = [fig["parts"][k] for k in STONE if k in fig["parts"]]
    S = body.S["head"]
    up = body.neck.t - body.root.t
    Lc = float(np.linalg.norm(up))
    up = up / Lc
    for key in names:
        k = key[len(prefix):]
        v = st[key + "__v"].astype(F)
        f = st[key + "__f"]
        n = st[key + "__n"].astype(F)
        if k != "cloth" and k in fig["parts"]:
            n = normal(fig["parts"][k], v, 0.006)
        reg = np.full(len(v), REGION["prop"])
        if k == "skin":
            dh = face(body.head.loc(v) / F(S), body.S) * F(S)
            dt = body.torso(v)
            dl = body.legs(v)
            reg = np.argmin(np.stack([dh, dt, dl], axis=1), axis=1)
        elif k in ("hair", "cloth", "base"):
            reg[:] = REGION[k]
        elif k in STONE:
            reg[:] = REGION["block"]
        # ossos: a cabeça gira no alto do pescoço; o peito se inclina a partir da cintura
        ba = np.zeros(len(v))
        bb = np.zeros(len(v))
        bw = np.ones(len(v))
        if k in ("skin", "hair", "cloth"):
            rel = v.astype(float) - body.root.t
            along = rel @ up
            rad = np.linalg.norm(rel - np.outer(along, up), axis=1)
            cw = smooth((along / Lc - 0.22) / 0.5) * (1 - smooth((rad - 1.25) / 0.6))
            if k == "skin":
                cw = np.where(reg == REGION["legs"], 0.0, cw)
            q = body.head.loc(v) / F(S)
            hw = smooth((q[:, 1] + 0.86) / 0.42) * (reg == REGION["head"]) if k == "skin" else (np.ones(len(v)) if k == "hair" else np.zeros(len(v)))
            head = hw > 0.01
            ba = np.where(head, 2, 1)
            bb = np.where(head, 1, 0)
            bw = np.where(head, hw, cw)
        elif k in fig.get("bones", {}):
            ba[:] = bb[:] = fig["bones"][k]
        rough = np.ones(len(v)) if k in STONE or k == "base" else (np.clip(1 - np.min([s(v) for s in stone_sdfs], axis=0) / 0.55, 0, 1) if stone_sdfs and k in ("skin", "cloth", "hair") else np.zeros(len(v)))
        V.append(v)
        N.append(n)
        AO.append(st[key + "__ao"])
        SH.append(st[key + "__sh"])
        REG.append(reg)
        BA.append(ba)
        BB.append(bb)
        BW.append(bw)
        RO.append(rough)
        T.append(f + off)
        off += len(v)
    M = dict(v=np.concatenate(V), n=np.concatenate(N), ao=np.concatenate(AO), sh=np.concatenate(SH), reg=np.concatenate(REG), ba=np.concatenate(BA), bb=np.concatenate(BB), bw=np.concatenate(BW), rough=np.concatenate(RO), t=np.concatenate(T))
    rng = np.random.default_rng(SEED)
    y = M["v"][:, 1]
    # a figura se forma de baixo para cima (os grãos sobem contra a gravidade), com a frente irregular
    M["order"] = np.clip(0.86 * (y - y.min()) / max(float(y.max() - y.min()), 1e-6) + 0.14 * rng.random(len(y)), 0, 1)
    M["seed"] = rng.random(len(y))
    return M


def grains(M, count):
    """Pontos na superfície, por área, com semente fixa; por região, em ordem de Morton."""
    rng = np.random.default_rng(SEED + count)
    v, t = M["v"].astype(float), M["t"]
    area = 0.5 * np.linalg.norm(np.cross(v[t[:, 1]] - v[t[:, 0]], v[t[:, 2]] - v[t[:, 0]]), axis=1)
    treg = M["reg"][t[:, 0]]
    have = [float(area[treg == r].sum()) for r in range(8)]
    # o que a figura não tem (cabelo, adereço, bloco) fica com o panejamento, ou com o que houver de maior
    fallback = REGION["cloth"] if have[REGION["cloth"]] > 0 else int(np.argmax(have))
    P, Nn, R, O, Lg = [], [], [], [], []
    for r in range(8):
        m = int(round(QUOTA[r] * count)) if r < 7 else count - sum(int(round(q * count)) for q in QUOTA[:7])
        src = r if have[r] > 0 else fallback
        idx = np.nonzero(treg == src)[0]
        pick = idx[rng.choice(len(idx), m, p=area[idx] / area[idx].sum())]
        a, b = rng.random(m), rng.random(m)
        flip = a + b > 1
        a[flip], b[flip] = 1 - a[flip], 1 - b[flip]
        w = np.stack([1 - a - b, a, b], axis=1)
        tri = t[pick]
        pos = (v[tri] * w[:, :, None]).sum(axis=1)
        nrm = (M["n"][tri] * w[:, :, None]).sum(axis=1)
        nrm /= np.maximum(np.linalg.norm(nrm, axis=1), 1e-9)[:, None]
        lo, hi = pos.min(axis=0), pos.max(axis=0)
        order = np.argsort(_morton((pos - lo) / np.maximum(hi - lo, 1e-6)), kind="stable")
        P.append(pos[order])
        Nn.append(nrm[order])
        R.append(np.full(m, r))
        O.append((M["order"][tri] * w).sum(axis=1)[order])
        Lg.append(((M["ao"][tri] * (0.45 + 0.55 * M["sh"][tri])) * w).sum(axis=1)[order])
    return dict(p=np.concatenate(P), n=np.concatenate(Nn), reg=np.concatenate(R), order=np.concatenate(O), light=np.concatenate(Lg), seed=rng.random(count))


def write(path, M, G):
    v = M["v"].astype(float)
    allp = np.concatenate([v, G["p"]])
    center = 0.5 * (allp.max(axis=0) + allp.min(axis=0))
    scale = float(np.abs(allp - center).max()) * 1.001
    n = len(v)
    idx = M["t"].astype("<u4" if n > 65535 else "<u2").tobytes()
    q16 = lambda p: np.round((p - center) / scale * 32767).astype("<i2").tobytes()
    u8 = lambda *cols: np.round(np.clip(np.stack(cols, axis=1), 0, 255)).astype("u1").tobytes()
    with open(path, "wb") as f:
        f.write(b"MTS1" + struct.pack("<III3ff", n, M["t"].size, len(G["p"]), *center, scale))
        f.write(q16(v) + bytes((n * 6) % 4))
        f.write(np.concatenate([np.round(np.clip(M["n"], -1, 1) * 127), np.round(np.clip(M["ao"], 0, 1) * 127)[:, None]], axis=1).astype("i1").tobytes())
        f.write(u8(M["reg"], M["order"] * 255, M["sh"] * 255, M["rough"] * 255))
        f.write(u8(M["ba"], M["bb"], M["bw"] * 255, M["seed"] * 255))
        f.write(idx + bytes(len(idx) % 4))
        m = len(G["p"])
        f.write(q16(G["p"]) + bytes((m * 6) % 4))
        f.write(np.concatenate([np.round(np.clip(G["n"], -1, 1) * 127), G["reg"][:, None]], axis=1).astype("i1").tobytes())
        f.write(u8(G["order"] * 255, G["seed"] * 255, G["light"] * 255, np.zeros(m)))
    return n, len(M["t"]), m
