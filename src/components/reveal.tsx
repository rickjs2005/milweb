"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { REVEAL_VARIANTS, SCRUB_VARS, type RevealVariant } from "./reveal-variants";

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Revela o conteúdo quando entra na viewport. Dois modos:
 *
 * - SCRUB (desktop com ponteiro fino, sem reduced-motion): a montagem fica
 *   amarrada ao progresso do scroll — rolou 10%, montou 10%; parou,
 *   congela; voltou, desmonta (GSAP ScrollTrigger scrub).
 * - IO (mobile/reduced-motion/fallback): dispara uma vez via
 *   IntersectionObserver com transição CSS — o comportamento original.
 *
 * Elementos perto do FIM da página caem automaticamente no modo IO: o topo
 * deles nunca alcança a faixa final do scrub (não dá pra rolar além do fim)
 * e ficariam presos semi-invisíveis — mesma classe de bug já corrigida na
 * revelação do /lab.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  variant = "fade-up",
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [scrub, setScrub] = useState(false);

  // Decide o modo antes do primeiro paint (evita flash entre os dois).
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine) return;
    // Alcançabilidade: o fim do range do scrub precisa existir. Elementos
    // na última meia-tela do documento não conseguem subir até lá.
    const elTop = el.getBoundingClientRect().top + window.scrollY;
    const reachable =
      elTop <= document.documentElement.scrollHeight - window.innerHeight * 0.45 - 10;
    if (reachable) setScrub(true);
  }, []);

  // Modo SCRUB: GSAP fromTo amarrado ao scroll (reversível por natureza).
  useIsoLayoutEffect(() => {
    if (!scrub) return;
    const el = ref.current;
    if (!el) return;
    const v = SCRUB_VARS[variant];
    // delay (ms) vira um deslocamento do range -- cards vizinhos com delays
    // diferentes montam em cascata durante a rolagem.
    const shift = Math.min(6, delay / 50);
    const tween = gsap.fromTo(
      el,
      { ...v.from },
      {
        ...v.to,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: `top ${92 - shift}%`,
          end: `top ${58 - shift}%`,
          scrub: 0.5,
        },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [scrub, variant, delay]);

  // Modo IO: comportamento original (uma vez, transição CSS).
  useEffect(() => {
    if (scrub) return;
    const el = ref.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    // Fail-safe: nunca deixa o conteúdo permanentemente escondido se o
    // observer não disparar (ex.: página não rolada, captura headless).
    const fallback = setTimeout(() => {
      setShown(true);
      io.disconnect();
    }, 1200);
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
  }, [scrub]);

  const v = REVEAL_VARIANTS[variant];
  // No modo scrub o GSAP escreve transform/opacity por frame -- as classes
  // de transição CSS precisam SAIR pra não suavizar em dobro (lag).
  const cls = scrub
    ? className
    : "transition-all duration-700 ease-out " +
      (shown ? v.shown : v.hidden) +
      (className ? " " + className : "");
  return (
    <Tag
      ref={ref}
      style={scrub ? undefined : { transitionDelay: `${delay}ms` }}
      className={cls}
    >
      {children}
    </Tag>
  );
}

/** Contador animado que dispara ao entrar na viewport. */
export function Counter({
  value,
  suffix = "",
  duration = 1400,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  /** Atraso (ms) antes de iniciar a contagem — usado para cascata/stagger. */
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce || typeof IntersectionObserver === "undefined") {
      setN(value);
      return;
    }
    let raf = 0;
    let startTimer = 0;
    const animate = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setN(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    // Inicia a animação após o atraso do stagger (delay = 0 -> imediato).
    const startAnimation = () => {
      if (delay > 0) {
        startTimer = window.setTimeout(animate, delay);
      } else {
        animate();
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        clearTimeout(fallback);
        startAnimation();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    // Fail-safe: garante o número final mesmo sem scroll/observer.
    const fallback = setTimeout(() => {
      io.disconnect();
      startAnimation();
    }, 1400);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
