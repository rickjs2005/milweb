import { BackSide, BufferAttribute, BufferGeometry, Color, CustomBlending, FrontSide, type Side, DataTexture, LinearFilter, MathUtils, Mesh, OneFactor, OneMinusSrcAlphaFactor, OrthographicCamera, PerspectiveCamera, Points, RGBAFormat, Scene, ShaderMaterial, SRGBColorSpace, Texture, Vector2, Vector3, Vector4, WebGLRenderTarget, WebGLRenderer } from "three";
import { gsap } from "@/animations/gsap";
import { ACT_TIME, actAt, idle, type ActFrame, type ActId } from "./acts";
import type { FigureMesh, FigurePart, Molecules } from "./asset";
import { FRAMES, MATERIA, PALETTE, type Mood } from "./config";
import { FIGURE_FRAG, FIGURE_SHADOW_FRAG, FIGURE_VERT, GRAIN_FRAG, GRAIN_VERT, KEY_LIGHT, PASSAGE_FRAG, PASSAGE_VERT, SILVER_FRAG, SILVER_VERT, WALL_FRAG, WALL_VERT } from "./hero-shaders";
import { heroTargets } from "./hero-targets";
import { passageCircle, passagePoly, type Pt, type Rect, type Shape } from "./passage";
import { BONES, createRig, type Goal, type RigFrame, type V3 } from "./rig";
import { SCULPT } from "./sculpt-data";
import type { Sculpt, SculptId } from "./sculpt";
import { BACKDROP_FRAG, BACKDROP_VERT, MOLECULE_FRAG, MOLECULE_VERT } from "./shaders";

/**
 * Motor da Matéria: um WebGLRenderer, o ateliê (um plano de tela inteira), as ESCULTURAS (a figura em repouso
 * e as seis que ela vira, uma malha cada), os braços articulados (rig.ts), os GRÃOS da transformação, os grãos
 * de prata do repouso, a PASSAGEM (a abertura por onde a página do destino aparece) e as moléculas (o cérebro da
 * conversa e o busto do recorte). UM laço: o ticker do GSAP. Nenhum estado React por quadro — a cola
 * (materia-scene.tsx) dá alvos (`set`, `become`, `act`, `tint`) e o motor chega a eles com o tempo.
 *
 *   repouso        a escultura inteira; os grãos de prata completam o trecho que falta no punho
 *   transformação  a pedra se desfaz de cima para baixo, os grãos percorrem trajetos curtos (rosto com rosto,
 *                  tecido com tecido) e a figura do destino se forma de baixo para cima — os dedos primeiro
 *   gesto          as mãos alcançam, puxam e soltam (acts.ts); a abertura nasce presa a elas e segue até as
 *                  coordenadas reais da janela
 *   conversa       a escultura se recolhe e as moléculas viram o cérebro; no recorte, o busto
 */
export type Point = Pt;
export type { Rect } from "./passage";
/** `home`: centro do busto em repouso (px CSS). `talk`: centro do cérebro na conversa e a sua escala relativa. */
export type Layout = { w: number; h: number; k: number; home: Point; talk: { x: number; y: number; k: number }; /** Até onde o busto aparece, em unidades abaixo do centro da cabeça (telefone: a grade de apps). */ floor?: number; /** O quadro da escultura: centro (px CSS) e altura (px). */ hero: { x: number; y: number; h: number }; /** Telefone: a altura (px CSS) em que a cena já se apagou — a grade de apps começa ali. */ heroFloor?: number };
export type Trans = { from: Mood; to: Mood; p: number; dir: 1 | -1; ox: number; oy: number };
export type Targets = { talk: boolean; listen: number; speak: number; calm: number; align: number; /** O recorte no rosto está aberto. */ portal: boolean; /** A faixa de luz vira a superfície do mar. */ sea: number; /** Onde o busto fica: 0 = repouso, 1 = o lugar da conversa. */ place: number };
/** O busto na tela agora (px CSS do canvas): centro, px por unidade e quanto o recorte está aberto (0..1). */
export type Figure = { x: number; y: number; k: number; open: number; /** Quanto a escultura está presente (0..1). */ hero: number };
/** A passagem em curso, para a interface recortar a janela (px CSS do canvas). */
export type Passage = Shape & { app: ActId; /** 0 = presa às mãos … 1 = a janela inteira. */ q: number; focal: [number, number]; rect: Rect; done: boolean };
export type EngineInit = { canvas: HTMLCanvasElement; mood: Mood; lite: boolean; molecules: Molecules; /** Os braços e as mãos (materia-figure.bin). */ figure: FigureMesh; /** A figura em repouso. */ rest: Sculpt; /** Imagem estática: fundo transparente, sem ambiente, buffer preservado. */ still?: boolean; /** Com `still`: a cena inteira (a parede lisa na cor do tema e a escultura), opaca. */ scene?: boolean; /** Com `still`: a prova de silhueta — só a pedra, em preto sobre branco. */ silhouette?: boolean };

