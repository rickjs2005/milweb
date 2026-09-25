"use client";

import { useEffect, useRef, useState } from "react";

export type MotionSources = { webm: string; mp4: string };

/**
 * Loop curto do projeto sobre a captura da galeria (MilWeb System, Sprint 02).
 *
 * Regras de carregamento e reprodução:
 *  - O poster (a captura) está sempre lá; o vídeo entra por cima quando toca.
 *  - 0 bytes antes do gesto: as <source> só entram no DOM quando o card é armado.
 *  - Ponteiro fino: hover/foco no link do card toca; sair pausa e volta ao início.
 *  - Toque: um único IntersectionObserver decide qual card manda. Só o card
 *    dominante é ARMADO (baixa o arquivo) e só ele toca — nunca dois.
 *  - Nunca sob reduced-motion, Save-Data ou prefers-reduced-data.
 *  - `play()` recusado (autoplay bloqueado, bateria) é silencioso: fica o poster.
 *
 * Armar e tocar são coisas separadas. Foi o que quebrou na primeira versão: cada
 * card recém-armado chamava play() por conta própria, então o último a carregar
 * roubava a vez do card que estava de fato na tela.
 */

let active: HTMLVideoElement | null = null;
let observer: IntersectionObserver | null = null;
const ratios = new Map<HTMLVideoElement, number>();
const armers = new Map<HTMLVideoElement, () => void>();
let lifecycleBound = false;

/** Fração visível a partir da qual um card assume a vez no toque. */
const DOMINANT = 0.6;

function stop(v: HTMLVideoElement) {
  v.pause();
  v.removeAttribute("data-playing");
  try {
    v.currentTime = 0;
  } catch {}
  if (active === v) active = null;
}

function start(v: HTMLVideoElement) {
  if (active && active !== v) stop(active);
  active = v;
  const p = v.play();
  if (p && typeof p.catch === "function") p.catch(() => stop(v));
}

/** Quem manda no toque: o card mais visível acima do limiar. Arma antes de tocar. */
function evaluate() {
  let best: HTMLVideoElement | null = null;
  let max = DOMINANT;
  ratios.forEach((r, el) => {
    if (r >= max) {
      max = r;
      best = el;
    }
  });
  if (!best) {
    if (active) stop(active);
    return;
  }
  const winner: HTMLVideoElement = best;
  if (!winner.querySelector("source")) {
    // Ainda sem arquivo: arma só este. O efeito de armar chama evaluate() de novo.
    armers.get(winner)?.();
    return;
  }
  if (winner !== active) start(winner);
}

function bindLifecycle() {
  if (lifecycleBound) return;
  lifecycleBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && active) stop(active);
  });
}

function observe(v: HTMLVideoElement, arm: () => void) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target as HTMLVideoElement, e.isIntersecting ? e.intersectionRatio : 0));
        evaluate();
      },
      { threshold: [0, 0.3, DOMINANT, 0.8, 1] },
    );
  }
  ratios.set(v, 0);
  armers.set(v, arm);
  observer.observe(v);
  return () => {
    observer?.unobserve(v);
    ratios.delete(v);
    armers.delete(v);
    if (active === v) stop(v);
  };
}

function allowed() {
  const html = document.documentElement;
  if (html.dataset.reduce === "1" || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (matchMedia("(prefers-reduced-data: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return true;
}

export function ProjectMotion({ sources }: { sources: MotionSources }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  /** Ponteiro fino: o cursor ainda está sobre o card? Evita tocar depois de sair. */
  const wants = useRef(false);
  const coarse = useRef(false);

  // Armar é só carregar. Quem decide tocar é o hover (fino) ou o observer (toque).
  useEffect(() => {
    const v = ref.current;
    if (!armed || !v) return;
    v.load();
    if (coarse.current) evaluate();
    else if (wants.current) start(v);
  }, [armed]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !allowed()) return;
    bindLifecycle();
    const onPlaying = () => v.setAttribute("data-playing", "1");
    v.addEventListener("playing", onPlaying);

    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    coarse.current = !fine;
    let cleanup: (() => void) | undefined;

    // A OS pode ligar reduced-motion a qualquer momento, não só antes desta troca de
    // rota: reavalia ao vivo e pausa na hora, sem esperar um gesto que reative o vídeo.
    const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const onReduceChange = () => { if (!allowed()) stop(v); };
    reduceQuery.addEventListener("change", onReduceChange);

    if (fine) {
      const link = v.closest<HTMLElement>("a");
      if (link) {
        const enter = () => {
          wants.current = true;
          if (v.querySelector("source")) start(v);
          else setArmed(true);
        };
        const leave = () => {
          wants.current = false;
          stop(v);
        };
        link.addEventListener("pointerenter", enter);
        link.addEventListener("pointerleave", leave);
        link.addEventListener("focusin", enter);
        link.addEventListener("focusout", leave);
        cleanup = () => {
          link.removeEventListener("pointerenter", enter);
          link.removeEventListener("pointerleave", leave);
          link.removeEventListener("focusin", enter);
          link.removeEventListener("focusout", leave);
          stop(v);
        };
      }
    } else {
      cleanup = observe(v, () => setArmed(true));
    }

    return () => {
      v.removeEventListener("playing", onPlaying);
      reduceQuery.removeEventListener("change", onReduceChange);
      cleanup?.();
    };
  }, []);

  return (
    <video ref={ref} className="gallery-project__motion" muted playsInline loop preload="none" aria-hidden="true" tabIndex={-1} data-motion disablePictureInPicture disableRemotePlayback>
      {armed && (
        <>
          <source src={sources.webm} type="video/webm" />
          <source src={sources.mp4} type="video/mp4" />
        </>
      )}
    </video>
  );
}
