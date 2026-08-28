import { Reveal } from "@/animations/reveal";

/** ACT 08 — BUILT WITH. Quatro palavras grandes; a stack em mono, discreta. */
export function BuiltWith({ eyebrow, big, stack }: { eyebrow: string; big: readonly string[]; stack: readonly string[] }) {
  return (
    <section data-act="ACT 08 / BUILT WITH" data-inspect="BUILT_WITH" className="container-page py-24 md:py-32">
      <Reveal>
        <div data-rule className="rule flex items-center justify-between pt-3 t-mono">
          <span data-reveal>{eyebrow}</span>
          <span data-reveal className="tnum text-ink-3">
            MW/008
          </span>
        </div>
        <ul className="mt-10 md:mt-16">
          {big.map((w, i) => (
            <li key={w} data-reveal className="flex items-baseline gap-6 py-1 md:gap-10">
              <span className="t-mono tnum text-ink-3">0{i + 1}</span>
              <span className={"t-display t-display-md " + (i === big.length - 1 ? "text-ink-3" : "text-ink")}>{w}</span>
            </li>
          ))}
        </ul>
        <p data-reveal className="t-mono mt-12 text-ink-3 md:mt-16">
          {stack.join("  ·  ")}
        </p>
      </Reveal>
    </section>
  );
}
