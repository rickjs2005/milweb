"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { OsProject, OsStrings } from "../../types";

/**
 * O cartaz de recompensa — papel com bordas orgânicas, grão e manchas, a
 * faixa PROCURA-SE / MAIS PROCURADO / MISSÃO ESPECIAL, a imagem do projeto
 * tratada pela "luz" do projeto (tinta e vinheta na cor do humor), o nome em
 * display expandido, o identificador da missão, o selo e uma frase curta.
 *
 * Um sistema só, variação por projeto: `mood` (cor rgb) e `focus` (recorte
 * do hero) vêm dos dados; as bordas e as manchas saem de uma semente
 * determinística (mesmo cartaz no servidor e no cliente). Tudo escala com o
 * próprio papel (unidades de contêiner), então o mesmo componente serve o
 * mural, o cartaz em voo e o dossiê.
 */
export type Seal = "client" | "demo" | "experiment" | "webgl" | "product";
export type Tier = "wanted" | "most" | "special";

export function posterSeal(p: OsProject): Seal {
  if (p.kind === "client") return "client";
  if (p.kindKey === "WEBGL EXPERIENCE") return "webgl";
  if (p.kindKey === "DIGITAL PRODUCT") return "product";
  if (p.kind === "demo") return "demo";
  return "experiment";
}

export function posterTier(p: OsProject): Tier {
  if (p.kind === "client") return "most";
  if (p.kindKey === "WEBGL EXPERIENCE" || p.kind === "study") return "special";
  return "wanted";
}

/** Bordas levemente irregulares (polígono em %), estáveis por semente. */
export function paperEdges(seed: number): string {
  let x = (seed * 9301 + 49297) % 233280;
  const rnd = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  const j = (amp = 1.1) => (rnd() - 0.5) * 2 * amp;
  const pts: string[] = [];
  pts.push(`${(0.3 + rnd() * 0.5).toFixed(2)}% ${(0.3 + rnd() * 0.5).toFixed(2)}%`);
  for (const t of [22, 48, 76]) pts.push(`${(t + j(2)).toFixed(2)}% ${(0.2 + Math.abs(j(0.9))).toFixed(2)}%`);
  pts.push(`${(99.6 - rnd() * 0.5).toFixed(2)}% ${(0.3 + rnd() * 0.5).toFixed(2)}%`);
  for (const t of [24, 50, 77]) pts.push(`${(99.8 - Math.abs(j(0.9))).toFixed(2)}% ${(t + j(2)).toFixed(2)}%`);
  pts.push(`${(99.6 - rnd() * 0.5).toFixed(2)}% ${(99.6 - rnd() * 0.5).toFixed(2)}%`);
  for (const t of [76, 50, 23]) pts.push(`${(t + j(2)).toFixed(2)}% ${(99.8 - Math.abs(j(0.9))).toFixed(2)}%`);
  pts.push(`${(0.3 + rnd() * 0.5).toFixed(2)}% ${(99.6 - rnd() * 0.5).toFixed(2)}%`);
  for (const t of [74, 49, 25]) pts.push(`${(0.2 + Math.abs(j(0.9))).toFixed(2)}% ${(t + j(2)).toFixed(2)}%`);
  return `polygon(${pts.join(", ")})`;
}

/** Manchas de papel velho: dois gradientes radiais em posições estáveis por semente. */
function paperStains(seed: number): string {
  const a = (seed * 37) % 100;
  const b = (seed * 61 + 17) % 100;
  return `radial-gradient(28% 22% at ${a}% ${(seed * 13) % 100}%, rgb(120 90 50 / .14), transparent 70%), radial-gradient(22% 30% at ${b}% ${(seed * 29 + 40) % 100}%, rgb(90 70 40 / .1), transparent 70%)`;
}

export function Poster({ p, index, total, s, withImage = true, eager = false }: { p: OsProject; index: number; total: number; s: OsStrings["projects"]; withImage?: boolean; eager?: boolean }) {
  const seal = posterSeal(p);
  const tier = posterTier(p);
  const seed = index + 1;
  const style = { "--edges": paperEdges(seed), "--stains": paperStains(seed), ...(p.mood ? { "--mood": p.mood } : {}), ...(p.focus ? { "--focus": p.focus } : {}) } as CSSProperties;
  return (
    <span className="bounty__paper" style={style} data-seal={seal}>
      <span className="bounty__shadow" aria-hidden="true" />
      <span className="bounty__sheet">
        <span className="bounty__tier" data-tier={tier}>{tier === "most" ? s.tier.most : tier === "special" ? s.tier.special : s.tier.wanted}</span>
        <span className="bounty__frame">
          {withImage ? (
            <Image src={p.image} alt={p.title} fill sizes="(max-width: 719px) 76vw, 380px" className="bounty__img" loading={eager ? "eager" : "lazy"} draggable={false} />
          ) : (
            <span className="bounty__img bounty__img--empty" aria-hidden="true" />
          )}
          <span className="bounty__tint" aria-hidden="true" />
          <span className="bounty__seal" data-seal={seal} aria-hidden="true">
            {s.seal[seal]}
          </span>
        </span>
        <span className="bounty__name">{p.name}</span>
        <span className="t-mono bounty__id">
          {p.n === "—" ? "MW/OS" : `MW/OS · ${s.rank} ${p.n} / ${String(total).padStart(2, "0")}`}
        </span>
        <span className="bounty__line">{p.tagline}</span>
      </span>
    </span>
  );
}
