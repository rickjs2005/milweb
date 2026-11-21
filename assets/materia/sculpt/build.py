"""
MATÉRIA · esculturas — do número à pedra.

  python assets/materia/sculpt/build.py --preview rest [--pose contact] [--sil] [--h 0.035]
      malha rápida das partes + braços na pose → .audit/sculpt/<nome>-<pose>.png (render no Blender)
"""
from __future__ import annotations

import io
import os
import subprocess
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from figures import BUDGET, FIGURES, LITE, RES, arm_sdfs  # noqa: E402
from sdf import nets  # noqa: E402

ROOT = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
AUDIT = os.path.join(ROOT, ".audit", "sculpt")
BLENDER = os.environ.get("BLENDER", r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe")
BOX = ((-4.4, -0.7, -2.6), (4.4, 9.2, 3.2))


def blender(script, *args):
    r = subprocess.run([BLENDER, "-b", "--python", os.path.join(HERE, script), "--", *[str(a) for a in args]], capture_output=True, text=True, encoding="utf-8", errors="replace")
    tail = [ln for ln in (r.stdout + r.stderr).splitlines() if any(k in ln for k in ("Error", "Traceback", "VIEW", "STAGE", "  File", "line "))]
    if r.returncode != 0 or any("Traceback" in ln for ln in tail):
        print("\n".join(tail[-25:]))
        raise SystemExit("blender falhou")
    return tail


def meshes(fig, h, pose, only=None):
    out = {}
    parts = dict(fig["parts"])
    parts.update(arm_sdfs(fig, pose))
    if only:
        parts = {k: v for k, v in parts.items() if k in only or k.startswith("arm")}
    for name, f in parts.items():
        t0 = time.time()
        v, n, t = nets(f, BOX[0], BOX[1], h)
        out[name] = (v, n, t)
        print(f"  {name}: {len(v)} vértices · {time.time() - t0:.1f} s")
    return out


def preview(name, pose, h, sil, cam=None, yaw=0.0, only=None):
    fig = FIGURES[name]()
    os.makedirs(AUDIT, exist_ok=True)
    M = meshes(fig, h, pose, only)
    npz = os.path.join(AUDIT, f"{name}-{pose}.npz")
    np.savez(npz, **{f"{k}__v": v for k, (v, _, _) in M.items()}, **{f"{k}__f": t for k, (_, _, t) in M.items()})
    out = os.path.join(AUDIT, f"{name}-{pose}{'-sil' if sil else ''}{f'-y{int(yaw)}' if yaw else ''}.png")
    args = [npz, out] + (["--sil"] if sil else []) + (["--cam", *cam] if cam else []) + (["--yaw", yaw] if yaw else [])
    blender("view.py", *args)
    return out


def stage(name, reuse=False):
    """Partes na resolução de produção → Blender (panejamento, corte, simplificação, luz) → .audit/sculpt/<nome>-stage.npz."""
    import json

    fig = FIGURES[name]()
    os.makedirs(os.path.join(AUDIT, "cache"), exist_ok=True)
    src = os.path.join(AUDIT, "cache", f"{name}-parts.npz")
    if not (reuse and os.path.exists(src)):
        parts = dict(fig["parts"])
        parts.update(arm_sdfs(fig, "contact"))
        M = {}
        for k, f in parts.items():
            t0 = time.time()
            h = 0.03 if k.startswith("arm") else RES.get(k, RES["*"])
            v, _, t = nets(f, BOX[0], BOX[1], h)
            M[k] = (v, t)
            print(f"  {k}: {len(v)} vértices (h = {h}) · {time.time() - t0:.1f} s", flush=True)
        np.savez(src, **{f"{k}__v": v for k, (v, _) in M.items()}, **{f"{k}__f": t for k, (_, t) in M.items()})
    spec = dict(garments=fig.get("garments", []), wind=fig.get("wind", []), budget=BUDGET, budget_lite=LITE, cam=fig.get("cam", [0.0, 3.6, 4.6]), frames=fig.get("frames", 70))
    js = os.path.join(AUDIT, "cache", f"{name}-spec.json")
    json.dump(spec, open(js, "w", encoding="utf-8"))
    out = os.path.join(AUDIT, f"{name}-stage.npz")
    os.makedirs(os.path.join(HERE, "blend"), exist_ok=True)
    tail = blender("stage.py", src, js, out, os.path.join(HERE, "blend", f"{name}.blend"), os.path.join(AUDIT, f"{name}-stage.png"))
    print("\n".join("  " + ln for ln in tail if "STAGE" in ln))
    return out


MODELS = os.path.join(ROOT, "public", "models")
DATA_TS = os.path.join(ROOT, "src", "features", "os", "materia", "sculpt-data.ts")


def _round(x):
    if isinstance(x, dict):
        return {k: _round(v) for k, v in x.items()}
    if isinstance(x, (list, tuple, np.ndarray)):
        return [_round(v) for v in x]
    if isinstance(x, (float, np.floating)):
        return round(float(x), 4)
    if isinstance(x, np.integer):
        return int(x)
    return x


def pack_all(names):
    """Estágio → public/models/sculpt-<nome>{,-lite}.bin + src/features/os/materia/sculpt-data.ts."""
    import json

    import pack

    info = {}
    for name in names:
        fig = FIGURES[name]()
        st = np.load(os.path.join(AUDIT, f"{name}-stage.npz"))
        sizes = {}
        for tier, prefix in (("full", ""), ("lite", "lite_")):
            M = pack.assemble(fig, st, prefix)
            G = pack.grains(M, pack.GRAINS[tier])
            path = os.path.join(MODELS, f"sculpt-{name}{'-lite' if tier == 'lite' else ''}.bin")
            n, i, m = pack.write(path, M, G)
            sizes[tier] = dict(verts=n, tris=i, grains=m, kb=round(os.path.getsize(path) / 1024))
            if tier == "full":
                lo, hi = M["v"].min(axis=0), M["v"].max(axis=0)
        body = fig["body"]
        arms = fig["arms"]
        info[name] = dict(
            cam=fig.get("cam", [0.0, 3.6, 4.6]),
            box=[*lo, *hi],
            shoulder={s: (body.shoulder[s] if s in arms else None) for s in ("R", "L")},
            arm={s: dict(scale=arms[s]["scale"], thick=arms[s]["thick"]) for s in arms},
            waist=body.waist.t, neck=body.atlas.t,
            poses={s: arms[s]["poses"] for s in arms},
            gap=fig.get("gap"), marks=fig.get("marks", {}), bones=fig.get("bones", {}), size=sizes,
        )
        print(name, sizes, flush=True)
    # as figuras que não foram refeitas agora continuam como estavam
    if os.path.exists(DATA_TS):
        src = io.open(DATA_TS, encoding="utf-8").read()
        import re

        try:
            old = json.loads(re.sub('^  ([a-z]+): ', lambda m: '  "' + m.group(1) + '": ', src[src.index('= {') + 2 : src.rindex('}') + 1], flags=re.M).replace(',' + chr(10) + '}', chr(10) + '}'))
        except ValueError:
            old = {}
        old.update(info)
        info = old
    order = [k for k in FIGURES if k in info]
    body_ts = "{" + chr(10) + "".join("  " + k + ": " + json.dumps(_round(info[k]), ensure_ascii=False, separators=(", ", ": ")) + "," + chr(10) for k in order) + "}"
    head = [
        "// GERADO por assets/materia/sculpt/build.py --pack — não editar à mão.",
        "// As esculturas da Matéria: enquadramento, ombros, pivôs, poses dos braços e marcas de cada figura",
        "// (unidades da figura: o chão é y = 0, a cabeça mede ~1,1; R/L são a direita e a esquerda DELA).",
        "export const SCULPT = " + body_ts + " as const;",
        "",
    ]
    io.open(DATA_TS, "w", encoding="utf-8", newline=chr(10)).write(chr(10).join(head))


if __name__ == "__main__":
    a = sys.argv[1:]
    opt = lambda k, d: a[a.index(k) + 1] if k in a else d
    if "--stage" in a:
        for name in opt("--stage", "rest").split(","):
            print(name, flush=True)
            print(stage(name, "--reuse" in a))
    if "--pack" in a:
        pack_all(opt("--pack", ",".join(FIGURES)).split(","))
    if "--preview" in a:
        name = opt("--preview", "rest")
        cam = [float(x) for x in opt("--cam", "0,4.2,4.8").split(",")]
        print(preview(name, opt("--pose", "rest"), float(opt("--h", "0.035")), "--sil" in a, cam, float(opt("--yaw", "0")), opt("--parts", "").split(",") if "--parts" in a else None))
