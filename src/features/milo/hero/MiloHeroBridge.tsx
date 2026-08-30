"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import { miloFrame, useMiloStore } from "@/components/milo/useMiloStore";
import { MILO } from "@/components/milo/milo.config";
import type { MiloState } from "@/components/milo/milo.types";
import type { MiloHeroInput } from "@/features/hero-visual/hero-visual.types";
import { useMiloHeroStore } from "./hero-store";
import { measureHeroGrid } from "./useMiloHeroMetrics";

/**
 * Ponte Hero → Milo. Não cria ScrollTrigger: lê o `progress` do trigger
 * pinado do BuildHero (a fonte oficial) a cada tick do GSAP e deriva TUDO
 * dele — estado narrativo, presença, energia, partículas, opacidade da
 * réplica da grid, curvatura e dissolve — em writes imperativos em
 * `miloFrame` (nada de React por frame). Como cada valor é função do
 * progresso, rolar para trás reconstrói o Milo exatamente ao contrário.
 *
 * O BRAÇO só se move na transformação tipográfica: o gesto de puxar a
 * headline (typeAnticipate → typeSettle, labels da própria timeline). A
 * puxada é sincronizada ao eixo `wdth` REAL — lido do `--wdth` que o tween
 * escreve inline no <h1> (pullProgress === fontWidthProgress). A mão segue a
 * extremidade direita da linha primária, medida por um Range sobre o texto
 * (uma leitura de layout por frame, só no trecho ativo).
 *
 * Boot: `mw:visual-assemble` libera a presença (gate), `mw:headline` levanta
 * a cabeça. Sair do Hero pausa o loop (store de baixa frequência).
 */
export const heroFrame = {
  gridOpacity: 0,
  bendMul: 0.3,
  scan: 0,
  bootGate: 0.35,
  headUp: 0,
  /** gesto da headline (0..1 normalizado entre typeAnticipate e typeSettle) */
  gesture: 0,
  /** progresso real do eixo wdth (62 % → 125 %) */
  fontWidth: 0,
  contact: 0,
  /** ajustes (debug): deslocamento da mão em relação à extremidade (px) e antecipação do ombro */
  pullOffsetX: 14,
  pullOffsetY: -10,
  shoulderAnticipation: 1,
  contactStrength: 1,
};

/** Labels padrão (as da timeline do BuildHero têm prioridade quando existem). */
const LABELS = { typeAnticipate: 0.24, typeReach: 0.3, typeContact: 0.38, typePullEnd: 0.56, typeRelease: 0.6, typeSettle: 0.66 };
type Labels = typeof LABELS;

const STAGE_BOUNDS = [0.16, 0.32, 0.5, 0.66, 0.84, 1.0001];
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type HeadlinePullTarget = { x: number; y: number; active: boolean; contact: number; pull: number; release: number };
export const pullTarget: HeadlinePullTarget = { x: 0.5, y: 0.5, active: false, contact: 0, pull: 0, release: 0 };

export function deriveHeroInput(progress: number, pointer: { x: number; y: number }, headlineReleased: boolean, heroVisible: boolean): MiloHeroInput {
  const p = Math.min(1, Math.max(0, progress));
  let stage = 0;
  while (stage < 5 && p >= STAGE_BOUNDS[stage]) stage++;
  const lo = stage === 0 ? 0 : STAGE_BOUNDS[stage - 1];
  const hi = STAGE_BOUNDS[stage];
  const stageProgress = Math.min(1, Math.max(0, (p - lo) / (hi - lo)));
  const scanProgress = p < 0.68 ? 0 : p < 0.78 ? (p - 0.68) / 0.1 : p < 0.86 ? 1 - (p - 0.8) / 0.06 : 0;
  return { stage: stage as MiloHeroInput["stage"], progress: p, stageProgress, scanProgress: Math.max(0, Math.min(1, scanProgress)), pointer, headlineReleased, heroVisible };
}

/**
 * Progresso → corpo (sem braço). Puro e reversível.
 * `fontWidth` = progresso real do wdth (0..1) — a puxada é exatamente ele.
 */
