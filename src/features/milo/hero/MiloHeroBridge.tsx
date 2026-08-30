"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import { miloFrame, useMiloStore } from "@/components/milo/useMiloStore";
import { MILO } from "@/components/milo/milo.config";
import type { MiloState } from "@/components/milo/milo.types";
import type { MiloHeroInput } from "@/features/hero-visual/hero-visual.types";
import { MILO_HERO } from "@/features/hero-visual/hero-visual.config";
import { HEADLINE_AXES } from "@/sections/home/build-hero";
import { heroPlacement, useMiloHeroStore } from "./hero-store";
import { measureHeroGrid } from "./useMiloHeroMetrics";

/**
 * Ponte Hero → Milo. Não cria ScrollTrigger: lê o `progress` do trigger
 * pinado do BuildHero (a fonte oficial) a cada tick do GSAP e deriva TUDO
 * dele em writes imperativos em `miloFrame`/`heroPlacement` (nada de React
 * por frame). Como cada valor é função do progresso, rolar para trás
 * reconstrói a cena exatamente ao contrário.
 *
 * A cena (labels lidas da própria timeline do BuildHero):
 *   walkStart → walkEnd   o corpo entra pela direita (x = ease do progresso) e
 *                         as pernas ciclam pela DISTÂNCIA (fase = deslocamento/passo)
 *   armStart  → contact   antecipação; o braço desce até a extremidade de "PESSOAS."
 *   contact   → pullEnd   a mão segura a extremidade (medida no DOM por frame)
 *                         e o corpo a acompanha andando de ré — mão, palavra e
 *                         corpo derivam do mesmo --wdth que o tween escreve
 *   pullEnd   → impactEnd solta: recuo, impulso na curvatura da grid, presença sólida
 */
export const heroFrame = {
  gridOpacity: 0,
  bendMul: 0.3,
  scan: 0,
  bootGate: 0.35,
  headUp: 0,
  /** progresso real do eixo wdth (62 % → 125 %) */
  fontWidth: 0,
  contact: 0,
  /** 0..1 dentro da caminhada de entrada e do arrasto */
  walk: 0,
  pull: 0,
  /** ajustes (debug): deslocamento da mão em relação à extremidade (px) e distância corpo↔palavra (mundo) */
  pullOffsetX: -22,
  pullOffsetY: 24,
  holdOffset: MILO_HERO.holdOffset,
  shoulderAnticipation: 1,
  contactStrength: 1,
};

/** Labels padrão (as da timeline do BuildHero têm prioridade quando existem). */
const LABELS = { walkStart: 0.15, walkEnd: 0.45, armStart: 0.56, contact: 0.6, pullEnd: 0.76, settle: 0.78, outro: 0.9 };
type Labels = typeof LABELS;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const HALF_H = MILO.camera.position[2] * Math.tan((MILO.camera.fov * Math.PI) / 360);

export type HeadlinePullTarget = { x: number; y: number; active: boolean; contact: number; pull: number; release: number };
export const pullTarget: HeadlinePullTarget = { x: 0.5, y: 0.5, active: false, contact: 0, pull: 0, release: 0 };

export function deriveHeroInput(progress: number, pointer: { x: number; y: number }, headlineReleased: boolean, heroVisible: boolean, L: Labels = LABELS): MiloHeroInput {
  const p = Math.min(1, Math.max(0, progress));
  const bounds = [L.walkStart, L.walkEnd, L.armStart, L.settle, L.outro, 1.0001];
  let stage = 0;
  while (stage < 5 && p >= bounds[stage]) stage++;
  const lo = stage === 0 ? 0 : bounds[stage - 1];
  const hi = bounds[stage];
  const stageProgress = Math.min(1, Math.max(0, (p - lo) / (hi - lo)));
  const scanProgress = 0;
  return { stage: stage as MiloHeroInput["stage"], progress: p, stageProgress, scanProgress: Math.max(0, Math.min(1, scanProgress)), pointer, headlineReleased, heroVisible };
}

