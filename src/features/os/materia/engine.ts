import { BackSide, BufferAttribute, BufferGeometry, Color, FrontSide, type Side, DataTexture, LinearFilter, MathUtils, Mesh, NoColorSpace, OrthographicCamera, PerspectiveCamera, Points, RGBAFormat, Scene, ShaderMaterial, SRGBColorSpace, Texture, Vector2, Vector3, Vector4, WebGLRenderTarget, WebGLRenderer } from "three";
import { gsap } from "@/animations/gsap";
import type { FigureMesh, FigurePart, Molecules } from "./asset";
import { MATERIA, PALETTE, type Mood } from "./config";
import { FIGURE_FRAG, FIGURE_SHADOW_FRAG, FIGURE_VERT } from "./hero-shaders";
import { heroTargets } from "./hero-targets";
import { createRig, type ArmGoal, type Goal, type V3 } from "./rig";
import { RIG } from "./rig-data";
import { BACKDROP_FRAG, BACKDROP_VERT, MOLECULE_FRAG, MOLECULE_VERT } from "./shaders";

/**
 * Motor da Matéria: um WebGLRenderer, o ambiente (um plano de tela inteira), a figura da home (malha
 * contínua: rosto, braço e a mão que segura a dobra da tela) e as moléculas (um draw call de pontos).
 * UM laço: o ticker do GSAP. Nenhum estado React por quadro — a cola (materia-scene.tsx) dá alvos
 * (`set`, `grab`, `reveal`, `slit`, `tint`) e o motor chega a eles com o tempo.
 *
 * Três poses da mesma matéria: a HOME (a figura inteira, a dobra aberta e as moléculas nas bordas de
 * ruptura), o CÉREBRO (a conversa: a faixa de luz percorre o braço, a figura se desfaz e as moléculas
 * se reorganizam) e o BUSTO de moléculas (só no recorte "Ver uma ideia para o meu site").
 */
export type Point = { x: number; y: number };
/** `home`: centro da cabeça em repouso (px CSS). `talk`: centro do cérebro na conversa e a sua escala relativa. */
export type Layout = { w: number; h: number; k: number; home: Point; talk: { x: number; y: number; k: number }; /** Até onde o busto aparece, em unidades abaixo do centro da cabeça (telefone: a grade de apps). */ floor?: number; /** A home: onde fica a ponta da dobra (px CSS) e quantos px vale uma unidade da figura. */ hero: { x: number; y: number; k: number }; /** Telefone: a altura (px CSS) em que a cena da home já se apagou — a grade de apps começa ali. */ heroFloor?: number };
export type Rect = { x0: number; y0: number; x1: number; y1: number };
export type Trans = { from: Mood; to: Mood; p: number; dir: 1 | -1; ox: number; oy: number };
export type Targets = { talk: boolean; listen: number; speak: number; calm: number; align: number; /** O recorte no rosto está aberto. */ portal: boolean; /** A faixa de luz vira a superfície do mar. */ sea: number; /** Onde a figura fica: 0 = repouso, 1 = o lugar da conversa. */ place: number };
/** A figura na tela agora (px CSS do canvas): centro, px por unidade e quanto o recorte está aberto (0..1). */
export type Figure = { x: number; y: number; k: number; open: number; /** A ponta da dobra agora (px CSS do canvas), px por unidade e quanto a cena da home está presente (0..1). */ tx: number; ty: number; fk: number; hero: number };
export type EngineInit = { canvas: HTMLCanvasElement; mood: Mood; lite: boolean; molecules: Molecules; figure: FigureMesh; /** Imagem estática: fundo transparente, sem ambiente, buffer preservado. */ still?: boolean; /** Com `still`: a cena inteira (a página lisa na cor do tema, a dobra e a figura), opaca. */ scene?: boolean };

