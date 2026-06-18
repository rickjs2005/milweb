"use client";

import { useLang } from "./lang-provider";
import { Reveal } from "./reveal";
import { Logo } from "./logo";
import { UI } from "@/lib/content";

/** "Sobre a MilWeb" — discreto: autoridade sem parecer agência. */
export function About() {
  const { t } = useLang();
  return (
    <section id="about" className="container-page scroll-mt-20 py-16 sm:py-24">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-2xl border border-line/10 glass p-8 text-center sm:p-10">
          <div className="mb-5 flex justify-center">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t(UI.sections.aboutTitle)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-fg-muted">
            {t(UI.sections.aboutBody)}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
