import type { Metadata } from "next";
import { CONTACT_PAGE } from "@/data/studio";
import { pageMetadata } from "@/lib/seo";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";

/** /contact — no MilWeb OS é o app Contato (features/os/apps/contact): canais reais e o compositor de mensagem. A rota fica para metadata e canonical. */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/contact", title: t(CONTACT_PAGE.meta.title), description: t(CONTACT_PAGE.meta.description) });
}

export default async function ContactPage({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return null;
}
