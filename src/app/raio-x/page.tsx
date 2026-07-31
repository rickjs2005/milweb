import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PROFILE, SITE_URL } from "@/lib/content";
import { getLocale, makeT, withLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { Dependency } from "@/components/dependency";
import { Google } from "@/components/google";
import { Contact, Footer } from "@/components/contact";

/**
 * /raio-x — o argumento denso da conversão, fora da home.
 *
 * Feedback de um designer: a home carregava informação demais. O Raio-X da
 * dependência (calculadora de prejuízo + apagões reais) e o teste do Google
 * eram as duas seções mais pesadas, então viraram esta página. A home ficou
 * com um convite curto (banner no Preço Justo) e quem clica chega aqui com
 * espaço pra ler com calma. Os ids das seções continuam os mesmos, então a
 * analítica de conversão (source do clique de WhatsApp) segue comparável.
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = makeT(locale);
  const canonical = `${locale === "en" ? "/en" : ""}/raio-x`;
  const title = t({ pt: "Raio-X da dependência", en: "Dependency X-ray" });
  const description = t({
    pt: "Calcule quanto depender só de rede social custa pro seu negócio e veja como sua empresa aparece no Google.",
    en: "Calculate what depending only on social media costs your business and see how your company shows up on Google.",
  });
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "pt-BR": "/raio-x",
        en: "/en/raio-x",
        "x-default": "/raio-x",
      },
    },
    openGraph: { type: "website", title: `${title} | MilWeb`, description, url: `${SITE_URL}${canonical}` },
    twitter: { card: "summary_large_image", title: `${title} | MilWeb`, description },
  };
}

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export default async function RaioXPage() {
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
            href={waHref(t({
              pt: "Olá Rick! Fiz o raio-X no site da MilWeb e quero conversar.",
              en: "Hi Rick! I ran the X-ray on the MilWeb site and I'd like to talk.",
            }))}
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
            {t({ pt: "Raio-X do seu negócio na internet", en: "An X-ray of your business online" })}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-fg-subtle">
            {t({
              pt: "Duas verificações rápidas e honestas: quanto você perderia se as redes caíssem hoje, e o que aparece quando alguém procura seu tipo de serviço no Google.",
              en: "Two quick, honest checks: how much you'd lose if social media went down today, and what shows up when someone searches for your kind of service on Google.",
            })}
          </p>
        </div>

        <Dependency locale={locale} />
        <Google locale={locale} />
        <Contact locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
