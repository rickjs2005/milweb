import {
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  NoToneMapping,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { gsap } from "@/animations/gsap";
import { bakeAll } from "./bake";
import { compositeMaterial } from "./composite";
import { OS_SCENE, TSUKU, VOID, type SceneWorld } from "./scene.config";
import { createTsukuyomi } from "./tsukuyomi";
import { createVoid } from "./void";
import { fullscreenGeometry, type FrameCtx, type World } from "./world";

/**
 * Motor da cena: um WebGLRenderer, os dois universos (cada um renderiza no
 * próprio alvo) e a composição na tela. UM laço: o ticker do GSAP — as
 * tweens da travessia, da reação ao app e da onda do clique e o quadro da
 * cena andam no mesmo rAF, por tempo decorrido. Nenhum estado React por
 * quadro: quem usa o motor recebe um gancho por quadro (`onFrame`) e lê o
 * estado direto.
 */
export type Trans = { from: SceneWorld; to: SceneWorld; p: number; dir: 1 | -1; ox: number; oy: number };
export type EngineInit = { canvas: HTMLCanvasElement; world: SceneWorld; lite: boolean; still?: boolean };
type Stage = { x: number; y: number; r: number };

export type Engine = {
  readonly renderer: WebGLRenderer;
  /** Os dois universos (diagnóstico: o handle de desenvolvimento liga e desliga camadas para medir o custo). */
  readonly worlds: Readonly<Record<SceneWorld, World>>;
  readonly world: SceneWorld;
  readonly trans: Readonly<Trans> | null;
  readonly frames: number;
  readonly dpr: number;
  readonly par: { x: number; y: number };
  /** Reação ao app destacado (diagnóstico): centro em px CSS, intensidade, início (tempo da cena). */
  readonly hoverState: Readonly<{ x: number; y: number; k: number; t0: number }>;
  /** Onda do clique (diagnóstico): origem em px CSS e progresso (−1 = parada). */
  readonly clickState: Readonly<{ x: number; y: number; p: number }>;
  setStage(stage: Stage, cssW: number, cssH: number): void;
  setDpr(v: number): void;
  setWorld(w: SceneWorld): void;
  /** Começa (ou muda o sentido de) uma travessia. false = nada a fazer. Origem da onda em px CSS do canvas. */
  transition(to: SceneWorld, origin: [number, number]): boolean;
  /** Termina a travessia na hora no universo de destino. */
  finish(to: SceneWorld): void;
  hover(x: number, y: number, on: boolean): void;
  click(x: number, y: number): void;
  /** Alvo da paralaxe (−1..1) ou null para a deriva automática. */
  pointer(p: { x: number; y: number } | null): void;
  start(): void;
  stop(): void;
  /**
   * Custo marginal de um quadro (ms) na resolução atual: a diferença entre `frames` quadros e um só,
   * sincronizados por readPixels — a latência fixa da leitura (no ANGLE/D3D11, alguns ms) se cancela.
   */
  measure(frames?: number, trans?: boolean): number;
  /** Um quadro sincronizado, do envio ao fim na GPU (ms) — inclui a latência fixa da leitura. */
  timeOnce(): number;
  /** Mede o próximo quadro do próprio laço (sem quadro extra): `cb` recebe o tempo, com a latência da leitura. */
  timeNextFrame(cb: (ms: number) => void): void;
  /**
   * Desenha uma vez, fora da tela, o universo que não está em cena: a geometria sobe para a GPU e o
   * driver prepara as variantes dos programas — a primeira travessia não paga isso no meio do caminho.
   */
  prime(): void;
  /**
   * Um quadro parado, sem paralaxe nem grão, para as imagens estáticas (t = 0) e para a revisão
   * (scripts/scene-still.mjs --review): `at` escolhe o instante e, com `to`, um ponto da travessia
   * (origem da onda em px CSS do canvas).
   */
  still(world: SceneWorld, at?: { t?: number; to?: SceneWorld; p?: number; ox?: number; oy?: number }): void;
  /** Compila os programas dos dois universos e da composição (em paralelo quando a GPU permite). */
  warm(): Promise<void>;
  onFrame(cb: ((e: Engine, dt: number) => void) | null): void;
  fps(ambient: number): void;
  dispose(): void;
};

export function createEngine(init: EngineInit): Engine | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas: init.canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: !!init.still });
  } catch {
    return null; // sem WebGL 2: fica a imagem
  }
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x000000, 1);
  const gl = renderer.getContext();

  const baked = bakeAll(renderer, init.lite);
  const worlds: Record<SceneWorld, World> = {
    tsukuyomi: createTsukuyomi(baked, { particles: init.lite ? TSUKU.embers.low : TSUKU.embers.high }),
    void: createVoid(baked, { particles: init.lite ? VOID.particles.low : VOID.particles.high }),
  };
  const rtOpts = { type: UnsignedByteType, format: RGBAFormat, depthBuffer: true, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter, generateMipmaps: false } as const;
  const rtA = new WebGLRenderTarget(1, 1, rtOpts);
  const rtB = new WebGLRenderTarget(1, 1, rtOpts);
  const comp = compositeMaterial(baked.noise);
  const compGeo = fullscreenGeometry();
  const compMesh = new Mesh(compGeo, comp);
  compMesh.frustumCulled = false;
  const compScene = new Scene();
  compScene.add(compMesh);
  const compCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ---- estado ----
  let world: SceneWorld = init.world;
  let tr: (Trans & { tween: gsap.core.Tween | null }) | null = null;
  let stageCss: Stage = { x: 0, y: 0, r: 300 };
  let css = { w: 1, h: 1 };
  let dpr = 1;
  let t = 0;
  let frames = 0;
  let acc = 0;
  let ambientFps: number = OS_SCENE.fps.ambient;
  let running = false;
  let disposed = false;
  let frameCb: ((e: Engine, dt: number) => void) | null = null;
  let timeCb: ((ms: number) => void) | null = null;
  const par = { x: 0, y: 0 };
  let target: { x: number; y: number } | null = null;
  const hov = { x: 0, y: 0, k: 0, t0: 0 };
  const clk = { x: 0, y: 0, p: -1 };
  let hovTween: gsap.core.Tween | null = null;
  let clkTween: gsap.core.Tween | null = null;
  const px1 = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);

  const resize = () => {
    renderer.setPixelRatio(dpr);
    renderer.setSize(css.w, css.h, false);
    const w = init.canvas.width;
    const h = init.canvas.height;
    if (rtA.width !== w || rtA.height !== h) {
      rtA.setSize(w, h);
      rtB.setSize(w, h);
    }
  };

  const ctxFor = (leave: number, enter: number, dt: number): FrameCtx => {
    const k = init.canvas.width / Math.max(1, css.w);
    return {
      t,
      dt,
      par,
      hover: { x: hov.x * k, y: hov.y * k, r: OS_SCENE.hover.radius * k, k: hov.k },
      res: [init.canvas.width, init.canvas.height],
      stage: { x: stageCss.x * k, y: stageCss.y * k, r: stageCss.r * k },
      leave,
      enter,
    };
  };

  const render = (dt: number, grain = 0.012) => {
    const W = init.canvas.width;
    const H = init.canvas.height;
    const k = W / Math.max(1, css.w);
    const u = comp.uniforms;
    const p = tr ? tr.p : 0;
    const A = tr ? tr.from : world;
    if (!tr || p < 0.97) {
      worlds[A].update(ctxFor(tr ? p : 0, 1, dt));
      renderer.setRenderTarget(rtA);
      renderer.render(worlds[A].scene, worlds[A].camera);
    }
    const hasB = !!tr && p > 0.33;
    if (tr && hasB) {
      worlds[tr.to].update(ctxFor(0, p, dt));
      renderer.setRenderTarget(rtB);
      renderer.render(worlds[tr.to].scene, worlds[tr.to].camera);
    }
    renderer.setRenderTarget(null);
    u.tA.value = rtA.texture;
    u.tB.value = rtB.texture;
    u.uTrans.value = tr ? 1 : 0;
    u.uHasB.value = hasB ? 1 : 0;
    u.uP.value = p;
    u.uToVoid.value = tr && tr.to === "void" ? 1 : 0;
    u.uAVoid.value = A === "void" ? 1 : 0;
    u.uRes.value = [W, H];
    u.uC.value = [stageCss.x * k, H - stageCss.y * k];
    u.uR.value = stageCss.r * k;
    const wu = tr ? (p - OS_SCENE.wave.from) / (OS_SCENE.wave.to - OS_SCENE.wave.from) : -1;
    u.uWave.value.set(tr ? tr.ox * k : 0, tr ? H - tr.oy * k : 0, tr ? easeOut(wu) : -1);
    u.uClick.value = [clk.x * k, H - clk.y * k, clk.p, clk.p >= 0 && clk.p < 1 ? 1 : 0];
    u.uHover.value = [hov.x * k, H - hov.y * k, hov.k, OS_SCENE.hover.radius * k];
    u.uHoverT.value = t - hov.t0;
    const dom = tr ? (p > 0.6 ? tr.to : tr.from) : world;
    // Vazio: azul (tira vermelho e verde do branco perolado); Tsukuyomi: brasa
    if (dom === "void") u.uHoverTint.value.set(-0.5, -0.26, 0.0);
    else u.uHoverTint.value.set(0.9, 0.24, 0.1);
    u.uTime.value = t % OS_SCENE.timeWrap;
    u.uGrain.value = grain;
    u.uVig.value = dom === "void" ? 0.1 : 0.5;
    renderer.render(compScene, compCam);
    frames++;
  };

  const tick = (_time: number, deltaMS: number) => {
    if (disposed) return;
    acc += deltaMS;
    if (acc + 1 < 1000 / ambientFps) return;
    const dt = Math.min(acc, 100) / 1000;
    acc = 0;
    t += dt;
    // paralaxe amortecida: mouse recente manda; sem ele, deriva lenta e automática
    const A = OS_SCENE.parallax;
    const tx = target ? target.x : A.drift * (Math.sin(t * 0.11) + 0.35 * Math.sin(t * 0.29 + 1));
    const ty = target ? target.y : A.drift * 0.75 * Math.sin(t * 0.083 + 1.3);
    const kk = 1 - Math.exp(-dt / A.tau);
    par.x += (tx - par.x) * kk;
    par.y += (ty - par.y) * kk;
    frameCb?.(api, dt);
    if (disposed) return;
    if (timeCb) {
      const cb = timeCb;
      timeCb = null;
      const p0 = performance.now();
      render(dt);
      sync();
      cb(performance.now() - p0);
      return;
    }
    render(dt);
  };

  const finishTr = (to: SceneWorld) => {
    if (tr?.tween) tr.tween.kill();
    tr = null;
    world = to;
  };

  const api: Engine = {
    renderer,
    worlds,
    get world() {
      return world;
    },
    get trans() {
      return tr ? { from: tr.from, to: tr.to, p: tr.p, dir: tr.dir, ox: tr.ox, oy: tr.oy } : null;
    },
    get frames() {
      return frames;
    },
    get dpr() {
      return dpr;
    },
    par,
    hoverState: hov,
    clickState: clk,
    setStage(stage, cssW, cssH) {
      stageCss = stage;
      if (cssW !== css.w || cssH !== css.h) {
        css = { w: Math.max(1, cssW), h: Math.max(1, cssH) };
        resize();
      }
    },
    setDpr(v) {
      dpr = v;
      resize();
    },
    setWorld(w) {
      if (tr) finishTr(w);
      world = w;
    },
    transition(to, origin) {
      if (!tr) {
        if (to === world) return false;
        const next: Trans & { tween: gsap.core.Tween | null } = { from: world, to, p: 0, dir: 1, ox: origin[0], oy: origin[1], tween: null };
        next.tween = gsap.to(next, {
          p: 1,
          duration: OS_SCENE.duration,
          ease: "none",
          onComplete: () => tr === next && finishTr(next.to),
          onReverseComplete: () => tr === next && finishTr(next.from),
        });
        tr = next;
        return true;
      }
      if (to === tr.to) {
        tr.dir = 1;
        tr.tween?.play();
      } else if (to === tr.from) {
        tr.dir = -1;
        tr.tween?.reverse();
      }
      return true;
    },
    finish(to) {
      finishTr(to);
    },
    hover(x, y, on) {
      if (on) {
        // outro app (ou o mesmo depois de sair): os pulsos recomeçam dele
        if (hov.k < 0.05 || Math.hypot(x - hov.x, y - hov.y) > 4) hov.t0 = t;
        hov.x = x;
        hov.y = y;
      }
      hovTween?.kill();
      hovTween = gsap.to(hov, { k: on ? 1 : 0, duration: on ? OS_SCENE.hover.in : OS_SCENE.hover.out, ease: on ? "power2.out" : "power2.inOut" });
    },
    click(x, y) {
      clk.x = x;
      clk.y = y;
      clkTween?.kill();
      // curva suave (quadrática): a frente atravessa o raio por igual e dá tempo de ser vista
      clkTween = gsap.fromTo(clk, { p: 0 }, { p: 1, duration: OS_SCENE.click.duration, ease: "power1.out", onComplete: () => void (clk.p = -1) });
    },
    pointer(p) {
      target = p;
    },
    start() {
      if (running || disposed) return;
      running = true;
      acc = 1000; // o primeiro tick já desenha
      gsap.ticker.add(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    },
    measure(n = 3, trans = false) {
      const keep = tr;
      if (trans) tr = { from: world, to: world === "tsukuyomi" ? "void" : "tsukuyomi", p: 0.6, dir: 1, ox: 0, oy: 0, tween: null };
      const m = Math.max(2, n);
      render(0);
      sync();
      let p0 = performance.now();
      render(0);
      sync();
      const one = performance.now() - p0;
      p0 = performance.now();
      for (let i = 0; i < m; i++) render(0);
      sync();
      const many = performance.now() - p0;
      tr = keep;
      return Math.max(0.05, (many - one) / (m - 1));
    },
    timeOnce() {
      sync();
      const p0 = performance.now();
      render(0);
      sync();
      return performance.now() - p0;
    },
    timeNextFrame(cb) {
      timeCb = cb;
    },
    prime() {
      if (tr || disposed) return;
      const other: SceneWorld = world === "tsukuyomi" ? "void" : "tsukuyomi";
      worlds[other].update(ctxFor(0, 1, 0));
      renderer.setRenderTarget(rtB);
      renderer.render(worlds[other].scene, worlds[other].camera);
      renderer.setRenderTarget(null);
    },
    still(w, at = {}) {
      const keepT = t;
      const keepTr = tr;
      t = at.t ?? 0;
      world = w;
      par.x = par.y = 0;
      tr = at.to && at.to !== w ? { from: w, to: at.to, p: at.p ?? 0.5, dir: 1, ox: at.ox ?? 0, oy: at.oy ?? 0, tween: null } : null;
      render(0, 0);
      tr = keepTr;
      t = keepT;
    },
    async warm() {
      for (const w of Object.values(worlds)) {
        w.update(ctxFor(0, 1, 0));
        await renderer.compileAsync(w.scene, w.camera);
      }
      await renderer.compileAsync(compScene, compCam);
    },
    onFrame(cb) {
      frameCb = cb;
    },
    fps(v) {
      ambientFps = v;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      api.stop();
      tr?.tween?.kill();
      hovTween?.kill();
      clkTween?.kill();
      worlds.tsukuyomi.dispose();
      worlds.void.dispose();
      baked.dispose();
      rtA.dispose();
      rtB.dispose();
      comp.dispose();
      compGeo.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  return api;
}

const easeOut = (u: number) => {
  if (u <= 0 || u >= 1) return u <= 0 ? 0 : 1;
  return 1 - Math.pow(1 - u, 3);
};
