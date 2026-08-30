import type { Metadata } from "next";
import { MiloLab } from "@/components/milo/milo-lab";
import { localeFrom, type LangParams } from "@/lib/i18n";

/**
 * /lab/milo-null — protótipo do personagem 3D da MilWeb. Rota isolada de
 * laboratório: fora do sitemap, noindex, texto provisório em PT.
 */
export const metadata: Metadata = {
  title: "Milo Null — protótipo 01",
  description: "Laboratório visual do personagem 3D da MilWeb.",
  robots: { index: false, follow: false },
};

export default async function MiloNullPage({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return <MiloLab />;
}
