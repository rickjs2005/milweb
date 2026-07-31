import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { DIAGNOSTICO, type Locale } from "@/lib/content";
import { makeT, withLocale } from "@/lib/i18n";
import { Reveal } from "./reveal";

/**
 * Card-ponte do Diagnóstico na home (opção 3 do designer, a favorita do
 * Rick): logo abaixo dos projetos, o diagnóstico vira "produto" com nome
 * próprio. É a ponte entre "gostei do seu trabalho" e "quero falar com
 * você" — quem ainda não está pronto pro orçamento entra por aqui. Sem
 * número de seção de propósito: é um card, não um capítulo da home.
 */
export function DiagnosticBanner({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const c = DIAGNOSTICO.banner;

  return (
    <section className="container-page py-10 sm:py-14">
      <Reveal>
        <div className="glass relative overflow-hidden rounded-3xl border border-accent/25 p-10 text-center sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background:radial-gradient(36rem_18rem_at_50%_-4rem,rgb(var(--accent)/0.12),transparent_70%)]"
          />
          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/25">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {t(c.title)}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-fg-subtle">{t(c.text)}</p>
            <Link
              href={withLocale(locale, "/diagnostico")}
              className="cta-shine mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
            >
              {t(c.cta)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
