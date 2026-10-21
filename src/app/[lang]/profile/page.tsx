import type { Metadata } from "next";
import { PROFILE_DATA } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";

/**
 * /profile (público: /perfil · /en/profile · /es/perfil) — no MilWeb OS é o app
 * Perfil (features/os/apps/profile), desenhado pelo shell. Quem abre o link cai
 * direto no conteúdo profissional: a rota abre a janela no desktop e a tela
 * no telefone. Aqui ficam metadata e canonical.
 */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return pageMetadata({ locale, internalPath: "/profile", title: t(PROFILE_DATA.meta.title), description: t(PROFILE_DATA.meta.description), type: "website" });
}

export default async function ProfilePage({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return null;
}
