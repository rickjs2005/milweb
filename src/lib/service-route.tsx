import type { Metadata } from "next";
import { SERVICES } from "./services";
import { localeFrom, type LangParams } from "./i18n";
import { ServicePage } from "@/components/service-page";

/**
 * Fábrica das rotas de serviço: cada app/[lang]/<slug>/page.tsx só reexporta
 * o que sai daqui — metadata localizada (canonical + hreflang) e a página.
 */
export function serviceRoute(slug: string) {
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) throw new Error(`Serviço desconhecido: ${slug}`);

  async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
    const locale = await localeFrom(params);
    const canonical = `${locale === "en" ? "/en" : ""}/${service!.slug}`;
    return {
      title: service!.metaTitle[locale],
      description: service!.metaDescription[locale],
      alternates: {
        canonical,
        languages: {
          "pt-BR": `/${service!.slug}`,
          en: `/en/${service!.slug}`,
          "x-default": `/${service!.slug}`,
        },
      },
      openGraph: {
        title: service!.metaTitle[locale],
        description: service!.metaDescription[locale],
        type: "website",
      },
    };
  }

  async function Page({ params }: { params: Promise<LangParams> }) {
    const locale = await localeFrom(params);
    return <ServicePage service={service!} locale={locale} />;
  }

  return { generateMetadata, Page };
}
