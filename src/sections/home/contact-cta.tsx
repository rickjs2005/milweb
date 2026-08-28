import Link from "next/link";
import { PROFILE } from "@/lib/content";
import { fitLines } from "@/lib/fit";

/**
 * ACT 09 — CONTACT. A última viewport: uma pergunta e uma ação. Ao
 * aproximar o cursor de PROJECT, a palavra revela a própria estrutura —
 * bounding box, labels e uma cota — só com CSS (group-hover).
 */
export function ContactCta({ headline, cta, ctaWord, href, email, whatsapp, act, label }: { headline: readonly string[]; cta: string; ctaWord: string; href: string; email: string; whatsapp: string; act: string; label: string }) {
  const [before, after] = cta.split(ctaWord);
  return (
    <section id="contact" data-act={act} data-inspect="CONTACT" className="container-page flex min-h-[100svh] flex-col justify-between pb-8 pt-nav">
      <div className="rule flex items-center justify-between pt-3 t-mono">
        <span>{label}</span>
        <span className="tnum text-ink-3">MW/009</span>
      </div>

      <h2 className="t-display t-display-xl t-fit-md text-ink" style={fitLines(headline)} data-inspect="H2">
        {headline.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </h2>

      <div className="grid-12 items-end gap-y-8">
        <Link href={href} className="group col-span-4 md:col-span-8 lg:col-span-8" data-inspect="CTA / START_A_PROJECT">
          <span className="t-display t-display-md inline-block text-ink">
            {before}
            <span className="relative inline-block">
              {/* estrutura interna da palavra: aparece no hover */}
              <span aria-hidden="true" className="pointer-events-none absolute -inset-x-2 -inset-y-1 border border-signal opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
              <span aria-hidden="true" className="t-mono pointer-events-none absolute -top-5 left-0 bg-signal px-1 text-[10px] tracking-[0.06em] text-signal-ink opacity-0 transition-opacity duration-fast group-hover:opacity-100">
                [SPAN] .word
              </span>
              <span aria-hidden="true" className="t-mono pointer-events-none absolute -bottom-5 right-0 text-[10px] tracking-[0.06em] text-signal opacity-0 transition-opacity duration-fast group-hover:opacity-100">
                grid 12 · col 1–6
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-signal/60 opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
              {ctaWord}
            </span>
            {after}
            <span className="ml-[0.25em] inline-block transition-transform duration-medium ease-out-expo group-hover:translate-x-2">→</span>
          </span>
        </Link>
        <ul className="t-mono col-span-4 flex gap-6 md:col-span-8 lg:col-span-4 lg:justify-end">
          <li>
            <a href={`mailto:${PROFILE.email}`} className="link-rule text-ink">
              {email}
            </a>
          </li>
          <li>
            <a href={`https://wa.me/${PROFILE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="link-rule text-ink">
              {whatsapp}
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