export type Engine = {
  readonly mood: Mood;
  readonly trans: Readonly<Trans> | null;
  readonly frames: number;
  readonly dpr: number;
  readonly fpsNow: number;
  readonly count: number;
  readonly stats: Readonly<{ ms: number }>;
  /** Leitura para testes e medições. */
  readonly debug: Readonly<{ morph: number; split: number; pull: number; lag: number; listen: number; speak: number; calm: number; align: number; tint: number; slit: number; portal: number; sea: number; place: number; hero: number; /** A figura formada (ou em formação), a que se desfaz e o progresso da troca. */ char: SculptId; prev: SculptId | null; shift: number; /** O gesto em curso e os seus três tempos. */ act: ActId | null; reach: number; pulling: number; release: number; done: boolean; arms: { a: number; b: number }; reachA: number; reachB: number; /** Quanto cada mão está longe do ponto de contato pedido (unidades da figura): 0 = tocando. */ miss: { a: number; b: number }; alive: boolean; /** Onde cada mão toca e as duas quinas de cima da abertura (px CSS do canvas). */ hands: { a: Point; b: Point; tl: Point | null; tr: Point | null }; loaded: SculptId[] }>;
  readonly figure: Readonly<Figure>;
  readonly passage: Readonly<Passage> | null;
  setLayout(l: Layout): void;
  setDpr(v: number): void;
  setMood(m: Mood): void;
  transition(to: Mood, origin: [number, number]): boolean;
  finish(to: Mood): void;
  set(t: Partial<Targets>): void;
  /** Gesto ao lado do rosto do busto (−1..1) ou null ao soltar. */
  pull(p: Point | null): void;
  /** Uma figura chegou do servidor: fica pronta para a transformação. */
  addSculpt(s: Sculpt): void;
  has(id: SculptId): boolean;
  /** A escultura vira outra figura (a pedra se desfaz, os grãos viajam, a nova se forma). */
  become(id: SculptId): boolean;
  /** O gesto do destino: as mãos abrem a passagem até ela coincidir com a janela `rect` (px CSS do canvas). */
  act(id: ActId, rect: Rect): boolean;
  /** A janela do gesto fechou ou outra tomou o lugar: a passagem some. */
  retire(): void;
  /** O visitante não quer esperar: a transformação e o gesto em curso valem como terminados. */
  settle(): void;
  /** Alguém se mexeu perto da cena: os grãos de prata continuam vivos por mais um tempo. */
  stir(): void;
  /** Câmera lenta, para medir e gravar os gestos (1 = tempo real). */
  pace(v?: number): number;
  /** A fenda de luz que atravessa o rosto do busto. */
  slit(): void;
  /** Reflete uma imagem (a capa de um projeto) na prata; null devolve o metal. */
  tint(image: HTMLImageElement | ImageBitmap | null): void;
  start(): void;
  stop(): void;
  compile(): Promise<void>;
  calibrate(floor?: number): number;
  /** Custo de um quadro (ms) com cada parte desligada — para ajuste, não roda em produção. */
  probe(): Record<string, number>;
  /** Um quadro parado (imagens estáticas): `morph` 0 = a escultura, 1 = o cérebro; `pose`: o instante do gesto (alcançar, puxar). */
  still(mood: Mood, morph: number, id?: SculptId, pose?: [number, number]): void;
  onFrame(cb: ((e: Engine, dt: number) => void) | null): void;
  dispose(): void;
};

/** A linha do mar em unidades acima do centro da cabeça: a mesma altura que a prévia desenha dentro do recorte. */
const SEA_Y = MATERIA.portal.c[1] + (1 - 2 * MATERIA.portal.sea) * MATERIA.portal.r[1] * MATERIA.portal.inset;
/** A figura de cada gesto. */
const FIGURE_OF: Record<ActId, SculptId> = { projects: "projects", profile: "profile", services: "services", studio: "studio", lab: "lab", contact: "contact" };

const srgb = (hex: string, into: Vector3) => {
  const c = new Color();
  c.set(hex);
  // `Color` guarda em linear; as cores dos shaders são de tela
  c.convertLinearToSRGB();
  return into.set(c.r, c.g, c.b);
};
const frameOf = (id: SculptId): RigFrame => {
  const S = SCULPT[id];
  const arm = S.arm as { R?: { scale: number; thick: number }; L?: { scale: number; thick: number } };
  const sh = S.shoulder as { R: readonly number[] | null; L: readonly number[] | null };
  const v = (a: readonly number[] | null): V3 | null => (a ? [a[0], a[1], a[2]] : null);
  return { shoulderA: v(sh.R), shoulderB: v(sh.L), scaleA: arm.R?.scale ?? 1, scaleB: arm.L?.scale ?? 1, thickA: arm.R?.thick ?? 1, thickB: arm.L?.thick ?? 1, waist: v(S.waist) as V3, neck: v(S.neck) as V3 };
};

