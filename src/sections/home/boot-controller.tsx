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
 *  2.2  headline sobe (evento mw:headline, o hero escuta) — logo depois do overlay sair,
 *       não 2 s depois: senão o visitante que já rolou vê grid + código + lista de estágios
 *       vazios por um tempo perceptível antes da manchete existir (bug real, corrigido aqui)
 *  3.6  anomalia: a escultura distorce a interface (html.anomaly + uAnomaly) — a headline
 *       não está nessa lista de seletores, então já pode estar em tela sem conflito
 *  5.1  controle total
 */
// Pedido do Rick: mais folga antes do overlay sair, pra dar tempo do site (chunks
// assíncronos — Lenis, SplitText, etc.) terminar de montar antes da primeira interação
// possível. NÃO é a correção do travamento em fechar/reabrir aba (esse caminho pula o
// preloader inteiro via sessionStorage, ver `booted` abaixo — o preloader nem roda nele);
// é só folga a mais no caminho normal de carregamento.
const FIRST = { exit: 2.8, assemble: 2.5, anomaly: 4.3, headline: 2.9, done: 5.8 };
/** Mobile: a introdução existe, mas curta — no celular o conteúdo vem antes do espetáculo. */
const SHORT = { exit: 2.0, assemble: 1.6, anomaly: 2.9, headline: 2.1, done: 3.8 };
const QUICK = { exit: 0.8, assemble: 0.5, anomaly: -1, headline: 0.9, done: 2.0 };

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

    // Sessão já bootada: o inline script só roda no HTML do servidor e o
    // <html className> é reaplicado pelo React na troca de idioma, então numa
    // revisita client-side a classe `booted` não existe — lemos o sessionStorage
    // direto e escondemos o overlay (sem removê-lo: o nó é do React).
    let booted = root.classList.contains("booted");
    try {
      booted ||= sessionStorage.getItem("mw:booted") === "1";
    } catch {}
    if (!el || booted) {
      if (el) el.style.display = "none";
      root.classList.remove("booting");
      headline();
      // sem intro (reduced / sessão já bootada): escultura já montada
      compiler.values.assemble = 1;
      compiler.values.opacity = 1;
      compiler.state = "assembled";
      compiler.notify();
      window.dispatchEvent(new Event("mw:visual-assemble"));
      window.dispatchEvent(new Event("mw:visual-ready"));
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
        // ponte genérica de visual (o Milo escuta; o Compiler segue pelo compileTo acima)
        window.dispatchEvent(new Event("mw:visual-assemble"));
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
      window.dispatchEvent(new Event("mw:visual-ready"));
      // NUNCA el.remove(): o <div id="mw-boot"> é renderizado pelo React. Tirá-lo
      // do DOM por fora deixa a fiber apontando para um nó solto e, na próxima
      // navegação que desmonta a Home, o React chama body.removeChild(el) →
      // NotFoundError → "Application error" (bug reproduzido em Chromium e
      // WebKit, local e produção). Esconder resolve; o React remove ao desmontar.
      window.setTimeout(() => {
        el.style.display = "none";
      }, 900);
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
    // FAILSAFE fora do GSAP: se a timeline morrer por qualquer motivo (aba suspensa,
    // erro, kill), o html.booting (overflow:hidden) não pode prender o site inteiro.
    const failsafe = window.setTimeout(() => finish(), (T.done + 2) * 1000);
    return () => {
      window.clearTimeout(failsafe);
      tl.kill();
      el.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);
  return null;
}
