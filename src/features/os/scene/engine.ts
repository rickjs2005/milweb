import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PerspectiveCamera,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Scene,
  type Texture,
  WebGLRenderer,
} from "three";
import { gsap } from "@/animations/gsap";
import { createBackdrop } from "./backdrop";
import { createDirector, type Director, type Layout, type Point, type Rect } from "./director";
import { loadEntity, type Entity } from "./entity";
import { ENTITY_URL, LOOK, OS_SCENE, PALETTE, type Mood } from "./scene.config";

/**
 * Motor da cena: um WebGLRenderer, o ambiente (um plano de tela inteira), a entidade e a câmera.
 * UM laço: o ticker do GSAP — a troca de tema e o quadro da cena andam no mesmo rAF, por
 * tempo decorrido. Nenhum estado React por quadro: quem usa o motor recebe um gancho por quadro
 * (`onFrame`) e lê o estado direto.
 *
 * O personagem chega depois (`load`): até lá — e se o arquivo ou o WebGL falharem — o motor não
 * entra em cena e a interface fica com a imagem estática. A navegação nunca depende dele.
 */
export type Trans = { from: Mood; to: Mood; p: number; dir: 1 | -1; ox: number; oy: number };
export type EngineInit = {
  canvas: HTMLCanvasElement;
  mood: Mood;
  lite: boolean;
  /** Imagens estáticas: fundo transparente, sem ambiente nem partículas, buffer preservado. */
  still?: boolean;
  /** Placa do ícone de um app (px CSS do canvas, y do topo) — lida do DOM a cada quadro em que há alvo. */
  resolve: (id: string) => Rect | null;
  /** A ponta do dedo encostou no app. */
  onTouch: (id: string) => void;
};

export type Engine = {
  readonly renderer: WebGLRenderer;
  readonly mood: Mood;
  readonly trans: Readonly<Trans> | null;
  readonly frames: number;
  readonly dpr: number;
  /** Teto de quadros em vigor (30 em repouso, 60 num gesto). */
  readonly fpsNow: number;
  /** O personagem está carregado e em cena. */
  readonly ready: boolean;
  readonly director: Director | null;
  readonly entity: Entity | null;
  /** Custo do último quadro: draw calls, triângulos e ms de CPU (média móvel). */
  readonly stats: Readonly<{ calls: number; triangles: number; ms: number }>;
  setLayout(l: Layout): void;
  setDpr(v: number): void;
  setMood(m: Mood): void;
  /** Começa (ou muda o sentido de) uma troca de tema. false = nada a fazer. Origem em px CSS do canvas. */
  transition(to: Mood, origin: [number, number]): boolean;
  /** Termina a troca na hora no tema de destino. */
  finish(to: Mood): void;
  /** Alvo da paralaxe/olhar (−1..1) ou null. */
  pointer(p: Point | null): void;
  start(): void;
  stop(): void;
  /** Carrega o personagem e compila os programas. false = falhou (fica a imagem). */
  load(url?: string): Promise<boolean>;
  /**
   * Mede o custo de um quadro (ms, do envio ao fim na GPU) e ajusta a resolução ao orçamento
   * (scene.config › budget). Chamar uma vez depois de `load`, com o canvas ainda fora de cena.
   * `floor`: resolução mínima aceita (padrão: `budget.minDpr`).
   */
  calibrate(floor?: number): number;
  /** Um quadro parado em repouso (imagens estáticas e revisão). */
  still(mood: Mood, at?: { t?: number; to?: Mood; p?: number; ox?: number; oy?: number }): void;
  onFrame(cb: ((e: Engine, dt: number) => void) | null): void;
  dispose(): void;
};

