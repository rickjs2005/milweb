import { NextResponse } from "next/server";
import { ALL_SLUGS } from "@/data/projects";
import { LOCALES, isLocale } from "@/i18n/config";
import { buildProjectDetail } from "@/features/os/project-data";

/**
 * Dados do case para o MilWeb OS — o que a janela de Projetos mostra quando
 * perde o foco para outra janela (a rota canônica continua sendo
 * /work/[slug]; isto é só a mesma informação em JSON, gerada no build para
 * cada idioma × case).
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => ALL_SLUGS.map((slug) => ({ lang, slug })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return NextResponse.json({ error: "locale" }, { status: 404 });
  const data = buildProjectDetail(slug, lang);
  if (!data) return NextResponse.json({ error: "project" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800" } });
}
