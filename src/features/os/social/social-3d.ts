import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  Shape,
  ShapeGeometry,
  type Texture,
  WebGLRenderer,
} from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { gsap } from "@/animations/gsap";
import { SOCIAL3D as C } from "./social-3d.config";
import { GITHUB_MARK, INSTAGRAM_CAMERA, LINKEDIN_IN, WHATSAPP_GLYPH } from "./social-paths";

/**
 * Atalhos sociais em 3D: quatro peças de grafite com o símbolo da marca em relevo, no lugar das
 * placas planas do grupo do canto inferior direito (desktop largo).
 *
 * Geometria real e procedural: os contornos vêm dos mesmos vetores dos ícones em HTML
 * (social-paths.ts) e são extrudados com chanfro pelo `ExtrudeGeometry`; nada é textura. UM canvas
 * e UM contexto para os quatro, dentro do próprio `<nav>` — pequeno, com resolução alta (os ícones
 * têm 38 px) e desenhado SOB DEMANDA: só há quadros enquanto uma peça se move; parado, custo zero.
 * O relógio é o ticker do GSAP (o mesmo do personagem), sem laço próprio.
 *
 * Os links continuam sendo os `<a>` de sempre: este módulo só escuta os eventos deles para animar
 * a peça correspondente e nunca intercepta clique, foco ou navegação. O canvas não recebe ponteiro.
 * Se o WebGL faltar ou o contexto cair, o `<nav>` perde `data-d3` e os ícones SVG voltam.
 */
export type Social3d = {
  /** Triângulos das quatro peças e chamadas de desenho do último quadro (medição). */
  readonly stats: { tris: number; calls: number; frames: number };
  /** Estado de uma peça (testes): inclinação em graus, elevação em px, pressão e luz de 0 a 1. */
  state(key: string): { rx: number; ry: number; lift: number; press: number; glow: number } | null;
  setAccent(hex: string): void;
  dispose(): void;
};

type Item = {
  key: string;
  link: HTMLElement;
  group: Group;
  line: MeshBasicMaterial;
  glowLight: PointLight;
  // alvos
  hover: number;
  focus: number;
  press: number;
  nx: number;
  ny: number;
  // valores correntes
  rx: number;
  ry: number;
  lift: number;
  sink: number;
  glow: number;
};

const rounded = (target: Shape | Path, w: number, h: number, r: number, cx = 0, cy = 0) => {
  const x = cx - w / 2;
  const y = cy - h / 2;
  target.moveTo(x + r, y);
  target.lineTo(x + w - r, y);
  target.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  target.lineTo(x + w, y + h - r);
  target.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  target.lineTo(x + r, y + h);
  target.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  target.lineTo(x, y + r);
  target.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return target;
};

/** Formas da marca, em coordenadas de SVG (y para baixo). */
function brandShapes(key: string): Shape[] {
  if (key === "instagram") {
    // o ícone do projeto é traço: vira contorno fechado (anel do corpo, anel da lente, ponto)
    const I = INSTAGRAM_CAMERA;
    const s = I.stroke / 2;
    const body = rounded(new Shape(), I.rect.w + I.stroke, I.rect.h + I.stroke, I.rect.r + s, I.rect.x + I.rect.w / 2, I.rect.y + I.rect.h / 2) as Shape;
    body.holes.push(rounded(new Path(), I.rect.w - I.stroke, I.rect.h - I.stroke, I.rect.r - s, I.rect.x + I.rect.w / 2, I.rect.y + I.rect.h / 2) as Path);
    const lens = new Shape().absarc(I.lens.cx, I.lens.cy, I.lens.r + s, 0, Math.PI * 2, false);
    lens.holes.push(new Path().absarc(I.lens.cx, I.lens.cy, I.lens.r - s, 0, Math.PI * 2, true));
    const dot = new Shape().absarc(I.dot.cx, I.dot.cy, I.dot.r, 0, Math.PI * 2, false);
    return [body, lens, dot];
  }
  const d = key === "github" ? GITHUB_MARK : key === "linkedin" ? LINKEDIN_IN : WHATSAPP_GLYPH;
  const box = key === "github" ? 16 : 24;
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}"><path d="${d}"/></svg>`);
  // furos e recortes (o gato do GitHub, o miolo do balão do WhatsApp) são resolvidos aqui
  return data.paths.flatMap((p) => SVGLoader.createShapes(p));
}

