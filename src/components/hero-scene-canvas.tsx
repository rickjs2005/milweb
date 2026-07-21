"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Cena 3D do hero (desktop): ~16k partículas voam de uma nuvem caótica e
 * MONTAM o monograma MW da MilWeb; projetos reais do portfólio orbitam como
 * hologramas; tudo reage ao mouse (rig de câmera + repulsão nas partículas)
 * e ao scroll. Carregada só via hero-scene.tsx (lg + pointer fine + sem
 * reduced-motion), ssr:false — zero custo em mobile.
 *
 * O canvas fica pointer-events-none (CTAs por cima continuam clicáveis),
 * então o mouse é rastreado por listener próprio de window, não pelo R3F.
 */

const ACCENT = new THREE.Color("#38bdf8");
const ACCENT_SOFT = new THREE.Color("#7dd3fc");
const ACCENT_DEEP = new THREE.Color("#0ea5e9");

/* Centro do logo no mundo (câmera z=9 fov45 ⇒ ~13,2 de largura visível):
   deslocado pra direita, espelhando o respiro do texto à esquerda. */
const LOGO_X = 2.9;
const LOGO_Y = 0.2;
const LOGO_SIZE = 5.6;
const COUNT = 16000;

/** Amostra o monograma MW (paths do icon.svg) num canvas offscreen e devolve
 *  `count` posições-alvo em coordenadas de mundo. Path2D aceita o path SVG
 *  direto — nada de carregar imagem. */
function sampleLogoTargets(count: number): Float32Array {
  const size = 480;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.scale(size / 48, size / 48);
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#fff";
  ctx.stroke(new Path2D("M7 34 V15 L16 26 L24 14"));
  ctx.stroke(new Path2D("M24 14 L32 26 L41 15 V34"));

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
    const px = pixels[p * 2];
    const py = pixels[p * 2 + 1];
    // jitter sub-pixel pra não ver a grade da amostragem
    out[i * 3] = LOGO_X + ((px + Math.random() * 2) / size - 0.5) * LOGO_SIZE;
    out[i * 3 + 1] = LOGO_Y + (0.5 - (py + Math.random() * 2) / size) * LOGO_SIZE;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return out;
}

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouse;
  attribute vec3 aTarget;
  attribute float aRand;
  varying float vRand;
  varying float vP;

  void main() {
    vRand = aRand;
    float p = clamp(uProgress * 1.35 - aRand * 0.35, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p); // smoothstep
    vP = p;
    vec3 pos = mix(position, aTarget, p);
    // respiração: wobble sutil perpétuo
    pos.x += sin(uTime * 0.6 + aRand * 6.283) * 0.045 * (0.4 + aRand);
    pos.y += cos(uTime * 0.5 + aRand * 9.42) * 0.045 * (0.4 + aRand);
    // repulsão do cursor (coordenadas de mundo em z~0)
    vec2 d = pos.xy - uMouse;
    float dist = length(d);
    pos.xy += (d / max(dist, 0.0001)) * smoothstep(1.7, 0.0, dist) * 0.5;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (30.0 * (0.45 + aRand)) / -mv.z;
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uColA;
  uniform vec3 uColB;
  varying float vRand;
  varying float vP;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.06, d);
    vec3 c = mix(uColA, uColB, vRand);
    gl_FragColor = vec4(c, a * (0.2 + 0.8 * vP));
  }