/** Ambiente de reflexo por tema: painéis de luz numa caixa, pré-filtrados (PMREM) — sem arquivo HDR. */
function buildEnv(pmrem: PMREMGenerator, mood: Mood): Texture {
  const P = PALETTE[mood];
  const s = new Scene();
  const geo = new BoxGeometry(1, 1, 1);
  const mats: MeshBasicMaterial[] = [];
  const panel = (color: string, gain: number, pos: [number, number, number], size: [number, number, number]) => {
    const m = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(gain) });
    mats.push(m);
    const mesh = new Mesh(geo, m);
    mesh.position.set(...pos);
    mesh.scale.set(...size);
    s.add(mesh);
  };
  // No tema claro a sala também é escura: o grafite continua grafite, recortado contra o fundo de gelo.
  const room = new MeshBasicMaterial({ color: new Color(mood === "dark" ? "#06070a" : "#1b2029"), side: BackSide });
  mats.push(room);
  const box = new Mesh(geo, room);
  box.scale.set(30, 30, 30);
  s.add(box);
  if (mood === "dark") {
    panel("#ffffff", 7, [0, 9, 2], [10, 0.2, 8]); // teto: o brilho longo no topo das placas
    panel(P.key, 9, [-9, 3, 5], [0.2, 7, 6]); // luz principal, à esquerda e à frente
    panel(P.rim, 14, [8, 2, -7], [0.2, 9, 5]); // recorte vermelho, por trás à direita
    panel(P.rim, 5, [-8, -1, -8], [0.2, 5, 4]);
    panel("#5a6c8c", 3, [3, -7, 6], [8, 0.2, 6]); // rebatida fria de baixo
  } else {
    panel("#ffffff", 6, [0, 9, 2], [9, 0.2, 7]);
    panel(P.key, 8, [-9, 3, 5], [0.2, 6, 5]);
    panel(P.rim, 12, [8, 2, -7], [0.2, 9, 5]); // recorte azul, por trás à direita
    panel("#ffffff", 7, [-8, 1, -8], [0.2, 7, 4]); // contraluz branca: a silhueta ganha borda clara
    panel("#dfe8f4", 2.5, [3, -7, 5], [8, 0.2, 6]);
  }
  const rt = pmrem.fromScene(s, 0.03);
  geo.dispose();
  mats.forEach((m) => m.dispose());
  return rt.texture;
}

function softDot(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.4, "rgba(255,255,255,0.5)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  return new CanvasTexture(c);
}

