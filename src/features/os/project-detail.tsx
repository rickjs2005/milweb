import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { buildProjectDetail } from "./project-data";
import { ProjectDetailView } from "./project-detail-view";

/**
 * Server component da rota /work/[slug]: monta os dados do case no servidor
 * (narrativa, história editorial, galeria — nada vai ao bundle além do que
 * aparece na tela) e entrega à view client, que também serve a janela sem
 * foco via /api/os/project/[lang]/[slug].
 */
export function ProjectDetail({ slug, locale }: { slug: string; locale: Locale }) {
  const data = buildProjectDetail(slug, locale);
  if (!data) notFound();
  return <ProjectDetailView data={data} />;
}
