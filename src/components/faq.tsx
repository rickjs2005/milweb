import { Plus } from "lucide-react";
import { FAQ, UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";

export function Faq({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: t(item.q),
      acceptedAnswer: { "@type": "Answer", text: t(item.a) },
    })),
  };
  return (
    <section id="faq" className="container-page scroll-mt-20 py-20 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">09 / </span>
          {t(UI.sections.faqEyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.faqTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.faqSub)}</p>
      </Reveal>

      <div className="mx-auto mt-10 max-w-3xl divide-y divide-line/10 rounded-2xl border border-line/10 glass">
        {FAQ.map((item, i) => (
          <Reveal key={item.q.en} delay={(i % 3) * 60}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-semibold text-fg transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                {t(item.q)}
                <Plus className="h-5 w-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-fg-muted">{t(item.a)}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
