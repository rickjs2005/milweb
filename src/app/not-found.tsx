import { headers } from "next/headers";
import { NotFoundView } from "@/components/not-found-view";
import { HTML_LANG, LOCALE_HEADER } from "@/i18n/config";
import { FONT_CLASS } from "@/lib/fonts";
import { normalizeLocale } from "@/lib/i18n";

/**
 * 404 global (rota /_not-found): toda URL que o middleware não reconhece
 * cai aqui, já com o idioma no header `x-milweb-locale`. Renderiza o
 * documento inteiro (html/body/fontes) porque o layout raiz é de passagem.
 */
export default async function NotFound() {
  const locale = normalizeLocale((await headers()).get(LOCALE_HEADER) ?? undefined);
  return (
    <html lang={HTML_LANG[locale]} className={FONT_CLASS}>
      <body>
        <NotFoundView locale={locale} />
      </body>
    </html>
  );
}
