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
  // y baixo: no Processo o título/label ficam no terço superior esquerdo —
  // em y:32 o Milo parava exatamente em cima do "07 / COMO FUNCIONA".
  process: { x: 4, y: 16, pose: "idle" },
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
/** Elementos que um balão de fala nunca pode cobrir. */
const CONTENT_SELECTOR =
  "h1, h2, h3, h4, p, a, button, li, img, video, svg, input, textarea, select, label, figure, blockquote, code, table";

/** "topLeft"/"topRight": acima do Milo, alinhado à borda que não estoura a tela. */
type BubblePlacement = "left" | "right" | "topLeft" | "topRight";

export function MiloProtagonist({ locale = "pt" }: { locale?: Locale }) {
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [pose, setPose] = useState<MiloPose>("idle");
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubbleSide, setBubbleSide] = useState<BubblePlacement>("right");
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /**
   * O balão cobre algum conteúdo de verdade nessa posição? Amostra os
   * cantos + centro do retângulo projetado com elementsFromPoint (barato,
   * só roda ao abrir um balão) e procura texto/mídia dentro do <main> —
   * fundos de seção e camadas fixas (nav, FAB, a própria lula) ficam fora.
   */
  const rectCollides = (r: { left: number; top: number; w: number; h: number }) => {
    const pts: Array<[number, number]> = [
      [r.left + 6, r.top + 6],
      [r.left + r.w - 6, r.top + 6],
      [r.left + 6, r.top + r.h - 6],
      [r.left + r.w - 6, r.top + r.h - 6],
      [r.left + r.w / 2, r.top + r.h / 2],
    ];
    return pts.some(([x, y]) => {
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return true;
      return document
        .elementsFromPoint(x, y)
        .some((n) => n instanceof Element && n.closest("main") && n.matches(CONTENT_SELECTOR));
    });
  };

  /**
   * Escolhe onde abrir o balão sem cobrir conteúdo: lado preferido (voltado
   * pro centro da tela) → lado oposto → em cima do Milo. Se tudo colidir,
   * fica em cima mesmo — é o que menos briga com texto nas margens.
   */
  const placeBubble = (preferred: "left" | "right") => {
    const wrap = wrapRef.current;
    const span = bubbleRef.current;
    if (!wrap || !span) return;
    const m = wrap.getBoundingClientRect();
    const w = Math.min(260, span.offsetWidth || 220);
    const h = span.offsetHeight || 44;
    // Acima do Milo, alinhado à borda que aponta pro centro da tela
    // (na margem direita o balão cresce pra esquerda, e vice-versa).
    const onRightHalf = m.left + m.width / 2 > window.innerWidth / 2;
    const top: [BubblePlacement, { left: number; top: number; w: number; h: number }] = onRightHalf
      ? ["topRight", { left: m.right - w, top: m.top - 12 - h, w, h }]
      : ["topLeft", { left: m.left, top: m.top - 12 - h, w, h }];
    const candidates: Array<[BubblePlacement, { left: number; top: number; w: number; h: number }]> = [
      ["right", { left: m.right + 12, top: m.top + 4, w, h }],
      ["left", { left: m.left - 12 - w, top: m.top + 4, w, h }],
      top,
    ];
    if (preferred === "left") [candidates[0], candidates[1]] = [candidates[1], candidates[0]];
    for (const [placement, rect] of candidates) {
      if (!rectCollides(rect)) {
        setBubbleSide(placement);
        return;
      }
    }
    setBubbleSide(top[0]);
  };

  const say = (text: string, p?: MiloPose, ttl = 4500, preferred?: "left" | "right") => {
    setBubble(text);
    if (p) setPose(p);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), ttl);
    // Mede depois que o texto renderizou (2 rAFs: commit + layout).
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const wrap = wrapRef.current;
        const fallback: "left" | "right" =
          wrap && wrap.getBoundingClientRect().left > window.innerWidth / 2 ? "left" : "right";
        placeBubble(preferred ?? fallback);
      }),
    );
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
        // A fala do tour só abre quando ele CHEGA (uma vez por seção por
        // visita) — falar andando media a colisão do balão no lugar errado.
        onComplete: () => {
          if (saidTour.has(id)) return;
          saidTour.add(id);
          const step = MILO_TOUR.find((t) => t.id === id);
          if (step) say(step.text[locale], step.pose, 4500, wp.x > 50 ? "left" : "right");
        },
      });
      currentX = wp.x;
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

        {/* balão de fala (tour + reações + despedida) — posição decidida
            por colisão real com o conteúdo (placeBubble) */}
        <span
          ref={bubbleRef}
          className={[
            "pointer-events-none absolute w-max max-w-[260px]",
            bubbleSide === "topLeft"
              ? "bottom-full left-0 mb-3 rounded-2xl rounded-bl-md"
              : bubbleSide === "topRight"
                ? "bottom-full right-0 mb-3 rounded-2xl rounded-br-md"
                : bubbleSide === "left"
                  ? "right-full top-1 mr-3 rounded-2xl rounded-br-md"
                  : "left-full top-1 ml-3 rounded-2xl rounded-bl-md",
            "border border-line/15 bg-surface-2/95 px-4 py-2.5",
            "text-sm font-medium leading-snug text-fg shadow-lg",
            "transition-opacity duration-300",
            bubble ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          {bubble}
        </span>
      </div>
    </div>
  );
}
