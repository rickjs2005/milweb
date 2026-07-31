import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { DIAGNOSTICO, PROFILE, SITE_URL } from "@/lib/content";
import { getLocale, makeT, withLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { Dependency } from "@/components/dependency";
import { Google } from "@/components/google";
import { FairPrice } from "@/components/fair-price";
import { Included } from "@/components/included";
import { Reveal } from "@/components/reveal";
import { Footer } from "@/components/contact";

/**
 * /diagnostico — o funil de convencimento inteiro numa página só, fora da
 * home (feedback de designer: informação demais lá).
 *
 * Narrativa em 5 atos: 01 Raio-X da dependência (o problema) → 02 presença
 * no Google (a prova) → 03 como o orçamento é calculado (a transparência)
 * → 04 o que está incluso (o pacote) → 05 CTA (a conversa). O visitante
 * chega no WhatsApp entendendo problema, solução e preço, sem trocar de
 * página. Âncoras: #dependencia, #google, #preco, #infraestrutura.
 * A rota antiga /raio-x redireciona pra cá (next.config).
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = makeT(locale);
  const canonical = `${locale === "en" ? "/en" : ""}/diagnostico`;
  const title = t({ pt: "Diagnóstico do seu negócio", en: "Your business audit" });
  const description = t({
    pt: "Quanto custa depender só de rede social, como sua empresa aparece no Google e como eu calculo um orçamento justo. Tudo numa página, com diagnóstico gratuito no final.",
    en: "What depending on social media really costs, how your company shows up on Google and how I price projects fairly. One page, with a free audit at the end.",
  });
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "pt-BR": "/diagnostico",
        en: "/en/diagnostico",
        "x-default": "/diagnostico",
      },
    },
    openGraph: { type: "website", title: `${title} | MilWeb`, description, url: `${SITE_URL}${canonical}` },
    twitter: { card: "summary_large_image", title: `${title} | MilWeb`, description },
  };
}

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export default async function DiagnosticoPage() {
  const locale = await getLocale();
  const t = makeT(locale);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line/10 glass-nav">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href={withLocale(locale, "/")} aria-label="MilWeb, início">
            <Logo />
          </Link>
          <a
            href={waHref(t(DIAGNOSTICO.cta.whats))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </header>

      <main>
        <div className="container-page pt-16 sm:pt-24">
          <Link
            href={withLocale(locale, "/")}
            className="inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" /> {t({ pt: "Voltar pra home", en: "Back to home" })}
          </Link>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            {t({ pt: "Diagnóstico do seu negócio na internet", en: "An audit of your business online" })}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-fg-subtle">
            {t({
              pt: "Do problema ao preço, na ordem certa: o risco de viver só de rede social, o que o Google mostra de você, como eu calculo o orçamento e o que vem dentro do projeto. No final, um diagnóstico gratuito.",
              en: "From problem to price, in the right order: the risk of living on social media alone, what Google shows about you, how I price the work and what comes inside the project. At the end, a free audit.",
            })}
          </p>
        </div>

        <Dependency locale={locale} />
        <Google locale={locale} />
        <FairPrice locale={locale} />
        <Included locale={locale} />

        {/* 05 / CTA — o fecho do funil: quem leu chegou aqui entendendo
            problema, solução e preço. Sem seção de contato completa; um
            convite só, direto pro WhatsApp. */}
        <section id="cta" className="container-page scroll-mt-20 pb-24 pt-4 sm:pb-32">
          <Reveal>
            <div className="glass rounded-3xl border border-accent/20 p-10 text-center sm:p-16">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-warm">
                <span className="text-warm/50">05 / </span>
                {t(DIAGNOSTICO.cta.eyebrow)}
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-5xl">
                {t(DIAGNOSTICO.cta.title)}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-fg-subtle">{t(DIAGNOSTICO.cta.sub)}</p>
              <a
                href={waHref(t(DIAGNOSTICO.cta.whats))}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-shine mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
              >
                <MessageCircle className="h-5 w-5" />
                {t(DIAGNOSTICO.cta.button)}
              </a>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