/** Símbolo extrudado, centrado, de pé (y para cima), assentado em z = 0, com a maior dimensão = `size`. */
function symbolGeometry(key: string): BufferGeometry {
  const shapes = brandShapes(key);
  const flat = new ShapeGeometry(shapes);
  flat.computeBoundingBox();
  const b = flat.boundingBox!;
  const k = (C.symbol.size[key] ?? 0.5) / Math.max(b.max.x - b.min.x, b.max.y - b.min.y);
  const cx = (b.min.x + b.max.x) / 2;
  const cy = (b.min.y + b.max.y) / 2;
  flat.dispose();
  const g = new ExtrudeGeometry(shapes, { depth: C.symbol.depth / k, bevelEnabled: true, bevelThickness: C.symbol.bevel / k, bevelSize: C.symbol.bevel / k, bevelOffset: -C.symbol.bevel / k, bevelSegments: C.symbol.bevelSegments, curveSegments: C.symbol.curveSegments });
  g.translate(-cx, -cy, 0);
  g.scale(k, k, k);
  g.rotateX(Math.PI); // SVG tem y para baixo: meia-volta em X põe de pé sem espelhar
  g.computeBoundingBox();
  g.translate(0, 0, -g.boundingBox!.min.z);
  g.computeVertexNormals();
  return g;
}

/** Ambiente de reflexo neutro e pequeno (os ícones têm 38 px): gerado uma vez; a cor do tema vem só das luzes. */
function envMap(renderer: WebGLRenderer): Texture {
  const pm = new PMREMGenerator(renderer);
  const s = new Scene();
  const geo = new BoxGeometry(1, 1, 1);
  const mats: MeshBasicMaterial[] = [];
  const panel = (c: Color, gain: number, pos: [number, number, number], size: [number, number, number]) => {
    const m = new MeshBasicMaterial({ color: c.clone().multiplyScalar(gain) });
    mats.push(m);
    const mesh = new Mesh(geo, m);
    mesh.position.set(...pos);
    mesh.scale.set(...size);
    s.add(mesh);
  };
  const room = new MeshBasicMaterial({ color: new Color("#0b0c10"), side: BackSide });
  mats.push(room);
  const box = new Mesh(geo, room);
  box.scale.set(30, 30, 30);
  s.add(box);
  const white = new Color("#ffffff");
  panel(white, 7, [0, 9, 4], [12, 0.2, 8]); // teto: o brilho nas arestas de cima
  panel(white, 6, [-9, 2, 6], [0.2, 7, 6]); // lateral esquerda: leitura do metal
  panel(white, 4.5, [0, 1, 12], [12, 7, 0.2]); // frente: o símbolo reflete claro visto de frente
  const tex = pm.fromScene(s, 0.035, 0.1, 100, { size: 64 }).texture;
  pm.dispose();
  geo.dispose();
  mats.forEach((m) => m.dispose());
  return tex;
}

