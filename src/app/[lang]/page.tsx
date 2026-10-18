import { localeFrom, type LangParams } from "@/lib/i18n";

/**
 * Home — a área de trabalho (desktop) e a tela inicial (celular) do MilWeb OS.
 * O shell vive no layout (features/os) e já desenha wallpaper, manchete
 * (H1 só aqui), atalhos, dock e a janela de Destaques; esta rota existe
 * para a URL canônica e para o 404 de idioma inválido.
 *
 * A home anterior em nós (Boot, globo, galeria, capacidades, Break…) segue
 * no repositório (sections/home, features/*) sem rota: decisão de arquivar
 * ou apagar fica para o Rick (ver docs/milweb-os-references.md).
 */
export default async function Home({ params }: { params: Promise<LangParams> }) {
  await localeFrom(params);
  return null;
}