export function createEngine(init: EngineInit): Engine | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas: init.canvas, antialias: true, alpha: !!init.still, depth: true, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: !!init.still });
  } catch {
    return null; // sem WebGL 2: fica a imagem
  }
  renderer.toneMapping = ACESFilmicToneMapping;
  // Em produção, sem a leitura síncrona do log dos programas (custa no arranque e só serve para depurar shader).
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, init.still ? 0 : 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(OS_SCENE.fov, 1, 0.5, 80);
  const key = new DirectionalLight(0xffffff, 2);
  key.position.set(-2.6, 3.4, 4.2);
  const rim = new DirectionalLight(0xff2a1c, 4);
  rim.position.set(3.2, 1.6, -4);
  const rim2 = new DirectionalLight(0xffffff, 0.6);
  rim2.position.set(-3.4, 2.2, -3);
  const hemi = new HemisphereLight(0xffffff, 0x000000, 0.5);
  scene.add(key, rim, rim2, hemi);

  const pmrem = new PMREMGenerator(renderer);
  const envs: Record<Mood, Texture> = { dark: buildEnv(pmrem, "dark"), light: buildEnv(pmrem, "light") };
  pmrem.dispose();

  const backdrop = createBackdrop();

  // poeira em profundidade, atrás do corpo
  const N = init.still ? 0 : init.lite ? 70 : 150;
  const dust = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < N; i++) {
    dust[i * 3] = (rnd() - 0.5) * 13;
    dust[i * 3 + 1] = (rnd() - 0.5) * 7;
    dust[i * 3 + 2] = -0.6 - rnd() * 7;
    speed[i] = 0.02 + rnd() * 0.06;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new BufferAttribute(dust, 3));
  const dotTex = softDot();
  const dustMat = new PointsMaterial({ size: 0.05, map: dotTex, transparent: true, depthWrite: false, opacity: 0.5, blending: AdditiveBlending, sizeAttenuation: true, toneMapped: false });
  const points = new Points(dustGeo, dustMat);
  points.frustumCulled = false;
  if (N) scene.add(points);

  // ---- estado ----
  let mood: Mood = init.mood;
  /** Troca de tema em curso: `e` é o tempo decorrido (s), em relógio REAL — quadros lentos não a esticam. */
  let tr: (Trans & { e: number }) | null = null;
  let trClock = 0;
  let layout: Layout = { w: 1, h: 1, k: 300, home: { x: 0.5, y: 0.5 }, present: null, bounds: { x0: 0, x1: 1, y0: 0, y1: 1 } };
  let dpr = 1;
  let t = 0;
  let frames = 0;
  let acc = 0;
  let calmT = 0;
  let fpsNow: number = OS_SCENE.fps.active;
  let activeFps: number = OS_SCENE.fps.active;
  let idleFps: number = OS_SCENE.fps.idle;
  let lastPtr = -1e9;
  let running = false;
  let disposed = false;
  let entity: Entity | null = null;
  let director: Director | null = null;
  let frameCb: ((e: Engine, dt: number) => void) | null = null;
  const par = { x: 0, y: 0 };
  let ptr: Point | null = null;
  const stats = { calls: 0, triangles: 0, ms: 0 };
  const cA = new Color();
  const cB = new Color();

  const resize = () => {
    renderer.setPixelRatio(dpr);
    renderer.setSize(layout.w, layout.h, false);
    camera.aspect = layout.w / Math.max(1, layout.h);
    camera.updateProjectionMatrix();
  };
  /** Distância da câmera para uma unidade do modelo valer `k` px no plano do corpo. */
  const camZ = () => layout.h / layout.k / (2 * Math.tan(MathUtils.degToRad(OS_SCENE.fov) / 2));

  /** Luz, ambiente, exposição e emissão de um tema — ou a mistura de dois (m = 0 → a, 1 → b). */
  const applyMood = (a: Mood, b: Mood, m: number) => {
    const A = LOOK[a];
    const B = LOOK[b];
    const PA = PALETTE[a];
    const PB = PALETTE[b];
    const mix = (x: number, y: number) => x + (y - x) * m;
    const lerp = (target: Color, x: string, y: string) => target.copy(cA.set(x)).lerp(cB.set(y), m);
    renderer.toneMappingExposure = mix(A.exposure, B.exposure);
    lerp(key.color, PA.key, PB.key);
    key.intensity = mix(A.key, B.key);
    lerp(rim.color, PA.rim, PB.rim);
    rim.intensity = mix(A.rim, B.rim);
    lerp(hemi.color, PA.sky, PB.sky);
    lerp(hemi.groundColor, PA.ground, PB.ground);
    hemi.intensity = mix(A.hemi, B.hemi);
    const dom = m < 0.5 ? a : b;
    scene.environment = envs[dom];
    scene.environmentIntensity = mix(A.env, B.env);
    lerp(dustMat.color, PA.accent, PB.accent);
    dustMat.opacity = mix(A.particles, B.particles);
    dustMat.blending = dom === "dark" ? AdditiveBlending : NormalBlending;
    if (entity) {
      lerp(entity.glow.color, PA.accent, PB.accent);
      entity.glow.color.multiplyScalar(mix(A.emissive, B.emissive));
      // halos e luz do contato: a mesma cor; no claro, mistura normal (aditivo some sobre o gelo)
      for (const s of [entity.visor, entity.spark, entity.ring]) {
        s.material.color.copy(entity.glow.color);
        s.material.blending = dom === "dark" ? AdditiveBlending : NormalBlending;
      }
    }
  };

  const render = (dt: number) => {
    const p0 = performance.now();
    // paralaxe: a câmera anda um pouco e continua olhando para o centro
    const D = camZ();
    camera.position.set(par.x * OS_SCENE.parallax.amount * D * 0.1, par.y * OS_SCENE.parallax.amount * D * 0.06, D);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    if (tr) {
      const m = MathUtils.smoothstep(tr.p, 0.3, 0.7);
      applyMood(tr.from, tr.to, m);
    }
    if (director) director.update(dt, t, camera);
    // poeira subindo devagar
    if (N) {
      for (let i = 0; i < N; i++) {
        let y = dust[i * 3 + 1] + speed[i] * dt;
        if (y > 3.6) y = -3.6;
        dust[i * 3 + 1] = y;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }
    const W = init.canvas.width;
    const H = init.canvas.height;
    const k = W / Math.max(1, layout.w);
    renderer.setRenderTarget(null);
    renderer.clear();
    let calls = 0;
    let tris = 0;
    if (!init.still) {
      const b = director?.debug.body ?? layout.home;
      const pl = director?.pulse;
      backdrop.set(tr ? tr.from : mood, tr ? tr.to : null, tr ? tr.p : 0, tr ? [tr.ox * k, H - tr.oy * k] : [0, 0]);
      backdrop.frame([W, H], t % OS_SCENE.timeWrap, [b.x * k, H - b.y * k, layout.k * k], pl && pl.k > 0 ? [pl.x * k, H - pl.y * k, pl.p, pl.k] : [0, 0, 1, 0], 0.014);
      renderer.render(backdrop.scene, backdrop.camera);
      calls += renderer.info.render.calls;
      renderer.clearDepth();
    }
    if (entity) {
      renderer.render(scene, camera);
      calls += renderer.info.render.calls;
      tris = renderer.info.render.triangles;
    }
    stats.calls = calls;
    stats.triangles = tris;
    stats.ms = stats.ms * 0.9 + (performance.now() - p0) * 0.1;
    frames++;
  };

  let slowEma = 0;
  let cooldown = 4;
  const tick = (_time: number, deltaMS: number) => {
    if (disposed) return;
    acc += deltaMS;
    // teto de quadros: 60 num gesto ou numa troca de tema; 30 depois de `calm` s de sossego
    // o ponteiro andando também conta: a cabeça o acompanha e a 30 qps esse olhar fica aos degraus
    const busy = !!tr || !!director?.busy || performance.now() - lastPtr < 400;
    calmT = busy ? 0 : calmT + deltaMS / 1000;
    fpsNow = calmT < OS_SCENE.fps.calm ? activeFps : idleFps;
    if (acc + 1 < 1000 / fpsNow) return;
    const dt = Math.min(acc, 100) / 1000;
    acc = 0;
    t += dt;
    const A = OS_SCENE.parallax;
    const kk = 1 - Math.exp(-dt / A.tau);
    par.x += ((ptr ? ptr.x : 0) - par.x) * kk;
    par.y += ((ptr ? ptr.y : 0) - par.y) * kk;
    // troca de tema: progresso pelo relógio real (o do GSAP comprime o tempo quando um quadro demora)
    let done: Mood | null = null;
    if (tr) {
      const nowR = performance.now();
      tr.e = Math.max(0, Math.min(OS_SCENE.duration, tr.e + (tr.dir * (nowR - trClock)) / 1000));
      trClock = nowR;
      const u = tr.e / OS_SCENE.duration;
      tr.p = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      if (tr.dir > 0 && tr.e >= OS_SCENE.duration) done = tr.to;
      else if (tr.dir < 0 && tr.e <= 0) done = tr.from;
    }
    frameCb?.(api, dt);
    if (disposed) return;
    render(dt);
    // termina só depois de o gancho ter visto o último quadro (é ele que confirma o tema na interface)
    if (done && tr) finishTr(done);
    // monitor: quadros lentos seguidos baixam a resolução (nunca abaixo do mínimo)
    const B = OS_SCENE.budget;
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
    renderer,
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
    get ready() {
      return !!entity;
    },
    get director() {
      return director;
    },
    get entity() {
      return entity;
    },
    stats,
    setLayout(l) {
      const sized = l.w !== layout.w || l.h !== layout.h;
      layout = l;
      director?.setLayout(l);
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
      // pedido de volta no meio do caminho: só inverte o sentido
      if (to === tr.to) tr.dir = 1;
      else if (to === tr.from) tr.dir = -1;
      return true;
    },
    finish(to) {
      finishTr(to);
    },
    pointer(p) {
      ptr = p;
      if (p) lastPtr = performance.now();
      director?.pointer(p);
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
    async load(url = ENTITY_URL) {
      const cancel = { cancelled: false };
      try {
        const e = await loadEntity(url, cancel);
        if (!e || disposed) {
          e?.dispose();
          return false;
        }
        entity = e;
        scene.add(e.pivot, e.spark, e.ring);
        director = createDirector(e, init.resolve, init.onTouch);
        director.setLayout(layout);
        director.pointer(ptr);
        applyMood(mood, mood, 0);
        // posa e compila antes do primeiro quadro à vista (sem travar: compilação assíncrona quando a GPU permite)
        camera.position.set(0, 0, camZ());
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        director.update(0, 0, camera);
        await renderer.compileAsync(scene, camera);
        if (!init.still) await renderer.compileAsync(backdrop.scene, backdrop.camera);
        return !disposed;
      } catch (err) {
        // modelo ausente ou corrompido: fica a imagem estática; a navegação não depende disso
        console.warn("[milweb] personagem indisponível:", err instanceof Error ? err.message : err);
        return false;
      }
    },
    calibrate(floor = OS_SCENE.budget.minDpr) {
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const B = OS_SCENE.budget;
      const cost = () => {
        render(0);
        sync(); // aquece (variantes dos programas, texturas na GPU)
        const p0 = performance.now();
        for (let i = 0; i < 3; i++) {
          render(0);
          sync();
        }
        return (performance.now() - p0) / 3;
      };
      let ms = cost();
      if (ms > B.targetMs && dpr > floor) {
        // custo ~ proporcional aos pixels: resolução na raiz da folga
        dpr = Math.max(floor, dpr * Math.sqrt(B.targetMs / ms));
        resize();
        ms = cost();
      }
      activeFps = ms > B.heavyMs ? OS_SCENE.fps.idle : OS_SCENE.fps.active;
      // com folga na GPU, o repouso também roda a 60: a flutuação fica contínua
      idleFps = !init.lite && ms <= B.smoothMs ? OS_SCENE.fps.active : OS_SCENE.fps.idle;
      frames = 0;
      return ms;
    },
    still(m, at = {}) {
      const keepT = t;
      const keepTr = tr;
      t = at.t ?? 0;
      mood = m;
      par.x = par.y = 0;
      tr = at.to && at.to !== m ? { from: m, to: at.to, p: at.p ?? 0.5, dir: 1, ox: at.ox ?? 0, oy: at.oy ?? 0, e: 0 } : null;
      if (!tr) applyMood(m, m, 0);
      if (entity && director) {
        entity.mixer.setTime(t);
        director.snap();
      }
      render(0);
      tr = keepTr;
      t = keepT;
    },
    onFrame(cb) {
      frameCb = cb;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      api.stop();
      entity?.dispose();
      backdrop.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      dotTex.dispose();
      envs.dark.dispose();
      envs.light.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  applyMood(mood, mood, 0);
  return api;
}
