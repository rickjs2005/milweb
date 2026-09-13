"use client";

import { useEffect, useRef } from "react";
import { useSystem } from "@/features/system/system-provider";
import { subscribeSystem } from "@/features/system/system-store";

export type HudStrings = { fine: string; coarse: string; reduce: string; sound: string };

/**
 * HUD do MilWeb System — a barra de estado persistente.
 *
 * Só mostra o que o provider mediu ou o que o registro estampou no DOM:
 * id e título do nó dominante, sua leitura (um fato publicado), o progresso
 * real dentro do nó e, no nó raiz, o que o sistema sabe da sessão (viewport,
 * DPR, tipo de ponteiro, reduced-motion, som). Nenhum número decorativo.
 *
 * `aria-hidden`: é redundante com os headings e não vira live region.
 * O progresso é escrito direto no DOM pelo assinante do frame — sem re-render.
 */
export function SystemHud({ strings }: { strings: HudStrings }) {
  const { current, root, media, viewport, audio } = useSystem();
  const progress = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let last = -1;
    return subscribeSystem((f) => {
      // Compara o número antes de formatar: a maioria dos quadros não muda o
      // progresso arredondado, e não vale criar uma string só pra descartá-la.
      const n = Math.round(f.nodeProgress * 100);
      if (n !== last && progress.current) {
        last = n;
        progress.current.textContent = String(n).padStart(3, "0");
      }
    });
  }, []);

  const short = String(current.index).padStart(3, "0");
  const isRoot = current.key === root.key;
  const device = viewport.w
    ? [`${viewport.w}×${viewport.h}`, `${viewport.dpr.toFixed(1)}×`, media.pointer === "fine" ? strings.fine : strings.coarse, media.reduce ? strings.reduce : null, audio ? strings.sound : null].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="mw-hud t-mono" aria-hidden="true" data-hud data-node-current={current.key}>
      {/* key força o remount do rótulo: a troca de nó anima por CSS (e não anima sob data-reduce). */}
      <span className="mw-hud__node" key={current.key}>
        <span className="mw-hud__long">
          <span className="mw-hud__id tnum">{current.id}</span>
          <span className="mw-hud__title"> — {current.title}</span>
          {current.readout && <span className="mw-hud__readout"> · {current.readout}</span>}
        </span>
        <span className="mw-hud__short tnum">
          {short} / {current.title}
        </span>
      </span>
      <span className="mw-hud__right">
        {isRoot && device && <span className="mw-hud__device tnum">{device}</span>}
        <span className="mw-hud__progress tnum" ref={progress}>
          000
        </span>
      </span>
    </div>
  );
}
