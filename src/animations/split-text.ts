import { gsap } from "./gsap";

/**
 * SplitText sob demanda. Ele só é usado em três lugares (headline do hero
 * no desktop, tipografia gravitacional do Lab e a quebra do Break) e
 * nenhum deles precisa dele no primeiro paint — então sai do bundle
 * inicial e vira um chunk carregado quando (e se) for usado.
 *
 * O plugin é registrado uma única vez, aqui; a promise é memorizada, então
 * chamadas concorrentes compartilham o mesmo download.
 */
type SplitTextCtor = typeof import("gsap/SplitText")["SplitText"];

let pending: Promise<SplitTextCtor> | null = null;
let loaded: SplitTextCtor | null = null;

export function loadSplitText(): Promise<SplitTextCtor> {
  if (loaded) return Promise.resolve(loaded);
  if (!pending) {
    pending = import("gsap/SplitText").then((mod) => {
      gsap.registerPlugin(mod.SplitText);
      loaded = mod.SplitText;
      return loaded;
    });
  }
  return pending;
}

/** Já está em memória? (para decidir entre caminho síncrono e assíncrono) */
export const splitTextReady = () => loaded;

/** Prefetch por intenção (hover/foco): o clique seguinte não espera nada. */
export const prefetchSplitText = () => void loadSplitText();

export type { SplitTextCtor };
export type SplitTextInstance = InstanceType<SplitTextCtor>;
