"use client";

import { useEffect } from "react";
import { gsap } from "@/animations/gsap";
import { compiler } from "@/features/compiler/store";
import { compileTo } from "@/features/compiler/compiler";
import { getQuality } from "@/lib/quality";
import { sound } from "@/features/sound/sound";

/** Onde a escultura vive no hero: à direita no desktop, acima do manifesto no mobile. */
export const heroPlacement = () => (window.innerWidth >= 1080 ? { cx: 0.68, cy: 0.48, scale: 0.34, opacity: 1 } : window.innerWidth >= 720 ? { cx: 0.7, cy: 0.55, scale: 0.26, opacity: 1 } : { cx: 0.62, cy: 0.68, scale: 0.19, opacity: 1 });

/**
 * Lado client do Boot — três relógios independentes:
 *
 *  1. CARREGAMENTO REAL   nunca segura a sequência: o overlay é CSS/SSR e a
 *     escultura entra quando o módulo WebGL estiver pronto (ou o fallback).
 *  2. SEQUÊNCIA VISUAL    primeira visita ≈ 5,6 s · visita recorrente ≈ 1,6 s
 *     (localStorage mw:visits) · pular = clique, toque, Esc/Enter/Espaço.
 *  3. ENTRADA INTERATIVA  o scroll destrava quando o overlay sai (≈ 3,4 s /
 *     0,9 s), antes da headline terminar — o visitante manda.
 *
 * Linha do tempo (primeira visita):
 *  0.0  tela quase vazia · sinais de inicialização
 *  0.9  estrutura / design / motion / interação "carregam"
 *  1.9  fragmentos: a escultura começa a montar
 *  2.1  overlay sai → hero visível (é o LCP: quanto antes, melhor)
 *  3.6  anomalia: a escultura distorce a interface (html.anomaly + uAnomaly)
 *  4.2  headline sobe (evento mw:headline, o hero escuta)
 *  5.1  controle total
 */
const FIRST = { exit: 2.1, assemble: 1.9, anomaly: 3.6, headline: 4.2, done: 5.1 };
/** Mobile: a introdução existe, mas curta — no celular o conteúdo vem antes do espetáculo. */
const SHORT = { exit: 1.5, assemble: 1.2, anomaly: 2.4, headline: 2.7, done: 3.3 };
const QUICK = { exit: 0.5, assemble: 0.3, anomaly: -1, headline: 0.9, done: 1.6 };

export function BootController() {
  useEffect(() => {
    const el = document.getElementById("mw-boot");
    const root = document.documentElement;
    // `data-headline` no <html> é a memória do evento: o hero pode chegar
    // depois (o SplitText é carregado sob demanda) e ainda saber que já pode
    // mostrar a headline — nunca fica escondida por corrida de carregamento.
    const headline = () => {
      root.dataset.headline = "1";
      window.dispatchEvent(new Event("mw:headline"));
    };

    if (!el || root.classList.contains("booted")) {
      root.classList.remove("booting");
      headline();
      // sem intro (reduced / sessão já bootada): escultura já montada
      compiler.values.assemble = 1;
      compiler.values.opacity = 1;
      compiler.state = "assembled";
      compiler.notify();
      return;
    }

    let visits = 0;
    try {
      visits = Number(localStorage.getItem("mw:visits") || 0);
      localStorage.setItem("mw:visits", String(visits + 1));
    } catch {}
    const small = window.innerWidth < 900 || window.matchMedia("(pointer: coarse)").matches;
    const T = visits > 0 ? QUICK : small ? SHORT : FIRST;
    if (visits > 0 || small) el.classList.add("is-quick");
    el.style.setProperty("--boot-exit", `${T.exit}s`);

    window.scrollTo(0, 0);
    const q = getQuality();
    sound.restore();
    sound.play("boot");
    const tl = gsap.timeline();
    let done = false;

    // 1–3: sinais + carregamento (CSS no overlay). 4–5: fragmentos → escultura.
    tl.call(
      () => {
        compiler.values.opacity = 1;
        compiler.notify();
        compileTo("assembled", heroPlacement(), { duration: visits > 0 ? 0.9 : 1.8 });
      },
      [],
      T.assemble,
    );
    // overlay sai → scroll livre
    tl.call(
      () => {
        root.classList.remove("booting");
        el.classList.add("is-exiting");
      },
      [],
      T.exit,
    );
    // 6–7: anomalia — a escultura distorce a interface por um instante
    if (T.anomaly > 0 && q.tier !== "low") {
      tl.call(
        () => {
          root.classList.add("anomaly");
          gsap.fromTo(compiler.values, { anomaly: 1 }, { anomaly: 0, duration: 0.55, ease: "power2.out", onUpdate: () => compiler.invalidate() });
          window.setTimeout(() => root.classList.remove("anomaly"), 450);
        },
        [],
        T.anomaly,
      );
    }
    // 8: headline
    tl.call(headline, [], T.headline);
    // 9: controle total
    tl.call(() => finish(), [], T.done);

    const finish = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem("mw:booted", "1");
      } catch {}
      root.classList.remove("booting", "anomaly");
      el.classList.add("is-exiting");
      window.setTimeout(() => el.remove(), 900);
    };
    const skip = (e?: Event) => {
      if (e instanceof KeyboardEvent && !["Escape", "Enter", " "].includes(e.key)) return;
      tl.kill();
      el.classList.add("is-skipped");
      compileTo("assembled", heroPlacement(), { duration: 0.8 });
      headline();
      finish();
    };
    el.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      tl.kill();
      el.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);
  return null;
}
