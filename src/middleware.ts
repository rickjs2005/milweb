import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

const CSP = buildCsp({ dev: process.env.NODE_ENV === "development" });

/**
 * i18n por URL, com o locale vivendo no SEGMENTO da rota (app/[lang]/...).
 *
 * As URLs públicas não mudaram: PT na raiz (`/`, `/projetos`) e EN em `/en`.
 * O que mudou é como o servidor descobre o idioma. Antes era um cookie lido
 * com `cookies()` dentro das Server Components — e ler cookie opta a rota
 * por render dinâmico, o que impedia qualquer página de ser pré-renderizada
 * (ver a nota longa em src/lib/csp.ts). Agora o idioma é parâmetro de rota,
 * então as duas versões saem prontas do build e são servidas da CDN.
 *
 *   /            → reescreve para /pt          (invisível pro visitante)
 *   /projetos    → reescreve para /pt/projetos
 *   /en, /en/... → passa direto (já casa com [lang])
 *   /pt, /pt/... → REDIRECIONA para a URL sem prefixo
 *
 * O último caso existe pra não criar conteúdo duplicado: o prefixo `/pt` é
 * detalhe interno, e sem o redirect toda página teria dois endereços
 * públicos idênticos.
 */
/**
 * Imagens de metadados (og/twitter) são geradas pelo Next a partir do
 * segmento, então saem no HTML como /pt/... — e essas URLs vão pra fora, em
 * preview de link do WhatsApp, LinkedIn e afins. Ficam de fora do redirect
 * abaixo pra que o crawler pegue a imagem direto, sem depender de seguir
 * redirect.
 */
const METADATA_IMAGE = /\/(opengraph-image|twitter-image)$/;

function withCsp(res: NextResponse) {
  res.headers.set("Content-Security-Policy", CSP);
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const segment = pathname.split("/")[1];

  // Já vem com idioma no path: entrega direto, sem reescrever de novo
  // (reescrever aqui produziria /pt/pt/... e 404).
  if (segment === "en") return withCsp(NextResponse.next());

  if (segment === "pt") {
    // Imagem de metadado: é a URL que sai no og:image e vai pra fora.
    if (METADATA_IMAGE.test(pathname)) return withCsp(NextResponse.next());
    // Página: /pt é endereço interno, volta pra URL pública.
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice("/pt".length) || "/";
    return withCsp(NextResponse.redirect(url, 308));
  }

  // Sem prefixo = português: ganha o /pt invisível.
  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/pt" : `/pt${pathname}`;
  return withCsp(NextResponse.rewrite(url));
}

export const config = {
  // Ignora assets estáticos (_next, arquivos com extensão) — o resto passa
  // pelo middleware pra ganhar o prefixo de idioma e o CSP.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
