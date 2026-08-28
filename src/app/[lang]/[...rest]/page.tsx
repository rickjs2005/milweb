import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";
import { getDict } from "@/i18n";
import { localeFrom, type LangParams } from "@/lib/i18n";

/**
 * Catch-all dentro de [lang]. O middleware valida a URL contra a tabela de
 * rotas + slugs dos cases e reescreve o que não existe para cá já com
 * status 404 — então esta página só renderiza o 404 com a identidade do
 * site, dentro do layout real (<html lang> certo, fontes, CSS), sem
 * depender do shell genérico que o Next usa quando notFound() estoura no
 * layout raiz dinâmico.
 */
export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = await localeFrom(params);
  const d = getDict(locale);
  return { title: `${d.errors.notFound[0]} — ${d.errors.notFound[1]}`, robots: { index: false, follow: false } };
}

export default async function CatchAll({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  return <NotFoundView locale={locale} />;
}
