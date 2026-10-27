"use client";

import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useOs, useOsStore } from "./os-shell";
import { useDesktopWide } from "./launch";
import { WhatsAppIcon } from "./mobile/icons";

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
 * em fade + deslocamento, pulsos percorrem as linhas de tempos em tempos e
 * um pulso extra corre a linha do painel sob o ponteiro/foco. Os pulsos são
 * pontos HTML pequenos fora do SVG, animados por transform e opacidade (Web
 * Animations): rodam no compositor, sem repintar nada. Eram círculos com
 * SMIL animateMotion dentro do SVG de tela inteira — cada quadro repintava
 * ladrilhos do SVG com o filtro de brilho (no Intel UHD, ~750 ms de
 * rasterização na GPU a cada 2 s, disputando com o fundo).
 * `prefers-reduced-motion`/Ajustes › Reduzir: tudo parado e visível.
 *
 * Celular: o HUD não aparece (as redes moram na dock de redes).
 * Desktop largo (≥ 1080 px): também não — as redes viram o grupo compacto
 * do canto inferior direito (SocialLinks, abaixo). O HUD fica no tablet.
 * O olho que dava nome aos nós saiu do cenário (revisão 14): o palco
 * (`.os-stage`) guarda a mesma caixa, então painéis e circuitos ficaram
 * exatamente onde estavam.
 */
export type SocialKey = "linkedin" | "github" | "instagram";
type Key = SocialKey;
const ORDER: Key[] = ["linkedin", "github", "instagram"];
const NAME: Record<Key, string> = { linkedin: "LinkedIn", github: "GitHub", instagram: "Instagram" };

type Wire = { d: string; x1: number; y1: number; xs: number; x2: number; y2: number };

/** Pulsos: período e início (s) — os mesmos da versão em SMIL; o extra do ponteiro dura 0,75 s. */
const PULSE = { dur: 2.8, begin: 2.1, step: 0.7, hot: 0.75 };
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.osMotion === "reduce";
/** O trajeto do circuito (toco reto + diagonal) em quadros-chave de translate, em ritmo constante. */
function pathFrames(w: Wire, r: number): Keyframe[] {
  const l1 = Math.abs(w.xs - w.x1);
  const l2 = Math.hypot(w.x2 - w.xs, w.y2 - w.y1);
  const at = (x: number, y: number) => `translate(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px)`;
  return [
    { transform: at(w.x1, w.y1), offset: 0 },
    { transform: at(w.xs, w.y1), offset: l1 / Math.max(1e-3, l1 + l2) },
    { transform: at(w.x2, w.y2), offset: 1 },
  ];
}

export function SocialHud() {
  const { payload } = useOs();
  const s = payload.s.social;
  const shell = useOsStore((st) => st.shell);
  const links = ORDER.filter((k) => payload.social[k]);
  const rootRef = useRef<HTMLDivElement>(null);
  const hotTimers = useRef<Partial<Record<Key, number>>>({});
  // Ajustes › Reduzir movimento liga e desliga os pulsos
  const motion = useOsStore((st) => st.prefs.motion);
  const wide = useDesktopWide();
  const [wires, setWires] = useState<Partial<Record<Key, Wire>>>({});
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Mede os painéis e o olho (só na área de trabalho) e traça os circuitos.
  const keys = links.join(",");
  useLayoutEffect(() => {
    const root = rootRef.current;
    const desk = root?.parentElement;
    if (!root || !desk || wide || shell === "mobile" || shell === "simple") {
      setWires({});
      return;
    }
    // O palco é a caixa que o olho ocupava (o olho saiu; a geometria do HUD ficou): os nós continuam nos mesmos
    // pontos, que agora caem sobre o anel interno da lua (Tsukuyomi) e a borda do miolo do portal (Vazio).
    const eye = desk.querySelector<HTMLElement>(".os-stage");
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
        // Nós em frações do palco (herdadas do olho: canto externo, sobrancelha e cílios inferiores).
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
  }, [shell, keys, wide]);

  // Pulsos em ciclo: recriados quando os circuitos mudam (medida/resize); nenhum JS por quadro.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || wide || typeof root.animate !== "function" || reduced()) return;
    const anims: Animation[] = [];
    (Object.keys(wires) as Key[]).forEach((k) => {
      const w = wires[k];
      const el = root.querySelector<HTMLElement>(`.os-hud__pulse[data-social="${k}"]:not(.os-hud__pulse--hot)`);
      if (!w || !el) return;
      const i = keys.split(",").indexOf(k);
      const timing: KeyframeAnimationOptions = { duration: PULSE.dur * 1000, delay: (PULSE.begin + i * PULSE.step) * 1000, iterations: Infinity };
      anims.push(el.animate(pathFrames(w, 2.2), { ...timing, easing: "linear" }));
      anims.push(el.animate([{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.85 }, { opacity: 0, offset: 1 }], timing));
    });
    return () => anims.forEach((a) => a.cancel());
  }, [wires, keys, motion, wide]);

  // Pulso extra na linha do painel sob o ponteiro/foco: começa na hora.
  const pulse = useCallback(
    (k: Key) => {
      const root = rootRef.current;
      const g = root?.querySelector<SVGGElement>(`.os-hud__wire[data-social="${k}"]`);
      const el = root?.querySelector<HTMLElement>(`.os-hud__pulse--hot[data-social="${k}"]`);
      const w = wires[k];
      if (!g || !el || !w || typeof el.animate !== "function" || reduced()) return;
      el.getAnimations().forEach((a) => a.cancel());
      el.animate(pathFrames(w, 2.6), { duration: PULSE.hot * 1000, easing: "linear" });
      el.animate([{ opacity: 1 }, { opacity: 1 }], { duration: PULSE.hot * 1000 });
      g.dataset.hot = "1";
      window.clearTimeout(hotTimers.current[k]);
      hotTimers.current[k] = window.setTimeout(() => delete g.dataset.hot, 850);
    },
    [wires],
  );

  if (!links.length || wide) return null;

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
            </g>
          );
        })}
      </svg>
      {/* pulsos: pontos HTML na mesma geometria do SVG (área de trabalho), animados no compositor */}
      {links.map((k) =>
        wires[k] ? (
          <span key={k} aria-hidden="true">
            <span className="os-hud__pulse" data-social={k} />
            <span className="os-hud__pulse os-hud__pulse--hot" data-social={k} />
          </span>
        ) : null,
      )}

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