export function mountSocial3d(nav: HTMLElement, opts: { accent: string; reduce: boolean }): Social3d | null {
  const links = [...nav.querySelectorAll<HTMLElement>("a.os-social__item")];
  if (!links.length) return null;
  const canvas = document.createElement("canvas");
  canvas.className = "os-social__canvas";
  canvas.setAttribute("aria-hidden", "true");
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, depth: true, stencil: false, powerPreference: "low-power" });
  } catch {
    return null; // sem WebGL: ficam os ícones SVG
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  nav.prepend(canvas);

  const accent = new Color(opts.accent);
  const scene = new Scene();
  const env = envMap(renderer);
  scene.environment = env;
  scene.environmentIntensity = C.material.env;
  const camera = new PerspectiveCamera(5, 1, 10, C.cameraDistance * 2);
  const key = new DirectionalLight(0xffffff, C.light.key.intensity);
  key.castShadow = true;
  key.shadow.mapSize.set(C.light.shadowMap, C.light.shadowMap / 2);
  key.shadow.bias = -0.0006;
  key.shadow.radius = 2.2;
  scene.add(key, key.target, new AmbientLight(0xffffff, C.light.fill));

  // ---- geometria e materiais compartilhados ----
  const B = C.base;
  const side = B.size - 2 * B.bevel;
  const bodyGeo = new ExtrudeGeometry(rounded(new Shape(), side, side, Math.max(0.02, B.radius - B.bevel)) as Shape, { depth: B.depth, bevelEnabled: true, bevelThickness: B.bevel, bevelSize: B.bevel, bevelSegments: B.bevelSegments, curveSegments: 6 });
  bodyGeo.translate(0, 0, -(B.depth + B.bevel)); // a face da frente fica em z = 0
  const frame = rounded(new Shape(), B.size - 0.05, B.size - 0.05, B.radius - 0.02) as Shape;
  frame.holes.push(rounded(new Path(), B.size - 0.05 - 2 * C.rim.inset, B.size - 0.05 - 2 * C.rim.inset, Math.max(0.03, B.radius - 0.02 - C.rim.inset)) as Path);
  const rimGeo = new ExtrudeGeometry(frame, { depth: C.rim.height, bevelEnabled: true, bevelThickness: C.rim.bevel, bevelSize: C.rim.bevel, bevelOffset: -C.rim.bevel, bevelSegments: 1, curveSegments: 6 });
  const lineGeo = new BoxGeometry(C.line.w, C.line.h, 0.012);
  const graphite = new MeshStandardMaterial(C.material.graphite);
  const silver = new MeshStandardMaterial(C.material.silver);
  const symbols: BufferGeometry[] = [];
  const lineMats: MeshBasicMaterial[] = [];
  const dark = new Color("#0a0b0d");

  const items: Item[] = links.map((link) => {
    const k = link.dataset.social ?? "";
    const group = new Group();
    const body = new Mesh(bodyGeo, graphite);
    body.receiveShadow = true;
    const rim = new Mesh(rimGeo, graphite);
    rim.castShadow = rim.receiveShadow = true;
    const sg = symbolGeometry(k);
    symbols.push(sg);
    const sym = new Mesh(sg, silver);
    sym.castShadow = true;
    sym.position.z = 0.001;
    const line = new MeshBasicMaterial({ color: dark.clone(), toneMapped: false });
    lineMats.push(line);
    const bar = new Mesh(lineGeo, line);
    bar.position.set(0, C.line.y, 0.007);
    const glowLight = new PointLight(accent, 0, 0, 2);
    glowLight.position.set(0, -0.62, 0.42);
    group.add(body, rim, sym, bar, glowLight);
    scene.add(group);
    return { key: k, link, group, line, glowLight, hover: 0, focus: 0, press: 0, nx: 0, ny: 0, rx: C.rest.rx, ry: C.rest.ry, lift: 0, sink: 0, glow: 0 };
  });

  let tris = 0;
  for (const g of [bodyGeo, rimGeo, lineGeo]) tris += ((g.index ? g.index.count : g.attributes.position.count) / 3) * items.length;
  for (const g of symbols) tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  const stats = { tris: Math.round(tris), calls: 0, frames: 0 };

  // ---- layout: cada peça no retângulo REAL da placa do seu link ----
  let size = 38;
  let cssW = 1;
  let cssH = 1;
  const layout = () => {
    const box = nav.getBoundingClientRect();
    if (box.width === 0) return false;
    cssW = box.width + 2 * C.pad;
    cssH = box.height + 2 * C.pad;
    const dpr = Math.min(C.dprMax, Math.max(C.dprMin, (window.devicePixelRatio || 1) * C.dprBoost));
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    camera.aspect = cssW / cssH;
    camera.fov = MathUtils.radToDeg(2 * Math.atan(cssH / 2 / C.cameraDistance));
    camera.position.set(0, 0, C.cameraDistance);
    camera.updateProjectionMatrix();
    for (const it of items) {
      const r = (it.link.querySelector(".os-social__icon") ?? it.link).getBoundingClientRect();
      size = r.width || size;
      it.group.userData.x = r.left + r.width / 2 - (box.left - C.pad) - cssW / 2;
      it.group.userData.y = cssH / 2 - (r.top + r.height / 2 - (box.top - C.pad));
    }
    // luz e sombra cobrem só a faixa dos ícones
    const [dx, dy, dz] = C.light.key.dir;
    key.position.set(dx * 600, dy * 600, dz * 600);
    key.target.position.set(0, 0, 0);
    const sc = key.shadow.camera;
    sc.left = -cssW / 2;
    sc.right = cssW / 2;
    sc.top = cssH / 2;
    sc.bottom = -cssH / 2;
    sc.near = 100;
    sc.far = 1400;
    sc.updateProjectionMatrix();
    return true;
  };

  const apply = (it: Item) => {
    const g = it.group;
    const s = size * C.base.size * (1 + (C.hover.scale - 1) * (it.lift / C.hover.lift) + (C.press.scale - 1) * (it.sink / C.press.sink));
    g.scale.setScalar(s);
    g.position.set(g.userData.x, g.userData.y + it.lift - it.sink * 0.35, (it.lift / C.hover.lift) * C.hover.forward - it.sink);
    g.rotation.set(MathUtils.degToRad(it.rx), MathUtils.degToRad(it.ry), 0);
    it.line.color.copy(dark).lerp(accent, it.glow);
    it.glowLight.intensity = C.light.glow * it.glow * size * size * 0.05;
    it.glowLight.color.copy(accent);
  };

  // ---- desenho sob demanda ----
  let running = false;
  let disposed = false;
  let last = 0;
  const draw = () => {
    renderer.render(scene, camera);
    stats.calls = renderer.info.render.calls;
    stats.frames++;
  };
  const tick = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    let moving = false;
    for (const it of items) {
      const on = Math.max(it.hover, it.focus);
      const still = opts.reduce;
      const tRx = C.rest.rx + (still ? 0 : it.hover * it.ny * C.hover.tilt);
      const tRy = C.rest.ry + (still ? 0 : it.hover * it.nx * C.hover.tilt);
      const tLift = still ? 0 : on * C.hover.lift * (1 - it.press);
      const tSink = still ? 0 : it.press * C.press.sink;
      const k = (tau: number) => 1 - Math.exp(-dt / tau);
      it.rx += (tRx - it.rx) * k(C.ease.tilt);
      it.ry += (tRy - it.ry) * k(C.ease.tilt);
      it.lift += (tLift - it.lift) * k(C.ease.lift);
      it.sink += (tSink - it.sink) * k(tSink > it.sink ? C.ease.pressIn : C.ease.pressOut);
      const tGlow = Math.min(1, on + it.press * 0.6);
      it.glow = still ? tGlow : it.glow + (tGlow - it.glow) * k(C.ease.glow);
      if (Math.abs(tRx - it.rx) + Math.abs(tRy - it.ry) > 0.02 || Math.abs(tLift - it.lift) > 0.01 || Math.abs(tSink - it.sink) > 0.01 || Math.abs(tGlow - it.glow) > 0.004) moving = true;
      apply(it);
    }
    draw();
    if (!moving) {
      running = false;
      gsap.ticker.remove(tick);
    }
  };
  const wake = () => {
    if (running || disposed || document.hidden) return;
    running = true;
    last = performance.now();
    gsap.ticker.add(tick);
  };

  // ---- eventos dos links reais (passivos: a navegação é a do navegador) ----
  const off: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Document, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn as EventListener, { passive: true });
    off.push(() => el.removeEventListener(type, fn as EventListener));
  };
  for (const it of items) {
    const aim = (e: PointerEvent) => {
      const r = (it.link.querySelector(".os-social__icon") ?? it.link).getBoundingClientRect();
      it.nx = MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1.4, 1.4) / 1.4;
      it.ny = MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1.4, 1.4) / 1.4;
    };
    on(it.link, "pointerenter", (e) => {
      if (e.pointerType === "mouse") it.hover = 1;
      aim(e);
      wake();
    });
    on(it.link, "pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      aim(e);
      wake();
    });
    on(it.link, "pointerleave", () => {
      it.hover = 0;
      it.press = 0;
      it.nx = it.ny = 0;
      wake();
    });
    on(it.link, "pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      it.press = 1;
      aim(e);
      wake();
    });
    const release = () => {
      it.press = 0;
      wake();
    };
    on(it.link, "pointerup", release);
    on(it.link, "pointercancel", release);
    on(it.link, "blur", () => {
      it.focus = 0;
      it.press = 0;
      wake();
    });
    on(it.link, "focus", () => {
      // foco de teclado pesa o mesmo que o hover; o foco que o clique do mouse dá não acende a peça
      if (it.link.matches(":focus-visible")) it.focus = 1;
      wake();
    });
    on(it.link, "keydown", (e) => {
      if (e.key === "Enter") {
        it.press = 1;
        wake();
      }
    });
    on(it.link, "keyup", release);
  }
  on(document, "visibilitychange" as keyof HTMLElementEventMap, () => {
    if (!document.hidden) wake();
  });
  const ro = new ResizeObserver(() => {
    if (layout()) wake();
  });
  ro.observe(nav);
  links.forEach((l) => ro.observe(l));
  const lost = (e: Event) => {
    e.preventDefault();
    api.dispose();
  };
  canvas.addEventListener("webglcontextlost", lost);

  const api: Social3d = {
    stats,
    state(k) {
      const it = items.find((i) => i.key === k);
      return it ? { rx: it.rx, ry: it.ry, lift: it.lift, press: it.sink / C.press.sink, glow: it.glow } : null;
    },
    setAccent(hex) {
      // só a luz e o filete mudam de cor: nada é regenerado
      accent.set(hex);
      for (const it of items) apply(it);
      draw();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gsap.ticker.remove(tick);
      off.forEach((f) => f());
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      delete nav.dataset.d3;
      for (const g of [bodyGeo, rimGeo, lineGeo, ...symbols]) g.dispose();
      for (const m of [graphite, silver, ...lineMats]) m.dispose();
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };

  if (!layout()) {
    api.dispose();
    return null;
  }
  for (const it of items) apply(it);
  draw();
  // só agora os ícones SVG saem de cena: sem quadro desenhado, eles continuam valendo
  nav.dataset.d3 = "on";
  return api;
}
