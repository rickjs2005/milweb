import {
  AdditiveBlending,
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  CanvasTexture,
  Color,
  Group,
  LoopOnce,
  LoopRepeat,
  type Material,
  type Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  type Object3D,
  type SkinnedMesh,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { COMPOSE } from "./scene.config";
import { buildRig, type Rig } from "./rig";

/**
 * A entidade carregada: o GLB, o esqueleto, os clipes e os poucos efeitos que andam com ela
 * (halo da fenda, ponto de luz do contato). Nada aqui decide comportamento — isso é do
 * director.ts; aqui ficam o asset e os mecanismos.
 *
 * Clipes (feitos no Blender, assets/entity/entity_anim.py): Idle, Attention, Anticipate,
 * Reach_R/L, Touch_R/L, Present, Return, Bow. Só as rotações entram no mixer: as posições dos ossos
 * são as do arquivo e o deslocamento do corpo é do runtime.
 */
export type ClipName = "Idle" | "Attention" | "Anticipate" | "Reach_R" | "Reach_L" | "Touch_R" | "Touch_L" | "Present" | "Return" | "Bow";
const LOOPS: ClipName[] = ["Idle", "Attention", "Reach_R", "Reach_L", "Present"];
const ONCE: ClipName[] = ["Anticipate", "Touch_R", "Touch_L", "Return", "Bow"];

export type Entity = {
  /** Pivô no quadril: posição, giro e inclinação do corpo inteiro. */
  pivot: Group;
  rig: Rig;
  mesh: SkinnedMesh;
  mixer: AnimationMixer;
  actions: Record<ClipName, AnimationAction>;
  /** Pesos atuais dos clipes (o director escreve os alvos; `blend` os persegue e normaliza). */
  weights: Record<ClipName, number>;
  /** Reinicia um clipe de uma vez só (antecipação, toque, retorno). */
  fire(name: ClipName): void;
  /** Aproxima os pesos dos alvos (constante de tempo `tau`, s) e os aplica, somando 1. */
  blend(target: Partial<Record<ClipName, number>>, dt: number, tau: number): void;
  /** Material da emissão (juntas, fenda): cor e intensidade por tema e por gesto. */
  glow: MeshBasicMaterial;
  /** Materiais PBR (grafite, metal, aço) — o motor ajusta o ambiente por tema. */
  pbr: MeshStandardMaterial[];
  /** Halo da fenda do elmo e ponto de luz do contato (sprites aditivos). */
  visor: Sprite;
  spark: Sprite;
  ring: Sprite;
  /** Posição de repouso de cada fragmento (local do osso pai), para a deriva. */
  fragRest: Vector3[];
  tris: number;
  dispose(): void;
};

function radial(inner: number, ring = false): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (ring) {
    gr.addColorStop(0, "rgba(255,255,255,0)");
    gr.addColorStop(0.62, "rgba(255,255,255,0)");
    gr.addColorStop(0.8, "rgba(255,255,255,1)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
  } else {
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(inner, "rgba(255,255,255,0.55)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.14)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

export async function loadEntity(url: string, signal?: { cancelled: boolean }): Promise<Entity | null> {
  const gltf = await new GLTFLoader().loadAsync(url);
  if (signal?.cancelled) return null;
  const model = gltf.scene;
  const rig = buildRig(model);
  let mesh: SkinnedMesh | null = null;
  model.traverse((o: Object3D) => {
    if ((o as SkinnedMesh).isSkinnedMesh) mesh = o as SkinnedMesh;
  });
  // modelo que não é o deste código: o motivo vai para o console (engine.ts › load) em vez de um fracasso mudo
  if (!rig || !mesh) throw new Error("o modelo não tem o esqueleto ou a malha esperados");
  const body = mesh as SkinnedMesh;
  // o esqueleto sai muito da caixa da pose de repouso (braço estendido): sem descarte por frustum
  body.frustumCulled = false;

  // Materiais: os três PBR ficam como vieram do arquivo; a emissão vira um material sem luz (cor exata do tema).
  const glow = new MeshBasicMaterial({ color: new Color("#ff3a2a"), toneMapped: false });
  const pbr: MeshStandardMaterial[] = [];
  const old: Material[] = [];
  const swap = (m: Material): Material => {
    if (m.name === "MW_Glow") {
      old.push(m);
      return glow;
    }
    pbr.push(m as MeshStandardMaterial);
    return m;
  };
  body.material = Array.isArray(body.material) ? body.material.map(swap) : swap(body.material);
  // o GLTFLoader separa as primitivas em malhas irmãs: aplica a troca em todas
  model.traverse((o: Object3D) => {
    const sm = o as SkinnedMesh;
    if (!sm.isSkinnedMesh || sm === body) return;
    sm.frustumCulled = false;
    sm.material = Array.isArray(sm.material) ? sm.material.map(swap) : swap(sm.material);
  });

  const pivot = new Group();
  model.position.set(0, -COMPOSE.hips, 0);
  pivot.add(model);

  const mixer = new AnimationMixer(model);
  const actions = {} as Record<ClipName, AnimationAction>;
  const weights = {} as Record<ClipName, number>;
  for (const name of [...LOOPS, ...ONCE]) {
    const src = AnimationClip.findByName(gltf.animations, name);
    if (!src) throw new Error(`o modelo não tem o clipe "${name}" (arquivo de outra revisão?)`);
    const clip = new AnimationClip(name, src.duration, src.tracks.filter((t) => t.name.endsWith(".quaternion")));
    const a = mixer.clipAction(clip);
    if (ONCE.includes(name)) {
      a.setLoop(LoopOnce, 1);
      a.clampWhenFinished = true;
    } else a.setLoop(LoopRepeat, Infinity);
    a.enabled = true;
    a.setEffectiveTimeScale(1);
    a.setEffectiveWeight(name === "Idle" ? 1 : 0);
    a.play();
    actions[name] = a;
    weights[name] = name === "Idle" ? 1 : 0;
  }

  const dot = radial(0.12);
  const visor = new Sprite(new SpriteMaterial({ map: dot, color: glow.color, blending: AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5, toneMapped: false }));
  visor.scale.set(0.42, 0.2, 1);
  visor.position.set(-0.005, 0.12, 0.13);
  rig.head.add(visor);
  const spark = new Sprite(new SpriteMaterial({ map: dot, color: glow.color, blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0, toneMapped: false }));
  const ring = new Sprite(new SpriteMaterial({ map: radial(0, true), color: glow.color, blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0, toneMapped: false }));
  spark.renderOrder = ring.renderOrder = 5;

  let tris = 0;
  model.traverse((o: Object3D) => {
    const g = (o as Mesh).geometry;
    if (g?.index) tris += g.index.count / 3;
  });

  return {
    pivot,
    rig,
    mesh: body,
    mixer,
    actions,
    weights,
    glow,
    pbr,
    visor,
    spark,
    ring,
    fragRest: rig.frags.map((b) => b.position.clone()),
    tris,
    fire(name) {
      const a = actions[name];
      a.reset();
      a.setEffectiveTimeScale(1);
      a.play();
    },
    blend(target, dt, tau) {
      const k = 1 - Math.exp(-dt / Math.max(1e-4, tau));
      let sum = 0;
      for (const name in weights) {
        const n = name as ClipName;
        weights[n] += ((target[n] ?? 0) - weights[n]) * k;
        if (weights[n] < 1e-4) weights[n] = 0;
        sum += weights[n];
      }
      if (sum < 1e-4) {
        weights.Idle = 1;
        sum = 1;
      }
      for (const name in weights) {
        const n = name as ClipName;
        actions[n].setEffectiveWeight(weights[n] / sum);
      }
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      model.traverse((o: Object3D) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      body.skeleton?.dispose();
      for (const m of [...pbr, ...old, glow, visor.material, spark.material, ring.material]) m.dispose();
      dot.dispose();
      ring.material.map?.dispose();
    },
  };
}
