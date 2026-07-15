"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { MiloLive } from "./milo-live";
import { type MiloPose } from "./milo";
import { MILO_FAB, MILO_TOUR, type Locale } from "@/lib/content";

type Waypoint = { x: number; y: number; pose: MiloPose; scale?: number };

/**
 * Trajetória do Milo pela home: um waypoint por seção (posição em vw/vh,
 * pose e escala). Posições alternam esquerda/direita nas margens pra ele
 * "atravessar" a tela andando entre seções. No Contato ele NÃO some: anda
 * até o canto inferior direito e fica ao lado do botão verde do WhatsApp.
 */
const WAYPOINTS: Record<string, Waypoint> = {
  deliverables: { x: 4, y: 64, pose: "idle" },
  why: { x: 89, y: 60, pose: "happy" },
  "raio-x": { x: 4, y: 62, pose: "think" },
  google: { x: 89, y: 34, pose: "idle" },
  projects: { x: 4, y: 68, pose: "shocked", scale: 1.15 },
  lab: { x: 89, y: 18, pose: "happy" },
  process: { x: 4, y: 32, pose: "idle" },
  tech: { x: 89, y: 58, pose: "think" },
  faq: { x: 4, y: 58, pose: "happy" },
  about: { x: 89, y: 36, pose: "idle" },
  // No contato ele caminha até o botão verde do WhatsApp (fixo no canto
  // inferior direito) e fica em pé ao lado dele, convidando pro papo.
  contact: { x: 89, y: 76, pose: "happy" },
};

/**
 * Milo protagonista interativo: acompanha o visitante pela home andando
 * entre seções, é o dono dos balões de fala (tour por seção, reações via
 * milo:say, despedida no fim), segue o cursor com o olhar e acena quando
 * clicado (MiloLive). No Contato ele caminha até o botão verde do WhatsApp
 * e fica ao lado. Nos viewports em que ele está ativo, o FAB vira só o
 * botão verde (sem mascote duplicado) — um Milo só em cena. Desktop lg+
 * com ponteiro fino; mobile/reduced continuam com o FAB de sempre.
 */
export function MiloProtagonist({ locale = "pt" }: { locale?: Locale }) {
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState<MiloPose>("idle");
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubbleSide, setBubbleSide] = useState<"left" | "right">("right");
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const say = (text: string, p?: MiloPose, ttl = 4500) => {
    setBubble(text);
    if (p) setPose(p);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), ttl);
  };

  useEffect(() => {
    const el = wrapRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    const ok =
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ok) return;

    const targets = Object.keys(WAYPOINTS)
      .map((id) => document.getElementById(id))
      .filter((t): t is HTMLElement => t !== null);
    if (!targets.length) return; // fora da home não há palco

    gsap.set(el, { left: "-14vw", top: "60vh", autoAlpha: 0 });
    let currentX = -14;
    let visible = false;
    const saidTour = new Set<string>();

    const goTo = (id: string) => {
      const wp = WAYPOINTS[id];
      if (!wp) return;
      setPose(wp.pose);
      setBubbleSide(wp.x > 50 ? "left" : "right");
      const goingRight = wp.x > currentX;
      // encara o conteúdo: na margem direita, espelha pra olhar pra esquerda
      gsap.to(inner, { scaleX: wp.x > 50 ? -1 : 1, duration: 0.35 });
      // baloiço de caminhada enquanto atravessa
      gsap.to(inner, {
        rotation: goingRight ? 5 : -5,
        yoyo: true,
        repeat: 7,
        duration: 0.18,
        ease: "sine.inOut",
        onComplete: () => {
          gsap.to(inner, { rotation: 0, duration: 0.2 });
        },
      });
      if (!visible) {
        visible = true;
        gsap.to(el, { autoAlpha: 1, duration: 0.5 });
      }
      gsap.to(el, {
        left: `${wp.x}vw`,
        top: `${wp.y}vh`,
        scale: wp.scale ?? 1,
        duration: 1.5,
        ease: "power2.inOut",
      });
      currentX = wp.x;
      // fala do tour: uma vez por seção por visita
      if (!saidTour.has(id)) {
        saidTour.add(id);
        const step = MILO_TOUR.find((t) => t.id === id);
        if (step) say(step.text[locale], step.pose);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) goTo(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));

    // reações vindas de qualquer ilha (calculadora, vitrines...)
    const onSay = (e: Event) => {
      const d = (e as CustomEvent).detail as { text?: string; pose?: MiloPose; ttl?: number };
      if (d?.text) say(d.text, d.pose, d.ttl ?? 4500);
    };
    window.addEventListener("milo:say", onSay);

    // despedida no fim da página (o footer não cruza a banda central)
    let saidGoodbye = false;
    const onScroll = () => {
      if (
        !saidGoodbye &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80
      ) {
        saidGoodbye = true;
        say(MILO_FAB.goodbye[locale], "happy", 5000);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("milo:say", onSay);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(bubbleTimer.current);
    };
  }, [pathname, locale]);

  return (
    // Renderiza sempre (invisível e fora da tela até o effect ativar) — o
    // effect precisa do elemento no DOM pra decidir se há palco. Em mobile
    // fica hidden via CSS e o effect nem roda os matchMedia com sucesso.
    <div
      ref={wrapRef}
      className="pointer-events-none fixed z-40 hidden opacity-0 lg:block"
      style={{ left: "-14vw", top: "60vh" }}
    >
      <div className="relative">
        {/* o mascote em si aceita interação (olhar/aceno via MiloLive);
            pose "idle" deixa o humor autônomo dele mandar */}
        <div ref={innerRef} className="pointer-events-auto">
          <MiloLive
            pose={pose === "idle" ? undefined : pose}
            className="w-24 drop-shadow-[0_10px_26px_rgb(var(--accent)/0.4)]"
          />
        </div>

        {/* balão de fala (tour + reações + despedida) */}
        <span
          className={[
            "pointer-events-none absolute top-1 w-max max-w-[260px]",
            bubbleSide === "left" ? "right-full mr-3" : "left-full ml-3",
            "rounded-2xl border border-line/15 bg-surface-2/95 px-4 py-2.5",
            bubbleSide === "left" ? "rounded-br-md" : "rounded-bl-md",
            "text-sm font-medium leading-snug text-fg shadow-lg",
            "transition-all duration-300",
            bubble ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          ].join(" ")}
        >
          {bubble}
        </span>
      </div>
    </div>
  );
}
