import type { CSSProperties } from "react";

/**
 * style para `.t-fit` (globals.css): a headline escala pela linha mais longa
 * (--chars) e nunca passa do tamanho normal. Serve para PT/EN/ES caberem
 * na mesma composição sem quebrar palavra nem cortar no ultrawide.
 */
export function fitLines(lines: readonly string[]): CSSProperties {
  return { "--chars": Math.max(1, ...lines.map((l) => l.length)) } as CSSProperties;
}
