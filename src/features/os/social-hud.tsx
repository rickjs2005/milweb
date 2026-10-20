"use client";

import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useOs, useOsStore } from "./os-shell";

/**
 * Redes do estúdio ao redor do olho — módulos flutuantes de HUD ligados ao
 * olho por circuitos finos (referência de design do Rick, 18/10/2026).
 *
 * Desktop: LinkedIn à esquerda, na altura do olho; GitHub (acima) e Instagram
 * (abaixo) à direita. Cada módulo é uma pílula de vidro escuro com o ícone
 * da rede em cores oficiais, o nome e a seta de link externo; o microtexto
 * fica FORA, sob o cartão. Posições em CSS, relativas ao quadro do olho
 * (`--eye-w`). Os circuitos são UM SVG decorativo (`pointer-events: none`)
 * sobre a área de trabalho: cada um sai da borda do painel num toco curto
 * até um ponto, e dali segue reto até um nó junto ao olho (canto externo
 * para o LinkedIn, sobrancelha para o GitHub, cílios inferiores para o
 * Instagram) — medido no cliente e redesenhado quando a janela muda.
 *
 * Movimento: os circuitos se desenham (stroke-dashoffset), os painéis entram
 * em fade + deslocamento, pulsos azuis percorrem as linhas de tempos em
 * tempos (SMIL animateMotion, zero JS por quadro) e um pulso extra corre a
 * linha do painel sob o ponteiro/foco. `prefers-reduced-motion`/Ajustes ›
 * Reduzir: tudo parado e visível.
 *
 * Celular: sem circuitos; uma fileira compacta de três módulos sob o olho.
 * O olho não muda: o `pointerdown` que o faz piscar é global e passivo, e
 * um clique nos painéis também pisca.
 */
export type SocialKey = "linkedin" | "github" | "instagram";
type Key = SocialKey;
const ORDER: Key[] = ["linkedin", "github", "instagram"];
const NAME: Record<Key, string> = { linkedin: "LinkedIn", github: "GitHub", instagram: "Instagram" };

type Wire = { d: string; x1: number; y1: number; xs: number; x2: number; y2: number };

