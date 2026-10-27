"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { gsap } from "@/animations/gsap";
import { useOs, useOsStore } from "./os-shell";
import { otherTheme, type OsTheme } from "./theme";

/**
 * O controle de tema — o ÚNICO olho visível do sistema. Fica na dock
 * (desktop) e na dock de redes (telefone). `role="switch"` com o nome fixo
 * "Tema escuro (Obito)": ligado = Obito, desligado = Gojo.
 *
 * O olho mostra o universo em vigor: íris vermelha no Obito (escuro), azul no
 * Gojo (claro). Antes da hidratação quem escolhe a íris é o CSS, pelo
 * `data-os-theme` do <html> (o HTML do servidor é o mesmo para os dois temas
 * — sem erro de hidratação, e o olho já nasce com a cor certa); depois, o
 * `data-iris` do botão.
 *
 * O clique pede o tema ao store (`requestTheme`). A cada destino novo o olho
 * pisca: a pálpebra fecha, a íris troca com ela fechada e a reabertura
 * revela a íris nova — enquanto o fundo (features/os/scene) atravessa de um
 * universo para o outro. Cliques rápidos só trocam o destino: um piscar em
 * curso pega o destino mais recente, e a pálpebra fecha a partir de onde
 * estiver. Movimento reduzido: sem piscar, a íris troca na hora.
 * `data-theme-toggle` continua marcando os controles de tema.
 */
export function ThemeToggle({ variant }: { variant: "dock" | "mdock" }) {
  const { payload, store } = useOs();
  const s = payload.s.settings;
  const theme = useOsStore((st) => st.prefs.theme);
  const hydrated = useOsStore((st) => st.hydrated);
  const dark = hydrated && theme === "obito";
  const btnRef = useRef<HTMLButtonElement>(null);
  useEyeBlink(btnRef);
  const onClick = () => {
    const st = store.getState();
    st.requestTheme(otherTheme(st.themePending ?? st.prefs.theme));
  };

  if (variant === "mdock") {
    return (
      <button ref={btnRef} type="button" role="switch" aria-checked={dark} aria-label={s.themeSwitch} className="os-mdock__item os-mdock__theme os-theme-btn" data-theme-toggle onClick={onClick}>
        <span className="os-mdock__icon" data-social="theme" aria-hidden="true">
          <ThemeEye />
        </span>
        <span className="os-mdock__label">{s.themeShort}</span>
      </button>
    );
  }
  return (
    <button ref={btnRef} type="button" role="switch" aria-checked={dark} aria-label={s.themeSwitch} className="os-dock__item os-dock__theme os-theme-btn" data-theme-toggle onClick={onClick}>
      <span className="os-icon" data-kind="theme" style={{ width: 40, height: 40 }} aria-hidden="true">
        <ThemeEye />
      </span>
      <span className="os-dock__label">{dark ? s.obito : s.gojo}</span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * Piscar do olho: uma timeline do GSAP — o mesmo relógio (gsap.ticker) do
 * fundo, nenhum laço próprio — escrevendo `--lid` (0 aberto, 1 fechado) no
 * SVG; a íris troca (`data-iris`) com a pálpebra fechada.
 * ------------------------------------------------------------------------- */
const BLINK = { close: 0.13, hold: 0.12, open: 0.36 };

function useEyeBlink(ref: RefObject<HTMLButtonElement | null>) {
  const { store } = useOs();
  const hydrated = useOsStore((st) => st.hydrated);
  useEffect(() => {
    const btn = ref.current;
    const eye = btn?.querySelector<SVGSVGElement>(".os-eyecon");
    if (!btn || !eye || !hydrated) return;
    const dest = (): OsTheme => {
      const st = store.getState();
      return st.themePending ?? st.prefs.theme;
    };
    const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || store.getState().prefs.motion === "reduce";
    let shown = dest();
    /** fechando (inclui a pausa fechada) · reabrindo · aberto */
    let phase: "open" | "closing" | "opening" = "open";
    const lid = { v: 0 };
    let tl: gsap.core.Timeline | null = null;
    const write = () => eye.style.setProperty("--lid", lid.v.toFixed(3));
    const swap = () => {
      const d = dest();
      if (d === shown) return;
      shown = d;
      btn.dataset.iris = d;
      btn.dataset.reveal = "1";
    };
    btn.dataset.iris = shown;

    function start() {
      if (phase === "closing") return; // já fechando: a troca pega o destino mais recente
      tl?.kill();
      tl = null;
      if (reduce() || btn!.getClientRects().length === 0) {
        shown = dest();
        btn!.dataset.iris = shown;
        lid.v = 0;
        eye!.style.removeProperty("--lid");
        phase = "open";
        return;
      }
      delete btn!.dataset.reveal;
      phase = "closing";
      tl = gsap
        .timeline({
          onComplete: () => {
            phase = "open";
            tl = null;
            if (dest() !== shown) start(); // o destino mudou durante a reabertura
          },
        })
        // a pálpebra fecha a partir de onde estiver
        .to(lid, { v: 1, duration: BLINK.close * (1 - lid.v) + 0.03, ease: "power1.inOut", onUpdate: write })
        // fechada: a íris passa a ser a do destino mais recente — no meio da pausa (a pálpebra fica em 1 por
        // alguns quadros com a íris nova) e de novo no fim, se o destino mudou nesse intervalo
        .to({}, { duration: BLINK.hold / 2 })
        .call(swap)
        .to({}, { duration: BLINK.hold / 2 })
        .call(() => {
          swap();
          phase = "opening";
        })
        .to(lid, { v: 0, duration: BLINK.open, ease: "power2.out", onUpdate: write });
    }
    const unsub = store.subscribe(() => {
      if (dest() !== shown && phase !== "closing") start();
    });
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === "os-iris-reveal") delete btn.dataset.reveal;
    };
    btn.addEventListener("animationend", onEnd);
    return () => {
      unsub();
      btn.removeEventListener("animationend", onEnd);
      tl?.kill();
      eye.style.removeProperty("--lid");
      delete btn.dataset.iris;
      delete btn.dataset.reveal;
    };
  }, [hydrated, ref, store]);
}