/** Geometria da cena em unidades do mundo (plano z = 0; a câmera olha (0,1,0) sem inclinação → x/y lineares com a tela). */
type SceneGeom = {
  halfW: number;
  halfH: number;
  scale: number;
  /** x da extremidade condensada da palavra (cache: só é medida com wdth = 0) */
  anchorX0: number;
  /** x atual da extremidade (medida por frame no trecho ativo) */
  anchorX: number;
  anchorY: number;
  anchorOk: boolean;
  /** passo (mundo) ajustado para a caminhada de entrada fechar em ciclos inteiros */
  stride: number;
  lastX: number;
  /** caixa do canvas (= section pinada) em px de CSS */
  W: number;
  H: number;
};

export const sceneGeom: SceneGeom = { halfW: 2.4, halfH: HALF_H, scale: MILO_HERO.scale, anchorX0: -0.6, anchorX: -0.6, anchorY: 0.2, anchorOk: false, stride: MILO_HERO.stride, lastX: 6, W: 1920, H: 1080 };

const pxToWorldX = (px: number, g: SceneGeom) => (px / g.W) * 2 * g.halfW - g.halfW;
const pxToWorldY = (px: number, g: SceneGeom) => MILO.camera.target[1] + (1 - (px / g.H) * 2) * g.halfH;

/**
 * Progresso → cena inteira (corpo, pernas, braço, contato, grid). Puro no
 * progresso e nas medidas do DOM; a única memória é a velocidade (derivada
 * numérica, só para a inclinação do tronco e o peso da marcha).
 */
