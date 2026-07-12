import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { LAB, LAB_PAGE, PROFILE } from "@/lib/content";
import { getLocale, makeT, withLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { Footer } from "@/components/contact";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const canonical = `${locale === "en" ? "/en" : ""}/lab`;
  return {
    title: LAB_PAGE.metaTitle[locale],
    description: LAB_PAGE.metaDescription[locale],
    alternates: {
      canonical,
      languages: { "pt-BR": "/lab", en: "/en/lab", "x-default": "/lab" },
    },
    openGraph: {
      title: LAB_PAGE.metaTitle[locale],
      description: LAB_PAGE.metaDescription[locale],
      type: "website",
    },
  };
}

/**
 * /lab — destino do link de bio (TikTok/Instagram): os filmes completos,
 * com som e controles, + o convite comercial. Vídeos só carregam quando o
 * visitante dá play (preload="none" + poster).
 */
export default async function LabPage() {
  const locale = await getLocale();
  const t = makeT(locale);
  const waHref = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(t(LAB_PAGE.ctaWhats))}`;

  return (
    <>
      <header className="container-page flex h-16 items-center justify-between">
        <Link href={withLocale(locale, "/")} aria-label="MilWeb — início">
          <Logo />
        </Link>
        <Link
          href={withLocale(locale, "/")}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> {t(LAB_PAGE.back)}
        </Link>
      </header>

      <main className="container-page pb-24 pt-10 sm:pt-16">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {t(LAB_PAGE.eyebrow)}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            {t(LAB_PAGE.title)} <span className="text-gradient">{t(LAB_PAGE.titleHighlight)}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-fg-muted">{t(LAB_PAGE.sub)}</p>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {LAB.map((clip, i) => (
            <Reveal key={clip.full} delay={i * 0.08}>
              <figure className="overflow-hidden rounded-2xl border border-line/10 bg-surface-2/60">
                <div className="relative aspect-[9/16]">
                  {/* Vídeo completo, com som — o visitante dá o play. */}
                  <video
                    src={clip.full}
                    poster={clip.poster}
                    controls
                    playsInline
                    preload="none"
                    aria-label={t(clip.title)}
                    className="block h-full w-full object-cover"
                  />
                </div>
                <figcaption className="space-y-2 p-5">
                  <p className="text-lg font-semibold text-fg">{t(clip.title)}</p>
                  <p className="text-sm text-fg-muted">{t(clip.desc)}</p>
                  <p className="pt-1 font-mono text-[11px] uppercase tracking-wide text-fg-subtle">
                    {t(LAB_PAGE.madeWith)}: {clip.tags.join(" · ")}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 rounded-2xl border border-line/10 bg-surface/60 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {t(LAB_PAGE.ctaTitle)}
            </h2>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
            >
              <MessageCircle className="h-5 w-5" />
              {t(LAB_PAGE.ctaButton)}
            </a>
          </div>
        </Reveal>
      </main>
      <Footer locale={locale} />
    </>
  );
}
