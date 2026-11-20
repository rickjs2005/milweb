import { MATERIA_URLS } from "./config";

/** Moléculas decodificadas (ver o cabeçalho de assets/materia/build_materia.py). */
export type Molecules = { count: number; bust: Float32Array; brain: Float32Array; normal: Float32Array; brainNormal: Float32Array; meta: Uint8Array };

function decode(buf: ArrayBuffer): Molecules {
  const view = new DataView(buf);
  if (view.getUint32(0, false) !== 0x4d545231) throw new Error("materia: formato desconhecido");
  const n = view.getUint32(4, true);
  const sBust = view.getFloat32(8, true) / 32767;
  const sBrain = view.getFloat32(12, true) / 32767;
  let at = 16;
  const take16 = (scale: number) => {
    const src = new Int16Array(buf.slice(at, at + n * 6));
    at += n * 6;
    const out = new Float32Array(n * 3);
    for (let i = 0; i < out.length; i++) out[i] = src[i] * scale;
    return out;
  };
  const take8 = () => {
    const src = new Int8Array(buf, at, n * 3);
    at += n * 3;
    const out = new Float32Array(n * 3);
    for (let i = 0; i < out.length; i++) out[i] = src[i] / 127;
    return out;
  };
  const bust = take16(sBust);
  const brain = take16(sBrain);
  const normal = take8();
  const brainNormal = take8();
  const meta = new Uint8Array(buf.slice(at, at + n * 4));
  return { count: n, bust, brain, normal, brainNormal, meta };
}

function join(a: Molecules, b: Molecules): Molecules {
  const cat = <T extends Float32Array | Uint8Array>(x: T, y: T): T => {
    const out = new (x.constructor as new (n: number) => T)(x.length + y.length);
    out.set(x);
    out.set(y, x.length);
    return out;
  };
  return { count: a.count + b.count, bust: cat(a.bust, b.bust), brain: cat(a.brain, b.brain), normal: cat(a.normal, b.normal), brainNormal: cat(a.brainNormal, b.brainNormal), meta: cat(a.meta, b.meta) };
}

/**
 * O primeiro arquivo é o do telefone: rosto e ombros densos e um cérebro inteiro. O segundo completa o
 * busto e adensa o cérebro — se falhar, o que há continua valendo.
 */
export async function loadMolecules(full: boolean, signal?: AbortSignal): Promise<Molecules> {
  const get = async (url: string) => {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`materia: ${res.status} em ${url}`);
    return decode(await res.arrayBuffer());
  };
  const first = get(MATERIA_URLS.a);
  if (!full) return first;
  const [a, b] = await Promise.all([first, get(MATERIA_URLS.b).catch(() => null)]);
  return b ? join(a, b) : a;
}