`;

function LogoParticles({ mouse }: { mouse: React.MutableRefObject<THREE.Vector2> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const { starts, targets, rands } = useMemo(() => {
    const targets = sampleLogoTargets(COUNT);
    const starts = new Float32Array(COUNT * 3);
    const rands = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // nuvem inicial: casca esférica larga em volta da cena
      const r = 7 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starts[i * 3] = LOGO_X + r * Math.sin(phi) * Math.cos(theta);
      starts[i * 3 + 1] = LOGO_Y + r * Math.sin(phi) * Math.sin(theta) * 0.6;
      starts[i * 3 + 2] = -2 + r * Math.cos(phi) * 0.5;
      rands[i] = Math.random();
    }
    return { starts, targets, rands };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uColA: { value: ACCENT_SOFT },
      uColB: { value: ACCENT_DEEP },
    }),
    [],
  );

  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += dt;
    u.uProgress.value = Math.min(1, u.uProgress.value + dt * 0.45);
    u.uMouse.value.lerp(mouse.current, 0.08);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[starts, 3]} />
        <bufferAttribute attach="attributes-aTarget" args={[targets, 3]} />
        <bufferAttribute attach="attributes-aRand" args={[rands, 1]} />
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

const holoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

type HoloSpec = {
  url: string;
  pos: [number, number, number];
  rotY: number;
  scale: number;
  speed: number;
  delay: number;
};

/* Projetos reais como hologramas — os 3 cases cinematográficos do portfólio. */
const HOLOS: HoloSpec[] = [
  { url: "/shots/aurex-motors.webp", pos: [5.0, -1.15, -0.9], rotY: -0.42, scale: 1.15, speed: 1.1, delay: 0.9 },
  { url: "/shots/atelier-vertex.webp", pos: [1.7, 2.05, -2.4], rotY: 0.3, scale: 1.0, speed: 0.8, delay: 1.25 },
  { url: "/shots/kavita.webp", pos: [5.2, 1.75, -2.6], rotY: -0.22, scale: 0.9, speed: 1.4, delay: 1.6 },
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
    g.position.y = spec.pos[1] + Math.sin(t * spec.speed + spec.delay * 7) * 0.14;
    g.rotation.y = spec.rotY + Math.sin(t * 0.3 + spec.delay * 3) * 0.06;
  });

  return (
    <group ref={group} position={spec.pos} scale={spec.scale}>
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

/** Glow radial atrás do logo — o "sol" azul da cena, pulso lento. */
function GlowBackdrop() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });
  return (
    <mesh position={[LOGO_X, LOGO_Y, -4]}>
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
            float d = length((vUv - 0.5) * vec2(1.45, 1.0));
            float pulse = 0.85 + 0.15 * sin(uTime * 0.4);
            float a = smoothstep(0.55, 0.0, d) * 0.16 * pulse;
            gl_FragColor = vec4(vec3(0.14, 0.5, 0.85), a);
          }
        `}
      />
    </mesh>
  );
}

/** Rig: rotação suave do grupo inteiro na direção do cursor + subida no scroll. */
function Rig({ ndc, children }: { ndc: React.MutableRefObject<THREE.Vector2>; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, ndc.current.x * 0.09, 0.045);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -ndc.current.y * 0.05, 0.045);
    g.position.y = window.scrollY * 0.0012;
  });
  return <group ref={group}>{children}</group>;
}

export default function HeroSceneCanvas() {
  /* Mouse fora do R3F: o canvas é pointer-events-none (CTAs clicáveis por
     cima), então window alimenta dois refs — NDC pro rig e mundo-z0 pra
     repulsão das partículas. */
  const ndc = useRef(new THREE.Vector2(0, 0));
  const mouseWorld = useRef(new THREE.Vector2(99, 99));
  const viewport = useRef({ w: 13.2, h: 7.45 });

  const onCreated = (state: RootState) => {
    const update = (e: PointerEvent) => {
      ndc.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      mouseWorld.current.set(
        ndc.current.x * (viewport.current.w / 2),
        ndc.current.y * (viewport.current.h / 2) + window.scrollY * 0.0012 * -1,
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
        <GlowBackdrop />
        <LogoParticles mouse={mouseWorld} />
        {HOLOS.map((h) => (
          <Hologram key={h.url} spec={h} />
        ))}
        <Sparkles count={110} scale={[15, 8, 6]} position={[LOGO_X, 0, -1]} size={2.2} speed={0.32} opacity={0.5} color="#7dd3fc" />
      </Rig>
    </Canvas>
  );
}