export function driveMilo(input: MiloHeroInput, L: Labels, fontWidth: number, g: SceneGeom, dt: number) {
  const f = miloFrame;
  const p = input.progress;
  const gate = heroFrame.bootGate;
  const S = g.scale;
  const small = window.innerWidth < 720;
  const walkIn = smooth(L.walkStart, L.walkEnd, p); // ease in/out: acelera e desacelera
  const settleStep = smooth(L.walkEnd, L.walkEnd + 0.05, p); // fecha o último passo, firma os pés
  // ombro → cotovelo → mão: o alcance sobe do armStart ao contato (a mola do IK dá a cadeia)
  const reach = smooth(L.armStart, L.contact, p);
  // segurando: do contato ao assentamento; solta devagar depois (pose final natural)
  const holding = p >= L.contact - 0.004 ? 1 - smooth(L.settle, L.settle + 0.08, p) : 0;
  const settled = smooth(L.pullEnd, L.settle + 0.06, p);
  heroFrame.walk = walkIn;
  heroFrame.pull = fontWidth;
  heroFrame.fontWidth = fontWidth;

  // ---- posição do corpo: entra, para junto da extremidade (colunas 8–10) e FICA — a frase vem até ele
  const xOff = g.halfW + (small ? MILO_HERO.offscreenPadMobile : MILO_HERO.offscreenPad) * S;
  const hold = (small ? MILO_HERO.holdOffsetMobile : heroFrame.holdOffset) * S;
  const stopX = Math.min(g.halfW - (small ? 0.28 : 0.55) * S, g.anchorX0 + hold); // inteiro na tela (mobile: só tronco/cabeça/braço)
  let x: number;
  if (p < L.walkStart) x = xOff;
  else if (p < L.walkEnd) x = lerp(xOff, stopX, walkIn);
  else x = stopX + 0.04 * S * reach * (1 - settled) - 0.03 * S * holding * fontWidth; // peso vai à frente no alcance, absorve na puxada
  heroPlacement.x = x;
  heroPlacement.y = small ? MILO_HERO.yMobile : MILO_HERO.y;
  heroPlacement.scale = S;
  heroPlacement.stride = g.stride;
  // corpo: de perfil andando; ao parar gira cabeça/tronco para a frase (três quartos)
  const turn = smooth(L.walkEnd - 0.06, L.armStart, p);
  heroPlacement.yaw = lerp(MILO_HERO.yawWalk, MILO_HERO.yawRest, turn) - 0.12 * holding * fontWidth;

  // ---- pernas: fase pela distância percorrida (assinada → andar de ré inverte o ciclo)
  f.walk.phase = (xOff - x) / g.stride;
  const v = dt > 0 ? (g.lastX - x) / dt : 0; // + = andando para a esquerda (frente)
  g.lastX = x;
  const vN = Math.max(-1, Math.min(1, v / (2.2 * S)));
  f.walk.speed += (vN - f.walk.speed) * Math.min(1, dt * 10);
  const moving = Math.min(1, Math.abs(f.walk.speed) * 4);
  const inWalk = p >= L.walkStart && p < L.walkEnd + 0.05 ? 1 : 0;
  // a marcha vale 100 % da entrada até o último passo (a fase é distância: devagar = passos
  // lentos, nunca pose congelada); só o fechamento do passo mistura de volta ao repouso
  const targetAmount = inWalk * smooth(L.walkStart, L.walkStart + 0.02, p) * (1 - settleStep);
  f.walk.amount += (targetAmount - f.walk.amount) * Math.min(1, dt * 10);

  // ---- braço: parado até armStart; alcança; segura enquanto a frase se move; conclui e volta
  const armW = p < L.contact ? reach : holding;
  f.touch = armW;
  const contact = (p >= L.contact - 0.004 ? 1 : 0) * smooth(L.contact - 0.01, L.contact + 0.006, p) * (1 - smooth(L.pullEnd, L.settle + 0.02, p)) * heroFrame.contactStrength;
  heroFrame.contact = contact;
  f.contact = contact;
  f.attention = smooth(L.walkEnd, L.walkEnd + 0.06, p) * (1 - smooth(L.outro, L.outro + 0.05, p));
  pullTarget.active = armW > 0.001;
  pullTarget.contact = contact;
  pullTarget.pull = fontWidth;
  pullTarget.release = settled;

  // ---- tronco: peso à frente para alcançar; absorve a força no contato; recua curto ao assentar
  f.lean = 0.12 * reach * (1 - settled) - 0.06 * holding * fontWidth + 0.05 * f.walk.speed;
  f.recoil = Math.sin(Math.PI * smooth(L.pullEnd, L.settle + 0.04, p)) * 0.8;
  f.solid = settled;
  // refração momentânea + distorção localizada no ponto de força (cai com o assentamento)
  const force = contact * (1 - 0.6 * settled);
  f.params.interactionDistortion = MILO.shader.interactionDistortion * (1 + 1.2 * force);
  f.params.bodyDensity = MILO.shader.bodyDensity * (1 + 0.45 * settled);
  f.params.internalShadow = MILO.shader.internalShadow * (1 + 0.3 * settled);

  // ---- presença, energia, grid
  f.visibility = smooth(L.walkStart - 0.005, L.walkStart + 0.02, p) * gate; // nunca < 1 depois de entrar: uVisibility < 1 dissolve as pernas primeiro
  f.observe = (0.35 + 0.45 * turn + heroFrame.headUp * 0.3) * (1 - 0.5 * inWalk * moving);
  // partículas: concentradas nas articulações; ganham energia no contato e perdem ao assentar
  f.particles = lerp(0.22, 0.4, walkIn) + 0.35 * contact * (1 - settled) - 0.1 * settled;
  f.scroll = p;
  f.pulse = 0;
  heroFrame.gridOpacity = smooth(L.walkStart, L.walkStart + 0.12, p);
  // grid: comprime/dobra no contato e guarda uma pequena memória da deformação depois
  heroFrame.bendMul = lerp(0.5, 1, smooth(L.walkStart, L.walkStart + 0.1, p)) + 0.6 * Math.sin(Math.PI * smooth(L.contact - 0.01, L.contact + 0.08, p)) + 0.12 * settled;
  heroFrame.scan = 0;
  f.energy = Math.max(0.08, lerp(0.14, 0.32, walkIn) + 0.3 * contact - 0.08 * settled);
}

function stateFor(p: number, L: Labels): Exclude<MiloState, "transition"> {
  if (p >= L.settle) return "full";
  if (p >= L.armStart) return "touch";
  if (p >= L.walkStart) return "observe";
  return "dormant";
}