/* ---------------------------------------------------------------------------
 * O olho (SVG 48 × 48): amêndoa, esclera, duas íris (Sharingan vermelho com
 * três tomoe; Six Eyes azul com anel claro), pupila, brilho, contorno no
 * acento do tema. O CSS escolhe a íris e aplica `--lid` ao grupo da pálpebra.
 * ------------------------------------------------------------------------- */
const ALMOND = "M5 24C11.6 13.4 36.4 13.4 43 24C36.4 34.6 11.6 34.6 5 24Z";
const TOMOE = [90, 210, 330].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const R = 5.7;
  const hx = 24 + R * Math.cos(a);
  const hy = 24 - R * Math.sin(a);
  const b = a + 0.62; // a cauda segue o anel
  const tx = 24 + R * Math.cos(b);
  const ty = 24 - R * Math.sin(b);
  return { hx: +hx.toFixed(2), hy: +hy.toFixed(2), tail: `M${hx.toFixed(2)} ${hy.toFixed(2)}A${R} ${R} 0 0 0 ${tx.toFixed(2)} ${ty.toFixed(2)}` };
});

export function ThemeEye() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg className="os-eyecon" viewBox="0 0 48 48" width="40" height="40" fill="none" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-a`}>
          <path d={ALMOND} />
        </clipPath>
        <radialGradient id={`${id}-r`} cx="50%" cy="46%" r="54%">
          <stop offset="0" stopColor="#ff7a5c" />
          <stop offset=".42" stopColor="#e3172b" />
          <stop offset=".86" stopColor="#7a0612" />
          <stop offset="1" stopColor="#3a0208" />
        </radialGradient>
        <radialGradient id={`${id}-b`} cx="50%" cy="44%" r="54%">
          <stop offset="0" stopColor="#f4fcff" />
          <stop offset=".3" stopColor="#a6dcff" />
          <stop offset=".66" stopColor="#2f86f2" />
          <stop offset="1" stopColor="#0a2c74" />
        </radialGradient>
      </defs>
      <g className="os-eyecon__lid">
        <path className="os-eyecon__white" d={ALMOND} />
        <g clipPath={`url(#${id}-a)`}>
          <g className="os-eyecon__iris os-eyecon__iris--obito">
            <circle cx="24" cy="24" r="9.6" fill={`url(#${id}-r)`} />
            <circle cx="24" cy="24" r="9.2" stroke="#2a0307" strokeWidth="1" />
            <circle cx="24" cy="24" r="5.7" stroke="#2a0307" strokeWidth=".7" opacity=".75" />
            <circle cx="24" cy="24" r="2.4" fill="#140204" />
            <g fill="#1c0306" stroke="#1c0306" strokeWidth="1" strokeLinecap="round">
              {TOMOE.map((t, i) => (
                <g key={i}>
                  <circle cx={t.hx} cy={t.hy} r="1.35" stroke="none" />
                  <path d={t.tail} fill="none" />
                </g>
              ))}
            </g>
          </g>
          <g className="os-eyecon__iris os-eyecon__iris--gojo">
            <circle cx="24" cy="24" r="9.6" fill={`url(#${id}-b)`} />
            <circle cx="24" cy="24" r="9.2" stroke="#0a2a6e" strokeWidth="1" />
            <circle cx="24" cy="24" r="6.4" stroke="#d8f2ff" strokeWidth=".8" opacity=".6" />
            <circle cx="24" cy="24" r="2.6" fill="#06163a" />
          </g>
          <circle className="os-eyecon__spark" cx="21.2" cy="20.6" r="1.6" fill="#fff" />
          <path className="os-eyecon__shade" d="M5 24C11.6 13.4 36.4 13.4 43 24C36.4 17.6 11.6 17.6 5 24Z" />
        </g>
        <path className="os-eyecon__line" d={ALMOND} />
      </g>
    </svg>
  );
}
