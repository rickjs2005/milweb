/**
 * Textura de ruído do fundo: 256 × 256, três canais independentes, semente
 * fixa (scene/bake.ts a sobe como DataTexture). Os shaders a leem com filtro
 * linear e repetição e suavizam a interpolação (ruído de valor com UMA leitura
 * por oitava). A semente fixa faz o canvas e as imagens estáticas
 * (scripts/scene-still.mjs) verem exatamente o mesmo ruído.
 */
export const NOISE_SIZE = 256;

let cached: Uint8Array | null = null;

/** RGBA (alfa 255) — mulberry32 com semente fixa. */
export function noiseData(): Uint8Array {
  if (cached) return cached;
  const out = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4);
  let s = 0x2f6b9d31;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < out.length; i += 4) {
    out[i] = (rnd() * 256) | 0;
    out[i + 1] = (rnd() * 256) | 0;
    out[i + 2] = (rnd() * 256) | 0;
    out[i + 3] = 255;
  }
  cached = out;
  return out;
}
