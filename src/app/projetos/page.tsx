import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BadgeCheck, MessageCircle, TrendingUp } from "lucide-react";
import { PROJECTS, PROFILE, SITE_URL, UI, type Project, type Locale } from "@/lib/content";
import { getLocale, makeT, withLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { Contact, Footer } from "@/components/contact";

/**
 * O acervo completo, fora da home.
 *
 * A home mostra as entregas para cliente e sete autorais escolhidos; tudo o
 * mais mora aqui. Nenhum projeto saiu do ar nem do sitemap — só deixou de
 * pesar no caminho de quem está decidindo se contrata.
 *
 * A lista aqui é deliberadamente simples: sem esteira 3D, sem parallax, sem
 * vídeo. Quem chega nesta página já quer ver quantidade, e ela existe
 * justamente para tirar peso de render da home.
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = makeT(locale);
  const canonical = `${locale === "en" ? "/en" : ""}/projetos`;
  const title = t(UI.sections.projectsAllTitle);
  const description = t(UI.sections.projectsAllSub);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "pt-BR": "/projetos",
        en: "/en/projetos",
        "x-default": "/projetos",
      },
    },
    openGraph: { type: "website", title: `${title} | MilWeb`, description, url: `${SITE_URL}${canonical}` },
    twitter: { card: "summary_large_image", title: `${title} | MilWeb`, description },
  };
}

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

function Card({ p, locale }: { p: Project; locale: Locale }) {
  const t = makeT(locale);
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line/10 glass p-6 transition-colors duration-300 hover:border-accent/40">
      {/* Capa: o hero do site no topo do card (pedido do Rick — o acervo
          era texto puro; agora cada projeto se apresenta pela própria
          tela). Margens negativas sangram a imagem até as bordas do card;
          projetos sem screenshot (sem deploy) seguem só com texto. */}
      {p.image && (
        <div className="-mx-6 -mt-6 mb-5 border-b border-line/10 bg-surface-2/40">
          <Image
            src={p.image}
            alt={`Tela do projeto ${p.title}`}
            width={800}
            height={500}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover object-top"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          />
        </div>
      )}
      {p.clientWork && p.clientName && (
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <BadgeCheck className="h-3.5 w-3.5" /> {p.clientName}
        </span>
      )}
      <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
        {p.title}
      </h2>
      <p className="mt-1.5 font-mono text-xs uppercase tracking-wider text-fg-subtle">
        {t(p.tagline)}
      </p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">
        {t(p.result)}
      </p>

      {p.metric && (
        <p className="mt-5">
          <span
            className={
              "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] " +
              (p.metricProof
                ? "border-accent/30 bg-accent/10 font-semibold text-accent"
                : "border-line/15 bg-surface-2/60 font-medium text-fg-subtle")
            }
          >
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t(p.metric)}</span>
          </span>
        </p>
      )}

      <ul className="mt-4 flex flex-wrap gap-2">
        {p.stack.slice(0, 4).map((s) => (
          <li
            key={s}
            className="rounded-md border border-line/10 bg-surface-2/60 px-2.5 py-1 font-mono text-[11px] text-fg-muted"
          >
            {s}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* O ::after estica o link do case por cima do card inteiro, então o
            card todo é clicável sem aninhar links. */}
        <Link
          href={withLocale(locale, `/projetos/${p.slug}`)}
          className="text-sm font-semibold text-accent after:absolute after:inset-0 after:content-['']"
        >
          {t(UI.labels.caseStudy)}
        </Link>
        {/* "Ver ao vivo" no card só em entrega a cliente; nos autorais o
            link vive na página de case. */}
        {p.live && p.clientWork && (
          <a
            href={p.live}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1 text-sm text-fg-subtle transition-colors hover:text-fg"
          >
            {t(UI.labels.viewLive)} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}

export default async function ProjectsIndexPage() {
  const locale = await getLocale();
  const t = makeT(locale);
  const clientWork = PROJECTS.filter((p) => p.clientWork);
  const own = PROJECTS.filter((p) => !p.clientWork && !p.hideFromLists);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line/10 glass-nav">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href={withLocale(locale, "/")} aria-label="MilWeb, início">
            <Logo />
          </Link>
          <a
            href={waHref("Olá Rick! Vim pelo site da MilWeb e quero um orçamento.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </header>

      <main className="container-page py-16 sm:py-24">
        <Link
          href={withLocale(locale, "/")}
          className="inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> {t(UI.sections.projectsBackHome)}
        </Link>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          {t(UI.sections.projectsAllTitle)}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">
          {t(UI.sections.projectsAllSub)}
        </p>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            {t(UI.sections.projectsClientTitle)}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {clientWork.map((p) => (
              <Card key={p.slug} p={p} locale={locale} />
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            {t(UI.sections.projectsOwnTitle)}{" "}
            <span className="font-mono text-base text-fg-subtle">
              {own.length}
            </span>
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {own.map((p) => (
              <Card key={p.slug} p={p} locale={locale} />
            ))}
          </div>
        </section>
      </main>

      <Contact locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