/** Extremidade direita da última palavra da headline ("PESSOAS."), em px de viewport, via Range — sobrevive ao SplitText. */
function makeAnchorReader(hero: HTMLElement) {
  const line = hero.querySelector<HTMLElement>("[data-headline-word=last]");
  const h1 = hero.querySelector<HTMLElement>("h1");
  if (!line || !h1) return null;
  const range = document.createRange();
  const out = { x: 0, y: 0, ok: false };
  return {
    h1,
    read() {
      range.selectNodeContents(line);
      const r = range.getBoundingClientRect();
      if (r.width > 0) {
        out.x = r.right;
        out.y = r.top + r.height * 0.5;
        out.ok = true;
      }
      return out;
    },
    /** 0..1 do eixo wdth, lido do inline style que o tween escreve (sem layout). */
    fontWidth() {
      const v = parseFloat(h1.style.getPropertyValue("--wdth"));
      return Number.isFinite(v) ? Math.min(1, Math.max(0, (v - HEADLINE_AXES.from.wdth) / (HEADLINE_AXES.to.wdth - HEADLINE_AXES.from.wdth))) : 0;
    },
  };
}

export function MiloHeroBridge() {
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    measureHeroGrid(hero);
    const grid = hero.querySelector<HTMLElement>("[data-layer=grid]");
    const ro = new ResizeObserver(() => measureHeroGrid(hero));
    ro.observe(hero);
    if (grid) ro.observe(grid);
    const onResize = () => measureHeroGrid(hero);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize).catch(() => {});

    const root = document.documentElement;
    const gateTo = (v: number, d: number) => gsap.to(heroFrame, { bootGate: v, duration: d, ease: "power2.out", overwrite: "auto" });
    if (root.classList.contains("booted") || !document.getElementById("mw-boot")) heroFrame.bootGate = 1;
    const onAssemble = () => gateTo(1, 1.6);
    const onHeadline = () => {
      gateTo(1, 0.9);
      gsap.fromTo(heroFrame, { headUp: 1 }, { headUp: 0, duration: 2.2, ease: "power2.out", overwrite: "auto" });
    };
    window.addEventListener("mw:visual-assemble", onAssemble);
    window.addEventListener("mw:headline", onHeadline);
    if (root.dataset.headline === "1") heroFrame.bootGate = 1;

    const anchor = makeAnchorReader(hero);
    const g = sceneGeom;
    let st: ScrollTrigger | null = null;
    const labels: Labels = { ...LABELS };
    let lastState: MiloState | null = null;
    let lastVisible: boolean | null = null;
    const heroStore = useMiloHeroStore.getState();
    useMiloStore.getState().setTarget([...MILO.touch.anchor] as [number, number, number]);

    const geometry = () => {
      const r = hero.getBoundingClientRect();
      g.W = Math.max(1, r.width);
      g.H = Math.max(1, r.height);
      g.halfH = HALF_H;
      g.halfW = HALF_H * (g.W / g.H);
      g.scale = window.innerWidth < 720 ? MILO_HERO.scaleMobile : MILO_HERO.scale;
    };
    /** Lê a extremidade; com wdth = 0 também atualiza o cache condensado e o passo. */
    const remeasure = (fontWidth: number) => {
      if (!anchor) return;
      const a = anchor.read();
      if (!a.ok) return;
      // px da viewport → px do canvas (a section pinada está em 0,0 durante a cena; fora dela desconta o topo)
      const box = hero.getBoundingClientRect();
      const ax = a.x - box.left + heroFrame.pullOffsetX;
      const ay = a.y - box.top + heroFrame.pullOffsetY;
      g.anchorX = pxToWorldX(ax, g);
      g.anchorY = pxToWorldY(ay, g);
      g.anchorOk = true;
      miloFrame.panel.x = ax / g.W;
      miloFrame.panel.y = 1 - ay / g.H;
      if (fontWidth < 0.01) {
        g.anchorX0 = g.anchorX;
        // a entrada fecha em ciclos inteiros: passo = distância / round(distância / passo nominal)
        const small = window.innerWidth < 720;
        const dist = g.halfW + (small ? MILO_HERO.offscreenPadMobile : MILO_HERO.offscreenPad) * g.scale - (g.anchorX0 + (small ? MILO_HERO.holdOffsetMobile : heroFrame.holdOffset) * g.scale);
        const nominal = MILO_HERO.stride * g.scale;
        g.stride = dist / Math.max(1, Math.round(dist / nominal));
      }
    };
    const onRefresh = () => {
      geometry();
      remeasure(anchor ? anchor.fontWidth() : 0);
    };
    geometry();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("resize", onRefresh);

    let lastTime = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      if (!st) {
        st = ScrollTrigger.getAll().find((t) => t.trigger === hero && !!t.vars.pin) ?? null;
        if (st) {
          const tl = st.animation as gsap.core.Timeline | undefined;
          const lb = tl?.labels ?? {};
          const dur = tl?.duration() || 1;
          for (const k of Object.keys(LABELS) as (keyof Labels)[]) if (typeof lb[k] === "number") labels[k] = lb[k] / dur;
          onRefresh();
        }
      }
      const progress = st ? st.progress : 0;
      const r = hero.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < window.innerHeight;
      const fontWidth = anchor ? anchor.fontWidth() : 0;
      // trecho ativo: a extremidade da frase se move com o wdth — uma leitura de layout por frame
      if (progress >= labels.armStart - 0.05 && document.visibilityState === "visible") remeasure(fontWidth);
      else if (!g.anchorOk) remeasure(fontWidth);
      const input = deriveHeroInput(progress, miloFrame.pointer, root.dataset.headline === "1", visible, labels);
      driveMilo(input, labels, fontWidth, g, dt);
      miloFrame.anticipation = heroFrame.shoulderAnticipation;
      pullTarget.x = miloFrame.panel.x;
      pullTarget.y = miloFrame.panel.y;

      const state = stateFor(progress, labels);
      if (state !== lastState) {
        lastState = state;
        useMiloStore.setState({ state, pending: null });
      }
      if (visible !== lastVisible) {
        lastVisible = visible;
        heroStore.setHeroVisible(visible);
      }
    };
    gsap.ticker.add(tick);
    let debugCleanup: (() => void) | null = null;
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __miloHero: unknown }).__miloHero = { frame: miloFrame, store: useMiloStore, heroStore: useMiloHeroStore, heroFrame, pullTarget, placement: heroPlacement, geom: g, labels: () => labels, st: () => st };
      debugCleanup = mountHeroDebug();
    }
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onRefresh);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("mw:visual-assemble", onAssemble);
      window.removeEventListener("mw:headline", onHeadline);
      debugCleanup?.();
    };
  }, []);
  return null;
}