export function createEngine(init: EngineInit): Engine | null {
  /** Imagem estática sobre transparente (o cérebro): sem ambiente. */
  const sil = !!init.still && !!init.silhouette;
  const bare = (!!init.still && !init.scene) || sil;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas: init.canvas, antialias: true, alpha: bare, depth: true, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: !!init.still });
  } catch {
    return null;
  }
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.autoClear = false;
  renderer.setClearColor(sil ? 0xffffff : 0x000000, bare && !sil ? 0 : 1);

  const M = init.molecules;
  const F = init.figure;
  const camera = new PerspectiveCamera(MATERIA.fov, 1, 0.5, 80);
  const scene = new Scene();
  const geo = new BufferGeometry();
  const home = heroTargets(M, init.rest);
  geo.setAttribute("position", new BufferAttribute(M.bust, 3));
  geo.setAttribute("aNormal", new BufferAttribute(M.normal, 3));
  geo.setAttribute("aBrain", new BufferAttribute(M.brain, 3));
  geo.setAttribute("aBrainN", new BufferAttribute(M.brainNormal, 3));
  geo.setAttribute("aMeta", new BufferAttribute(M.meta, 4, true));
  geo.setAttribute("aHero", new BufferAttribute(home.pos, 3));
  geo.setAttribute("aHeroN", new BufferAttribute(home.nrm, 4));
  // o que a pedra, os grãos e o ambiente leem juntos
  const shared = { uFloorPx: { value: new Vector2(-2e5, -1e5) }, uLight: { value: 0 }, uKeyDir: { value: new Vector3(...KEY_LIGHT).normalize() }, uFade: { value: new Vector3() }, uKey: { value: new Vector3() }, uPx: { value: 300 }, uCamZ: { value: 5 } };
  /** Onde a figura atual fica na cena (as moléculas partem dali). */
  const figNow = new Vector4(0, 0, 0, 1);

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
      uTime: { value: 0 }, uPx: shared.uPx, uCamZ: shared.uCamZ,
      // só com o primeiro arquivo (telefone) cada molécula cresce um pouco, para a superfície continuar fechada
      uSize: { value: MATERIA.size * (M.count < 40000 ? 1.2 : 1) }, uYaw: { value: MATERIA.yaw },
      uMorph: { value: 0 }, uListen: { value: 0 }, uSpeak: { value: 0 }, uCalm: { value: 0 }, uAlign: { value: 0 }, uSlit: { value: -1 },
      uScale: { value: 1 }, uIntro: { value: init.still ? 1 : 0 }, uFold: { value: 0 }, uFloor: { value: 9 },
      uPull: { value: new Vector2() }, uPullLag: { value: new Vector2() }, uOffset: { value: new Vector3() },
      uPortal: { value: 0 }, uPortalYaw: { value: MATERIA.portal.yaw }, uPortalC: { value: new Vector2(MATERIA.portal.c[0], MATERIA.portal.c[1]) }, uPortalR: { value: new Vector2(MATERIA.portal.r[0], MATERIA.portal.r[1]) },
      uSea: { value: 0 }, uSeaY: { value: SEA_Y },
      uMetal: { value: new Vector3() }, uKey: shared.uKey, uRim: { value: new Vector3() }, uAccent: { value: new Vector3() }, uShade: { value: new Vector3() }, uFade: shared.uFade,
      uLight: shared.uLight, uBead: { value: MATERIA.bead }, uTintK: { value: 0 }, uStripAz: { value: -1.12 }, uTint: { value: blank },
      uFloorPx: shared.uFloorPx, uHeroK: { value: 1 }, uFigT: { value: figNow },
    },
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // ───────────────────────── as esculturas, os braços e os grãos
  const rig = createRig(frameOf("rest"));
  const figScene = new Scene();
  const armScene = new Scene();
  const shadowScene = new Scene();
  const fxScene = new Scene();
  const disposables: { dispose(): void }[] = [];
  const stone = { ...shared, uBone: { value: rig.bones }, uGlow: { value: 0 }, uSil: { value: sil ? 1 : 0 } };
  type Body = { id: SculptId; data: Sculpt; mesh: Mesh; caster: Mesh; own: { uFigT: { value: Vector4 }; uVis: { value: number } }; vis: number; gPos: BufferAttribute; gNr: BufferAttribute };
  const bodies = new Map<SculptId, Body>();
  const addBody = (data: Sculpt) => {
    if (bodies.has(data.id)) return;
    const g = new BufferGeometry();
    const pos = new BufferAttribute(data.position, 3);
    const na = new BufferAttribute(data.na, 4, true);
    g.setAttribute("position", pos);
    g.setAttribute("aPosB", pos);
    g.setAttribute("aNA", na);
    g.setAttribute("aNB", na);
    g.setAttribute("aMeta", new BufferAttribute(data.meta, 4, true));
    g.setAttribute("aSkin", new BufferAttribute(data.skin, 4));
    g.setIndex(new BufferAttribute(data.index, 1));
    const own = { ...stone, uFigT: { value: new Vector4(0, 0, 0, 1) }, uVis: { value: 0 }, uBoneOff: { value: 0 }, uShape: { value: 0 }, uArm: { value: 0 }, uGap: { value: new Vector3() } };
    const m = new ShaderMaterial({ vertexShader: FIGURE_VERT, fragmentShader: FIGURE_FRAG, side: FrontSide, depthTest: true, depthWrite: true, toneMapped: false, uniforms: own });
    const sm = new ShaderMaterial({ vertexShader: FIGURE_VERT, fragmentShader: FIGURE_SHADOW_FRAG, side: FrontSide, depthTest: false, depthWrite: false, toneMapped: false, uniforms: own });
    const mesh = new Mesh(g, m);
    const caster = new Mesh(g, sm);
    mesh.frustumCulled = caster.frustumCulled = false;
    mesh.visible = caster.visible = false;
    figScene.add(mesh);
    shadowScene.add(caster);
    disposables.push(g, m, sm);
    bodies.set(data.id, { id: data.id, data, mesh, caster, own, vis: 0, gPos: new BufferAttribute(data.grains.position, 3), gNr: new BufferAttribute(data.grains.nr, 4, true) });
  };
  addBody(init.rest);

  // os braços: a mesma malha duas vezes — o A (direito da figura) usa a espelhada, por isso o verso das faces
  const attrs = (part: FigurePart) => ({ pos: part.shapes.map((sh) => new BufferAttribute(sh.position, 3)), na: part.shapes.map((sh) => new BufferAttribute(sh.na, 4, true)), meta: new BufferAttribute(part.meta, 4, true), skin: new BufferAttribute(part.skin, 4), index: new BufferAttribute(part.index, 1) });
  const armOwn = (off: number) => ({ ...stone, uFigT: { value: new Vector4(0, 0, 0, 1) }, uVis: { value: 0 }, uBoneOff: { value: off }, uShape: { value: 0 }, uArm: { value: 1 }, uGap: { value: new Vector3() } });
  const ownA = armOwn(1);
  const ownB = armOwn(4);
  const piece = (A: ReturnType<typeof attrs>, own: ReturnType<typeof armOwn>, side: Side) => {
    const g = new BufferGeometry();
    g.setAttribute("position", A.pos[0]);
    g.setAttribute("aPosB", A.pos[0]);
    g.setAttribute("aNA", A.na[0]);
    g.setAttribute("aNB", A.na[0]);
    g.setAttribute("aMeta", A.meta);
    g.setAttribute("aSkin", A.skin);
    g.setIndex(A.index);
    // a forma da mão é de cada peça (o braço não tem): o uniforme não pode ser o compartilhado
    const mine = { ...own, uShape: { value: 0 } };
    const m = new ShaderMaterial({ vertexShader: FIGURE_VERT, fragmentShader: FIGURE_FRAG, side, depthTest: true, depthWrite: true, toneMapped: false, uniforms: mine });
    const sm = new ShaderMaterial({ vertexShader: FIGURE_VERT, fragmentShader: FIGURE_SHADOW_FRAG, side, depthTest: false, depthWrite: false, toneMapped: false, uniforms: mine });
    const mesh = new Mesh(g, m);
    const caster = new Mesh(g, sm);
    mesh.frustumCulled = caster.frustumCulled = false;
    armScene.add(mesh);
    shadowScene.add(caster);
    disposables.push(g, m, sm);
    return { g, own: mine, mesh, caster };
  };
  const armAttrs = attrs(F.arm);
  const handAttrs = attrs(F.hand);
  const armA = piece(armAttrs, ownA, BackSide);
  const handA = piece(handAttrs, ownA, BackSide);
  const armB = piece(armAttrs, ownB, FrontSide);
  const handB = piece(handAttrs, ownB, FrontSide);
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

  // os grãos da transformação: de onde estavam na figura que se desfaz para onde assentam na que se forma
  const grainGeo = new BufferGeometry();
  const grainCount = init.rest.grains.count;
  const grainMeta = new BufferAttribute(new Uint8Array(grainCount * 4), 4, true);
  const grainU = { ...shared, uFromT: { value: new Vector4(0, 0, 0, 1) }, uToT: { value: new Vector4(0, 0, 0, 1) }, uShift: { value: 1 }, uSize: { value: MATERIA.sculpt.grain * (init.lite ? 1.25 : 1) }, uTime: { value: 0 } };
  const grainMat = new ShaderMaterial({ vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG, depthTest: true, depthWrite: true, toneMapped: false, uniforms: grainU });
  const grains = new Points(grainGeo, grainMat);
  grains.frustumCulled = false;
  grains.visible = false;
  fxScene.add(grains);
  const aimGrains = (from: Body, to: Body) => {
    grainGeo.setAttribute("position", from.gPos);
    grainGeo.setAttribute("aTo", to.gPos);
    grainGeo.setAttribute("aNF", from.gNr);
    grainGeo.setAttribute("aNT", to.gNr);
    const a = from.data.grains.meta;
    const b = to.data.grains.meta;
    const out = grainMeta.array as Uint8Array;
    const n = Math.min(grainCount, from.data.grains.count, to.data.grains.count);
    for (let i = 0; i < n; i++) {
      out[i * 4] = a[i * 4];
      out[i * 4 + 1] = b[i * 4 + 1];
      out[i * 4 + 2] = b[i * 4 + 2];
      out[i * 4 + 3] = b[i * 4];
    }
    grainMeta.needsUpdate = true;
    grainGeo.setAttribute("aMeta", grainMeta);
    grainGeo.setDrawRange(0, n);
  };

  // os grãos de prata do repouso
  const silverN = init.lite ? 420 : 760;
  const silverGeo = new BufferGeometry();
  {
    let seed = 20261120;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const s = new Float32Array(silverN * 4);
    for (let i = 0; i < s.length; i++) s[i] = rand();
    silverGeo.setAttribute("aSeed", new BufferAttribute(s, 4));
    silverGeo.setAttribute("position", new BufferAttribute(new Float32Array(silverN * 3), 3));
  }
  const silverU = { ...shared, uGapM: { value: [new Vector4(1, 0, 0, 0), new Vector4(0, 1, 0, 0), new Vector4(0, 0, 1, 0)] }, uFigT: { value: new Vector4(0, 0, 0, 1) }, uGap: { value: new Vector3() }, uSize: { value: MATERIA.sculpt.silver }, uTime: { value: 0 }, uStir: { value: 0 } };
  const silverMat = new ShaderMaterial({ vertexShader: SILVER_VERT, fragmentShader: SILVER_FRAG, depthTest: true, depthWrite: true, toneMapped: false, uniforms: silverU });
  const silver = new Points(silverGeo, silverMat);
  silver.frustumCulled = false;
  fxScene.add(silver);

  const shadowRT = new WebGLRenderTarget(4, 4, { depthBuffer: false, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter, generateMipmaps: false });

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
      uFloorPx: shared.uFloorPx, uFlat: { value: init.still ? 1 : 0 }, uHero: { value: 1 }, uFigBox: { value: new Vector4(0, 0, 300, 0) },
    },
  });
  const bgMesh = new Mesh(bgGeo, bgMat);
  bgMesh.frustumCulled = false;
  bgScene.add(bgMesh);
  // O ambiente custa caro por pixel e quase nunca muda: é desenhado num alvo (metade da resolução; inteira nas imagens
  // estáticas) só quando algo nele muda, e a cada quadro vai para a tela numa passada barata, com a sombra da escultura.
  const bgRT = new WebGLRenderTarget(4, 4, { depthBuffer: false, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter, generateMipmaps: false });
  const wallScene = new Scene();
  const wallU = { uBg: { value: bgRT.texture }, uShadow: { value: shadowRT.texture }, uRes: { value: new Vector2(1, 1) }, uFigBox: bgMat.uniforms.uFigBox, uFloorPx: shared.uFloorPx, uHero: bgMat.uniforms.uHero, uLight: shared.uLight, uGrain: { value: init.still ? 0 : 0.014 }, uTime: { value: 0 } };
  const wallMat = new ShaderMaterial({ vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, depthTest: false, depthWrite: false, toneMapped: false, uniforms: wallU });
  const wallMesh = new Mesh(bgGeo, wallMat);
  wallMesh.frustumCulled = false;
  wallScene.add(wallMesh);
  let bgKey = "";
  let shadowStale = 2;

  // a passagem: um plano de tela inteira por cima do corpo e por baixo dos braços
  const passScene = new Scene();
  const passU = { uPoly: { value: Array.from({ length: 16 }, () => new Vector2()) }, uPolyN: { value: 0 }, uCircle: { value: new Vector3() }, uK: { value: 100 }, uAmt: { value: 0 }, uFlap: { value: 0 }, uLight: shared.uLight, uStone: { value: new Vector3() }, uVoid: { value: new Vector3() } };
  const passMat = new ShaderMaterial({ vertexShader: PASSAGE_VERT, fragmentShader: PASSAGE_FRAG, depthTest: false, depthWrite: false, toneMapped: false, transparent: true, blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor, uniforms: passU });
  const passMesh = new Mesh(bgGeo, passMat);
  passMesh.frustumCulled = false;
  passScene.add(passMesh);

  // ---- estado ----
  let mood: Mood = init.mood;
  let tr: (Trans & { e: number }) | null = null;
  let trClock = 0;
  let layout: Layout = { w: 1, h: 1, k: 300, home: { x: 0.5, y: 0.5 }, talk: { x: 0.5, y: 0.5, k: 1 }, hero: { x: 0.5, y: 0.5, h: 1 } };
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
  const now = { morph: 0, listen: 0, speak: 0, calm: 0, align: 0, tint: 0, intro: init.still ? 1 : 0, portal: 0, sea: 0, place: 0, hero: 1, stir: 0 };
  const fig: Figure = { x: 0, y: 0, k: 300, open: 0, hero: 1 };
  // a figura formada (ou em formação), a que se desfaz, e o progresso da troca (1 = terminada)
  let cur: SculptId = "rest";
  let prev: SculptId | null = null;
  let shift = 1;
  let framed: SculptId = "rest";
  const armVis = { a: 1, b: 0 };
  // o gesto do destino
  let acting: { id: ActId; rect: Rect; t: number; done: boolean } | null = null;
  let actFrame: ActFrame | null = null;
  let lastGoal: Goal | null = null;
  let passAmt = 0;
  let passage: Passage | null = null;
  /** O tempo que move a respiração e os grãos de prata: só corre enquanto a cena está "viva". */
  let live = 0;
  let aliveUntil = init.still ? 0 : 10;
  let tintWant = 0;
  let slitAt = -1;
  // dobra do tempo (o busto): o gesto de agora e o mesmo gesto `lag` s atrás
  let pullTarget: Point | null = null;
  const pullNow = { x: 0, y: 0 };
  const pullLag = { x: 0, y: 0 };
  const trail: { t: number; x: number; y: number }[] = [];
  const u = mat.uniforms;
  const b = bgMat.uniforms;
  const tmp = new Vector3();
  bodies.get("rest")!.vis = 1;

  const camZ = () => layout.h / layout.k / (2 * Math.tan(MathUtils.degToRad(MATERIA.fov) / 2));
  const resize = () => {
    renderer.setPixelRatio(dpr);
    renderer.setSize(layout.w, layout.h, false);
    shadowRT.setSize(Math.max(4, Math.ceil((layout.w * dpr) / 4)), Math.max(4, Math.ceil((layout.h * dpr) / 4)));
    const half = init.still ? 1 : 0.5;
    bgRT.setSize(Math.max(4, Math.ceil(layout.w * dpr * half)), Math.max(4, Math.ceil(layout.h * dpr * half)));
    bgKey = "";
    shadowStale = 2;
    camera.aspect = layout.w / Math.max(1, layout.h);
    camera.updateProjectionMatrix();
  };
  /** Onde uma figura fica na cena: deslocamento (unidades do mundo) e escala (unidades do mundo por unidade da figura). */
  const figT = (id: SculptId, into: Vector4) => {
    const Fr = FRAMES[id];
    const px = layout.hero.h / (2 * Fr.half);
    const s = px / layout.k;
    return into.set((layout.hero.x - layout.w / 2) / layout.k - Fr.c[0] * s, -(layout.hero.y - layout.h / 2) / layout.k - Fr.c[1] * s, 0, s);
  };
  const scratch = new Vector4();
  /** Um ponto da figura (unidades dela) → px CSS do canvas. */
  const toPx = (id: SculptId, p: readonly number[]): Point => {
    const T = figT(id, scratch);
    const D = camZ();
    const f = D / (D - p[2] * T.w);
    return { x: layout.w / 2 + (p[0] * T.w + T.x) * f * layout.k, y: layout.h / 2 - (p[1] * T.w + T.y) * f * layout.k };
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

  const ease = (x: number) => {
    const c = Math.max(0, Math.min(1, x));
    return c * c * (3 - 2 * c);
  };
  /** Os três tempos do gesto em curso. */
  const phases = () => {
    if (!acting) return { r: 0, p: 0, q: 0 };
    const T = ACT_TIME;
    return { r: MathUtils.clamp(acting.t / T.reach, 0, 1), p: MathUtils.clamp((acting.t - T.reach) / T.pull, 0, 1), q: MathUtils.clamp((acting.t - T.reach - T.pull) / T.release, 0, 1) };
  };
  const STONES: [number, number, number][][] = [
    [[0.17, 0.16, 0.15], [0.84, 0.83, 0.81]],
    [[0.9, 0.87, 0.8], [0.97, 0.96, 0.93]],
    [[0.88, 0.86, 0.82], [0.93, 0.92, 0.9]],
  ];

  const render = () => {
    const p0 = performance.now();
    const D = camZ();
    camera.position.set(0, 0, D);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    if (tr) applyMood(tr.from, tr.to, MathUtils.smoothstep(tr.p, 0.3, 0.7));
    // o busto e o cérebro: do repouso à conversa, com a escala de cada um
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
    fig.hero = now.hero;
    const presence = MathUtils.smoothstep(now.hero, 0, 0.2);

    // as esculturas: a que se forma e a que se desfaz, cada uma no seu quadro
    const forming = shift < 1 || (now.hero > 0 && now.hero < 1);
    stone.uGlow.value = forming ? 1 : 0;
    for (const B of bodies.values()) {
      const on = (B.id === cur || B.id === prev) && now.hero > 0.001 && B.vis > 0.001;
      B.mesh.visible = B.caster.visible = on;
      if (!on) continue;
      figT(B.id, B.own.uFigT.value);
      B.own.uVis.value = Math.min(B.vis, now.hero);
    }
    figT(framed, ownA.uFigT.value);
    ownB.uFigT.value.copy(ownA.uFigT.value);
    figT(cur, figNow);
    const gap = SCULPT[framed].gap as { side: string; span: readonly number[] } | null;
    const gapOn = gap && gap.side === "R" ? 1 : 0;
    for (const P of [armA, handA]) {
      P.own.uVis.value = Math.min(armVis.a, now.hero);
      P.own.uGap.value.set(gap ? gap.span[0] : 0, gap ? gap.span[1] : 0, gapOn);
      P.mesh.visible = P.caster.visible = P.own.uVis.value > 0.001;
    }
    for (const P of [armB, handB]) {
      P.own.uVis.value = Math.min(armVis.b, now.hero);
      P.mesh.visible = P.caster.visible = P.own.uVis.value > 0.001;
    }
    setShape(handA, shapeNow.a, rig.hand.a.from, rig.hand.a.to, rig.hand.a.k);
    setShape(handB, shapeNow.b, rig.hand.b.from, rig.hand.b.to, rig.hand.b.k);
    // os grãos da transformação
    grains.visible = shift < 1 && prev !== null && now.hero > 0.5;
    if (grains.visible && prev) {
      figT(prev, grainU.uFromT.value);
      figT(cur, grainU.uToT.value);
      grainU.uShift.value = shift;
      grainU.uTime.value = t % MATERIA.timeWrap;
    }
    // os grãos de prata: só a figura em repouso tem o trecho por completar
    const silverOn = gapOn * ease(armVis.a) * now.hero * (framed === "rest" ? 1 : 0);
    silver.visible = silverOn > 0.01;
    if (silver.visible) {
      silverU.uFigT.value.copy(ownA.uFigT.value);
      const rows = silverU.uGapM.value;
      for (let i = 0; i < 3; i++) rows[i].set(rig.bones[48 + i * 4], rig.bones[49 + i * 4], rig.bones[50 + i * 4], rig.bones[51 + i * 4]);
      silverU.uGap.value.set(gap ? gap.span[0] : 0, gap ? gap.span[1] : 0, silverOn);
      silverU.uTime.value = live;
      silverU.uStir.value = now.stir;
    }

    u.uHeroK.value = now.hero;
    u.uPortal.value = now.portal;
    u.uSea.value = now.sea;
    u.uFloor.value = layout.floor ?? 9;
    shared.uPx.value = layout.k * dpr;
    shared.uCamZ.value = D;
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
      // telefone: a cena se apaga antes da grade de apps — menos quando a passagem vira a tela do app
      const floor = layout.heroFloor + (layout.h + 90 - layout.heroFloor) * passAmt;
      shared.uFloorPx.value.set(H - floor * k, H - (floor - 54) * k);
    }
    const heroOn = now.hero > 0.001;
    // a silhueta da escultura, em um quarto da resolução: é a sombra que ela projeta na parede. Só é refeita quando
    // a figura muda (a respiração do repouso não conta: a sombra é larga e macia)
    if (now.hero < 1 || shift < 1 || framed !== cur || (!!acting && !acting.done) || passAmt > 0.001 || dirty > 0 || (framed !== "rest" && rig.moving)) shadowStale = 2;
    if (!bare && heroOn && shadowStale > 0) {
      shadowStale--;
      renderer.setRenderTarget(shadowRT);
      renderer.clear();
      renderer.render(shadowScene, camera);
    }
    // com a escultura inteira as moléculas estão todas guardadas: nem entram na fila de desenho
    points.visible = !(now.hero > 0.985 && now.morph <= 0 && now.portal <= 0 && now.intro >= 1);
    if (!bare) {
      // o ambiente: nas medidas do alvo dele (o shader trabalha em px do buffer)
      const s2 = bgRT.width / Math.max(1, W);
      const band = (1 - 0.75 * now.calm) * (1 - 0.6 * ease(now.morph)) * (1 - presence);
      const bend = (split / MATERIA.fold.yaw) * (1 - ease(now.morph));
      // com a escultura inteira o ambiente é o ateliê parado; na conversa e no recorte a névoa e a faixa de luz andam
      const moving = presence < 0.999 || !!tr || slit >= 0 || now.sea > 0.001;
      const key = moving ? "" : `${bgRT.width}x${bgRT.height}:${mood}:${layout.hero.x.toFixed(1)}:${layout.hero.y.toFixed(1)}:${layout.hero.h.toFixed(1)}:${shared.uFloorPx.value.x.toFixed(0)}`;
      if (moving || key !== bgKey) {
        bgKey = key;
        b.uRes.value.set(bgRT.width, bgRT.height);
        b.uTime.value = t % MATERIA.timeWrap;
        b.uHead.value.set(cx * k * s2, (H - cy * k) * s2, layout.k * scale * k * s2);
        b.uBend.value = bend;
        // a faixa diagonal do ambiente é da conversa e do recorte; com a escultura, a luz é a do ateliê
        b.uBand.value = band;
        b.uSea.value = now.sea;
        b.uSlit.value = slit;
        b.uP.value = tr ? tr.p : 0;
        if (tr) b.uOrigin.value.set(tr.ox * k * s2, (H - tr.oy * k) * s2);
        b.uHero.value = presence;
        b.uFigBox.value.set(layout.hero.x * k * s2, (H - layout.hero.y * k) * s2, (layout.hero.h / 2) * k * s2, 0);
        const fx = shared.uFloorPx.value.x;
        const fy = shared.uFloorPx.value.y;
        shared.uFloorPx.value.set(fx * s2, fy * s2);
        renderer.setRenderTarget(bgRT);
        renderer.clear();
        renderer.render(bgScene, bgCam);
        shared.uFloorPx.value.set(fx, fy);
      }
    }
    renderer.setRenderTarget(null);
    renderer.clear();
    if (!bare) {
      b.uHero.value = presence;
      b.uFigBox.value.set(layout.hero.x * k, H - layout.hero.y * k, (layout.hero.h / 2) * k, 0);
      wallU.uRes.value.set(W, H);
      wallU.uTime.value = t % MATERIA.timeWrap;
      renderer.render(wallScene, bgCam);
      renderer.clearDepth();
    }
    if (heroOn) {
      renderer.render(figScene, camera);
      if (passAmt > 0.002 && passage && !bare) {
        const S = STONES[actFrame?.stone ?? 0];
        const L = shared.uLight.value;
        passU.uStone.value.set(S[0][0] + (S[1][0] - S[0][0]) * L, S[0][1] + (S[1][1] - S[0][1]) * L, S[0][2] + (S[1][2] - S[0][2]) * L);
        passU.uVoid.value.set(0.03 + 0.13 * L, 0.03 + 0.14 * L, 0.035 + 0.17 * L);
        passU.uAmt.value = passAmt;
        passU.uK.value = (layout.hero.h / (2 * FRAMES[cur].half)) * k;
        passU.uFlap.value = (actFrame?.flap ?? 0) * (1 - ease(passage.q));
        if (passage.circle) {
          passU.uPolyN.value = 0;
          passU.uCircle.value.set(passage.circle.x * k, H - passage.circle.y * k, passage.circle.r * k);
        } else if (passage.poly) {
          const P = passage.poly;
          const n = Math.min(16, P.length);
          passU.uPolyN.value = n;
          for (let i = 0; i < n; i++) passU.uPoly.value[i].set(P[i].x * k, H - P[i].y * k);
        }
        renderer.render(passScene, bgCam);
      }
      renderer.render(armScene, camera);
      if (!sil) renderer.render(fxScene, camera);
    }
    if (!sil) renderer.render(scene, camera);
    stats.ms = stats.ms * 0.9 + (performance.now() - p0) * 0.1;
    frames++;
  };

  const heroWant = () => !target.talk && !target.portal && now.portal < 0.04;
  /** A figura atual tem cada braço? */
  const armsOf = (id: SculptId) => {
    const sh = SCULPT[id].shoulder as { R: unknown; L: unknown };
    return { a: sh.R ? 1 : 0, b: sh.L ? 1 : 0 };
  };
  /** O que a figura faz agora: o gesto em curso (no tempo dele) ou a espera. */
  const frameNow = (): { goal: Goal; frame: ActFrame | null } => {
    if (acting && cur === FIGURE_OF[acting.id]) {
      const { r, p, q } = phases();
      const f = actAt(acting.id, r, p, q, live);
      return { goal: f.goal, frame: f };
    }
    if (framed !== "rest" && framed in FIGURE_OF) {
      const f = actAt(framed as ActId, 0, 0, 0, live);
      return { goal: f.goal, frame: f };
    }
    return { goal: idle(framed, live), frame: null };
  };
  const applyProps = (f: ActFrame | null) => {
    for (let i = 0; i < 4; i++) rig.setProp(i, f ? f.props[i] : null);
  };
  /** O contorno da passagem agora, em px CSS do canvas. */
  const shapeNowPx = (f: ActFrame, q: number, rect: Rect): Shape => {
    const px = (layout.hero.h / (2 * FRAMES[cur].half));
    if (f.circle) {
      const c = toPx(cur, f.circle.c);
      const D = camZ();
      const s = figT(cur, scratch).w;
      const persp = D / (D - f.circle.c[2] * s);
      return { poly: null, circle: passageCircle(c, f.circle.r * px * persp, rect, q) };
    }
    const Q = f.quad!;
    return { poly: passagePoly([toPx(cur, Q[0]), toPx(cur, Q[1]), toPx(cur, Q[2]), toPx(cur, Q[3])], rect, q, f.sag * px, f.vee * px), circle: null };
  };

  const step = (dt: number) => {
    const Fo = MATERIA.fold;
    // gesto de agora: mola rápida até o alvo; ao soltar, volta mais devagar
    const tx = pullTarget ? pullTarget.x * Fo.yaw : 0;
    const ty = pullTarget ? pullTarget.y * Fo.pitch : 0;
    const kp = 1 - Math.exp(-dt * (pullTarget ? Fo.follow : Fo.release));
    pullNow.x += (tx - pullNow.x) * kp;
    pullNow.y += (ty - pullNow.y) * kp;
    trail.push({ t, x: pullNow.x, y: pullNow.y });
    while (trail.length > 2 && trail[1].t <= t - Fo.lag) trail.shift();
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
    // A escultura se forma fora da conversa e do recorte; quando a conversa abre, ela se recolhe e a matéria fica livre.
    const SC = MATERIA.sculpt;
    // com um gesto à espera, a figura não demora: forma-se já como a do destino
    now.hero = Math.max(0, Math.min(1, now.hero + (heroWant() ? dt / (acting && !acting.done ? SC.formFast : SC.form) : -dt / SC.leave)));
    const alive = t < aliveUntil || shift < 1 || (!!acting && !acting.done);
    if (alive) live += dt;
    now.stir += ((t < aliveUntil - 9 ? 1 : 0) - now.stir) * (1 - Math.exp(-dt / 0.8));

    // a transformação: a pedra de antes se desfaz, os grãos viajam, a nova se forma — e os braços com ela
    if (shift < 1) {
      shift = Math.min(1, shift + dt / SC.shift);
      const P0 = prev ? bodies.get(prev) : null;
      const C0 = bodies.get(cur)!;
      if (P0) P0.vis = 1 - ease(shift / 0.55);
      C0.vis = ease((shift - 0.36) / 0.64);
      if (shift >= 1) {
        if (P0) P0.vis = 0;
        prev = null;
      }
    }
    const has = armsOf(cur);
    if (framed !== cur) {
      // os braços da figura anterior somem (o ombro por último); então o esqueleto passa para a nova
      armVis.a = Math.max(0, armVis.a - dt / SC.armOut);
      armVis.b = Math.max(0, armVis.b - dt / SC.armOut);
      if (armVis.a <= 0 && armVis.b <= 0 && shift >= 0.3) {
        framed = cur;
        rig.setFrame(frameOf(cur));
        const first = frameNow();
        applyProps(first.frame);
        rig.snap(first.goal);
      }
    } else {
      // …e os da nova se formam, dos dedos ao ombro
      armVis.a = MathUtils.clamp(armVis.a + (has.a ? dt : -dt) / SC.armIn, 0, 1);
      armVis.b = MathUtils.clamp(armVis.b + (has.b ? dt : -dt) / SC.armIn, 0, 1);
    }

    // o gesto: começa quando a figura do destino já tem mãos
    if (acting && !acting.done && cur === FIGURE_OF[acting.id] && framed === cur && now.hero > 0.85 && shift > 0.74 && Math.max(armVis.a, armVis.b) > 0.55) {
      acting.t += dt;
      if (acting.t >= ACT_TIME.reach + ACT_TIME.pull + ACT_TIME.release) acting.done = true;
    }
    const fn = frameNow();
    actFrame = fn.frame;
    lastGoal = fn.goal;
    applyProps(fn.frame);
    rig.update(fn.goal, dt);
    // a passagem nasce quando as mãos chegam ao contato e some depois que a janela está inteira
    if (acting && actFrame && cur === FIGURE_OF[acting.id]) {
      const { r, q } = phases();
      const want = acting.done ? 0 : ease((r - 0.55) / 0.45);
      passAmt += (want - passAmt) * (1 - Math.exp(-dt / (acting.done ? 0.14 : 0.05)));
      // antes do contato não há abertura: a janela espera recolhida
      passage = r > 0.55 || acting.done ? { ...shapeNowPx(actFrame, q, acting.rect), app: acting.id, q, focal: actFrame.focal, rect: acting.rect, done: acting.done } : null;
    } else {
      passAmt = Math.max(0, passAmt - dt / 0.15);
      if (passAmt <= 0) passage = null;
    }
  };

  /** Algo se mexe por causa do visitante (ou ainda está assentando)? */
  const busy = () =>
    !!tr || now.intro < 1 || slitAt >= 0 || !!pullTarget || Math.abs(pullNow.x - pullLag.x) > 0.002 || Math.abs(pullNow.x) > 0.004 ||
    (now.morph > 0 && now.morph < 1) || now.listen > 0.02 || now.speak > 0.02 || Math.abs(now.tint - tintWant) > 0.01 || Math.abs(now.align - target.align) > 0.01 ||
    target.portal || now.portal > 0 || now.sea > 0.01 || Math.abs(now.place - target.place) > 0.005 ||
    now.hero !== (heroWant() ? 1 : 0) || shift < 1 || framed !== cur || (!!acting && !acting.done) || passAmt > 0.001 || rig.moving;

  /** A escultura inteira e quieta: nada na cena muda, então o quadro que está na tela continua valendo. */
  const resting = () => now.hero === 1 && now.morph === 0 && now.intro >= 1 && !tr && !rig.moving && shift >= 1 && framed === cur && (!acting || acting.done) && passAmt <= 0.001 && t >= aliveUntil;
  let dirty = 2;
  /** Câmera lenta (só para medições e gravações): 1 = tempo real. */
  let pace = 1;
  let slowEma = 0;
  let cooldown = 4;
  let lastTick = 0;
  const tick = () => {
    if (disposed) return;
    // Relógio REAL: o do GSAP comprime o tempo quando um quadro demora, e os gestos são medidos em segundos de verdade.
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

  /** Onde cada mão toca agora e onde estão as duas quinas de cima da abertura (px CSS do canvas). */
  const hands = () => {
    const P = passage?.poly ?? null;
    return { a: toPx(framed, rig.joints.a.touch), b: toPx(framed, rig.joints.b.touch), tl: P ? P[0] : null, tr: P ? P[P.length - 3] : null };
  };

  const finishTr = (to: Mood) => {
    tr = null;
    mood = to;
    applyMood(mood, mood, 0);
  };
  /** A figura `id` inteira e parada, sem transição. */
  const place = (id: SculptId) => {
    for (const B of bodies.values()) B.vis = B.id === id ? 1 : 0;
    cur = framed = id;
    prev = null;
    shift = 1;
    rig.setFrame(frameOf(id));
    const has = armsOf(id);
    armVis.a = has.a;
    armVis.b = has.b;
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
      const ph = phases();
      return { morph: now.morph, split: pullNow.x - pullLag.x, pull: pullNow.x, lag: pullLag.x, listen: now.listen, speak: now.speak, calm: now.calm, align: now.align, tint: now.tint, slit: slitAt < 0 ? -1 : (t - slitAt) / MATERIA.slit, portal: now.portal, sea: now.sea, place: now.place, hero: now.hero, char: cur, prev, shift, act: acting?.id ?? null, reach: ph.r, pulling: ph.p, release: ph.q, done: !!acting?.done, arms: { ...armVis }, reachA: rig.reach.a, reachB: rig.reach.b, miss: { a: lastGoal?.a ? Math.hypot(rig.joints.a.touch[0] - lastGoal.a.at[0], rig.joints.a.touch[1] - lastGoal.a.at[1], rig.joints.a.touch[2] - lastGoal.a.at[2]) : 0, b: lastGoal?.b ? Math.hypot(rig.joints.b.touch[0] - lastGoal.b.at[0], rig.joints.b.touch[1] - lastGoal.b.at[1], rig.joints.b.touch[2] - lastGoal.b.at[2]) : 0 }, alive: t < aliveUntil, hands: hands(), loaded: [...bodies.keys()] };
    },
    figure: fig,
    get passage() {
      return passage;
    },
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
    addSculpt(s) {
      addBody(s);
    },
    has(id) {
      return bodies.has(id);
    },
    become(id) {
      const next = bodies.get(id);
      if (!next) return false;
      if (id === cur) return true;
      // uma segunda escolha interrompe a primeira: o que estava a caminho vale como chegado, e parte-se dali
      if (shift < 1) {
        const C0 = bodies.get(cur)!;
        C0.vis = 1;
        if (prev) bodies.get(prev)!.vis = 0;
      }
      prev = cur;
      cur = id;
      shift = 0;
      next.vis = 0;
      aimGrains(bodies.get(prev)!, next);
      dirty = 2;
      return true;
    },
    act(id, rect) {
      if (!bodies.has(FIGURE_OF[id])) return false;
      api.become(FIGURE_OF[id]);
      acting = { id, rect, t: 0, done: false };
      passAmt = 0;
      passage = null;
      aliveUntil = Math.max(aliveUntil, t + 6);
      dirty = 2;
      return true;
    },
    retire() {
      if (acting) acting.done = true;
      acting = null;
    },
    settle() {
      if (shift < 1) {
        shift = 1;
        const C0 = bodies.get(cur)!;
        C0.vis = 1;
        if (prev) bodies.get(prev)!.vis = 0;
        prev = null;
      }
      if (acting && !acting.done) {
        acting.t = ACT_TIME.reach + ACT_TIME.pull + ACT_TIME.release;
        acting.done = true;
      }
      dirty = 2;
    },
    stir() {
      aliveUntil = t + 12;
    },
    pace(v) {
      if (v !== undefined) pace = Math.max(0.02, Math.min(1, v));
      return pace;
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
      const rest = bodies.get("rest")!;
      rest.mesh.visible = rest.caster.visible = true;
      aimGrains(rest, rest);
      // o que nasce invisível também é compilado agora: a primeira transformação não pode engasgar
      const wasGrains = grains.visible;
      grains.visible = silver.visible = true;
      await renderer.compileAsync(scene, camera);
      await renderer.compileAsync(figScene, camera);
      await renderer.compileAsync(armScene, camera);
      await renderer.compileAsync(fxScene, camera);
      if (!bare) {
        await renderer.compileAsync(shadowScene, camera);
        await renderer.compileAsync(bgScene, bgCam);
        await renderer.compileAsync(wallScene, bgCam);
        await renderer.compileAsync(passScene, bgCam);
      }
      grains.visible = wasGrains;
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
      figScene.visible = armScene.visible = false;
      out.semEscultura = run();
      figScene.visible = armScene.visible = true;
      bgMesh.visible = false;
      out.semFundo = run();
      bgMesh.visible = true;
      return out;
    },
    still(m, morph, id = "rest", pose) {
      mood = m;
      tr = null;
      applyMood(m, m, 0);
      t = 0;
      live = 0;
      now.morph = morph;
      now.hero = morph < 0.5 ? 1 : 0;
      now.intro = 1;
      if (bodies.has(id)) place(id);
      acting = pose && id !== "rest" ? { id: id as ActId, rect: { x0: 0, y0: 0, x1: layout.w, y1: layout.h }, t: ACT_TIME.reach * pose[0] + ACT_TIME.pull * pose[1], done: false } : null;
      const f = frameNow();
      actFrame = f.frame;
      applyProps(f.frame);
      rig.snap(f.goal);
      passAmt = 0;
      passage = null;
      if (acting && actFrame && pose && pose[0] >= 1) {
        passAmt = 1;
        passage = { ...shapeNowPx(actFrame, 0, acting.rect), app: acting.id, q: 0, focal: actFrame.focal, rect: acting.rect, done: false };
      }
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
      passMat.dispose();
      blank.dispose();
      tintTex?.dispose();
      disposables.forEach((d) => d.dispose());
      grainGeo.dispose();
      grainMat.dispose();
      silverGeo.dispose();
      silverMat.dispose();
      shadowRT.dispose();
      bgRT.dispose();
      wallMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  void BONES;
  applyMood(mood, mood, 0);
  return api;
}
