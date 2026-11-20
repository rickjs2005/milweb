import { BufferAttribute, BufferGeometry, Color, DataTexture, LinearFilter, MathUtils, Mesh, OrthographicCamera, PerspectiveCamera, Points, RGBAFormat, Scene, ShaderMaterial, SRGBColorSpace, Texture, Vector2, Vector3, WebGLRenderer } from "three";
import { gsap } from "@/animations/gsap";
import type { Molecules } from "./asset";
import { MATERIA, PALETTE, type Mood } from "./config";
import { BACKDROP_FRAG, BACKDROP_VERT, MOLECULE_FRAG, MOLECULE_VERT } from "./shaders";

/**
 * Motor da Matéria: um WebGLRenderer, o ambiente (um plano de tela inteira) e as moléculas (um draw
 * call de pontos). UM laço: o ticker do GSAP. Nenhum estado React por quadro — a cola
 * (materia-scene.tsx) dá alvos (`set`, `pull`, `slit`, `tint`) e o motor chega a eles com o tempo.
 */
export type Point = { x: number; y: number };
/** `home`: centro da cabeça em repouso (px CSS). `talk`: centro do cérebro na conversa e a sua escala relativa. */
export type Layout = { w: number; h: number; k: number; home: Point; talk: { x: number; y: number; k: number }; /** Até onde o busto aparece, em unidades abaixo do centro da cabeça (telefone: a grade de apps). */ floor?: number };
export type Trans = { from: Mood; to: Mood; p: number; dir: 1 | -1; ox: number; oy: number };
export type Targets = { talk: boolean; listen: number; speak: number; calm: number; align: number; /** O recorte no rosto está aberto. */ portal: boolean; /** A faixa de luz vira a superfície do mar. */ sea: number; /** Onde a figura fica: 0 = repouso, 1 = o lugar da conversa. */ place: number };
/** A figura na tela agora (px CSS do canvas): centro, px por unidade e quanto o recorte está aberto (0..1). */
export type Figure = { x: number; y: number; k: number; open: number };
export type EngineInit = { canvas: HTMLCanvasElement; mood: Mood; lite: boolean; molecules: Molecules; /** Imagem estática: fundo transparente, sem ambiente, buffer preservado. */ still?: boolean };

export type Engine = {
  readonly mood: Mood;
  readonly trans: Readonly<Trans> | null;
  readonly frames: number;
  readonly dpr: number;
  readonly fpsNow: number;
  readonly count: number;
  readonly stats: Readonly<{ ms: number }>;
  /** Leitura para testes e medições: metamorfose (0 busto … 1 cérebro), afastamento entre os dois perfis (rad) e alvos. */
  readonly debug: Readonly<{ morph: number; split: number; pull: number; lag: number; listen: number; speak: number; calm: number; align: number; tint: number; slit: number; portal: number; sea: number; place: number }>;
  readonly figure: Readonly<Figure>;
  setLayout(l: Layout): void;
  setDpr(v: number): void;
  setMood(m: Mood): void;
  transition(to: Mood, origin: [number, number]): boolean;
  finish(to: Mood): void;
  set(t: Partial<Targets>): void;
  /** Gesto ao lado do rosto (−1..1) ou null ao soltar. */
  pull(p: Point | null): void;
  /** A fenda de luz que atravessa o rosto. */
  slit(): void;
  /** Reflete uma imagem (a capa de um projeto) na prata; null devolve o metal. */
  tint(image: HTMLImageElement | ImageBitmap | null): void;
  start(): void;
  stop(): void;
  compile(): Promise<void>;
  calibrate(floor?: number): number;
  /** Um quadro parado (imagens estáticas): `morph` 0 = busto, 1 = cérebro. */
  still(mood: Mood, morph: number): void;
  onFrame(cb: ((e: Engine, dt: number) => void) | null): void;
  dispose(): void;
};

/** A linha do mar em unidades acima do centro da cabeça: a mesma altura que a prévia desenha dentro do recorte. */
const SEA_Y = MATERIA.portal.c[1] + (1 - 2 * MATERIA.portal.sea) * MATERIA.portal.r[1] * MATERIA.portal.inset;

const srgb = (hex: string, into: Vector3) => {
  const c = new Color();
  c.set(hex);
  // `Color` guarda em linear; as cores dos shaders são de tela
  c.convertLinearToSRGB();
  return into.set(c.r, c.g, c.b);
};

