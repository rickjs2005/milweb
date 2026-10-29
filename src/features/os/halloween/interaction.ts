import { gsap } from "@/animations/gsap";
import { CASTLE_TOWER } from "./art/castle";

/**
 * A casa assombrada reage ao visitante. UM sistema de ponteiro coordena tudo (nada de React por quadro):
 *
 *  · lanterna — um foco de luz com bordas suaves segue o ponteiro com inércia (`gsap.quickTo`). Ela escurece
 *    o cenário (camada `.hw-dark`, gradiente radial) e revela detalhes (`.hw-lantern`: uma janela que só se
 *    move por transform, com o contrafluxo na camada interna, mostrando a versão iluminada do castelo e do
 *    cemitério, olhos escondidos e névoa). Só o cenário é tocado: a interface fica acima e sem ponteiro
 *    interceptado.
 *  · criaturas — cada uma tem a sua zona; o fantasma perto da luz se afasta e volta; os olhos do vampiro e
 *    dos fantasmas acompanham o ponteiro dentro de limites; a aranha desce quando a luz chega perto de uma
 *    teia; manter a luz sobre o castelo por ~1 s dispara uma descoberta (janelas acesas, silhueta, morcegos).
 *    Uma reação "grande" por vez, com portão global e recargas.
 *  · paralaxe — as camadas `[data-depth]` andam em sentido oposto ao do ponteiro (só desktop, sem movimento
 *    reduzido).
 *
 * Ponteiro fino (mouse): escuta a janela inteira. Toque: a zona decorativa `.hw-touchzone` conduz a lanterna
 * e um toque/segurar sobre o castelo dispara a descoberta; ela não impede rolagem nem links.
 * Movimento reduzido: a luz segue sem inércia, as criaturas respondem só com brilho (sem deslocamento) e a
 * descoberta se resume às janelas acendendo.
 * Aba oculta: os tempos pausam. Fim do evento / desmontagem: `dispose()` limpa listeners, timers e tweens.
 */
export type Reactions = { ghost(pan: number): void; spider(pan: number): void; castle(pan: number): void };
export type Options = { fine: boolean; reduced: boolean; lite: boolean; lean: boolean; reactions: Reactions };
export type Controller = { setBusy(b: boolean): void; dispose(): void };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const now = () => performance.now();

type Ghost = { el: HTMLElement; gr: HTMLElement; svg: SVGElement | null; cd: number; state: "idle" | "flee"; back: gsap.core.Tween | null; cx: number; cy: number; h: number };
type Drop = { el: HTMLElement; dr: HTMLElement; web: HTMLElement | null; cd: number; busy: boolean; zx: number; zy: number; zr: number };
type Eye = { el: HTMLElement; qx: (v: number) => void; qy: (v: number) => void; cx: number; cy: number; units: number; range: number; lx: number; ly: number };

