import { gsap, EASE } from "@/animations/gsap";

/**
 * As LEIS de cada mundo — o que só existe com ponteiro fino e sem
 * reduced-motion: reações ao cursor e ao scroll que não cabem na
 * timeline de entrada/saída. Cada função devolve o cleanup.
 *
 * Tudo aqui é barato: quickTo (um tween reaproveitado por propriedade),
 * transforms em elementos pequenos, zero leitura de layout por frame
 * (os retângulos são medidos uma vez por entrada de ponteiro).
 */
type Law = (panel: HTMLElement) => () => void;

const rectOf = (el: HTMLElement) => el.getBoundingClientRect();

/** KAVITA — cartografia: cursor com coordenadas, profundidade mapa/mídia/tipo, drones em rota. */
const kavita: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const cursor = q<HTMLElement>("[data-map-cursor]")[0];
  const xy = q<HTMLElement>("[data-map-xy]")[0];
  const topo = q<HTMLElement>("[data-topo]")[0];
  const media = q<HTMLElement>("[data-media]")[0];
  const title = q<HTMLElement>("h2")[0];
  const drones = q<SVGGElement>("[data-drone]");
  const routes = q<SVGPathElement>("[data-route]");
  const cx = gsap.quickTo(cursor, "x", { duration: 0.18, ease: EASE.outQuint });
  const cy = gsap.quickTo(cursor, "y", { duration: 0.18, ease: EASE.outQuint });
  const layers = [
    { el: topo, k: 14 },
    { el: media, k: -8 },
    { el: title, k: -4 },
  ].map(({ el, k }) => ({ x: gsap.quickTo(el, "x", { duration: 0.9, ease: EASE.outQuint }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: EASE.outQuint }), k }));
  let r = rectOf(panel);
  const enter = () => {
    r = rectOf(panel);
    gsap.to(cursor, { autoAlpha: 1, duration: 0.3 });
  };
  const move = (e: PointerEvent) => {
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    cx(px);
    cy(py);
    xy.textContent = `X ${String(Math.round(px)).padStart(4, "0")} · Y ${String(Math.round(py)).padStart(4, "0")}`;
    const nx = px / r.width - 0.5;
    const ny = py / r.height - 0.5;
    layers.forEach((l) => {
      l.x(nx * l.k);
      l.y(ny * l.k);
    });
  };
  const leave = () => {
    gsap.to(cursor, { autoAlpha: 0, duration: 0.3 });
    layers.forEach((l) => {
      l.x(0);
      l.y(0);
    });
  };
  panel.addEventListener("pointerenter", enter);
  panel.addEventListener("pointermove", move, { passive: true });
  panel.addEventListener("pointerleave", leave);
  // drones: percorrem as rotas enquanto o painel está visível (timeline pausável)
  const flights = drones.map((d, i) => {
    const path = routes[i];
    const len = path.getTotalLength();
    const state = { t: (i * 0.33) % 1 };
    const tl = gsap.to(state, {
      t: state.t + 1,
      duration: 14 + i * 3,
      ease: "none",
      repeat: -1,
      paused: true,
      onUpdate: () => {
        const p = path.getPointAtLength((state.t % 1) * len);
        d.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      },
    });
    gsap.set(d, { opacity: 1 });
    return tl;
  });
  const io = new IntersectionObserver(([e]) => flights.forEach((f) => (e.isIntersecting ? f.play() : f.pause())), { threshold: 0.2 });
  io.observe(panel);
  return () => {
    panel.removeEventListener("pointerenter", enter);
    panel.removeEventListener("pointermove", move);
    panel.removeEventListener("pointerleave", leave);
    io.disconnect();
    flights.forEach((f) => f.kill());
  };
};