export function driveMilo(input: MiloHeroInput, L: Labels, fontWidth: number) {
  const f = miloFrame;
  const p = input.progress;
  const gate = heroFrame.bootGate;
  const reveal = lerp(0.55, 1, smooth(0.16, 0.32, p));
  const dissolve = smooth(0.92, 1, p);
  f.visibility = reveal * gate * (1 - dissolve);
  f.observe = (0.25 + 0.75 * smooth(0.16, 0.32, p) + heroFrame.headUp * 0.3) * (1 - dissolve);
  f.particles = lerp(0.3, 0.55, smooth(0.16, 0.32, p)) + 0.2 * smooth(0.66, 0.84, p) + 0.35 * dissolve;
  f.scroll = p;
  f.pulse = 0;
  heroFrame.gridOpacity = smooth(0.2, 0.32, p) * (1 - smooth(0.84, 0.94, p));
  heroFrame.bendMul = lerp(0.3, 1, smooth(0.16, 0.36, p));
  heroFrame.scan = input.scanProgress;

  // ---- gesto da headline: antecipação → alcance → contato/puxada → liberação → retorno
  const g0 = L.typeAnticipate, gC = L.typeContact, gE = L.typePullEnd, gR = L.typeRelease, gS = L.typeSettle;
  const gesture = p <= g0 || p >= gS ? 0 : (p - g0) / (gS - g0);
  heroFrame.gesture = gesture;
  // peso do braço (IK): sobe da antecipação ao contato, segura na puxada, volta na liberação
  const reachW = p < gC ? smooth(g0, gC, p) : p < gE ? 1 : 1 - smooth(gE, gS, p);
  f.touch = reachW * (1 - dissolve);
  // a puxada É o wdth (pullProgress === fontWidthProgress); o contato vale enquanto a mão segura
  const holding = p >= gC - 0.005 && p <= gR ? 1 : 0;
  const contact = holding * smooth(gC - 0.02, gC + 0.01, p) * (1 - smooth(gE, gR, p)) * heroFrame.contactStrength;
  heroFrame.fontWidth = fontWidth;
  heroFrame.contact = contact;
  f.contact = contact;
  f.attention = smooth(g0, g0 + 0.04, p) * (1 - smooth(gR, gS, p)); // cabeça olha o ponto de contato
  pullTarget.active = reachW > 0.001;
  pullTarget.contact = contact;
  pullTarget.pull = fontWidth;
  pullTarget.release = smooth(gE, gS, p);
  // energia: baixa no início, tick no contato, sobe no scan (sem mover o braço), cai no dissolve
  f.energy = Math.max(0.08, lerp(0.12, 0.38, smooth(0.16, 0.32, p)) + 0.18 * contact + 0.3 * smooth(0.66, 0.84, p) + 0.2 * smooth(0.84, 0.9, p) - 0.7 * dissolve);
}

function stateFor(input: MiloHeroInput, L: Labels): Exclude<MiloState, "transition"> {
  const p = input.progress;
  if (p >= 0.84) return "dissolve";
  if (p >= L.typeAnticipate && p < L.typeSettle) return "touch";
  if (input.stage === 4) return "full";
  if (input.stage >= 1) return "observe";
  return "dormant";
}

