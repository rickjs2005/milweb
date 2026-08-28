import Image from "next/image";
import { Reveal } from "@/animations/reveal";

/**
 * ACT 07 — HUMAN. Depois de tanta tecnologia, quase nada: papel, espaço e
 * uma frase. O contraste é o ponto — nenhuma caixa, nenhum ícone.
 */
export function Human({ headline, tail, name, role, location, act }: { headline: readonly string[]; tail: string; name: string; role: string; location: string; act: string }) {
  return (
    <section id="human" data-act={act} data-inspect="HUMAN" className="container-page flex min-h-[100svh] flex-col justify-center py-32 md:py-48">
      <Reveal>
        <h2 className="t-display t-display-lg text-ink" data-inspect="H2">
          {headline.map((l) => (
            <span key={l} data-reveal className="block">
              {l}
            </span>
          ))}
        </h2>
        <p data-reveal className="t-display t-display-lg mt-[0.6em] text-ink-3">
          {tail}
        </p>
      </Reveal>

      <Reveal className="grid-12 mt-24 items-end gap-y-8 md:mt-40">
        <div data-reveal className="col-span-1">
          <Image src="/avatar.png" alt={name} width={112} height={112} sizes="112px" className="w-20 grayscale md:w-28" data-inspect="IMG / RICK" />
        </div>
        <div data-reveal className="t-mono col-span-3 md:col-span-4 md:col-start-3">
          <p className="text-ink">{name}</p>
          <p className="mt-1 text-ink-3">{role}</p>
        </div>
        <p data-reveal className="t-mono col-span-4 text-ink-3 md:col-span-4 md:col-start-9 md:text-right">
          {location}
        </p>
      </Reveal>
    </section>
  );
}
