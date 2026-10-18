import type { Metadata } from "next";
import { UI } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";

/**
 * /work — a coleção. No MilWeb OS é o app Projetos (features/os/apps/projects):
 * o shell desenha a grade com todos os cases a partir da carga do idioma,
 * no servidor, dentro da janela/tela. A rota fica para metadata e canonical.
 */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/work", title: t(UI.sections.projectsAllTitle), description: t(UI.sections.projectsAllSub) });
}

export default async function WorkPage({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return null;
}
