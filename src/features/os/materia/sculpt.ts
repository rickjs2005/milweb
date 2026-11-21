import { SCULPT } from "./sculpt-data";

/**
 * As esculturas da Matéria (assets/materia/sculpt → public/models/sculpt-<figura>{,-lite}.bin): a figura em
 * repouso e as seis que ela vira — cada uma com o corpo esculpido na pose, o panejamento, os adereços e os GRÃOS
 * (pontos na superfície; o grão i de uma figura corresponde ao grão i de outra: rosto com rosto, tecido com
 * tecido). O formato está no cabeçalho de assets/materia/sculpt/pack.py.
 */
export type SculptId = keyof typeof SCULPT;
export const SCULPT_IDS = Object.keys(SCULPT) as SculptId[];
/** A figura de cada destino do sistema (as demais áreas ficam com a de repouso). */
export const SCULPT_OF: Partial<Record<string, SculptId>> = { projects: "projects", profile: "profile", services: "services", studio: "studio", lab: "lab", contact: "contact" };

export type Sculpt = {
  id: SculptId;
  count: number;
  position: Float32Array;
  /** normal (xyz) e oclusão */
  na: Int8Array;
  /** região, ordem de formação, sombra da luz principal, pedra bruta */
  meta: Uint8Array;
  /** osso A, osso B, peso de A, semente */
  skin: Uint8Array;
  index: Uint16Array | Uint32Array;
  grains: { count: number; position: Float32Array; /** normal (xyz) e região */ nr: Int8Array; /** ordem, semente, luz */ meta: Uint8Array };
};

const REV = process.env.NEXT_PUBLIC_MATERIA_REV;
export const sculptUrl = (id: SculptId, lite: boolean) => `/models/sculpt-${id}${lite ? "-lite" : ""}.bin${REV ? `?v=${REV}` : ""}`;

export function decodeSculpt(id: SculptId, buf: ArrayBuffer): Sculpt {
  const view = new DataView(buf);
  if (view.getUint32(0, false) !== 0x4d545331) throw new Error("materia: escultura em formato desconhecido");
  const n = view.getUint32(4, true);
  const ni = view.getUint32(8, true);
  const m = view.getUint32(12, true);
  const center = [view.getFloat32(16, true), view.getFloat32(20, true), view.getFloat32(24, true)];
  const scale = view.getFloat32(28, true) / 32767;
  let at = 32;
  const take16 = (count: number) => {
    const src = new Int16Array(buf.slice(at, at + count * 6));
    at += count * 6 + ((count * 6) % 4);
    const out = new Float32Array(count * 3);
    for (let i = 0; i < out.length; i++) out[i] = src[i] * scale + center[i % 3];
    return out;
  };
  const position = take16(n);
  const na = new Int8Array(buf.slice(at, at + n * 4));
  at += n * 4;
  const meta = new Uint8Array(buf.slice(at, at + n * 4));
  at += n * 4;
  const skin = new Uint8Array(buf.slice(at, at + n * 4));
  at += n * 4;
  const wide = n > 65535;
  const bytes = ni * (wide ? 4 : 2);
  const index = wide ? new Uint32Array(buf.slice(at, at + bytes)) : new Uint16Array(buf.slice(at, at + bytes));
  at += bytes + (bytes % 4);
  const gp = take16(m);
  const nr = new Int8Array(buf.slice(at, at + m * 4));
  at += m * 4;
  const gm = new Uint8Array(buf.slice(at, at + m * 4));
  return { id, count: n, position, na, meta, skin, index, grains: { count: m, position: gp, nr, meta: gm } };
}

const cache = new Map<string, Promise<Sculpt>>();
/** Baixa (uma vez) e decodifica uma figura. A completa só para GPU com folga; o telefone recebe a leve. */
export function loadSculpt(id: SculptId, lite: boolean, signal?: AbortSignal): Promise<Sculpt> {
  const url = sculptUrl(id, lite);
  let p = cache.get(url);
  if (!p) {
    p = fetch(url, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`materia: ${res.status} em ${url}`);
        return res.arrayBuffer();
      })
      .then((buf) => decodeSculpt(id, buf));
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}
