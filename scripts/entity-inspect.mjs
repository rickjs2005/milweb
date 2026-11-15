// Inspeciona o GLB do personagem (public/models/entity.glb): nós, ossos, materiais, clipes e orçamento.
//   node scripts/entity-inspect.mjs [arquivo.glb]
import { readFileSync } from "node:fs";

const file = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? new URL("../public/models/entity.glb", import.meta.url);
const buf = readFileSync(file);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("não é um GLB");
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
const acc = json.accessors ?? [];
const count = (i) => acc[i]?.count ?? 0;
const bytesOf = (i) => {
  const a = acc[i];
  if (!a) return 0;
  const comp = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type];
  return a.count * comp * n;
};

let tris = 0;
let verts = 0;
let meshBytes = 0;
const prims = [];
for (const m of json.meshes ?? []) {
  for (const p of m.primitives) {
    const t = count(p.indices) / 3;
    tris += t;
    verts += count(p.attributes.POSITION);
    meshBytes += bytesOf(p.indices) + Object.values(p.attributes).reduce((s, i) => s + bytesOf(i), 0);
    prims.push({ material: json.materials?.[p.material]?.name, tris: t, verts: count(p.attributes.POSITION), attrs: Object.keys(p.attributes).join(",") });
  }
}
const joints = json.skins?.[0]?.joints ?? [];
const names = joints.map((j) => json.nodes[j].name);
const anims = (json.animations ?? []).map((a) => {
  const dur = Math.max(...a.samplers.map((s) => acc[s.input].max?.[0] ?? 0));
  const paths = {};
  for (const c of a.channels) paths[c.target.path] = (paths[c.target.path] ?? 0) + 1;
  const bytes = a.samplers.reduce((s, sm) => s + bytesOf(sm.output), 0);
  return { name: a.name, dur: +dur.toFixed(3), channels: a.channels.length, paths, kb: +(bytes / 1024).toFixed(1) };
});

console.log(
  JSON.stringify(
    {
      bytes: buf.length,
      mb: +(buf.length / 1048576).toFixed(3),
      generator: json.asset?.generator,
      extensions: json.extensionsUsed ?? [],
      meshes: json.meshes?.length,
      drawCalls: prims.length,
      tris,
      verts,
      meshKb: +(meshBytes / 1024).toFixed(1),
      materials: (json.materials ?? []).map((m) => ({ name: m.name, doubleSided: !!m.doubleSided, base: m.pbrMetallicRoughness?.baseColorFactor?.map((v) => +v.toFixed(3)), metal: m.pbrMetallicRoughness?.metallicFactor, rough: m.pbrMetallicRoughness?.roughnessFactor, emissive: m.emissiveFactor, strength: m.extensions?.KHR_materials_emissive_strength?.emissiveStrength })),
      textures: json.textures?.length ?? 0,
      bones: names.length,
      prims,
      anims,
    },
    null,
    1,
  ),
);
if (process.argv.includes("--bones")) console.log(names.join(" "));
