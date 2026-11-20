import { FIGURE_URLS, MATERIA_URLS } from "./config";

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

/**
 * A figura da home, articulada (ver o cabeçalho de assets/materia/build_figure.py): o corpo (tronco e cabeça,
 * já na pose da cena), o braço e a mão em repouso — a mão em três formas, a mesma malha. O motor desenha o
 * braço e a mão duas vezes (rig.ts).
 */
export type FigureShape = { position: Float32Array; na: Int8Array };
export type FigurePart = { count: number; shapes: FigureShape[]; /** caminho da luz, dissolução, semente */ meta: Uint8Array; /** osso A, osso B, peso de A */ skin: Uint8Array; index: Uint16Array };
export type FigureMesh = { body: FigurePart; arm: FigurePart; hand: FigurePart };

function decodeFigure(buf: ArrayBuffer): FigureMesh {
  const view = new DataView(buf);
  if (view.getUint32(0, false) !== 0x4d544632) throw new Error("materia: figura em formato desconhecido");
  const n = view.getUint32(4, true);
  let at = 8;
  const parts: FigurePart[] = [];
  for (let k = 0; k < n; k++) {
    const count = view.getUint32(at, true);
    const indices = view.getUint32(at + 4, true);
    const forms = view.getUint32(at + 8, true);
    const center = [view.getFloat32(at + 12, true), view.getFloat32(at + 16, true), view.getFloat32(at + 20, true)];
    const scale = view.getFloat32(at + 24, true) / 32767;
    at += 28;
    const shapes: FigureShape[] = [];
    for (let f = 0; f < forms; f++) {
      const src = new Int16Array(buf.slice(at, at + count * 6));
      at += count * 6 + ((count * 6) % 4);
      const position = new Float32Array(count * 3);
      for (let i = 0; i < position.length; i++) position[i] = src[i] * scale + center[i % 3];
      const na = new Int8Array(buf.slice(at, at + count * 4));
      at += count * 4;
      shapes.push({ position, na });
    }
    const meta = new Uint8Array(buf.slice(at, at + count * 4));
    at += count * 4;
    const skin = new Uint8Array(buf.slice(at, at + count * 4));
    at += count * 4;
    const index = new Uint16Array(buf.slice(at, at + indices * 2));
    at += indices * 2 + ((indices * 2) % 4);
    parts.push({ count, shapes, meta, skin, index });
  }
  if (parts.length < 3) throw new Error("materia: figura incompleta");
  return { body: parts[0], arm: parts[1], hand: parts[2] };
}

/** A malha completa só para GPU com folga; as demais (e o telefone) recebem a versão leve. */
export async function loadFigure(full: boolean, signal?: AbortSignal): Promise<FigureMesh> {
  const url = full ? FIGURE_URLS.full : FIGURE_URLS.lite;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`materia: ${res.status} em ${url}`);
  return decodeFigure(await res.arrayBuffer());
}
