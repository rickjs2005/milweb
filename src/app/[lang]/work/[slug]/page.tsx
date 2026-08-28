import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { PROJECTS, PROFILE, QUOTE, SITE_URL, UI, searchDescription } from "@/lib/content";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { CaseStudy } from "@/components/case-study";
import { Contact, Footer } from "@/components/contact";

/** Um case por projeto — o segmento [lang] pai já enumera os dois idiomas. */
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams & { slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return {};
  const locale = await localeFrom(params);
  // `result` é escrito para ser lido na página; para o resultado de busca
  // vale a versão que cabe sem truncar no meio da frase.
  const description = searchDescription(p.result[locale]);
  const canonical = `${locale === "en" ? "/en" : ""}/work/${p.slug}`;
  const url = `${SITE_URL}${canonical}`;
  // "MilLead | MilWeb" nao dizia o que o projeto e. A tagline ja resume em
  // uma linha e o layout ainda acrescenta o sufixo da marca.
  const title = `${p.title} — ${p.tagline[locale]}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "pt-BR": `/work/${p.slug}`,
        en: `/en/work/${p.slug}`,
        "x-default": `/work/${p.slug}`,
      },
    },
    openGraph: { type: "article", title: `${p.title} | MilWeb`, description, url },
    twitter: { card: "summary_large_image", title: `${p.title} | MilWeb`, description },
  };
}

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export default async function ProjectPage({
  params,
}: {
  params: Promise<LangParams & { slug: string }>;
}) {
  const { slug } = await params;
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const idx = PROJECTS.findIndex((p) => p.slug === slug);
  if (idx === -1) notFound();

  const project = PROJECTS[idx];
  const prev = idx > 0 ? PROJECTS[idx - 1] : undefined;
  const next = idx < PROJECTS.length - 1 ? PROJECTS[idx + 1] : undefined;

  // O grafo tem de falar da MESMA página que o canonical aponta. Enquanto a
  // url era montada sem o locale, a versão /en declarava a URL pt e os dois
  // sinais se contradiziam.
  const url = `${SITE_URL}${withLocale(locale, `/work/${project.slug}`)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: project.title,
        headline: t(project.tagline),
        description: t(project.result),
        url,
        inLanguage: locale === "en" ? "en" : "pt-BR",
        keywords: project.stack.join(", "),
        creator: { "@type": "Person", name: "Rick", url: PROFILE.github },
        ...(project.live ? { sameAs: project.live } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MilWeb", item: `${SITE_URL}${withLocale(locale, "/")}` },
          // O acervo é uma página de verdade (/work). Apontar pro
          // fragmento /#projects dava ao degrau um endereço que não existe.
          {
            "@type": "ListItem",
            position: 2,
            name: t(UI.nav.projects),
            item: `${SITE_URL}${withLocale(locale, "/work")}`,
          },
          { "@type": "ListItem", position: 3, name: project.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-50 border-b border-line/10 glass-nav">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href={withLocale(locale, "/")} aria-label={t(UI.labels.home)}>
            <Logo />
          </Link>
          <a
            href={waHref(t(QUOTE.fallback))}
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
        <CaseStudy
          project={project}
          prev={prev && { slug: prev.slug, title: prev.title }}
          next={next && { slug: next.slug, title: next.title }}
          locale={locale}
        />
      </main>

      <Contact locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
