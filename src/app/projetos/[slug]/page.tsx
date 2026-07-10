import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { PROJECTS, PROFILE, SITE_URL } from "@/lib/content";
import { getLocale, withLocale } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { CaseStudy } from "@/components/case-study";
import { Contact, Footer } from "@/components/contact";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return {};
  const locale = await getLocale();
  const description = p.result[locale];
  const canonical = `${locale === "en" ? "/en" : ""}/projetos/${p.slug}`;
  const url = `${SITE_URL}${canonical}`;
  return {
    title: p.title,
    description,
    alternates: {
      canonical,
      languages: {
        "pt-BR": `/projetos/${p.slug}`,
        en: `/en/projetos/${p.slug}`,
        "x-default": `/projetos/${p.slug}`,
      },
    },
    openGraph: { type: "article", title: `${p.title} — MilWeb`, description, url },
    twitter: { card: "summary_large_image", title: `${p.title} — MilWeb`, description },
  };
}

const waHref = (text: string) =>
  `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(text)}`;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const idx = PROJECTS.findIndex((p) => p.slug === slug);
  if (idx === -1) notFound();

  const project = PROJECTS[idx];
  const prev = idx > 0 ? PROJECTS[idx - 1] : undefined;
  const next = idx < PROJECTS.length - 1 ? PROJECTS[idx + 1] : undefined;

  const url = `${SITE_URL}/projetos/${project.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: project.title,
        headline: project.tagline.pt,
        description: project.result.pt,
        url,
        keywords: project.stack.join(", "),
        creator: { "@type": "Person", name: "Rick", url: PROFILE.github },
        ...(project.live ? { sameAs: project.live } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MilWeb", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Projetos", item: `${SITE_URL}/#projects` },
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
          <Link href={withLocale(locale, "/")} aria-label="MilWeb — início">
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