export function createEngine(init: EngineInit): Engine | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas: init.canvas, antialias: false, alpha: !!init.still, depth: true, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: !!init.still });
  } catch {
    return null;
  }
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, init.still ? 0 : 1);

  const M = init.molecules;
  const camera = new PerspectiveCamera(MATERIA.fov, 1, 0.5, 80);
  const scene = new Scene();
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(M.bust, 3));
  geo.setAttribute("aNormal", new BufferAttribute(M.normal, 3));
  geo.setAttribute("aBrain", new BufferAttribute(M.brain, 3));
  geo.setAttribute("aBrainN", new BufferAttribute(M.brainNormal, 3));
  geo.setAttribute("aMeta", new BufferAttribute(M.meta, 4, true));

  const blank = new DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, RGBAFormat);
  blank.needsUpdate = true;
  let tintTex: Texture | null = null;

  const mat = new ShaderMaterial({
    vertexShader: MOLECULE_VERT,
    fragmentShader: MOLECULE_FRAG,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 }, uPx: { value: 300 }, uCamZ: { value: 5 },
      // só com o primeiro arquivo (telefone) cada molécula cresce um pouco, para a superfície continuar fechada
      uSize: { value: MATERIA.size * (M.count < 40000 ? 1.2 : 1) }, uYaw: { value: MATERIA.yaw },
      uMorph: { value: 0 }, uListen: { value: 0 }, uSpeak: { value: 0 }, uCalm: { value: 0 }, uAlign: { value: 0 }, uSlit: { value: -1 },
      uScale: { value: 1 }, uIntro: { value: init.still ? 1 : 0 }, uFold: { value: 0 }, uFloor: { value: 9 },
      uPull: { value: new Vector2() }, uPullLag: { value: new Vector2() }, uOffset: { value: new Vector3() },
      uPortal: { value: 0 }, uPortalYaw: { value: MATERIA.portal.yaw }, uPortalC: { value: new Vector2(MATERIA.portal.c[0], MATERIA.portal.c[1]) }, uPortalR: { value: new Vector2(MATERIA.portal.r[0], MATERIA.portal.r[1]) },
      uSea: { value: 0 }, uSeaY: { value: SEA_Y },
      uMetal: { value: new Vector3() }, uKey: { value: new Vector3() }, uRim: { value: new Vector3() }, uAccent: { value: new Vector3() }, uShade: { value: new Vector3() }, uFade: { value: new Vector3() },
      uLight: { value: 0 }, uBead: { value: MATERIA.bead }, uTintK: { value: 0 }, uStripAz: { value: -1.12 }, uTint: { value: blank },
    },
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const bgScene = new Scene();
  const bgCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bgGeo = new BufferGeometry();
  bgGeo.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const bgMat = new ShaderMaterial({
    vertexShader: BACKDROP_VERT,
    fragmentShader: BACKDROP_FRAG,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uRes: { value: new Vector2(1, 1) }, uTime: { value: 0 },
      uBaseA: { value: new Vector3() }, uDeepA: { value: new Vector3() }, uHazeA: { value: new Vector3() }, uAccentA: { value: new Vector3() },
      uBaseB: { value: new Vector3() }, uDeepB: { value: new Vector3() }, uHazeB: { value: new Vector3() }, uAccentB: { value: new Vector3() },
      uLightA: { value: 0 }, uLightB: { value: 0 }, uP: { value: 0 }, uOrigin: { value: new Vector2() }, uHead: { value: new Vector3(0, 0, 300) },
      uBend: { value: 0 }, uBand: { value: 1 }, uSlit: { value: -1 }, uGrain: { value: 0.014 }, uSea: { value: 0 }, uSeaY: { value: SEA_Y },
    },
  });
  const bgMesh = new Mesh(bgGeo, bgMat);
  bgMesh.frustumCulled = false;
  bgScene.add(bgMesh);

  // ---- estado ----
  let mood: Mood = init.mood;
  let tr: (Trans & { e: number }) | null = null;
  let trClock = 0;
  let layout: Layout = { w: 1, h: 1, k: 300, home: { x: 0.5, y: 0.5 }, talk: { x: 0.5, y: 0.5, k: 1 } };
  let dpr = 1;
  let t = 0;
  let frames = 0;
  let acc = 0;
  let calmFor = 0;
  let fpsNow: number = MATERIA.fps.active;
  let activeFps: number = MATERIA.fps.active;
  let running = false;
  let disposed = false;
  let frameCb: ((e: Engine, dt: number) => void) | null = null;
  const stats = { ms: 0 };
  const target: Targets = { talk: false, listen: 0, speak: 0, calm: 0, align: 0, portal: false, sea: 0, place: 0 };
  const now = { morph: 0, listen: 0, speak: 0, calm: 0, align: 0, tint: 0, intro: init.still ? 1 : 0, portal: 0, sea: 0, place: 0 };
  const fig: Figure = { x: 0, y: 0, k: 300, open: 0 };
  let tintWant = 0;
  let slitAt = -1;
  // dobra do tempo: o gesto de agora e o mesmo gesto `lag` s atrás (linha de atraso)
  let pullTarget: Point | null = null;
  const pullNow = { x: 0, y: 0 };
  const pullLag = { x: 0, y: 0 };
  const trail: { t: number; x: number; y: number }[] = [];
  const u = mat.uniforms;
  const b = bgMat.uniforms;
  const tmp = new Vector3();

  const camZ = () => layout.h / layout.k / (2 * Math.tan(MathUtils.degToRad(MATERIA.fov) / 2));
  const resize = () => {
    renderer.setPixelRatio(dpr);
    renderer.setSize(layout.w, layout.h, false);
    camera.aspect = layout.w / Math.max(1, layout.h);
    camera.updateProjectionMatrix();
  };

  /** Cores do tema — ou a mistura de dois (m = 0 → a, 1 → b). */
  const applyMood = (a: Mood, bb: Mood, m: number) => {
    const A = PALETTE[a];
    const B = PALETTE[bb];
    const mix = (x: string, y: string, into: Vector3) => {
      srgb(x, into);
      return into.lerp(srgb(y, tmp), m);
    };
    mix(A.metal, B.metal, u.uMetal.value);
    mix(A.key, B.key, u.uKey.value);
    mix(A.rim, B.rim, u.uRim.value);
    mix(A.accent, B.accent, u.uAccent.value);
    mix(A.shade, B.shade, u.uShade.value);
    mix(A.base, B.base, u.uFade.value);
    const la = a === "light" ? 1 : 0;
    const lb = bb === "light" ? 1 : 0;
    u.uLight.value = la + (lb - la) * m;
    srgb(A.base, b.uBaseA.value);
    srgb(A.deep, b.uDeepA.value);
    srgb(A.haze, b.uHazeA.value);
    srgb(A.accent, b.uAccentA.value);
    srgb(B.base, b.uBaseB.value);
    srgb(B.deep, b.uDeepB.value);
    srgb(B.haze, b.uHazeB.value);
    srgb(B.accent, b.uAccentB.value);
    b.uLightA.value = la;
    b.uLightB.value = lb;
  };

  const ease = (x: number) => x * x * (3 - 2 * x);
  const render = () => {
    const p0 = performance.now();
    const D = camZ();
    camera.position.set(0, 0, D);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    if (tr) applyMood(tr.from, tr.to, MathUtils.smoothstep(tr.p, 0.3, 0.7));
    // do repouso (centro da cabeça) à conversa (centro do cérebro), com a escala de cada um; o recorte pode
    // acontecer no lugar da conversa (painel aberto) sem a metamorfose
    const m = Math.max(ease(now.morph), ease(now.place));
    const cx = layout.home.x + (layout.talk.x - layout.home.x) * m;
    const cy = layout.home.y + (layout.talk.y - layout.home.y) * m;
    const scale = 1 + (layout.talk.k - 1) * m;
    u.uOffset.value.set((cx - layout.w / 2) / layout.k, -(cy - layout.h / 2) / layout.k, 0);
    u.uScale.value = scale;
    fig.x = cx;
    fig.y = cy;
    fig.k = layout.k * scale;
    fig.open = MathUtils.smoothstep(now.portal, 0.42, 1) * (1 - ease(now.morph));
    u.uPortal.value = now.portal;
    u.uSea.value = now.sea;
    u.uFloor.value = layout.floor ?? 9;
    u.uPx.value = layout.k * dpr;
    u.uCamZ.value = D;
    u.uTime.value = t % MATERIA.timeWrap;
    u.uMorph.value = now.morph;
    u.uListen.value = now.listen;
    u.uSpeak.value = now.speak;
    u.uCalm.value = now.calm;
    u.uAlign.value = now.align;
    u.uIntro.value = now.intro;
    // com o recorte aberto a capa refletida recua: a figura continua prata, a cor fica por conta da ideia
    u.uTintK.value = now.tint * (1 - 0.6 * now.portal);
    u.uPull.value.set(pullNow.x, pullNow.y);
    u.uPullLag.value.set(pullLag.x, pullLag.y);
    const split = pullNow.x - pullLag.x;
    u.uFold.value = Math.min(1, Math.abs(split) * 5);
    const slit = slitAt < 0 ? -1 : Math.min(1, (t - slitAt) / MATERIA.slit);
    u.uSlit.value = slit;

    const W = init.canvas.width;
    const H = init.canvas.height;
    const k = W / Math.max(1, layout.w);
    renderer.setRenderTarget(null);
    renderer.clear();
    if (!init.still) {
      b.uRes.value.set(W, H);
      b.uTime.value = t % MATERIA.timeWrap;
      b.uHead.value.set(cx * k, H - cy * k, layout.k * scale * k);
      b.uBend.value = (split / MATERIA.fold.yaw) * (1 - ease(now.morph));
      b.uBand.value = (1 - 0.75 * now.calm) * (1 - 0.6 * ease(now.morph));
      b.uSea.value = now.sea;
      b.uSlit.value = slit;
      b.uP.value = tr ? tr.p : 0;
      if (tr) b.uOrigin.value.set(tr.ox * k, H - tr.oy * k);
      renderer.render(bgScene, bgCam);
      renderer.clearDepth();
    }
    renderer.render(scene, camera);
    stats.ms = stats.ms * 0.9 + (performance.now() - p0) * 0.1;
    frames++;
  };

  const step = (dt: number) => {
    const F = MATERIA.fold;
    // gesto de agora: mola rápida até o alvo; ao soltar, volta mais devagar
    const tx = pullTarget ? pullTarget.x * F.yaw : 0;
    const ty = pullTarget ? pullTarget.y * F.pitch : 0;
    const kp = 1 - Math.exp(-dt * (pullTarget ? F.follow : F.release));
    pullNow.x += (tx - pullNow.x) * kp;
    pullNow.y += (ty - pullNow.y) * kp;
    trail.push({ t, x: pullNow.x, y: pullNow.y });
    while (trail.length > 2 && trail[1].t <= t - F.lag) trail.shift();
    pullLag.x = trail[0].x;
    pullLag.y = trail[0].y;
    // metamorfose em tempo linear (o shader dá a cada molécula a sua curva)
    const dir = target.talk ? 1 : -1;
    now.morph = Math.max(0, Math.min(1, now.morph + (dir * dt) / MATERIA.morph));
    const k2 = 1 - Math.exp(-dt / 0.3);
    now.listen += (target.listen - now.listen) * k2;
    now.speak += (target.speak - now.speak) * k2;
    now.calm += (target.calm - now.calm) * (1 - Math.exp(-dt / 0.6));
    now.align += (target.align - now.align) * (1 - Math.exp(-dt / 0.5));
    now.tint += (tintWant - now.tint) * (1 - Math.exp(-dt / 0.35));
    // O recorte espera o busto se recompor (vindo do cérebro) e fecha mais depressa do que abre.
    const P = MATERIA.portal;
    const opening = target.portal && now.morph < 0.3;
    now.portal = Math.max(0, Math.min(1, now.portal + (opening ? dt / P.time : -dt / P.close)));
    now.sea += ((opening && now.portal > 0.35 ? target.sea : 0) - now.sea) * (1 - Math.exp(-dt / 0.45));
    now.place += (target.place - now.place) * (1 - Math.exp(-dt / 0.4));
    now.intro = Math.min(1, now.intro + dt / 1.7);
    if (slitAt >= 0 && t - slitAt > MATERIA.slit) slitAt = -1;
  };

  /** Algo se mexe por causa do visitante (ou ainda está assentando)? */
  const busy = () =>
    !!tr || now.intro < 1 || slitAt >= 0 || !!pullTarget || Math.abs(pullNow.x - pullLag.x) > 0.002 || Math.abs(pullNow.x) > 0.004 ||
    (now.morph > 0 && now.morph < 1) || now.listen > 0.02 || now.speak > 0.02 || Math.abs(now.tint - tintWant) > 0.01 || Math.abs(now.align - target.align) > 0.01 ||
    target.portal || now.portal > 0 || now.sea > 0.01 || Math.abs(now.place - target.place) > 0.005;

  let slowEma = 0;
  let cooldown = 4;
  let lastTick = 0;
  const tick = () => {
    if (disposed) return;
    // Relógio REAL: o do GSAP comprime o tempo quando um quadro demora, e a dobra do tempo é medida em segundos de verdade.
    const clock = performance.now();
    const deltaMS = Math.min(250, clock - lastTick);
    lastTick = clock;
    acc += deltaMS;
    calmFor = busy() ? 0 : calmFor + deltaMS / 1000;
    fpsNow = calmFor < MATERIA.fps.calm ? activeFps : MATERIA.fps.idle;
    if (acc + 1 < 1000 / fpsNow) return;
    const dt = Math.min(acc, 100) / 1000;
    acc = 0;
    t += dt;
    let done: Mood | null = null;
    if (tr) {
      // progresso pelo relógio real: quadros lentos não esticam a troca
      const nowR = performance.now();
      tr.e = Math.max(0, Math.min(MATERIA.duration, tr.e + (tr.dir * (nowR - trClock)) / 1000));
      trClock = nowR;
      const x = tr.e / MATERIA.duration;
      tr.p = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      if (tr.dir > 0 && tr.e >= MATERIA.duration) done = tr.to;
      else if (tr.dir < 0 && tr.e <= 0) done = tr.from;
    }
    step(dt);
    frameCb?.(api, dt);
    if (disposed) return;
    render();
    if (done && tr) finishTr(done);
    // quadros lentos seguidos baixam a resolução (nunca abaixo do mínimo)
    const B = MATERIA.budget;
    slowEma = slowEma * 0.92 + (deltaMS > 1.6 * (1000 / fpsNow) || stats.ms > B.slowMs ? 0.08 : 0);
    cooldown -= dt;
    if (cooldown <= 0 && slowEma > 0.5 && dpr > B.minDpr + 0.01) {
      dpr = Math.max(B.minDpr, dpr * B.step);
      resize();
      slowEma = 0;
      cooldown = 2.5;
    }
  };

  const finishTr = (to: Mood) => {
    tr = null;
    mood = to;
    applyMood(mood, mood, 0);
  };

  const api: Engine = {
    get mood() {
      return mood;
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
    get fpsNow() {
      return fpsNow;
    },
    count: M.count,
    stats,
    get debug() {
      return { morph: now.morph, split: pullNow.x - pullLag.x, pull: pullNow.x, lag: pullLag.x, listen: now.listen, speak: now.speak, calm: now.calm, align: now.align, tint: now.tint, slit: slitAt < 0 ? -1 : (t - slitAt) / MATERIA.slit, portal: now.portal, sea: now.sea, place: now.place };
    },
    figure: fig,
    setLayout(l) {
      const sized = l.w !== layout.w || l.h !== layout.h;
      layout = l;
      if (sized) resize();
    },
    setDpr(v) {
      dpr = v;
      resize();
    },
    setMood(m) {
      if (tr) finishTr(m);
      mood = m;
      applyMood(mood, mood, 0);
    },
    transition(to, origin) {
      if (!tr) {
        if (to === mood) return false;
        tr = { from: mood, to, p: 0, dir: 1, ox: origin[0], oy: origin[1], e: 0 };
        trClock = performance.now();
        return true;
      }
      if (to === tr.to) tr.dir = 1;
      else if (to === tr.from) tr.dir = -1;
      return true;
    },
    finish(to) {
      finishTr(to);
    },
    set(next) {
      Object.assign(target, next);
    },
    pull(p) {
      pullTarget = p;
    },
    slit() {
      slitAt = t;
    },
    tint(image) {
      if (!image) {
        tintWant = 0;
        return;
      }
      const tex = new Texture(image);
      tex.colorSpace = SRGBColorSpace;
      tex.minFilter = LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      tintTex?.dispose();
      tintTex = tex;
      u.uTint.value = tex;
      tintWant = 1;
    },
    start() {
      if (running || disposed) return;
      running = true;
      acc = 1000;
      lastTick = performance.now();
      gsap.ticker.add(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    },
    async compile() {
      camera.position.set(0, 0, camZ());
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      await renderer.compileAsync(scene, camera);
      if (!init.still) await renderer.compileAsync(bgScene, bgCam);
    },
    calibrate(floor = MATERIA.budget.minDpr) {
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const B = MATERIA.budget;
      const keep = now.intro;
      now.intro = 1; // mede a escultura inteira à vista
      const cost = () => {
        render();
        sync();
        const p0 = performance.now();
        for (let i = 0; i < 3; i++) {
          render();
          sync();
        }
        return (performance.now() - p0) / 3;
      };
      let ms = cost();
      if (ms > B.targetMs && dpr > floor) {
        dpr = Math.max(floor, dpr * Math.sqrt(B.targetMs / ms));
        resize();
        ms = cost();
      }
      activeFps = ms > B.heavyMs ? MATERIA.fps.idle : MATERIA.fps.active;
      now.intro = keep;
      frames = 0;
      return ms;
    },
    still(m, morph) {
      mood = m;
      tr = null;
      applyMood(m, m, 0);
      t = 0;
      now.morph = morph;
      now.intro = 1;
      render();
    },
    onFrame(cb) {
      frameCb = cb;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      api.stop();
      geo.dispose();
      mat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      blank.dispose();
      tintTex?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  applyMood(mood, mood, 0);
  return api;
}
