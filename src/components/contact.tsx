import { MessageCircle, Mail, Github, Linkedin, ShieldCheck, LifeBuoy, Code2, BadgeCheck } from "lucide-react";
import { Magnetic } from "./magnetic";
import { Reveal } from "./reveal";
import { Logo } from "./logo";
import { UI, PROFILE, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export function Contact({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  return (
    <section id="contact" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-accent/30 glass p-8 text-center sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-[120px]"
          />
          <h2 className="relative mx-auto max-w-3xl text-3xl font-bold tracking-tight text-fg sm:text-5xl">
            {t(UI.cta.title)}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-fg-muted">{t(UI.cta.sub)}</p>

          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic strength={0.5} className="w-full sm:w-auto">
              <a
                href={waHref("Olá Rick! Vim pelo site da MilWeb e quero um orçamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-soft sm:w-auto glow-accent"
              >
                <MessageCircle className="h-5 w-5" />
                {t(UI.cta.whats)}
              </a>
            </Magnetic>
            <a
              href={`mailto:${PROFILE.email}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line/15 px-6 py-3.5 text-base font-semibold text-fg transition-colors hover:border-accent/50 sm:w-auto"
            >
              <Mail className="h-5 w-5" />
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
    <footer className="border-t border-line/10">
      <div className="container-page flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-sm text-fg-subtle">{t(UI.labels.footerNote)}</p>
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end">
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
        </div>
      </div>
    </footer>
  );
}
