import { gsap, EASE } from "@/animations/gsap";

/**
 * AS LEIS DE CADA MUNDO — o que só existe com ponteiro fino e sem
 * reduced-motion: reações ao CURSOR. Tudo que depende de SCROLL mora na
 * timeline do ato (selected-work.tsx); aqui não há um único listener de
 * scroll, justamente para nenhuma propriedade ter dois donos.
 *
 * Custo: `quickTo` (um tween reaproveitado por propriedade), transforms em
 * poucos elementos, e zero leitura de layout por frame — os retângulos são
 * medidos uma vez por entrada de ponteiro.
 */
type Law = (panel: HTMLElement) => () => void;

const rectOf = (el: HTMLElement) => el.getBoundingClientRect();

/** Liga pointerenter/move/leave e devolve o cleanup — o esqueleto de toda lei. */
function pointer(panel: HTMLElement, on: { enter?: (r: DOMRect) => void; move: (x: number, y: number, r: DOMRect) => void; leave?: () => void }) {
  let r = rectOf(panel);
  const enter = () => {
    r = rectOf(panel);
    on.enter?.(r);
  };
  const move = (e: PointerEvent) => on.move(e.clientX - r.left, e.clientY - r.top, r);
  const leave = () => on.leave?.();
  panel.addEventListener("pointerenter", enter);
  panel.addEventListener("pointermove", move, { passive: true });
  panel.addEventListener("pointerleave", leave);
  return () => {
    panel.removeEventListener("pointerenter", enter);
    panel.removeEventListener("pointermove", move);
    panel.removeEventListener("pointerleave", leave);
  };
}

/** KAVITA — cartografia: cursor com coordenadas, três profundidades, drones em rota. */
const kavita: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const cursor = q<HTMLElement>("[data-map-cursor]")[0];
  const xy = q<HTMLElement>("[data-map-xy]")[0];
  const topo = q<HTMLElement>("[data-topo]")[0];
  const media = q<HTMLElement>("[data-media]")[0];
  const craft = q<HTMLElement>("[data-media-b]")[0];
  const title = q<HTMLElement>("[data-headline]")[0];
  const drones = q<SVGGElement>("[data-drone]");
  const routes = q<SVGPathElement>("[data-route]");
  if (!cursor || !topo) return () => {};
  const cx = gsap.quickTo(cursor, "x", { duration: 0.18, ease: EASE.outQuint });
  const cy = gsap.quickTo(cursor, "y", { duration: 0.18, ease: EASE.outQuint });
  // parallax em quatro profundidades: o mapa atrás anda mais que a janela, o
  // drone (o plano mais próximo) anda contra, e a tipografia quase não anda.
  // Só x/y aqui — xPercent/yPercent/scale do drone são da timeline do ato.
  const layers = [
    { el: topo, k: 16 },
    { el: media, k: -9 },
    { el: craft, k: -18 },
    { el: title, k: -3 },
  ]
    .filter((l) => l.el)
    .map(({ el, k }) => ({ x: gsap.quickTo(el, "x", { duration: 0.9, ease: EASE.outQuint }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: EASE.outQuint }), k }));

  const off = pointer(panel, {
    enter: () => gsap.to(cursor, { autoAlpha: 1, duration: 0.3 }),
    move: (px, py, r) => {
      cx(px);
      cy(py);
      xy.textContent = `X ${String(Math.round(px)).padStart(4, "0")} · Y ${String(Math.round(py)).padStart(4, "0")}`;
      const nx = px / r.width - 0.5;
      const ny = py / r.height - 0.5;
      layers.forEach((l) => {
        l.x(nx * l.k);
        l.y(ny * l.k);
      });
    },
    leave: () => {
      gsap.to(cursor, { autoAlpha: 0, duration: 0.3 });
      layers.forEach((l) => {
        l.x(0);
        l.y(0);
      });
    },
  });

  // drones percorrendo as rotas — pausados fora da viewport
  const flights = drones.map((d, i) => {
    const path = routes[i];
    if (!path) return null;
    const len = path.getTotalLength();
    const state = { t: (i * 0.4) % 1 };
    gsap.set(d, { opacity: 1 });
    return gsap.to(state, {
      t: state.t + 1,
      duration: 16 + i * 4,
      ease: "none",
      repeat: -1,
      paused: true,
      onUpdate: () => {
        const p = path.getPointAtLength((state.t % 1) * len);
        d.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      },
    });
  });
  const io = new IntersectionObserver(([e]) => flights.forEach((f) => (e.isIntersecting ? f?.play() : f?.pause())), { threshold: 0.15 });
  io.observe(panel);
  return () => {
    off();
    io.disconnect();
    flights.forEach((f) => f?.kill());
  };
};

