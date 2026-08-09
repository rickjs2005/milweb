"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Cena 3D do hero (desktop): ~16k partículas vivas montam o monograma MW e,
 * em loop, se desmancham e escrevem SITES, APPS, WEB e MILWEB, voltando ao M
 * entre cada uma. Tem turbulência no meio do morph, pulso de energia
 * percorrendo a forma, repulsão magnética do cursor e "fugitivas" que
 * escapam da formação.
 * Profundidade em 6 camadas (estrelas → névoa → glow → cards → linhas →
 * partículas), cada uma com parallax próprio.
 *
 * Canvas pointer-events-none (CTAs clicáveis por cima) ⇒ mouse via listener
 * de window, não pelo R3F. Só monta via hero-scene.tsx (1280 + fine + sem
 * reduced-motion), dynamic ssr:false. A coluna do texto é apagada pela
 * máscara .hero-scene-mask — a cena só pinta à direita do H1.
 */

/* Posição/tamanho da formação. Deslocada à direita e menor do que era
   (2.9 / 5.6): a máscara .hero-scene-mask apaga a coluna do texto, que é
   uma faixa de largura FIXA à esquerda, e com os valores antigos o "M" de
   MILWEB caía dentro dessa zona morta — a marca aparecia cortada. A palavra
   é bem mais larga que o monograma MW, então quem manda no enquadramento
   agora é ela. */
const LOGO_X = 3.8;
const LOGO_Y = 0.2;
const LOGO_SIZE = 4.2;
const COUNT = 16000;

/* ===== Formas-alvo: monograma MW + nomes dos projetos ===== */

function makeCtx() {
  const size = 480;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return { ctx: c.getContext("2d")!, size };
}