export function createInteractions(root: HTMLElement, o: Options): Controller {
  const $ = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const dark = root.querySelector<HTMLElement>(".hw-dark");
  const lantern = root.querySelector<HTMLElement>(".hw-lantern");
  const lanternIn = root.querySelector<HTMLElement>(".hw-lantern__in");
  const zone = root.querySelector<HTMLElement>(".hw-touchzone");
  const castleEl = root.querySelector<HTMLElement>(".hw-l .hw-castle");
  const layers = $<HTMLElement>("[data-depth]");
  const bursts = $<HTMLElement>(".hw-burst");

  let rect = root.getBoundingClientRect();
  let R = 190;
  let busy = false;
  let inside = false;
  let explored = false;
  let disposed = false;
  let gate = 0; // portão global: até quando uma reação grande está em curso
  let castleCd = now() + 4000;
  let castleDwell = 0;
  let castleRunning = false;
  let castleTl: gsap.core.Timeline | null = null;
  let movedDist = 0;
  let lastX = 0;
  let lastY = 0;

  const cur = { x: -999, y: -999 }; // lanterna suavizada, em coordenadas da janela (viewport)
  const level = { v: 0 }; // intensidade da lanterna (0 apagada → 1)
  const ratio = () => (busy ? 0.4 : 1);

  /* ---- medidas ----------------------------------------------------------------------------------- */
  const ghosts: Ghost[] = $<HTMLElement>(".hw-ghost").map((el) => ({ el, gr: el.querySelector<HTMLElement>(".hw-gr")!, svg: el.querySelector("svg"), cd: 0, state: "idle", back: null, cx: 0, cy: 0, h: 0 }));
  const drops: Drop[] = $<HTMLElement>(".hw-drop").map((el, i) => ({ el, dr: el.querySelector<HTMLElement>(".hw-dr")!, web: root.querySelector<HTMLElement>(i === 0 ? ".hw-web--tl" : ".hw-web--tr"), cd: now() + 3000 + i * 4000, busy: false, zx: 0, zy: 0, zr: 0 }));
  const vamp = root.querySelector<HTMLElement>(".hw-l .hw-vampire");
  const eyes: Eye[] = [];
  // Pupilas: elementos HTML pequenos por cima dos SVGs (só transform; os SVGs com filtros nunca são tocados).
  // `units` é o alcance em unidades do desenho original (convertido em px na medida).
  const mkEye = (el: HTMLElement, units: number) => {
    eyes.push({ el, qx: gsap.quickTo(el, "x", { duration: 0.28, ease: "power2.out" }), qy: gsap.quickTo(el, "y", { duration: 0.28, ease: "power2.out" }), cx: 0, cy: 0, units, range: units, lx: 0, ly: 0 });
  };
  if (!o.reduced) {
    $<HTMLElement>(".hw-l .hw-vp").forEach((el) => mkEye(el, 2.6));
    $<HTMLElement>(".hw-l .hw-gp").forEach((el) => mkEye(el, 3.2));
  }

  function measure() {
    rect = root.getBoundingClientRect();
    R = o.lite ? clamp(rect.width * 0.4, 130, 210) : clamp(rect.height * 0.26, 150, 280);
    dark?.style.setProperty("--lr", `${R}px`);
    if (lantern) {
      lantern.style.width = lantern.style.height = `${R * 2}px`;
      if (lanternIn) {
        lanternIn.style.width = `${rect.width}px`;
        lanternIn.style.height = `${rect.height}px`;
      }
    }
    for (const g of ghosts) {
      const r = g.el.getBoundingClientRect();
      g.cx = r.left + r.width / 2;
      g.cy = r.top + r.height / 2;
      g.h = r.height;
    }
    for (const d of drops) {
      const w = d.web?.getBoundingClientRect();
      if (w) {
        const tl = d.web!.classList.contains("hw-web--tl");
        d.zx = tl ? w.left + w.width * 0.15 : w.right - w.width * 0.15;
        d.zy = w.top + w.height * 0.15;
        d.zr = Math.max(w.width * (tl ? 1.7 : 1.15), 110);
      }
    }
    for (const e of eyes) {
      const host = e.el.closest(".hw-vampire, .hw-ghost");
      const sock = e.el.parentElement?.getBoundingClientRect();
      const hr = host?.getBoundingClientRect();
      if (!sock || !hr) continue;
      e.cx = sock.left + sock.width / 2;
      e.cy = sock.top + sock.height / 2;
      e.range = e.units * (hr.width / (host!.classList.contains("hw-vampire") ? 300 : 140));
    }
  }

  /* ---- aplicação visual (uma vez por quadro, só quando algo mudou) ---------------------------------- */
  let dirty = false;
  let ticking = false;
  let idleFrames = 0;
  const frame = () => {
    if (disposed) return;
    if (dirty) {
      dirty = false;
      idleFrames = 0;
      const x = cur.x - rect.left;
      const y = cur.y - rect.top;
      if (dark && lantern && lanternIn) {
        dark.style.setProperty("--lx", `${x}px`);
        dark.style.setProperty("--ly", `${y}px`);
        dark.style.opacity = String(level.v * (busy ? 0.5 : 1));
        lantern.style.opacity = String(level.v);
        lantern.style.transform = `translate3d(${x - R}px,${y - R}px,0)`;
        lanternIn.style.transform = `translate3d(${R - x}px,${R - y}px,0)`;
      }
    } else if (++idleFrames > 40) {
      ticking = false;
      gsap.ticker.remove(frame);
    }
  };
  const mark = () => {
    dirty = true;
    if (!ticking) {
      ticking = true;
      gsap.ticker.add(frame);
    }
  };
  const qx = gsap.quickTo(cur, "x", { duration: 0.34, ease: "power3.out", onUpdate: mark });
  const qy = gsap.quickTo(cur, "y", { duration: 0.34, ease: "power3.out", onUpdate: mark });
  // movimento reduzido: a luz segue o ponteiro sem inércia (quickTo com duração 0 não chama onUpdate)
  const setPos = (x: number, y: number) => {
    if (o.reduced) {
      cur.x = x;
      cur.y = y;
      mark();
    } else {
      qx(x);
      qy(y);
    }
  };
  const fade = (to: number) => gsap.to(level, { v: to * ratio(), duration: to ? 0.55 : 0.7, ease: "power2.out", onUpdate: mark, overwrite: true });

  /* ---- paralaxe e olhos (junto da lanterna: um só listener) ------------------------------------------- */
  const movers = o.fine && !o.reduced && !o.lite && !o.lean ? layers.map((el) => ({ x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }), d: Number(el.dataset.depth) || 0 })) : [];
  let rafMove = 0;
  let px = 0;
  let py = 0;
  const onMoveFrame = () => {
    rafMove = 0;
    const nx = (px / window.innerWidth) * 2 - 1;
    const ny = (py / window.innerHeight) * 2 - 1;
    for (const m of movers) {
      m.x(-nx * 11 * m.d);
      m.y(-ny * 5.5 * m.d);
    }
    for (const e of eyes) {
      const dx = px - e.cx;
      const dy = py - e.cy;
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 280) * e.range;
      // quantiza em 0,25 px e só escreve quando muda: movimento lento do mouse quase não toca no DOM
      const tx = Math.round(((dx / dist) * k) * 4) / 4;
      const ty = Math.round(((dy / dist) * k * 0.8) * 4) / 4;
      if (tx === e.lx && ty === e.ly) continue;
      e.lx = tx;
      e.ly = ty;
      e.qx(tx);
      e.qy(ty);
    }
  };

  /* ---- entrada do ponteiro ------------------------------------------------------------------------------ */
  function point(x: number, y: number) {
    px = x;
    py = y;
    movedDist += Math.hypot(x - lastX, y - lastY);
    lastX = x;
    lastY = y;
    if (!inside) {
      inside = true;
      cur.x = x;
      cur.y = y; // reaparece onde o ponteiro está, sem voar da posição antiga
      measure();
      fade(1);
    }
    setPos(x, y);
    mark();
    if (!explored && movedDist > 24) {
      explored = true;
      root.dataset.explored = "1";
    }
    if (!rafMove) rafMove = requestAnimationFrame(onMoveFrame);
  }
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    point(e.clientX, e.clientY);
  };
  const leave = () => {
    if (!inside) return;
    inside = false;
    castleDwell = 0;
    fade(0);
    for (const m of movers) {
      m.x(0);
      m.y(0);
    }
  };
  const onDocLeave = (e: MouseEvent) => {
    if (!e.relatedTarget) leave();
  };

  if (o.fine) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    document.addEventListener("mouseout", onDocLeave);
    window.addEventListener("blur", leave);
  }
  // Toque: a zona decorativa conduz a luz; levantar o dedo apaga-a depois de um instante
  let touchTimer: ReturnType<typeof setTimeout> | null = null;
  const onTouch = (e: PointerEvent) => {
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
    if (touchTimer) clearTimeout(touchTimer);
    // pointerup/pointercancel chegam com coordenadas zeradas: só apagam a luz, nunca a movem
    if (e.type === "pointerup" || e.type === "pointercancel") {
      touchTimer = setTimeout(leave, 1400);
      return;
    }
    point(e.clientX, e.clientY);
    if (e.type === "pointerdown") castleDwell = castleDwell || now() - 500; // um toque sobre o castelo basta
  };
  if (zone) for (const t of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) zone.addEventListener(t, onTouch as EventListener);

  /* ---- criaturas -------------------------------------------------------------------------------------------- */
  const panOf = (x: number) => clamp((x / window.innerWidth) * 2 - 1, -0.85, 0.85);

  function flee(g: Ghost, lx: number, ly: number) {
    g.state = "flee";
    gate = now() + 900;
    if (o.reduced) {
      // sem deslocamento: só o brilho responde
      if (g.svg) gsap.fromTo(g.svg, { opacity: 0.55 }, { opacity: 1, duration: 1.1, ease: "power2.out" });
      g.cd = now() + 3500;
      g.state = "idle";
      o.reactions.ghost(panOf(g.cx));
      return;
    }
    const ang = Math.atan2(g.cy - ly, g.cx - lx);
    const dist = rand(46, 80);
    const tx = Math.cos(ang) * dist + rand(-14, 14);
    const ty = Math.sin(ang) * dist * 0.6 - rand(8, 26);
    gsap.to(g.gr, { x: tx, y: ty, rotation: rand(-10, 10), duration: 0.6, ease: "power3.out", overwrite: true });
    if (g.svg) gsap.to(g.svg, { opacity: 0.5, duration: 0.35, overwrite: true });
    o.reactions.ghost(panOf(g.cx));
    g.back?.kill();
    g.back = gsap.delayedCall(rand(1.7, 2.5), () => {
      gsap.to(g.gr, { x: 0, y: 0, rotation: 0, duration: 1.5, ease: "power2.inOut", overwrite: true });
      if (g.svg) gsap.to(g.svg, { opacity: 1, duration: 1.1, overwrite: true });
      g.state = "idle";
      g.cd = now() + 3500;
    });
  }

  function dropSpider(d: Drop) {
    d.busy = true;
    gate = now() + 700;
    o.reactions.spider(panOf(d.zx));
    if (o.reduced) {
      d.busy = false;
      d.cd = now() + 9000;
      return;
    }
    const down = Math.min(window.innerHeight * 0.17, 170);
    const dir = d.zx > window.innerWidth / 2 ? -1 : 1;
    gsap.set(d.dr, { transformOrigin: "50% 0" });
    gsap
      .timeline({ onComplete: () => ((d.busy = false), (d.cd = now() + rand(8500, 11500))) })
      .to(d.dr, { y: down, duration: 0.4, ease: "power3.out" })
      .to(d.dr, { rotation: dir * 7, duration: 0.22, ease: "power1.out" }, 0)
      .to(d.dr, { rotation: 0, duration: 1.7, ease: "elastic.out(1,.32)" }, 0.22)
      .to(d.dr, { y: 0, duration: 1.15, ease: "power2.inOut" }, "+=0.7");
  }

  function castleDiscovery() {
    if (!castleEl || castleRunning) return;
    castleRunning = true;
    gate = now() + 6200;
    root.dataset.event = "castle";
    const cr = castleEl.getBoundingClientRect();
    o.reactions.castle(panOf(cr.left + cr.width * CASTLE_TOWER.x));
    const order = [11, 5, 6, 9, 10, 7, 8, 2, 1, 3, 4, 0, 12, "rose"].map(String);
    const winsOf = (k: string) => $<SVGElement>(`.hw-win[data-win="${k}"]`);
    const figs = $<SVGElement>(".hw-figure");
    const tl = gsap.timeline({
      onComplete: () => {
        root.removeAttribute("data-event");
        $<SVGElement>(".hw-win.hw-lit").forEach((w) => w.classList.remove("hw-lit"));
        castleRunning = false;
        castleDwell = 0;
        castleCd = now() + rand(22000, 30000);
      },
    });
    castleTl = tl;
    order.forEach((k, i) => tl.call(() => winsOf(k).forEach((w) => w.classList.add("hw-lit")), undefined, i * 0.16));
    if (!o.reduced) {
      figs.forEach((f) => tl.to(f, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.8).to(f, { opacity: 0, duration: 0.7, ease: "power1.in" }, 2.7));
      // morcegos saem da torre
      const ox = cr.left + cr.width * CASTLE_TOWER.x - rect.left;
      const oy = cr.top + cr.height * CASTLE_TOWER.y - rect.top;
      bursts.forEach((b, i) => {
        const side = i % 2 ? 1 : -1;
        const tx = ox + side * rand(160, 520);
        const ty = oy - rand(120, 360);
        tl.set(b, { x: ox, y: oy, scale: 0.4, opacity: 0, display: "block" }, 1.25 + i * 0.12);
        tl.to(b, { opacity: 1, duration: 0.2 }, 1.25 + i * 0.12);
        tl.to(b, { keyframes: [{ x: ox + (tx - ox) * 0.45, y: oy - rand(30, 90), scale: 0.8, duration: 1.0, ease: "sine.out" }, { x: tx, y: ty, scale: 1.1, duration: 1.7, ease: "sine.in" }] }, 1.35 + i * 0.12);
        tl.to(b, { opacity: 0, duration: 0.5 }, 3.0 + i * 0.12);
        tl.set(b, { display: "none" }, 3.6 + i * 0.12);
      });
    }
    tl.to({}, { duration: 0.2 }, 5);
  }

  /* ---- laço lento das criaturas (10 Hz; pausa com a aba oculta) --------------------------------------------- */
  const loop = setInterval(() => {
    if (document.hidden || !inside) return;
    const t = now();
    const lx = cur.x;
    const ly = cur.y;
    // a descoberta do castelo manda sobre o resto enquanto dura
    if (castleEl) {
      const c = castleEl.getBoundingClientRect();
      const within = lx > c.left + c.width * 0.1 && lx < c.right - c.width * 0.1 && ly > c.top + c.height * 0.12 && ly < c.bottom - c.height * 0.05;
      if (within && !busy && !castleRunning && t > castleCd) {
        if (!castleDwell) castleDwell = t;
        else if (t - castleDwell >= (o.fine ? 1000 : 500)) castleDiscovery();
      } else if (!within) castleDwell = 0;
    }
    if (busy || castleRunning || t < gate) return;
    for (const g of ghosts) {
      if (g.state !== "idle" || t < g.cd) continue;
      if (Math.hypot(lx - g.cx, ly - g.cy) < R * 0.62 + g.h * 0.2) return void flee(g, lx, ly);
    }
    for (const d of drops) {
      if (d.busy || t < d.cd || !d.zr) continue;
      if (Math.hypot(lx - d.zx, ly - d.zy) < d.zr) return void dropSpider(d);
    }
  }, 100);
  const remeasure = setInterval(() => !document.hidden && measure(), 450);
  const ro = new ResizeObserver(measure);
  ro.observe(root);
  measure();

  return {
    setBusy(b) {
      if (busy === b) return;
      busy = b;
      if (b) {
        castleTl?.progress(1);
        for (const g of ghosts) {
          g.back?.kill();
          gsap.to(g.gr, { x: 0, y: 0, rotation: 0, duration: 0.5, overwrite: true });
          g.state = "idle";
        }
      }
      if (inside) fade(1);
      mark();
    },
    dispose() {
      disposed = true;
      clearInterval(loop);
      clearInterval(remeasure);
      if (touchTimer) clearTimeout(touchTimer);
      if (rafMove) cancelAnimationFrame(rafMove);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseout", onDocLeave);
      window.removeEventListener("blur", leave);
      if (zone) for (const t of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) zone.removeEventListener(t, onTouch as EventListener);
      gsap.ticker.remove(frame);
      castleTl?.kill();
      const touched: gsap.TweenTarget[] = [cur, level, ...layers, ...bursts, ...ghosts.flatMap((g) => [g.gr, g.svg].filter(Boolean) as Element[]), ...drops.map((d) => d.dr), ...eyes.map((e) => e.el)];
      gsap.killTweensOf(touched);
      gsap.set([...layers, ...bursts, ...eyes.map((e) => e.el), ...ghosts.map((g) => g.gr), ...drops.map((d) => d.dr)], { clearProps: "all" });
      ghosts.forEach((g) => g.back?.kill());
    },
  };
}
