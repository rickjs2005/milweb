import type { Metadata } from "next";
import { LAB_PAGE } from "@/lib/content";
import { localeFrom, type LangParams } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

/** /lab — no MilWeb OS é o app Lab (features/os/apps/lab): experimentos e filmes carregados só quando pedidos. A rota fica para metadata e canonical. */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  return pageMetadata({ locale, internalPath: "/lab", title: LAB_PAGE.metaTitle[locale], description: LAB_PAGE.metaDescription[locale] });
}

export default async function LabPage({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return null;
}