/**
 * Debug da cena (só desenvolvimento, tecla H, começa desligado): leitura de
 * progresso/fase/wdth/contato, âncora DOM, alvo convertido, linha ombro→mão
 * e sliders de pullOffset/holdOffset/shoulderAnticipation/contactStrength.
 * DOM imperativo, fora do React.
 */
function mountHeroDebug() {
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:70;background:#F2F0EA;border:1px solid #111;padding:8px 10px;font:11px/1.5 ui-monospace,monospace;color:#111;display:none;pointer-events:auto;width:270px";
  box.innerHTML = `<div><b>MILO / HERO SCENE [H]</b></div><pre id="mh-read" style="margin:6px 0;white-space:pre-wrap"></pre>
    <label><input type="checkbox" id="mh-anchor"> headlineAnchorVisible</label><br>
    <label><input type="checkbox" id="mh-target"> armIkTargetVisible</label><br>
    <label>pullOffset x <input id="mh-ox" type="range" min="-40" max="60" step="1" value="${heroFrame.pullOffsetX}"></label><br>
    <label>pullOffset y <input id="mh-oy" type="range" min="-40" max="40" step="1" value="${heroFrame.pullOffsetY}"></label><br>
    <label>holdOffset <input id="mh-ho" type="range" min="0.2" max="1.2" step="0.01" value="${heroFrame.holdOffset}"></label><br>
    <label>shoulderAnticipation <input id="mh-sa" type="range" min="0" max="2" step="0.05" value="${heroFrame.shoulderAnticipation}"></label><br>
    <label>contactStrength <input id="mh-cs" type="range" min="0" max="1" step="0.05" value="${heroFrame.contactStrength}"></label>`;
  const dotA = document.createElement("div");
  dotA.style.cssText = "position:fixed;z-index:69;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#B7FF37;outline:1px solid #111;display:none;pointer-events:none";
  const dotT = document.createElement("div");
  dotT.style.cssText = "position:fixed;z-index:69;width:10px;height:10px;margin:-5px 0 0 -5px;border:1px solid #111;display:none;pointer-events:none";
  const line = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  line.setAttribute("style", "position:fixed;inset:0;width:100%;height:100%;z-index:68;pointer-events:none;display:none");
  const seg = document.createElementNS("http://www.w3.org/2000/svg", "line");
  seg.setAttribute("stroke", "#111");
  seg.setAttribute("stroke-dasharray", "4 4");
  line.appendChild(seg);
  document.body.append(box, dotA, dotT, line);
  const read = box.querySelector<HTMLElement>("#mh-read")!;
  const cbA = box.querySelector<HTMLInputElement>("#mh-anchor")!;
  const cbT = box.querySelector<HTMLInputElement>("#mh-target")!;
  const bind = (id: string, key: keyof typeof heroFrame) => box.querySelector<HTMLInputElement>(id)!.addEventListener("input", (e) => ((heroFrame as Record<string, number>)[key] = Number((e.target as HTMLInputElement).value)));
  bind("#mh-ox", "pullOffsetX");
  bind("#mh-oy", "pullOffsetY");
  bind("#mh-ho", "holdOffset");
  bind("#mh-sa", "shoulderAnticipation");
  bind("#mh-cs", "contactStrength");
  let open = false;
  const key = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== "h" || e.repeat) return;
    open = !open;
    box.style.display = open ? "block" : "none";
  };
  window.addEventListener("keydown", key);
  const loop = () => {
    if (open) {
      const f = miloFrame;
      read.textContent = `progress ${f.scroll.toFixed(3)}  walk ${heroFrame.walk.toFixed(2)}\nphase ${f.walk.phase.toFixed(2)}  amount ${f.walk.amount.toFixed(2)}  speed ${f.walk.speed.toFixed(2)}\nx ${heroPlacement.x.toFixed(2)}  yaw ${heroPlacement.yaw.toFixed(2)}\nfontWidth (wdth) ${heroFrame.fontWidth.toFixed(3)}\ncontact ${heroFrame.contact.toFixed(2)}  touch ${f.touch.toFixed(2)}  lean ${f.lean.toFixed(2)}\nstate ${useMiloStore.getState().state}\nanchor uv ${f.panel.x.toFixed(3)} ${f.panel.y.toFixed(3)}\nhand uv ${f.hand.x.toFixed(3)} ${f.hand.y.toFixed(3)}`;
      const box = document.getElementById("top")?.getBoundingClientRect() ?? { left: 0, top: 0, width: innerWidth, height: innerHeight };
      const ax = box.left + f.panel.x * box.width, ay = box.top + (1 - f.panel.y) * box.height;
      const hx = box.left + f.hand.x * box.width, hy = box.top + (1 - f.hand.y) * box.height;
      dotA.style.display = cbA.checked ? "block" : "none";
      dotA.style.transform = `translate(${ax}px, ${ay}px)`;
      dotT.style.display = cbT.checked ? "block" : "none";
      dotT.style.transform = `translate(${hx}px, ${hy}px)`;
      line.style.display = cbT.checked ? "block" : "none";
      seg.setAttribute("x1", String(hx));
      seg.setAttribute("y1", String(hy));
      seg.setAttribute("x2", String(ax));
      seg.setAttribute("y2", String(ay));
    }
  };
  gsap.ticker.add(loop);
  return () => {
    gsap.ticker.remove(loop);
    window.removeEventListener("keydown", key);
    box.remove();
    dotA.remove();
    dotT.remove();
    line.remove();
  };
}