/** Extremidade direita da linha primária da headline (px de viewport), via Range — sobrevive ao SplitText. */
function makeAnchorReader(hero: HTMLElement) {
  const line = hero.querySelector<HTMLElement>("[data-headline-line=primary]");
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
      return Number.isFinite(v) ? Math.min(1, Math.max(0, (v - 62) / 63)) : 0;
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
    let st: ScrollTrigger | null = null;
    let labels: Labels = { ...LABELS };
    let lastState: MiloState | null = null;
    let lastVisible: boolean | null = null;
    const heroStore = useMiloHeroStore.getState();
    useMiloStore.getState().setTarget([...MILO.touch.anchor] as [number, number, number]);
    // fora do trecho ativo a âncora é medida só em refresh/resize
    const remeasure = () => {
      if (anchor) {
        const a = anchor.read();
        if (a.ok) {
          miloFrame.panel.x = (a.x + heroFrame.pullOffsetX) / window.innerWidth;
          miloFrame.panel.y = 1 - (a.y + heroFrame.pullOffsetY) / window.innerHeight;
        }
      }
    };
    const onRefresh = () => remeasure();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("resize", remeasure);

    const tick = () => {
      if (!st) {
        st = ScrollTrigger.getAll().find((t) => t.trigger === hero && !!t.vars.pin) ?? null;
        if (st) {
          const tl = st.animation as gsap.core.Timeline | undefined;
          const lb = tl?.labels ?? {};
          const dur = tl?.duration() || 1;
          for (const k of Object.keys(LABELS) as (keyof Labels)[]) if (typeof lb[k] === "number") labels[k] = lb[k] / dur;
          remeasure();
        }
      }
      const progress = st ? st.progress : 0;
      const r = hero.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < window.innerHeight;
      const input = deriveHeroInput(progress, miloFrame.pointer, root.dataset.headline === "1", visible);
      const fontWidth = anchor ? anchor.fontWidth() : 0;
      driveMilo(input, labels, fontWidth);
      miloFrame.anticipation = heroFrame.shoulderAnticipation;
      // trecho ativo: a extremidade da frase se move com o wdth — uma leitura de layout por frame
      if (pullTarget.active && anchor && document.visibilityState === "visible") {
        const a = anchor.read();
        if (a.ok) {
          miloFrame.panel.x = (a.x + heroFrame.pullOffsetX) / window.innerWidth;
          miloFrame.panel.y = 1 - (a.y + heroFrame.pullOffsetY) / window.innerHeight;
        }
      }
      pullTarget.x = miloFrame.panel.x;
      pullTarget.y = miloFrame.panel.y;

      const state = stateFor(input, labels);
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
      (window as unknown as { __miloHero: unknown }).__miloHero = { frame: miloFrame, store: useMiloStore, heroStore: useMiloHeroStore, heroFrame, pullTarget, labels: () => labels };
      debugCleanup = mountHeroDebug(hero);
    }
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", remeasure);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("mw:visual-assemble", onAssemble);
      window.removeEventListener("mw:headline", onHeadline);
      debugCleanup?.();
    };
  }, []);
  return null;
}

/**
 * Debug do gesto (só desenvolvimento, tecla H, começa desligado): leitura de
 * progresso/wdth/contato, âncora DOM, alvo convertido, linha ombro→mão e
 * sliders de pullOffset/shoulderAnticipation/contactStrength. DOM imperativo,
 * fora do React.
 */
function mountHeroDebug(hero: HTMLElement) {
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:70;background:#F2F0EA;border:1px solid #111;padding:8px 10px;font:11px/1.5 ui-monospace,monospace;color:#111;display:none;pointer-events:auto;width:260px";
  box.innerHTML = `<div><b>MILO / HERO GESTURE [H]</b></div><pre id="mh-read" style="margin:6px 0;white-space:pre-wrap"></pre>
    <label><input type="checkbox" id="mh-anchor"> headlineAnchorVisible</label><br>
    <label><input type="checkbox" id="mh-target"> armIkTargetVisible</label><br>
    <label>pullOffset x <input id="mh-ox" type="range" min="-40" max="60" step="1" value="${heroFrame.pullOffsetX}"></label><br>
    <label>pullOffset y <input id="mh-oy" type="range" min="-40" max="40" step="1" value="${heroFrame.pullOffsetY}"></label><br>
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
      read.textContent = `headlineGestureProgress ${heroFrame.gesture.toFixed(3)}\nfontWidth (wdth) ${heroFrame.fontWidth.toFixed(3)}\ncontact ${heroFrame.contact.toFixed(2)}  touch ${f.touch.toFixed(2)}\nstate ${useMiloStore.getState().state}\nanchor uv ${f.panel.x.toFixed(3)} ${f.panel.y.toFixed(3)}\nhand uv ${f.hand.x.toFixed(3)} ${f.hand.y.toFixed(3)}`;
      const ax = f.panel.x * innerWidth, ay = (1 - f.panel.y) * innerHeight;
      const hx = f.hand.x * innerWidth, hy = (1 - f.hand.y) * innerHeight;
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
  void hero;
  return () => {
    gsap.ticker.remove(loop);
    window.removeEventListener("keydown", key);
    box.remove();
    dotA.remove();
    dotT.remove();
    line.remove();
  };
}
