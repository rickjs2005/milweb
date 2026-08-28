import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROFILE, SITE_URL, searchDescription } from "@/lib/content";
import { ALL_SLUGS, getProject } from "@/data/projects";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";
import { CaseStudy } from "@/sections/case/case-study";
import { Footer } from "@/components/footer";
import { getDict, HTML_LANG } from "@/i18n";
import { pageMetadata } from "@/lib/seo";

/** Um case por projeto — o segmento [lang] pai já enumera os dois idiomas. */
export function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<LangParams & { slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const locale = await localeFrom(params);
  const description = searchDescription(p.result[locale]);
  return pageMetadata({ locale, internalPath: `/work/${p.slug}`, title: `${p.title} — ${p.tagline[locale]}`, description, type: "article" });
}

export default async function ProjectPage({ params }: { params: Promise<LangParams & { slug: string }> }) {
  const { slug } = await params;
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const project = getProject(slug);
  if (!project) notFound();
  const next = getProject(project.nextSlug)!;
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
        inLanguage: HTML_LANG[locale],
        keywords: project.stack.join(", "),
        creator: { "@type": "Person", name: "Rick Januario", url: PROFILE.github },
        ...(project.live ? { sameAs: project.live } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MilWeb", item: `${SITE_URL}${withLocale(locale, "/")}` },
          { "@type": "ListItem", position: 2, name: getDict(locale).nav.work, item: `${SITE_URL}${withLocale(locale, "/work")}` },
          { "@type": "ListItem", position: 3, name: project.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <CaseStudy project={project} next={next} locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