/**
 * Redes no desktop largo (≥ 1080 px): grupo compacto no canto inferior direito — LinkedIn, GitHub, Instagram e
 * WhatsApp, no lugar dos painéis HUD (sem circuitos nem descrições). Ícone monocromático numa placa de vidro e o
 * nome embaixo; no hover ou foco, o acento do tema (no WhatsApp, verde discreto). O WhatsApp é o número comercial
 * de lib/content (PROFILE.whatsapp, o mesmo do app Contato e da dock do telefone): sem um número válido (DDI +
 * número, só dígitos), o item não aparece. Abaixo de 1080 px o grupo fica escondido pelo CSS — o tablet mantém o
 * HUD e o telefone, a dock de redes.
 */
export function SocialLinks() {
  const { payload } = useOs();
  const s = payload.s;
  const items: { key: Key | "whatsapp"; href: string; name: string }[] = ORDER.filter((k) => payload.social[k]).map((k) => ({ key: k, href: payload.social[k]!, name: NAME[k] }));
  if (/^[1-9]\d{7,14}$/.test(payload.contact.whatsapp)) items.push({ key: "whatsapp", href: `https://wa.me/${payload.contact.whatsapp}`, name: s.contact.whatsapp });
  if (!items.length) return null;
  return (
    <nav className="os-social" aria-label={s.social.label} data-no-inspect>
      <ul>
        {items.map((it) => (
          <li key={it.key}>
            <a className="os-social__item" data-social={it.key} href={it.href} target="_blank" rel="noopener noreferrer">
              <span className="os-social__icon" aria-hidden="true">
                {it.key === "whatsapp" ? <WhatsAppIcon /> : <SocialIcon k={it.key} mono />}
              </span>
              <span className="os-social__name">{it.name}</span>
              <span className="sr-only"> · {s.social.external}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * As marcas nas cores oficiais: "in" na placa azul, o gato do GitHub (octicon) no círculo, a câmera do Instagram no
 * degradê. `mono` (redes compactas do desktop largo): o LinkedIn vira a placa com o "in" vazado, para ser
 * reconhecível sem a cor; GitHub e Instagram já são a própria marca em uma cor.
 */
export function SocialIcon({ k, mono = false }: { k: Key; mono?: boolean }) {
  if (k === "linkedin" && mono) {
    return (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM5.2 9.5h3V18h-3zM6.7 5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10.2 9.5h2.9v1.2c.5-.8 1.5-1.4 2.9-1.4 2.6 0 3.2 1.7 3.2 3.9V18h-3v-4.1c0-1 0-2.2-1.4-2.2s-1.6 1.1-1.6 2.1V18h-3z"
        />
      </svg>
    );
  }
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