/** TERRAL — matéria: rastro de grãos e as duas fotografias em profundidades diferentes. */
const terral: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const dots = q<HTMLElement>("[data-grain-dot]");
  const a = q<HTMLElement>("[data-media]")[0];
  const b = q<HTMLElement>("[data-media-b]")[0];
  const movers = dots.map((d, i) => ({ x: gsap.quickTo(d, "x", { duration: 0.25 + i * 0.07, ease: EASE.outQuint }), y: gsap.quickTo(d, "y", { duration: 0.25 + i * 0.07, ease: EASE.outQuint }) }));
  const depth = [
    { el: a, k: -7 },
    { el: b, k: 13 },
  ]
    .filter((l) => l.el)
    .map(({ el, k }) => ({ x: gsap.quickTo(el, "x", { duration: 1, ease: EASE.outQuint }), y: gsap.quickTo(el, "y", { duration: 1, ease: EASE.outQuint }), k }));

  const off = pointer(panel, {
    enter: () => gsap.to(dots, { opacity: 0.5, stagger: 0.02, duration: 0.4 }),
    move: (px, py, r) => {
      movers.forEach((m, i) => {
        m.x(px + Math.sin(i * 1.7) * 7);
        m.y(py + Math.cos(i * 2.1) * 7);
      });
      const nx = px / r.width - 0.5;
      const ny = py / r.height - 0.5;
      depth.forEach((l) => {
        l.x(nx * l.k);
        l.y(ny * l.k * 0.5);
      });
    },
    leave: () => {
      gsap.to(dots, { opacity: 0, duration: 0.4 });
      depth.forEach((l) => {
        l.x(0);
        l.y(0);
      });
    },
  });
  return off;
};

/** VERTEX — espaço: guias, prancha e tipografia em três planos de profundidade. */
const vertex: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const title = q<HTMLElement>("[data-headline]")[0];
  const media = q<HTMLElement>("[data-media]")[0];
  const guides = q<HTMLElement>("[data-guides]")[0];
  if (!media || !guides) return () => {};
  gsap.set(media, { transformPerspective: 1600 });
  const mediaY = gsap.quickTo(media, "rotationY", { duration: 0.9, ease: EASE.outQuint });
  const mediaX = gsap.quickTo(media, "rotationX", { duration: 0.9, ease: EASE.outQuint });
  const guideX = gsap.quickTo(guides, "x", { duration: 1.1, ease: EASE.outQuint });
  const guideY = gsap.quickTo(guides, "y", { duration: 1.1, ease: EASE.outQuint });
  const titleX = title ? gsap.quickTo(title, "x", { duration: 1.1, ease: EASE.outQuint }) : null;
  const off = pointer(panel, {
    move: (px, py, r) => {
      const nx = px / r.width - 0.5;
      const ny = py / r.height - 0.5;
      guideX(nx * 24);
      guideY(ny * 12);
      mediaY(nx * -5);
      mediaX(ny * 2.5);
      titleX?.(nx * -4);
    },
    leave: () => {
      guideX(0);
      guideY(0);
      mediaY(0);
      mediaX(0);
      titleX?.(0);
    },
  });
  return off;
};

/** AUREX — tempo: o cursor deixa fantasmas atrasados. O calibre é do scroll, não do cursor. */
const aurex: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const ghosts = q<HTMLElement>("[data-ghost]");
  if (!ghosts.length) return () => {};
  const gx = ghosts.map((g, i) => ({ x: gsap.quickTo(g, "x", { duration: 0.12 + i * 0.18, ease: "power2.out" }), y: gsap.quickTo(g, "y", { duration: 0.12 + i * 0.18, ease: "power2.out" }) }));
  return pointer(panel, {
    enter: () => gsap.to(ghosts, { opacity: (i: number) => 0.6 - i * 0.13, duration: 0.3 }),
    move: (px, py) =>
      gx.forEach((g) => {
        g.x(px);
        g.y(py);
      }),
    leave: () => gsap.to(ghosts, { opacity: 0, duration: 0.3 }),
  });
};

export const ACT_LAWS: Record<string, Law> = { "kavita-drones": kavita, terral, "atelier-vertex": vertex, "aurex-timepieces": aurex };
