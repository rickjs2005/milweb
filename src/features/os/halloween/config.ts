/**
 * Halloween 2026 — a janela do evento, a política e a decisão de ativação.
 *
 * Módulo PURO, sem imports: o script inline do layout, o relógio do cliente (clock.ts) e os testes
 * (scripts/halloween-check.mjs) usam exatamente a mesma regra. Datas são instantes absolutos
 * (Date.parse de um ISO com offset de Brasília), nunca o fuso do visitante.
 *
 * Como acender ou apagar:
 *   · fora do intervalo o site é o normal; dentro dele, o evento liga sozinho — nada depende de build,
 *     de cache da página ou de alguém lembrar em novembro;
 *   · NEXT_PUBLIC_HALLOWEEN=off        → desliga o evento em qualquer ambiente (desativação emergencial);
 *   · NEXT_PUBLIC_HALLOWEEN_PREVIEW=on → força o evento ligado, mas SÓ em desenvolvimento local ou em
 *     deploy de preview da Vercel; em produção a variável é ignorada (não existe parâmetro público de URL).
 */
export const HALLOWEEN_START_ISO = "2026-10-28T00:00:00-03:00";
export const HALLOWEEN_END_ISO = "2026-11-01T00:00:00-03:00";

/** Início inclusivo e fim exclusivo, em milissegundos desde a época Unix. */
export const HALLOWEEN_START = Date.parse(HALLOWEEN_START_ISO);
export const HALLOWEEN_END = Date.parse(HALLOWEEN_END_ISO);

export type HalloweenPolicy = { kill: boolean; force: boolean };

export type HalloweenEnv = {
  /** NEXT_PUBLIC_HALLOWEEN */
  off?: string;
  /** NEXT_PUBLIC_HALLOWEEN_PREVIEW */
  preview?: string;
  /** process.env.NODE_ENV */
  nodeEnv?: string;
  /** NEXT_PUBLIC_VERCEL_ENV: "production" | "preview" | "development" */
  vercelEnv?: string;
};

/** Variáveis de ambiente → política. A pré-visualização só vale em desenvolvimento e em preview. */
export function resolvePolicy(env: HalloweenEnv): HalloweenPolicy {
  const kill = env.off === "off";
  const previewAllowed = env.nodeEnv === "development" || env.vercelEnv === "preview";
  const force = previewAllowed && env.preview === "on";
  return { kill, force };
}

/** `ms` está dentro de [início, fim)? */
export function isInWindow(ms: number): boolean {
  return ms >= HALLOWEEN_START && ms < HALLOWEEN_END;
}

/** A decisão final: o interruptor de emergência vence tudo; a prévia força; senão vale o intervalo. */
export function isHalloweenActive(ms: number, policy: HalloweenPolicy): boolean {
  if (policy.kill) return false;
  if (policy.force) return true;
  return isInWindow(ms);
}

/** Milissegundos até a próxima virada (início ou fim); null quando não há mais nenhuma ou a política fixa o estado. */
export function msUntilNextChange(ms: number, policy: HalloweenPolicy): number | null {
  if (policy.kill || policy.force) return null;
  if (ms < HALLOWEEN_START) return HALLOWEEN_START - ms;
  if (ms < HALLOWEEN_END) return HALLOWEEN_END - ms;
  return null;
}

/**
 * Script inline (logo depois do THEME_SCRIPT, antes de qualquer pintura): marca o <html> do evento e força
 * o conjunto de tokens escuro (Obito) só no atributo — a preferência salva do visitante não é tocada. A
 * mesma regra de isHalloweenActive, sem módulos, com os instantes já convertidos em números.
 */
export function halloweenScript(policy: HalloweenPolicy): string {
  return (
    "(function(){try{var n=Date.now();" +
    "var on=" +
    (policy.kill ? "false" : policy.force ? "true" : "n>=" + HALLOWEEN_START + "&&n<" + HALLOWEEN_END) +
    ";if(on){var h=document.documentElement;h.setAttribute('data-os-event','halloween');h.setAttribute('data-os-theme','obito');}" +
    "}catch(e){}})();"
  );
}
