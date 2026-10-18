import type { Metadata } from "next";
import { SERVICES_PAGE } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";

/** /services — no MilWeb OS é o app Serviços (features/os/apps/services); cada serviço abre a própria página dentro da janela. A rota fica para metadata e canonical. */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/services", title: t(SERVICES_PAGE.meta.title), description: t(SERVICES_PAGE.meta.description) });
}

export default async function ServicesPage({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return null;
}