/** TERRAL — matéria: rastro de grãos e a mancha-portal que segue o cursor. */
const terral: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const dots = q<HTMLElement>("[data-grain-dot]");
  const portal = q<HTMLElement>("[data-portal]")[0];
  const media = q<HTMLElement>("[data-media]")[0];
  const movers = dots.map((d, i) => ({ x: gsap.quickTo(d, "x", { duration: 0.25 + i * 0.07, ease: EASE.outQuint }), y: gsap.quickTo(d, "y", { duration: 0.25 + i * 0.07, ease: EASE.outQuint }) }));
  let r = rectOf(panel);
  let mr = media ? rectOf(media) : r;
  const enter = () => {
    r = rectOf(panel);
    mr = media ? rectOf(media) : r;
    gsap.to(dots, { opacity: 0.55, stagger: 0.02, duration: 0.4 });
  };
  const move = (e: PointerEvent) => {
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    movers.forEach((m, i) => {
      m.x(px + Math.sin(i * 1.7) * 6);
      m.y(py + Math.cos(i * 2.1) * 6);
    });
    if (portal) {
      const inside = e.clientX >= mr.left && e.clientX <= mr.right && e.clientY >= mr.top && e.clientY <= mr.bottom;
      portal.style.setProperty("--px", `${(((e.clientX - mr.left) / mr.width) * 100).toFixed(1)}%`);
      portal.style.setProperty("--py", `${(((e.clientY - mr.top) / mr.height) * 100).toFixed(1)}%`);
      gsap.to(portal, { "--pr": inside ? "22%" : "0%", duration: inside ? 0.9 : 0.5, ease: EASE.outQuint, overwrite: "auto" });
    }
  };
  const leave = () => {
    gsap.to(dots, { opacity: 0, duration: 0.4 });
    if (portal) gsap.to(portal, { "--pr": "0%", duration: 0.6, overwrite: "auto" });
  };
  panel.addEventListener("pointerenter", enter);
  panel.addEventListener("pointermove", move, { passive: true });
  panel.addEventListener("pointerleave", leave);
  return () => {
    panel.removeEventListener("pointerenter", enter);
    panel.removeEventListener("pointermove", move);
    panel.removeEventListener("pointerleave", leave);
  };
};

/** VERTEX — espaço: mídia e guias em planos, tipografia entre 2D e 3D, porta que abre. */
const vertex: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const title = q<HTMLElement>("h2")[0];
  const mediaWrap = q<HTMLElement>("[data-media]")[0];
  const guides = q<HTMLElement>("[data-guides]")[0];
  const door = q<HTMLElement>("[data-door]")[0];
  gsap.set(title, { transformPerspective: 1200, transformOrigin: "left center" });
  gsap.set(mediaWrap, { transformPerspective: 1600 });
  const rotY = gsap.quickTo(title, "rotationY", { duration: 0.8, ease: EASE.outQuint });
  const rotX = gsap.quickTo(title, "rotationX", { duration: 0.8, ease: EASE.outQuint });
  const mediaY = gsap.quickTo(mediaWrap, "rotationY", { duration: 0.9, ease: EASE.outQuint });
  const mediaX = gsap.quickTo(mediaWrap, "rotationX", { duration: 0.9, ease: EASE.outQuint });
  const guideX = gsap.quickTo(guides, "x", { duration: 1.1, ease: EASE.outQuint });
  const guideY = gsap.quickTo(guides, "y", { duration: 1.1, ease: EASE.outQuint });
  let r = rectOf(panel);
  const enter = () => {
    r = rectOf(panel);
    if (door) gsap.to(door, { "--door": 1, duration: 1.1, ease: EASE.inOutQuart, overwrite: "auto" });
  };
  const move = (e: PointerEvent) => {
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    // três profundidades: guias (fundo) · mídia (meio) · tipografia (frente)
    guideX(nx * 26);
    guideY(ny * 14);
    mediaY(nx * -6);
    mediaX(ny * 3);
    rotY(nx * 9);
    rotX(-ny * 5);
  };
  const leave = () => {
    rotY(0);
    rotX(0);
    mediaY(0);
    mediaX(0);
    guideX(0);
    guideY(0);
    if (door) gsap.to(door, { "--door": 0, duration: 0.8, ease: EASE.inOutQuart, overwrite: "auto" });
  };
  panel.addEventListener("pointerenter", enter);
  panel.addEventListener("pointermove", move, { passive: true });
  panel.addEventListener("pointerleave", leave);
  return () => {
    panel.removeEventListener("pointerenter", enter);
    panel.removeEventListener("pointermove", move);
    panel.removeEventListener("pointerleave", leave);
  };
};

