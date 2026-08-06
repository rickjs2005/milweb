import { Mail, Github, Linkedin, ShieldCheck, LifeBuoy, Code2, BadgeCheck } from "lucide-react";
import { Reveal } from "./reveal";
import { CtaGlow } from "./cta-glow";
import { Logo } from "./logo";
import { QuotePicker } from "./quote-picker";
import { UI, QUOTE, PROFILE, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";

export function Contact({
  locale,
  /** Slug de SERVICES: a página do serviço já entrega o chip dela marcado. */
  preselectedType,
}: {
  locale: Locale;
  preselectedType?: string;
}) {
  const t = makeT(locale);
  // Textos resolvidos AQUI (Server Component) e passados prontos: é o que
  // mantém content.ts fora do bundle do browser.
  const option = (o: { key: string; label: typeof UI.cta.title; phrase: typeof UI.cta.title }) => ({
    key: o.key,
    label: t(o.label),
    phrase: t(o.phrase),
  });
  return (
    <section id="contact" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal variant="depth">
        <div className="relative overflow-hidden rounded-3xl border border-accent/30 glass p-8 text-center sm:p-14">
          <CtaGlow />
          <h2 className="relative mx-auto max-w-3xl text-3xl font-bold tracking-tight text-fg sm:text-5xl">
            {t(UI.cta.title)}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-fg-muted">{t(UI.cta.sub)}</p>

          {/* Duas escolhas montam a mensagem do WhatsApp. Escolher é
              opcional: sem clique nenhum, o botão leva a mesma mensagem de
              sempre (QUOTE.fallback). */}
          <QuotePicker
            typeQuestion={t(QUOTE.typeQuestion)}
            statusQuestion={t(QUOTE.statusQuestion)}
            types={QUOTE.types.map(option)}
            statuses={QUOTE.statuses.map(option)}
            greeting={t(QUOTE.greeting)}
            closing={t(QUOTE.closing)}
            joiner={t(QUOTE.joiner)}
            fallbackMessage={t(QUOTE.fallback)}
            previewLabel={t(QUOTE.previewLabel)}
            ctaLabel={t(UI.cta.whats)}
            whatsapp={PROFILE.whatsapp}
            preselectedType={preselectedType}
          />

          <div className="relative mt-4 flex justify-center">
            <a
              href={`mailto:${PROFILE.email}`}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-fg-subtle transition-colors hover:text-fg"
            >
              <Mail className="h-4 w-4" />
              {t(UI.cta.email)}
            </a>
          </div>

          {/* Selos de confiança honestos — sem preço nem depoimento inventado. */}
          <ul className="relative mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-medium text-fg-subtle sm:text-sm">
            {[
              { icon: ShieldCheck, label: UI.trust.contract },
              { icon: LifeBuoy, label: UI.trust.support },
              { icon: Code2, label: UI.trust.ownCode },
              { icon: BadgeCheck, label: UI.trust.freeQuote },
            ].map(({ icon: Icon, label }) => (
              <li key={label.en} className="inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-accent/70" aria-hidden />
                {t(label)}
              </li>
            ))}
          </ul>

          <div className="relative mt-8 flex items-center justify-center gap-5 text-fg-subtle">
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="transition-colors hover:text-accent">
              <Github className="h-5 w-5" />
            </a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-accent">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href={`mailto:${PROFILE.email}`} aria-label="E-mail" className="transition-colors hover:text-accent">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const year = new Date().getFullYear();
  return (
    <footer id="footer" className="border-t border-line/10">
      <div className="container-page flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <Reveal variant="slide-left" className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-sm text-fg-subtle">{t(UI.labels.footerNote)}</p>
        </Reveal>
        <Reveal variant="slide-right" delay={120} className="flex flex-col items-center gap-2 sm:items-end">
          <div className="flex items-center gap-4 text-fg-subtle">
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="transition-colors hover:text-accent">
              <Github className="h-4 w-4" />
            </a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-accent">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href={`mailto:${PROFILE.email}`} aria-label="E-mail" className="transition-colors hover:text-accent">
              <Mail className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs text-fg-subtle">
            © {year} MilWeb · {t(UI.labels.rights)}
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
