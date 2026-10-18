import type { Metadata } from "next";
import { STUDIO } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";

/** /studio — no MilWeb OS é o app Estúdio (features/os/apps/studio), desenhado pelo shell. A rota fica para metadata e canonical. */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/studio", title: t(STUDIO.meta.title), description: t(STUDIO.meta.description) });
}

export default async function StudioPage({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return null;
}