/** AUREX — tempo: cursor com atraso, anéis em velocidades opostas ao scroll, planos e letras com lag. */
const aurex: Law = (panel) => {
  const q = gsap.utils.selector(panel);
  const ghosts = q<HTMLElement>("[data-ghost]");
  const rings = q<SVGGElement>("[data-ring]");
  const planes = q<HTMLElement>("[data-plane]");
  const chars = q<HTMLElement>("[data-tchar]");
  const gx = ghosts.map((g, i) => ({ x: gsap.quickTo(g, "x", { duration: 0.12 + i * 0.16, ease: "power2.out" }), y: gsap.quickTo(g, "y", { duration: 0.12 + i * 0.16, ease: "power2.out" }) }));
  // A timeline de entrada já anima o <g data-ring>; o tempo gira os FILHOS
  // (mesma origem em 900/450) para não disputar a mesma propriedade.
  const ringRot = rings.map((g) => {
    const kids = Array.from(g.children) as SVGElement[];
    gsap.set(kids, { svgOrigin: "900 450" });
    return { set: gsap.quickTo(kids, "rotation", { duration: 0.6 + Math.abs(Number(g.dataset.speed)) * 0.6, ease: EASE.outQuint }), k: Number(g.dataset.speed) || 1 };
  });
  const planeY = planes.map((p, k) => gsap.quickTo(p, "y", { duration: 0.35 + k * 0.28, ease: EASE.outQuint }));
  const charY = chars.map((c, i) => gsap.quickTo(c, "y", { duration: 0.15 + (i % 7) * 0.06, ease: EASE.outQuint }));
  let r = rectOf(panel);
  let lastY = window.scrollY;
  const enter = () => {
    r = rectOf(panel);
    gsap.to(ghosts, { opacity: (i: number) => 0.7 - i * 0.15, duration: 0.3 });
  };
  const move = (e: PointerEvent) => {
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    gx.forEach((g) => {
      g.x(px);
      g.y(py);
    });
  };
  const leave = () => gsap.to(ghosts, { opacity: 0, duration: 0.3 });
  // o scroll "puxa o tempo": cada camada responde numa velocidade
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      ringRot.forEach((rr) => rr.set(y * 0.08 * rr.k));
      planeY.forEach((p, k) => p(gsap.utils.clamp(-40, 40, dy * (0.35 + k * 0.4))));
      charY.forEach((c, i) => c(gsap.utils.clamp(-10, 10, dy * 0.08 * ((i % 5) - 2))));
      // volta ao lugar quando o scroll para
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        planeY.forEach((p) => p(0));
        charY.forEach((c) => c(0));
      }, 140);
    });
  };
  let settle = 0;
  panel.addEventListener("pointerenter", enter);
  panel.addEventListener("pointermove", move, { passive: true });
  panel.addEventListener("pointerleave", leave);
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? window.addEventListener("scroll", onScroll, { passive: true }) : window.removeEventListener("scroll", onScroll)), { threshold: 0.05 });
  io.observe(panel);
  return () => {
    panel.removeEventListener("pointerenter", enter);
    panel.removeEventListener("pointermove", move);
    panel.removeEventListener("pointerleave", leave);
    window.removeEventListener("scroll", onScroll);
    window.clearTimeout(settle);
    cancelAnimationFrame(raf);
    io.disconnect();
  };
};

export const WORLD_LAWS: Record<string, Law> = { "kavita-drones": kavita, terral, "atelier-vertex": vertex, "aurex-timepieces": aurex };