function samplePixels(ctx: CanvasRenderingContext2D, size: number, count: number, spread: number): Float32Array {
  const data = ctx.getImageData(0, 0, size, size).data;
  const pixels: number[] = [];
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      if (data[(y * size + x) * 4 + 3] > 128) pixels.push(x, y);
    }
  }
  const out = new Float32Array(count * 3);
  const n = pixels.length / 2;
  for (let i = 0; i < count; i++) {
    const p = (Math.random() * n) | 0;
    out[i * 3] = LOGO_X + ((pixels[p * 2] + Math.random() * 2) / size - 0.5) * LOGO_SIZE;
    out[i * 3 + 1] = LOGO_Y + (0.5 - (pixels[p * 2 + 1] + Math.random() * 2) / size) * LOGO_SIZE;
    out[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  return out;
}

/** Monograma MW (paths do icon.svg via Path2D — nada de carregar imagem). */
function sampleLogo(count: number): Float32Array {
  const { ctx, size } = makeCtx();
  ctx.scale(size / 48, size / 48);
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#fff";
  ctx.stroke(new Path2D("M7 34 V15 L16 26 L24 14"));
  ctx.stroke(new Path2D("M24 14 L32 26 L41 15 V34"));
  const out = samplePixels(ctx, size, count, 0.6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return out;
}

/** Palavra como texto (as partículas "escrevem" a marca). */
function sampleWord(word: string, count: number): Float32Array {
  const { ctx, size } = makeCtx();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let px = 150;
  ctx.font = `bold ${px}px system-ui, sans-serif`;
  const w = ctx.measureText(word).width;
  if (w > size * 0.92) {
    px = Math.floor((px * size * 0.92) / w);
    ctx.font = `bold ${px}px system-ui, sans-serif`;
  }
  ctx.fillText(word, size / 2, size / 2);
  return samplePixels(ctx, size, count, 0.6);
}

/* ===== Shaders das partículas ===== */

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uTurb;
  uniform float uScatter;
  // Pesos das formas (one-hot no repouso, blend no morph). Array e não vec4:
  // com vec4 o teto era 4 formas, e adicionar a quinta palavra exigia mexer
  // no shader inteiro. Assim, incluir outra é só somar um alvo e um attribute.
  uniform float uW[5];
  uniform vec2 uMouse;
  attribute vec3 aT0;
  attribute vec3 aT1;
  attribute vec3 aT2;
  attribute vec3 aT3;
  attribute vec3 aT4;
  attribute float aRand;
  attribute float aGlyph;
  varying float vRand;
  varying float vP;
  varying float vX;
  varying float vGlyph;

  void main() {
    vRand = aRand;
    vGlyph = aGlyph;
    float p = clamp(uProgress * 1.35 - aRand * 0.35, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);
    vP = p;

    vec3 shape = aT0 * uW[0] + aT1 * uW[1] + aT2 * uW[2] + aT3 * uW[3] + aT4 * uW[4];
    vec3 pos = mix(position, shape, p);
    vX = shape.x;

    // vida perpétua: deriva orgânica (pseudo-curl com senos dessincronizados)
    float t = uTime;
    pos.x += sin(t * 0.6 + aRand * 6.283) * 0.05 * (0.4 + aRand);
    pos.y += cos(t * 0.5 + aRand * 9.42) * 0.05 * (0.4 + aRand);
    pos.z += sin(t * 0.35 + aRand * 12.0) * 0.12;

    // fugitivas: ~6% escapam da formação e vagueiam ao redor (vento)
    float escape = step(0.94, aRand);
    pos.x += escape * sin(t * 0.22 + aRand * 40.0) * 1.7;
    pos.y += escape * cos(t * 0.17 + aRand * 30.0) * 1.1;
    pos.z += escape * sin(t * 0.13 + aRand * 20.0) * 0.8;

    // turbulência do morph: explode no meio da transição e reassenta
    float n = sin(pos.y * 3.1 + t * 2.0 + aRand * 6.283) * cos(pos.x * 2.3 - t * 1.6);
    pos += uTurb * n * vec3(0.55, 0.45, 0.5) * (0.35 + aRand);

    // scroll: a formação se desmancha de volta pra nuvem
    pos = mix(pos, position * 0.7 + vec3(0.0, 1.0, 0.0), uScatter);

    // repulsão magnética do cursor (volta sozinha pela própria mistura)
    vec2 d = pos.xy - uMouse;
    float dist = length(d);
    pos.xy += (d / max(dist, 0.0001)) * smoothstep(1.9, 0.0, dist) * 0.65;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // glifo é mais fino que um disco — ponto ~30% maior compensa a massa
    gl_PointSize = (39.0 * (0.45 + aRand)) / -mv.z;
  }
`;

const particleFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform sampler2D uAtlas;
  varying float vRand;
  varying float vP;
  varying float vX;
  varying float vGlyph;

  void main() {
    // célula do glifo no atlas 5x4; clamp evita sangrar na célula vizinha
    vec2 cell = vec2(mod(vGlyph, 5.0), floor(vGlyph / 5.0));
    vec2 pc = clamp(gl_PointCoord, 0.03, 0.97);
    float a = texture2D(uAtlas, (cell + pc) / vec2(5.0, 4.0)).a;
    vec3 c = mix(uColA, uColB, vRand);
    // pulso de energia varrendo a forma da esquerda pra direita
    float wave = mod(uTime * 1.6, 9.0) - 1.5;
    float pulse = exp(-pow((vX - wave) * 1.8, 2.0));
    c += vec3(0.5, 0.8, 1.0) * pulse * 0.9;
    gl_FragColor = vec4(c, a * (0.2 + 0.8 * vP) * (1.0 + pulse * 0.6));
  }
`;

/* Linha do tempo do morph: o monograma MW volta entre cada palavra, então o
   ciclo é MW → SITES → MW → APPS → MW → WEB → MW → MILWEB. Palavras curtas
   de propósito: a contagem de partículas é fixa, então quanto mais glifos,
   mais fino o traço de cada letra (SISTEMAS, com 8 caracteres, saía
   visivelmente mais fraco que SITES). As palavras dizem o que é entregue e
   fecham na marca; antes eram nomes de projeto (AUREX/KAVITA/VERTEX) que o
   visitante não conhece, e a formação mais cara da cena não comunicava nada.

   HOLD_M é o mais curto dos três porque o monograma reaparece a cada troca,
   4x por volta: é o estado que menos informa e o que mais custaria em tempo
   de ciclo. Mesmo assim, com 4 palavras a volta completa leva ~24s. */
const SHAPES = [0, 1, 0, 2, 0, 3, 0, 4];
const HOLD_M = 1.8;
const HOLD_WORD = 2.0;
const MORPH = 1.1;

/* Atlas de glifos: os caracteres viram UMA textura desenhada em runtime
   (nada novo no bundle). Grade 5x4 = 20 células; cada partícula sorteia uma
   célula fixa no nascimento. Glifos de sintaxe e não letras: de longe a
   forma continua lendo como massa de luz, de perto revela código. */
const GLYPHS = ["{", "}", "<", ">", "/", "(", ")", ";", "=", "+", "*", "#", "&", "$", "%", "?", "!", ":", "~", "."];
const ATLAS_COLS = 5;
const ATLAS_ROWS = 4;

function makeGlyphAtlas(): THREE.CanvasTexture {
  const cell = 64;
  const c = document.createElement("canvas");
  c.width = ATLAS_COLS * cell;
  c.height = ATLAS_ROWS * cell;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.round(cell * 0.78)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  GLYPHS.forEach((g, i) => {
    ctx.fillText(g, (i % ATLAS_COLS) * cell + cell / 2, Math.floor(i / ATLAS_COLS) * cell + cell / 2);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function LogoParticles({ mouse }: { mouse: React.MutableRefObject<THREE.Vector2> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const timeline = useRef({ idx: 0, t: 0 });

  const { starts, targets, rands, glyphs } = useMemo(() => {
    const targets = [
      sampleLogo(COUNT),
      sampleWord("SITES", COUNT),
      sampleWord("APPS", COUNT),
      sampleWord("WEB", COUNT),
      sampleWord("MILWEB", COUNT),
    ];
    const starts = new Float32Array(COUNT * 3);
    const rands = new Float32Array(COUNT);
    const glyphs = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 7 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starts[i * 3] = LOGO_X + r * Math.sin(phi) * Math.cos(theta);
      starts[i * 3 + 1] = LOGO_Y + r * Math.sin(phi) * Math.sin(theta) * 0.6;
      starts[i * 3 + 2] = -2 + r * Math.cos(phi) * 0.5;
      rands[i] = Math.random();
      glyphs[i] = (Math.random() * GLYPHS.length) | 0;
    }
    return { starts, targets, rands, glyphs };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uTurb: { value: 0 },
      uScatter: { value: 0 },
      uW: { value: [1, 0, 0, 0, 0] },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uColA: { value: new THREE.Color("#9db7ff") },
      uColB: { value: new THREE.Color("#3355e6") },
      uAtlas: { value: makeGlyphAtlas() },
    }),
    [],
  );

  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += dt;
    u.uProgress.value = Math.min(1, u.uProgress.value + dt * 0.45);
    u.uMouse.value.lerp(mouse.current, 0.08);
    u.uScatter.value = THREE.MathUtils.clamp(window.scrollY / 700, 0, 1);

    // Morph em loop (só depois da montagem inicial e fora do scatter)
    if (u.uProgress.value < 1 || u.uScatter.value > 0.15) {
      u.uTurb.value = THREE.MathUtils.lerp(u.uTurb.value, 0, 0.05);
      return;
    }
    const tl = timeline.current;
    tl.t += dt;
    const cur = SHAPES[tl.idx % SHAPES.length];
    const nxt = SHAPES[(tl.idx + 1) % SHAPES.length];
    const hold = cur === 0 ? HOLD_M : HOLD_WORD;
    const w = u.uW.value as number[];
    if (tl.t <= hold) {
      w.fill(0);
      w[cur] = 1;
      u.uTurb.value = THREE.MathUtils.lerp(u.uTurb.value, 0, 0.06);
    } else {
      const m = Math.min(1, (tl.t - hold) / MORPH);
      const e = m * m * (3 - 2 * m);
      w.fill(0);
      w[cur] = 1 - e;
      w[nxt] = e;
      u.uTurb.value = Math.sin(m * Math.PI) * 0.9; // explode no meio, assenta no fim
      if (m >= 1) {
        tl.idx = (tl.idx + 1) % SHAPES.length;
        tl.t = 0;
      }
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[starts, 3]} />
        <bufferAttribute attach="attributes-aT0" args={[targets[0], 3]} />
        <bufferAttribute attach="attributes-aT1" args={[targets[1], 3]} />
        <bufferAttribute attach="attributes-aT2" args={[targets[2], 3]} />
        <bufferAttribute attach="attributes-aT3" args={[targets[3], 3]} />
        <bufferAttribute attach="attributes-aT4" args={[targets[4], 3]} />
        <bufferAttribute attach="attributes-aRand" args={[rands, 1]} />
        <bufferAttribute attach="attributes-aGlyph" args={[glyphs, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ===== Hologramas ===== */

const holoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uOp;
  varying vec2 vUv;

  void main() {
    vec3 tex = texture2D(uMap, vUv).rgb;
    float scan = 0.9 + 0.1 * sin(vUv.y * 240.0 + uTime * 2.4);
    vec3 tint = mix(tex, tex * vec3(0.6, 0.85, 1.1), 0.45);
    float inside = smoothstep(0.5, 0.482, abs(vUv.x - 0.5)) * smoothstep(0.5, 0.482, abs(vUv.y - 0.5));
    vec3 glow = vec3(0.22, 0.74, 0.97) * (1.0 - inside) * 1.5;
    gl_FragColor = vec4(tint * scan + glow, uOp * (0.55 + 0.45 * inside));
  }
`;

type HoloSpec = {
  url: string;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: number;
  speed: number;
  delay: number;
};

/* Cards em profundidades e ângulos DIFERENTES de propósito (nada de grade
   PowerPoint): um perto e grande, um médio inclinado, um longe e pequeno.
   Curadoria por impacto: carro (aurex), relógio DOURADO (contrasta com o
   azul da cena) e dashboard SaaS (prova os "sistemas" da headline). */
const HOLOS: HoloSpec[] = [
  { url: "/shots/aurex-motors.webp", pos: [5.2, -1.25, -0.4], rot: [0.06, -0.5, 0.05], scale: 1.35, speed: 1.1, delay: 0.9 },
  { url: "/shots/millead.webp", pos: [1.55, 2.05, -2.6], rot: [-0.1, 0.34, -0.03], scale: 1.0, speed: 0.8, delay: 1.25 },
  { url: "/shots/aurex-timepieces.webp", pos: [5.35, 1.9, -3.6], rot: [0.05, -0.24, -0.07], scale: 0.86, speed: 1.4, delay: 1.6 },
];

function Hologram({ spec }: { spec: HoloSpec }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const map = useTexture(spec.url);
  map.colorSpace = THREE.SRGBColorSpace;

  const uniforms = useMemo(
    () => ({ uMap: { value: map }, uTime: { value: 0 }, uOp: { value: 0 } }),
    [map],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    const u = mat.current?.uniforms;
    if (!g || !u) return;
    u.uTime.value = t;
    u.uOp.value = THREE.MathUtils.lerp(u.uOp.value, t > spec.delay ? 0.92 : 0, 0.04);
    // glitch de holograma: blip raro de opacidade (realismo de projeção)
    if (Math.sin(t * 7.3 + spec.delay * 23) > 0.997) u.uOp.value *= 0.5;
    g.position.y = spec.pos[1] + Math.sin(t * spec.speed + spec.delay * 7) * 0.14;
    g.rotation.y = spec.rot[1] + Math.sin(t * 0.3 + spec.delay * 3) * 0.06;
    g.rotation.x = spec.rot[0] + Math.cos(t * 0.24 + spec.delay * 5) * 0.03;
  });

  return (
    <group ref={group} position={spec.pos} rotation={spec.rot} scale={spec.scale}>
      <mesh>
        <planeGeometry args={[2.3, 1.44]} />
        <shaderMaterial
          ref={mat}
          vertexShader={holoVertex}
          fragmentShader={holoFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ===== Linhas de energia: conectam o coração do M aos cards ===== */

function EnergyLinks() {
  const dots = useRef<THREE.Group>(null);
  /* THREE.Line montado imperativamente: o JSX <line> do R3F colide com o
     <line> de SVG na tipagem TSX — <primitive> evita a briga. */
  const { curves, lineObjs } = useMemo(() => {
    const center = new THREE.Vector3(LOGO_X, LOGO_Y, 0);
    const curves = HOLOS.map((h) => {
      const b = new THREE.Vector3(...h.pos);
      // leve curva pra fora (não parecer régua)
      const mid = center.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.35, 0.3));
      return new THREE.QuadraticBezierCurve3(center.clone(), mid, b);
    });
    const lineObjs = curves.map(
      (c) =>
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(c.getPoints(36)),
          new THREE.LineBasicMaterial({
            color: "#5b7cff",
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ),
    );
    return { curves, lineObjs };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    dots.current?.children.forEach((d, i) => {
      const p = curves[i].getPoint((t * 0.14 + i * 0.33) % 1);
      d.position.copy(p);
      d.scale.setScalar(0.75 + Math.sin(t * 3 + i) * 0.25);
    });
  });

  return (
    <group>
      {lineObjs.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
      <group ref={dots}>
        {curves.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#9db7ff" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ===== Fundo: glow pulsante + névoa em deriva ===== */

function GlowBackdrop() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });
  return (
    <mesh position={[LOGO_X, LOGO_Y, -4.2]}>
      <planeGeometry args={[13, 9]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={holoVertex}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            // 0.07 e não 0.16: medindo a luminância do hero com a cena 3D
            // escondida e depois visível, este backdrop era o que mais
            // lavava a metade direita (3,17x contra 1,29x só do CSS).
            // Cor em ultramarine — estava em vec3(0.14,0.5,0.85), resquício
            // da paleta antiga numa notação que nenhuma varredura pegou.
            float d = length((vUv - 0.5) * vec2(1.45, 1.0));
            float pulse = 0.85 + 0.15 * sin(uTime * 0.4);
            float a = smoothstep(0.55, 0.0, d) * 0.07 * pulse;
            gl_FragColor = vec4(vec3(0.357, 0.486, 1.0), a);
          }
        `}
      />
    </mesh>
  );
}

function Mist() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current?.children.forEach((m, i) => {
      m.position.x = (i - 1) * 4 + Math.sin(t * 0.05 + i * 2.1) * 1.6;
      m.position.y = Math.cos(t * 0.04 + i * 1.4) * 0.9;
    });
  });
  return (
    <group ref={group} position={[LOGO_X, 0, -5]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <planeGeometry args={[11, 7]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            vertexShader={holoVertex}
            fragmentShader={/* glsl */ `
              varying vec2 vUv;
              void main() {
                // São TRÊS planos empilhados: 0.045 cada virava ~0.13 somado.
                float d = length((vUv - 0.5) * vec2(1.6, 1.0));
                gl_FragColor = vec4(vec3(0.30, 0.40, 0.85), smoothstep(0.5, 0.05, d) * 0.026);
              }
            `}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ===== Camadas com parallax próprio (a diferença de deslocamento entre
   camadas é o que cria a profundidade cinematográfica) ===== */

function DepthLayer({
  ndc,
  factor,
  children,
}: {
  ndc: React.MutableRefObject<THREE.Vector2>;
  factor: number;
  children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    g.current.position.x = THREE.MathUtils.lerp(g.current.position.x, ndc.current.x * factor, 0.04);
    g.current.position.y = THREE.MathUtils.lerp(
      g.current.position.y,
      ndc.current.y * factor * 0.6 + window.scrollY * 0.0012,
      0.04,
    );
  });
  return <group ref={g}>{children}</group>;
}

function Rig({ ndc, children }: { ndc: React.MutableRefObject<THREE.Vector2>; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    // entrada de câmera: dolly-in dos primeiros ~2,4s (12 → 9), easing suave
    const t = Math.min(1, state.clock.elapsedTime / 2.4);
    const e = 1 - Math.pow(1 - t, 3);
    state.camera.position.z = 12 - 3 * e;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, ndc.current.x * 0.09, 0.045);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -ndc.current.y * 0.05, 0.045);
  });
  return <group ref={group}>{children}</group>;
}

export default function HeroSceneCanvas() {
  const ndc = useRef(new THREE.Vector2(0, 0));
  const mouseWorld = useRef(new THREE.Vector2(99, 99));
  const viewport = useRef({ w: 13.2, h: 7.45 });

  const onCreated = (state: RootState) => {
    const update = (e: PointerEvent) => {
      ndc.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      mouseWorld.current.set(
        ndc.current.x * (viewport.current.w / 2),
        ndc.current.y * (viewport.current.h / 2) - window.scrollY * 0.0012,
      );
    };
    const measure = () => {
      const v = state.viewport.getCurrentViewport(state.camera, new THREE.Vector3(0, 0, 0));
      viewport.current = { w: v.width, h: v.height };
    };
    measure();
    window.addEventListener("pointermove", update, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      onCreated={onCreated}
      className="pointer-events-none"
    >
      <Rig ndc={ndc}>
        {/* fundo → frente, cada camada com fator de parallax maior */}
        <DepthLayer ndc={ndc} factor={0.06}>
          <Sparkles count={220} scale={[26, 13, 3]} position={[LOGO_X, 0, -6]} size={1.1} speed={0.06} opacity={0.35} color="#c2d0ff" />
        </DepthLayer>
        <DepthLayer ndc={ndc} factor={0.12}>
          <Mist />
        </DepthLayer>
        <DepthLayer ndc={ndc} factor={0.18}>
          <GlowBackdrop />
        </DepthLayer>
        <DepthLayer ndc={ndc} factor={0.3}>
          {HOLOS.map((h) => (
            <Hologram key={h.url} spec={h} />
          ))}
          <EnergyLinks />
        </DepthLayer>
        <DepthLayer ndc={ndc} factor={0.45}>
          <LogoParticles mouse={mouseWorld} />
          <Sparkles count={110} scale={[15, 8, 6]} position={[LOGO_X, 0, -1]} size={2.2} speed={0.32} opacity={0.5} color="#9db7ff" />
        </DepthLayer>
      </Rig>
    </Canvas>
  );
}