export function SocialHud() {
  const { payload } = useOs();
  const s = payload.s.social;
  const shell = useOsStore((st) => st.shell);
  const links = ORDER.filter((k) => payload.social[k]);
  const rootRef = useRef<HTMLDivElement>(null);
  const motionRefs = useRef<Partial<Record<Key, SVGAnimateMotionElement>>>({});
  const hotTimers = useRef<Partial<Record<Key, number>>>({});
  const [wires, setWires] = useState<Partial<Record<Key, Wire>>>({});
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Mede os painéis e o olho (só na área de trabalho) e traça os circuitos.
  const keys = links.join(",");
  useLayoutEffect(() => {
    const root = rootRef.current;
    const desk = root?.parentElement;
    if (!root || !desk || shell === "mobile" || shell === "simple") {
      setWires({});
      return;
    }
    const eye = desk.querySelector<HTMLElement>(".os-eye");
    if (!eye) return;
    const measure = () => {
      const dr = desk.getBoundingClientRect();
      const er = eye.getBoundingClientRect();
      if (!er.width) return;
      const cx = er.left + er.width / 2 - dr.left;
      const cy = er.top + er.height / 2 - dr.top;
      const next: Partial<Record<Key, Wire>> = {};
      for (const k of keys.split(",") as Key[]) {
        const card = root.querySelector<HTMLElement>(`.os-hud__panel[data-social="${k}"] .os-hud__card`);
        if (!card) continue;
        const r = card.getBoundingClientRect();
        const left = k === "linkedin";
        const dir = left ? 1 : -1;
        const x1 = (left ? r.right : r.left) - dr.left;
        const y1 = r.top + r.height / 2 - dr.top;
        const xs = x1 + 34 * dir;
        // Nós no olho (medidos sobre a imagem do shader: o globo ocupa ~40% da largura do quadro):
        // canto externo esquerdo (LinkedIn), sobrancelha direita (GitHub), cílios inferiores direitos (Instagram).
        const x2 = k === "linkedin" ? cx - er.width * 0.205 : cx + er.width * (k === "github" ? 0.16 : 0.165);
        const y2 = cy + er.height * (k === "linkedin" ? -0.04 : k === "github" ? -0.19 : 0.12);
        const d = `M${x1.toFixed(1)} ${y1.toFixed(1)} H${xs.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
        next[k] = { d, x1, y1, xs, x2, y2 };
      }
      setWires(next);
      setBox({ w: Math.round(dr.width), h: Math.round(dr.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(desk);
    ro.observe(eye);
    return () => ro.disconnect();
  }, [shell, keys]);

  // Pulso extra na linha do painel sob o ponteiro/foco (SMIL: começa na hora, sem JS por quadro).
  const pulse = useCallback((k: Key) => {
    const m = motionRefs.current[k];
    const g = rootRef.current?.querySelector<SVGGElement>(`.os-hud__wire[data-social="${k}"]`);
    if (!m || !g || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.osMotion === "reduce") return;
    try {
      m.beginElement();
    } catch {}
    g.dataset.hot = "1";
    window.clearTimeout(hotTimers.current[k]);
    hotTimers.current[k] = window.setTimeout(() => delete g.dataset.hot, 850);
  }, []);

  if (!links.length) return null;

  return (
    <div ref={rootRef} className="os-hud" data-in="1" aria-label={s.label}>
      <svg className="os-hud__wires" viewBox={`0 0 ${box.w || 1} ${box.h || 1}`} width={box.w || 1} height={box.h || 1} aria-hidden="true" data-ready={Object.keys(wires).length ? "1" : "0"}>
        {links.map((k, i) => {
          const w = wires[k];
          if (!w) return null;
          return (
            <g key={k} className="os-hud__wire" data-social={k} style={{ "--i": i } as CSSProperties}>
              <path d={w.d} pathLength={1} className="os-hud__line os-hud__line--glow" />
              <path d={w.d} pathLength={1} className="os-hud__line" />
              <circle className="os-hud__node os-hud__node--near" cx={w.xs} cy={w.y1} r="2.2" />
              <circle className="os-hud__ring" cx={w.x2} cy={w.y2} r="5.5" />
              <circle className="os-hud__node" cx={w.x2} cy={w.y2} r="2.4" />
              <circle className="os-hud__pulse" r="2.2" opacity="0">
                <animateMotion dur="2.8s" begin={`${2.1 + i * 0.7}s`} repeatCount="indefinite" path={w.d} />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.85;1" dur="2.8s" begin={`${2.1 + i * 0.7}s`} repeatCount="indefinite" />
              </circle>
              <circle className="os-hud__pulse os-hud__pulse--hot" r="2.6">
                <animateMotion
                  ref={(el) => {
                    motionRefs.current[k] = (el as SVGAnimateMotionElement | null) ?? undefined;
                  }}
                  dur="0.75s"
                  begin="indefinite"
                  path={w.d}
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {links.map((k, i) => (
        <a key={k} className="os-hud__panel" data-social={k} href={payload.social[k]!} target="_blank" rel="noopener noreferrer" style={{ "--i": i } as CSSProperties} onPointerEnter={() => pulse(k)} onFocus={() => pulse(k)}>
          <span className="os-hud__card">
            <span className="os-hud__icon" data-social={k} aria-hidden="true">
              <SocialIcon k={k} />
            </span>
            <span className="os-hud__name">{NAME[k]}</span>
            <span className="os-hud__arrow" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12L12 4M6 4h6v6" />
              </svg>
            </span>
            <span className="os-hud__dot" aria-hidden="true" />
          </span>
          <span className="os-hud__micro">{s[k]}</span>
          <span className="sr-only">· {s.external}</span>
        </a>
      ))}
    </div>
  );
}

/** As marcas nas cores oficiais: "in" na placa azul, o gato do GitHub (octicon) no círculo, a câmera do Instagram no degradê. */
export function SocialIcon({ k }: { k: Key }) {
  if (k === "github") {
    return (
      <svg viewBox="0 0 16 16" width="19" height="19" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
      </svg>
    );
  }
  if (k === "instagram") {
    return (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
      <path d="M6.5 9.5h3V18h-3zM8 5a1.75 1.75 0 1 1 0 3.5A1.75 1.75 0 0 1 8 5zM11.5 9.5h2.9v1.2c.5-.8 1.5-1.4 2.9-1.4 2.6 0 3.2 1.7 3.2 3.9V18h-3v-4.1c0-1 0-2.2-1.4-2.2s-1.6 1.1-1.6 2.1V18h-3z" />
    </svg>
  );
}