export type Engine = {
  readonly mood: Mood;
  readonly trans: Readonly<Trans> | null;
  readonly frames: number;
  readonly dpr: number;
  readonly fpsNow: number;
  readonly count: number;
  readonly stats: Readonly<{ ms: number }>;
  /** Leitura para testes e medições: metamorfose (0 busto … 1 cérebro), afastamento entre os dois perfis (rad) e alvos. */
  readonly debug: Readonly<{ morph: number; split: number; pull: number; lag: number; listen: number; speak: number; calm: number; align: number; tint: number; slit: number; portal: number; sea: number; place: number; hero: number; grabX: number; grabY: number; held: boolean; wave: number; hover: number; reveal: number; cover: boolean; word: boolean; arms: number; offer: number; sheet: boolean; swapping: boolean; card: number; opening: boolean; openT: number; reachA: number; reachB: number; /** Onde cada mão toca e as duas quinas que elas seguram ao abrir Projetos (px CSS do canvas). */ hands: { a: Point; b: Point; cornerA: Point; cornerB: Point } }>;
  readonly figure: Readonly<Figure>;
  setLayout(l: Layout): void;
  setDpr(v: number): void;
  setMood(m: Mood): void;
  transition(to: Mood, origin: [number, number]): boolean;
  finish(to: Mood): void;
  set(t: Partial<Targets>): void;
  /** Gesto ao lado do rosto (−1..1) ou null ao soltar. */
  pull(p: Point | null): void;
  /** A ponta da dobra segue o gesto: deslocamento em unidades a partir do repouso; null solta (e a tensão corre pelo metal). */
  grab(p: Point | null): void;
  /** O visitante está sobre a dobra: a capa do projeto aparece inteira pela abertura. */
  hover(on: boolean): void;
  /**
   * Abrir Projetos: uma mão firma a ponta, a outra apanha a borda de baixo e as duas esticam a abertura até ela
   * coincidir com a janela (`rect`, px CSS do canvas); a capa preenche `inner` (o corpo da janela). null devolve a dobra.
   */
  reveal(rect: Rect | null, inner?: Rect | null): void;
  /** Uma ficha (o perfil, o briefing) sobe apoiada na palma, gira com o punho e cresce até a janela `win`. */
  present(win: Rect, image: HTMLCanvasElement | null): void;
  /** Na conversa, uma das mãos traz para a cena a peça recomendada; null a leva embora. */
  offer(image: HTMLImageElement | ImageBitmap | null): void;
  /** Trocar de projeto na coleção: uma mão apresenta a próxima peça, a outra retira a anterior. */
  swap(dir: 1 | -1): void;
  /** O visitante não quer esperar o gesto: a ação em curso vale como terminada. */
  settle(): void;
  /** Câmera lenta, para medir e gravar os gestos (1 = tempo real). */
  pace(v?: number): number;
  /** A capa do projeto que se vê pela abertura. */
  cover(image: HTMLImageElement | ImageBitmap | null): void;
  /** O lema, para o reflexo invertido na aba (vermelho = letras, azul = o ponto final). */
  word(image: HTMLCanvasElement | null): void;
  /** A fenda de luz que atravessa o rosto. */
  slit(): void;
  /** Reflete uma imagem (a capa de um projeto) na prata; null devolve o metal. */
  tint(image: HTMLImageElement | ImageBitmap | null): void;
  start(): void;
  stop(): void;
  compile(): Promise<void>;
  calibrate(floor?: number): number;
  /** Custo de um quadro (ms) com cada parte desligada — para ajuste, não roda em produção. */
  probe(): Record<string, number>;
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
  /** Imagem estática da figura sobre transparente (o cérebro): sem ambiente. */
  const bare = !!init.still && !init.scene;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas: init.canvas, antialias: true, alpha: bare, depth: true, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: !!init.still });
  } catch {
    return null;
  }
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, bare ? 0 : 1);

  const M = init.molecules;
  const F = init.figure;
  const home = heroTargets(M, F);
  const camera = new PerspectiveCamera(MATERIA.fov, 1, 0.5, 80);
  const scene = new Scene();
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(M.bust, 3));
  geo.setAttribute("aNormal", new BufferAttribute(M.normal, 3));
  geo.setAttribute("aBrain", new BufferAttribute(M.brain, 3));
  geo.setAttribute("aBrainN", new BufferAttribute(M.brainNormal, 3));
  geo.setAttribute("aMeta", new BufferAttribute(M.meta, 4, true));
  geo.setAttribute("aHero", new BufferAttribute(home.pos, 3));
  geo.setAttribute("aHeroN", new BufferAttribute(home.nrm, 4));
  // o que a figura, as moléculas e o ambiente leem juntos: a mesma dobra, no mesmo lugar
  const shared = { uFigScale: { value: 1 }, uFigOffset: { value: new Vector3() }, uGrabF: { value: new Vector3() }, uGrab: { value: new Vector2() }, uOpen: { value: 1 }, uFloorPx: { value: new Vector2(-2e5, -1e5) } };

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
      ...shared, uHeroK: { value: 1 }, uFoldW: { value: 1 }, uTipW: { value: new Vector2() }, uRevealM: { value: 0 },
    },
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // A figura da home, articulada (rig.ts): o corpo, e o braço + a mão desenhados duas vezes — o que segura a ponta usa a
  // malha espelhada (por isso o verso das faces). As mãos têm três formas; cada uma liga duas por vez.
  const HOME_X = [RIG.homeHand[0], RIG.homeHand[1], RIG.homeHand[2]] as V3;
  const HOME_Y = [RIG.homeHand[3], RIG.homeHand[4], RIG.homeHand[5]] as V3;
  const hiddenArm = (): ArmGoal => ({ at: [1.5, -2.5, 0.5], contact: "palm", fingers: [-0.3, -0.9, 0.2], back: [0.25, 0.1, 1], pole: [0.8, -0.2, 0.6], shape: "relax" });
  const rig = createRig({ a: { at: [RIG.pinch[0], RIG.pinch[1], RIG.pinch[2]], contact: "pinch", fingers: HOME_X, back: HOME_Y, pole: [0.35, -1, 0.45], shape: "pinch" }, b: hiddenArm(), lean: [0, 0, 0], look: [0, 0] });
  const figScene = new Scene();
  const shadowScene = new Scene();
  const figUniforms = { ...shared, uLight: mat.uniforms.uLight, uAccent: mat.uniforms.uAccent, uKey: mat.uniforms.uKey, uFade: mat.uniforms.uFade, uSweep: { value: -1 }, uKeep: { value: 0.42 }, uGlowAt: { value: new Vector3(0.12, -0.28, 1) }, uBone: { value: rig.bones } };
  const figMats: ShaderMaterial[] = [];
  const figGeos: BufferGeometry[] = [];
  const attrs = (part: FigurePart) => ({ pos: part.shapes.map((sh) => new BufferAttribute(sh.position, 3)), na: part.shapes.map((sh) => new BufferAttribute(sh.na, 4, true)), meta: new BufferAttribute(part.meta, 4, true), skin: new BufferAttribute(part.skin, 4), index: new BufferAttribute(part.index, 1) });
  const piece = (A: ReturnType<typeof attrs>, off: number, side: Side, casts: boolean) => {
    const g = new BufferGeometry();
    g.setAttribute("position", A.pos[0]);
    g.setAttribute("aPosB", A.pos[0]);
    g.setAttribute("aNA", A.na[0]);
    g.setAttribute("aNB", A.na[0]);
    g.setAttribute("aMeta", A.meta);
    g.setAttribute("aSkin", A.skin);
    g.setIndex(A.index);
    const own = { ...figUniforms, uBoneOff: { value: off }, uShape: { value: 0 } };
    const m = new ShaderMaterial({ vertexShader: FIGURE_VERT, fragmentShader: FIGURE_FRAG, side, depthTest: true, depthWrite: true, toneMapped: false, uniforms: own });
    const mesh = new Mesh(g, m);
    mesh.frustumCulled = false;
    figScene.add(mesh);
    figMats.push(m);
    figGeos.push(g);
    if (casts) {
      // só as mãos projetam sombra na página
      const sm = new ShaderMaterial({ vertexShader: FIGURE_VERT, fragmentShader: FIGURE_SHADOW_FRAG, side, depthTest: false, depthWrite: false, toneMapped: false, uniforms: own });
      const caster = new Mesh(g, sm);
      caster.frustumCulled = false;
      shadowScene.add(caster);
      figMats.push(sm);
    }
    return { g, own, mesh };
  };
  const armAttrs = attrs(F.arm);
  const handAttrs = attrs(F.hand);
  const body = piece(attrs(F.body), 0, FrontSide, false);
  piece(armAttrs, 0, BackSide, false);
  const handA = piece(handAttrs, 0, BackSide, true);
  piece(armAttrs, 3, FrontSide, false);
  const handB = piece(handAttrs, 3, FrontSide, true);
  const shapeNow = { a: [-1, -1], b: [-1, -1] };
  const setShape = (h: typeof handA, state: number[], from: number, to: number, k: number) => {
    if (state[0] !== from || state[1] !== to) {
      state[0] = from;
      state[1] = to;
      h.g.setAttribute("position", handAttrs.pos[from]);
      h.g.setAttribute("aPosB", handAttrs.pos[to]);
      h.g.setAttribute("aNA", handAttrs.na[from]);
      h.g.setAttribute("aNB", handAttrs.na[to]);
    }
    h.own.uShape.value = k;
  };
  const shadowRT = new WebGLRenderTarget(4, 4, { depthBuffer: false, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter, generateMipmaps: false });
  let coverTex: Texture | null = null;
  let wordTex: Texture | null = null;

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
      uGrab: shared.uGrab, uOpen: shared.uOpen, uFloorPx: shared.uFloorPx, uFlat: { value: init.still ? 1 : 0 },
      uTip: { value: new Vector2() }, uFoldK: { value: 300 }, uHero: { value: 1 }, uHover: { value: 0 }, uWave: { value: new Vector2(9, 0) }, uReveal: { value: 0 }, uWinQ: { value: new Vector4(-1, -1, 1, 1) }, uFoldBottom: { value: -3 }, uCoverRect: { value: new Vector4(0, 0, 1, 1) }, uChrome: { value: new Vector3(0.07, 0.07, 0.085) },
      uCard: { value: new Vector4() }, uCardM: { value: new Vector4() }, uCardTex: { value: blank }, uCardAr: { value: 1 },
      uCover: { value: blank }, uWord: { value: blank }, uShadow: { value: shadowRT.texture }, uCoverK: { value: 0 }, uCoverAr: { value: 1.6 }, uWordK: { value: 0 }, uShadowK: { value: 1 },
    },
  });
  const bgMesh = new Mesh(bgGeo, bgMat);
  bgMesh.frustumCulled = false;
  bgScene.add(bgMesh);

  // ---- estado ----
  let mood: Mood = init.mood;
  let tr: (Trans & { e: number }) | null = null;
  let trClock = 0;
  let layout: Layout = { w: 1, h: 1, k: 300, home: { x: 0.5, y: 0.5 }, talk: { x: 0.5, y: 0.5, k: 1 }, hero: { x: 0.5, y: 0.5, k: 300 } };
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
  const now = { morph: 0, listen: 0, speak: 0, calm: 0, align: 0, tint: 0, intro: init.still ? 1 : 0, portal: 0, sea: 0, place: 0, hero: 1, hover: 0, reveal: 0, arms: 1, offer: 0 };
  const fig: Figure = { x: 0, y: 0, k: 300, open: 0, tx: 0, ty: 0, fk: 300, hero: 1 };
  // a ponta da dobra: uma mola entre o gesto e o repouso; ao soltar, a sobra vira onda no metal
  let grabTarget: Point | null = null;
  const grab = { x: 0, y: 0, vx: 0, vy: 0 };
  let releasedAt = -10;
  let waveAmp = 0;
  let hoverWant = 0;
  // Abrir Projetos: a dobra vira a janela (`revealRect`), com a capa no corpo dela (`revealBody`).
  let revealRect: Rect | null = null;
  let revealBody: Rect | null = null;
  let revealWant = 0;
  let openT = 0;
  // Uma ficha apoiada na palma vira a janela (perfil, orçamento); na conversa, a mão traz a peça recomendada.
  let sheet: { win: Rect; t: number } | null = null;
  let sheetTex: Texture | null = null;
  let sheetAr = 0.78;
  let offerWant = 0;
  let offerTex: Texture | null = null;
  let offerAr = 1.6;
  // Trocar de projeto na coleção: uma mão apresenta a próxima peça, a outra retira a anterior.
  let swapT = 9;
  let swapDir = 1;
  const card = { x: 0, y: 0, hw: 0, hh: 0, rot: 0, face: 1, k: 0, r: 8, ar: 1 };
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
    shadowRT.setSize(Math.max(4, Math.ceil((layout.w * dpr) / 4)), Math.max(4, Math.ceil((layout.h * dpr) / 4)));
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
    // A home: a ponta da pinça (com a perspectiva dela) cai exatamente sobre a ponta da dobra, e a mão a acompanha.
    const Hr = layout.hero;
    const sF = Hr.k / layout.k;
    const persp = (D - RIG.pinch[2] * sF) / D;
    const presence = MathUtils.smoothstep(now.hero, 0, 0.2);
    const rev = ease(now.reveal);
    shared.uFigScale.value = sF;
    shared.uFigOffset.value.set(((Hr.x - layout.w / 2) / layout.k) * persp - RIG.pinch[0] * sF, (-(Hr.y - layout.h / 2) / layout.k) * persp - RIG.pinch[1] * sF, 0);
    shared.uGrabF.value.set(grab.x * persp, grab.y * persp, 0);
    shared.uGrab.value.set(grab.x, grab.y);
    shared.uOpen.value = MathUtils.smoothstep(now.hero, 0, 0.75);
    figUniforms.uSweep.value = (1 - now.hero) * 1.3 - 0.12;
    // na conversa os braços ficam (a faixa de luz passa por eles); no recorte a figura inteira vira o busto de moléculas
    figUniforms.uKeep.value = now.arms * 0.42 - (1 - now.arms) * 1.2;
    figUniforms.uGlowAt.value.set((grab.x + 0.12) * persp, (grab.y - 0.28) * persp, (1 - rev) * presence);
    setShape(handA, shapeNow.a, rig.hand.a.from, rig.hand.a.to, rig.hand.a.k);
    setShape(handB, shapeNow.b, rig.hand.b.from, rig.hand.b.to, rig.hand.b.k);
    body.mesh.visible = now.hero > 0.001;
    u.uHeroK.value = now.hero;
    u.uRevealM.value = rev;
    u.uFoldW.value = sF;
    u.uTipW.value.set((Hr.x - layout.w / 2) / layout.k, -(Hr.y - layout.h / 2) / layout.k);
    fig.tx = Hr.x + grab.x * Hr.k;
    fig.ty = Hr.y - grab.y * Hr.k;
    fig.fk = Hr.k;
    fig.hero = now.hero;
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
    if (layout.heroFloor === undefined) shared.uFloorPx.value.set(-2e5, -1e5);
    else {
      // telefone: a cena se apaga antes da grade de apps — menos quando a dobra vira a tela do app (ela cresce até embaixo)
      const floor = layout.heroFloor + (layout.h + 90 - layout.heroFloor) * rev;
      shared.uFloorPx.value.set(H - floor * k, H - (floor - 54) * k);
    }
    const heroOn = now.hero > 0.001 || now.arms > 0.001;
    if (!bare && heroOn) {
      // a silhueta da figura, em um quarto da resolução: é a sombra que a mão projeta na página
      renderer.setRenderTarget(shadowRT);
      renderer.clear();
      renderer.render(shadowScene, camera);
    }
    renderer.setRenderTarget(null);
    renderer.clear();
    if (!bare) {
      b.uRes.value.set(W, H);
      b.uTime.value = t % MATERIA.timeWrap;
      b.uHead.value.set(cx * k, H - cy * k, layout.k * scale * k);
      b.uBend.value = (split / MATERIA.fold.yaw) * (1 - ease(now.morph));
      // a faixa diagonal do ambiente é da conversa e do recorte; na home a luz é a da fenda
      b.uBand.value = (1 - 0.75 * now.calm) * (1 - 0.6 * ease(now.morph)) * (1 - presence);
      b.uSea.value = now.sea;
      b.uSlit.value = slit;
      b.uP.value = tr ? tr.p : 0;
      if (tr) b.uOrigin.value.set(tr.ox * k, H - tr.oy * k);
      b.uTip.value.set(Hr.x * k, H - Hr.y * k);
      b.uFoldK.value = Hr.k * k;
      b.uHero.value = presence;
      b.uHover.value = now.hover;
      b.uWave.value.set(Math.min(9, t - releasedAt), waveAmp);
      b.uReveal.value = rev;
      const Wq = winQ();
      b.uWinQ.value.set(Wq.l, Wq.b, Wq.r, Wq.t);
      b.uFoldBottom.value = foldBottom();
      const inner = revealBody ?? revealRect;
      if (inner) b.uCoverRect.value.set(inner.x0 * k, H - inner.y1 * k, inner.x1 * k, H - inner.y0 * k);
      b.uChrome.value.set(0.07, 0.07, 0.085).lerp(tmp.set(0.93, 0.94, 0.96), u.uLight.value);
      b.uCard.value.set(card.x * k, H - card.y * k, card.hw * k, card.hh * k);
      b.uCardM.value.set(card.rot, card.face, card.k, card.r * k);
      b.uCardAr.value = card.ar;
      b.uCardTex.value = (sheet ? sheetTex : offerTex) ?? blank;
      renderer.render(bgScene, bgCam);
      renderer.clearDepth();
    }
    if (heroOn) renderer.render(figScene, camera);
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
    // A home: a figura se forma (da cabeça à mão) fora da conversa e do recorte; quando a conversa abre, a
    // faixa de luz percorre o braço até a cabeça e a matéria fica livre para virar o cérebro.
    const HR = MATERIA.hero;
    now.hero = Math.max(0, Math.min(1, now.hero + (heroWant() ? dt / HR.form : -dt / HR.sweep)));
    if (!heroWant() && grabTarget) release();
    const S = grabTarget ? HR.hold : HR.free;
    const gx = grabTarget ? grabTarget.x : 0;
    const gy = grabTarget ? grabTarget.y : 0;
    const hs = dt / 4;
    for (let i = 0; i < 4; i++) {
      grab.vx += (-S.k * (grab.x - gx) - S.c * grab.vx) * hs;
      grab.vy += (-S.k * (grab.y - gy) - S.c * grab.vy) * hs;
      grab.x += grab.vx * hs;
      grab.y += grab.vy * hs;
    }
    now.hover += (hoverWant - now.hover) * (1 - Math.exp(-dt / 0.22));
    // Abrir Projetos: alcançar a borda → esticar até a janela → soltar. Ao voltar, a abertura encolhe até a dobra.
    if (revealWant) {
      openT += dt;
      now.reveal = MathUtils.clamp((openT - HR.open.reach) / HR.open.stretch, 0, 1);
    } else {
      openT = 0;
      now.reveal = Math.max(0, now.reveal - (1.6 * dt) / HR.reveal);
    }
    swapT += dt;
    now.arms = MathUtils.clamp(now.arms + (target.portal || now.portal > 0.04 ? -dt / 0.5 : dt / 0.7), 0, 1);
    now.offer += ((target.talk ? offerWant : 0) - now.offer) * (1 - Math.exp(-dt / 0.3));
    // a ficha: sobe apoiada na palma, gira com o punho e cresce até a janela; na conversa, é a peça recomendada
    const Hr = layout.hero;
    if (sheet) {
      sheet.t += dt;
      const S2 = HR.sheet;
      const up = ease(MathUtils.clamp(sheet.t / S2.raise, 0, 1));
      const turn = ease(MathUtils.clamp((sheet.t - S2.raise) / S2.turn, 0, 1));
      const grow = ease(MathUtils.clamp((sheet.t - S2.raise - S2.turn) / S2.grow, 0, 1));
      const hh0 = Hr.k * 0.46;
      const hw0 = hh0 * sheetAr;
      const x0 = Hr.x + Hr.k * (1.75 - 0.8 * up);
      const y0 = Hr.y + Hr.k * (1.2 - 1.45 * up);
      const w = sheet.win;
      card.x = x0 + ((w.x0 + w.x1) / 2 - x0) * grow;
      card.y = y0 + ((w.y0 + w.y1) / 2 - y0) * grow;
      card.hw = hw0 + ((w.x1 - w.x0) / 2 - hw0) * grow;
      card.hh = hh0 + ((w.y1 - w.y0) / 2 - hh0) * grow;
      card.rot = -0.16 * (1 - turn);
      card.face = 0.14 + 0.86 * turn;
      card.r = 10;
      card.ar = sheetAr;
      card.k = Math.min(1, sheet.t / 0.12) * (1 - MathUtils.clamp((sheet.t - S2.raise - S2.turn - S2.grow - 0.12) / 0.25, 0, 1));
      if (sheet.t > S2.raise + S2.turn + S2.grow + 0.4) sheet = null;
    } else if (now.offer > 0.01) {
      const hw = Hr.k * 0.42;
      card.x = layout.talk.x - Hr.k * 1.02;
      card.y = layout.talk.y + Hr.k * (0.62 - 0.5 * ease(now.offer));
      card.hw = hw;
      card.hh = hw / offerAr;
      card.rot = -0.07;
      card.face = 0.3 + 0.7 * ease(now.offer);
      card.k = now.offer;
      card.r = 8;
      card.ar = offerAr;
    } else card.k = 0;
    rig.update(goals(), dt);
  };
  const heroWant = () => !target.talk && !target.portal && now.portal < 0.04;
  /** A janela que a dobra vira, em unidades da dobra a partir da ponta em repouso (y para cima). */
  const winQ = () => {
    const Hr = layout.hero;
    const r = revealRect;
    return r ? { l: (r.x0 - Hr.x) / Hr.k, r: (r.x1 - Hr.x) / Hr.k, t: -(r.y0 - Hr.y) / Hr.k, b: -(r.y1 - Hr.y) / Hr.k } : { l: -1, r: 1, t: 1, b: -1 };
  };
  /** A borda de baixo da abertura em repouso fica fora da tela. */
  const foldBottom = () => -((layout.heroFloor ?? layout.h) - layout.hero.y) / layout.hero.k - 0.3;
  const foldLq = (d: number) => -0.22 * Math.pow(Math.max(d, 0), 0.62) * (1 + 0.3 * Math.max(d, 0)); // hero-shaders.ts › foldL
  /**
   * O que cada braço faz agora — sai da ação em curso, e a figura corre até lá a partir da pose em que está.
   * Os pontos de contato são os da cena: a ponta da dobra, as quinas da abertura que vira janela, a base da ficha.
   */
  const goals = (): Goal => {
    const Hr = layout.hero;
    const HR = MATERIA.hero;
    const D = camZ();
    const persp = (D - (RIG.pinch[2] * Hr.k) / layout.k) / D;
    const at = (qx: number, qy: number, dz = 0): V3 => [qx * persp, qy * persp, RIG.pinch[2] + dz];
    const cardBase = (): V3 => at((card.x - Hr.x) / Hr.k + 0.03, -(card.y + card.hh - Hr.y) / Hr.k - 0.015);
    let a: ArmGoal = { at: at(grab.x, grab.y), contact: "pinch", fingers: HOME_X, back: HOME_Y, pole: [0.35, -1, 0.45], shape: "pinch", rate: 400 };
    let b = hiddenArm();
    let lean: V3 = [0, 0, 0];
    let look: [number, number] = [0, 0];
    if (target.talk || now.morph > 0.5) {
      // a conversa: as mãos relaxam embaixo, fora da área de leitura; uma delas traz a peça recomendada
      const tx = (layout.talk.x - Hr.x) / Hr.k;
      const ty = -(layout.talk.y - Hr.y) / Hr.k;
      a = { at: at(tx + 0.55, ty - 1.15, -0.1), contact: "palm", fingers: [-0.9, 0.12, 0.3], back: [0.1, 0.8, 0.6], pole: [0.5, -0.8, 0.5], shape: "relax", rate: 5 };
      b = { at: at(tx - 0.4, ty - 1.22, -0.2), contact: "palm", fingers: [-0.85, 0.2, 0.35], back: [0.15, 0.75, 0.65], pole: [0.4, -1, 0.4], shape: "relax", rate: 5 };
      if (now.offer > 0.02) b = { at: cardBase(), contact: "palm", fingers: [-0.9, 0.15, 0.35], back: [0.05, -0.9, 0.35], pole: [0.5, -0.9, 0.4], shape: "open", rate: 12 };
      return { a, b, lean, look };
    }
    if (revealWant || now.reveal > 0) {
      // abrir Projetos: A firma a ponta e a leva ao canto de cima; B apanha a borda de baixo e a leva ao canto oposto
      const s = ease(now.reveal);
      const W = winQ();
      const reach = revealWant ? MathUtils.clamp(openT / HR.open.reach, 0, 1) : 0;
      const rel = revealWant ? ease(MathUtils.clamp((openT - HR.open.reach - HR.open.stretch) / HR.open.release, 0, 1)) : 0;
      const top = W.t * s;
      const low = foldBottom();
      const grip = Math.max(low + (W.b - low) * s, low + 0.44);
      const edge = foldLq(top - grip);
      a.at = at(W.r * s + 0.34 * rel, top - 0.22 * rel);
      a.pole = [0.7, -0.5, 0.5];
      if (rel > 0) a = { ...a, contact: "tips", fingers: [-0.92, -0.2, 0.3], back: [0.1, 0.7, 0.7], shape: rel > 0.3 ? "relax" : "open", rate: 9 };
      if (revealWant && rel < 0.7) b = { at: at(edge + (W.l - edge) * s + 0.5 * rel, grip - 0.6 * rel), contact: "pinch", fingers: [-0.86, -0.3, 0.4], back: [0.3, 0.5, 0.82], pole: [0.25, -1, 0.5], shape: rel > 0 ? "open" : "pinch", rate: reach < 1 ? 11 : 400 };
      const hold = reach * (1 - rel);
      lean = [-0.26 * s * (1 - rel), -0.1 * s * (1 - rel), 0.06 * s * (1 - rel)];
      look = [-0.05 * hold, 0.17 * hold];
      if (rel >= 1 && swapT < HR.swap) {
        // na coleção: uma mão apresenta a próxima peça (um toque na borda), a outra retira a anterior
        const w = swapT / HR.swap;
        const jab = Math.sin(Math.PI * Math.min(1, w / 0.55));
        a = { ...a, at: at(W.r + 0.34 - 0.38 * jab, top - 0.22 - 0.3 * swapDir * jab), shape: "open", rate: 14 };
        b = { at: at(W.r - 0.3 - 0.1 * w, W.b - 0.02 - 0.75 * ease(w)), contact: "pinch", fingers: [-0.6, 0.5, 0.5], back: [0.4, 0.4, 0.8], pole: [0.6, -0.8, 0.4], shape: w < 0.75 ? "pinch" : "open", rate: 14 };
      }
    }
    if (sheet) {
      // apresentar a ficha: a palma por baixo dela, e o punho gira para mostrá-la de frente
      const S2 = HR.sheet;
      const turn = ease(MathUtils.clamp((sheet.t - S2.raise) / S2.turn, 0, 1));
      const gone = MathUtils.clamp((sheet.t - S2.raise - S2.turn - S2.grow * 0.3) / (S2.grow * 0.7), 0, 1);
      if (gone < 1) b = { at: cardBase(), contact: "palm", fingers: [-0.95 + 0.45 * turn, 0.08, 0.25 + 0.5 * turn], back: [0.05, -0.92, 0.3], pole: [0.5, -0.9, 0.45], shape: "open", rate: 16 };
      look = [0.12 * (1 - gone), 0.04 * (1 - gone)];
    }
    return { a, b, lean, look };
  };
  const release = () => {
    if (!grabTarget) return;
    grabTarget = null;
    releasedAt = t;
    waveAmp = Math.min(1, Math.hypot(grab.x, grab.y) / MATERIA.hero.reach + Math.hypot(grab.vx, grab.vy) * 0.2);
  };

  /** Algo se mexe por causa do visitante (ou ainda está assentando)? */
  const busy = () =>
    !!tr || now.intro < 1 || slitAt >= 0 || !!pullTarget || Math.abs(pullNow.x - pullLag.x) > 0.002 || Math.abs(pullNow.x) > 0.004 ||
    (now.morph > 0 && now.morph < 1) || now.listen > 0.02 || now.speak > 0.02 || Math.abs(now.tint - tintWant) > 0.01 || Math.abs(now.align - target.align) > 0.01 ||
    target.portal || now.portal > 0 || now.sea > 0.01 || Math.abs(now.place - target.place) > 0.005 ||
    now.hero !== (heroWant() ? 1 : 0) || !!grabTarget || Math.abs(grab.x) + Math.abs(grab.y) > 0.002 || Math.abs(grab.vx) + Math.abs(grab.vy) > 0.01 || t - releasedAt < 1.8 ||
    Math.abs(now.hover - hoverWant) > 0.01 || now.reveal !== revealWant || rig.moving || !!sheet || swapT < MATERIA.hero.swap ||
    Math.abs(now.offer - (target.talk ? offerWant : 0)) > 0.01 || (now.arms > 0 && now.arms < 1) || (revealWant === 1 && openT < MATERIA.hero.open.reach + MATERIA.hero.open.stretch + MATERIA.hero.open.release + 0.3);

  /** A home inteira e quieta: nada na cena muda, então o quadro que está na tela continua valendo. */
  const resting = () => now.hero === 1 && now.morph === 0 && now.intro >= 1 && !tr && !rig.moving;
  let dirty = 2;
  /** Câmera lenta (só para medições e gravações): 1 = tempo real. */
  let pace = 1;
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
    calmFor = busy() || dirty > 0 ? 0 : calmFor + deltaMS / 1000;
    fpsNow = calmFor < MATERIA.fps.calm ? activeFps : MATERIA.fps.idle;
    if (calmFor >= MATERIA.fps.calm && resting()) {
      fpsNow = 0;
      acc = 0;
      return;
    }
    if (acc + 1 < 1000 / fpsNow) return;
    const dt = (Math.min(acc, 100) / 1000) * pace;
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
    if (dirty > 0) dirty--;
    if (done && tr) finishTr(done);
    // quadros lentos seguidos baixam a resolução (nunca abaixo do mínimo)
    const B = MATERIA.budget;
    slowEma = slowEma * 0.92 + (deltaMS > 1.6 * (1000 / fpsNow) || stats.ms > B.slowMs ? 0.08 : 0);
    cooldown -= dt;
    if (cooldown <= 0 && slowEma > 0.5 && dpr > B.minDpr + 0.01) {
      dpr = Math.max(B.minDpr, dpr * B.step);
      resize();
      dirty = 2;
      slowEma = 0;
      cooldown = 2.5;
    }
  };

  /** Onde cada mão toca agora e onde estão as duas quinas da abertura que elas seguram (px CSS do canvas). */
  const hands = () => {
    const Hr = layout.hero;
    const D = camZ();
    const persp = (D - (RIG.pinch[2] * Hr.k) / layout.k) / D;
    const px = (v: readonly number[]): Point => ({ x: Hr.x + (v[0] / persp) * Hr.k, y: Hr.y - (v[1] / persp) * Hr.k });
    const s = ease(now.reveal);
    const W = winQ();
    const low = foldBottom();
    const yb = low + (W.b - low) * s;
    const edge = foldLq(W.t * s - yb);
    return { a: px(rig.joints.a.touch), b: px(rig.joints.b.touch), cornerA: { x: Hr.x + W.r * s * Hr.k, y: Hr.y - W.t * s * Hr.k }, cornerB: { x: Hr.x + (edge + (W.l - edge) * s) * Hr.k, y: Hr.y - yb * Hr.k } };
  };

  /** Textura que sai como entrou (os shaders já trabalham em cor de tela). */
  const plain = (image: TexImageSource) => {
    const tex = new Texture(image as HTMLImageElement);
    tex.colorSpace = NoColorSpace;
    tex.minFilter = LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
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
      return { morph: now.morph, split: pullNow.x - pullLag.x, pull: pullNow.x, lag: pullLag.x, listen: now.listen, speak: now.speak, calm: now.calm, align: now.align, tint: now.tint, slit: slitAt < 0 ? -1 : (t - slitAt) / MATERIA.slit, portal: now.portal, sea: now.sea, place: now.place, hero: now.hero, grabX: grab.x, grabY: grab.y, held: !!grabTarget, wave: t - releasedAt < 1.8 ? waveAmp : 0, hover: now.hover, reveal: now.reveal, cover: b.uCoverK.value > 0, word: b.uWordK.value > 0, arms: now.arms, offer: now.offer, sheet: !!sheet, swapping: swapT < MATERIA.hero.swap, card: card.k, opening: revealWant === 1, openT, reachA: rig.reach.a, reachB: rig.reach.b, hands: hands() };
    },
    figure: fig,
    setLayout(l) {
      const sized = l.w !== layout.w || l.h !== layout.h;
      layout = l;
      if (sized) resize();
      dirty = 2;
    },
    setDpr(v) {
      dpr = v;
      resize();
      dirty = 2;
    },
    setMood(m) {
      if (tr) finishTr(m);
      mood = m;
      applyMood(mood, mood, 0);
      dirty = 2;
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
    grab(p) {
      if (!p) return release();
      if (!heroWant() || now.hero < 0.98 || revealWant || now.reveal > 0 || sheet) return;
      const R = MATERIA.hero.reach;
      const len = Math.hypot(p.x, p.y);
      const f = len > R ? R / len : 1;
      grabTarget = { x: p.x * f, y: p.y * f };
    },
    hover(on) {
      hoverWant = on ? 1 : 0;
    },
    reveal(rect, inner) {
      if (rect) {
        release();
        revealRect = rect;
        revealBody = inner ?? null;
        if (!revealWant) openT = 0;
      }
      revealWant = rect ? 1 : 0;
    },
    present(win, image) {
      release();
      if (image) {
        sheetTex?.dispose();
        sheetTex = plain(image);
        sheetAr = image.width / Math.max(1, image.height);
      }
      sheet = { win, t: 0 };
      dirty = 2;
    },
    offer(image) {
      if (image) {
        offerTex?.dispose();
        offerTex = plain(image);
        offerAr = ("naturalWidth" in image ? image.naturalWidth / Math.max(1, image.naturalHeight) : image.width / Math.max(1, image.height)) || 1.6;
      }
      offerWant = image ? 1 : 0;
    },
    swap(dir) {
      swapT = 0;
      swapDir = dir;
    },
    pace(v) {
      if (v !== undefined) pace = Math.max(0.02, Math.min(1, v));
      return pace;
    },
    settle() {
      const HR = MATERIA.hero;
      if (revealWant) openT = Math.max(openT, HR.open.reach + HR.open.stretch + HR.open.release);
      if (sheet) sheet.t = Math.max(sheet.t, HR.sheet.raise + HR.sheet.turn + HR.sheet.grow + 0.12);
    },
    cover(image) {
      coverTex?.dispose();
      coverTex = null;
      if (!image) {
        b.uCover.value = blank;
        b.uCoverK.value = 0;
        return;
      }
      dirty = 2;
      coverTex = plain(image);
      b.uCover.value = coverTex;
      b.uCoverAr.value = "naturalWidth" in image ? image.naturalWidth / Math.max(1, image.naturalHeight) : image.width / Math.max(1, image.height);
      b.uCoverK.value = 1;
    },
    word(image) {
      wordTex?.dispose();
      wordTex = image ? plain(image) : null;
      dirty = 2;
      b.uWord.value = wordTex ?? blank;
      b.uWordK.value = wordTex ? 1 : 0;
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
      dirty = 2;
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
      await renderer.compileAsync(figScene, camera);
      if (!bare) {
        await renderer.compileAsync(shadowScene, camera);
        await renderer.compileAsync(bgScene, bgCam);
      }
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
    probe() {
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      const run = () => {
        render();
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const p0 = performance.now();
        for (let i = 0; i < 4; i++) {
          render();
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        }
        return +((performance.now() - p0) / 4).toFixed(1);
      };
      const out: Record<string, number> = { all: run() };
      points.visible = false;
      out.semMoleculas = run();
      points.visible = true;
      figScene.visible = false;
      out.semFigura = run();
      figScene.visible = true;
      bgMesh.visible = false;
      out.semFundo = run();
      bgMesh.visible = true;
      return out;
    },
    still(m, morph) {
      mood = m;
      tr = null;
      applyMood(m, m, 0);
      t = 0;
      now.morph = morph;
      now.hero = morph < 0.5 ? 1 : 0;
      // a imagem do cérebro é só ele (as mãos da conversa pertencem à cena viva)
      now.arms = morph < 0.5 ? 1 : 0;
      now.intro = 1;
      rig.snap(goals());
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
      figGeos.forEach((g) => g.dispose());
      figMats.forEach((m) => m.dispose());
      sheetTex?.dispose();
      offerTex?.dispose();
      shadowRT.dispose();
      coverTex?.dispose();
      wordTex?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  applyMood(mood, mood, 0);
  return api;
}
