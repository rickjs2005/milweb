import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, PREFIX, isLocale } from "@/i18n/config";
import { internalizePath, isKnownInternalPath, localizePath } from "@/i18n/routing";

const CSP = buildCsp({ dev: process.env.NODE_ENV === "development" });

/**
 * i18n por URL com rotas LOCALIZADAS, locale vivendo no segmento interno
 * app/[lang]/…:
 *
 *   /                 → rewrite /pt
 *   /projetos/terral  → rewrite /pt/work/terral
 *   /en/work/terral   → rewrite /en/work/terral   (segmento já interno)
 *   /es/proyectos/x   → rewrite /es/work/x
 *   /pt, /pt/…        → 308 para a URL pública sem prefixo (endereço interno)
 *
 * URLs antigas já publicadas (/work, /studio, /services, /contact, /en/diagnostico,
 * /en/criacao-de-sites…) recebem 308 DIRETO para a canônica — sem cadeia.
 *
 * Preferência de idioma: o seletor grava o cookie `milweb_locale`. Só a raiz
 * exata "/" honra esse cookie (reabrir o site volta ao idioma escolhido);
 * qualquer link direto com /en ou /es sempre respeita a URL. Não há
 * redirecionamento por Accept-Language.
 */
const METADATA_IMAGE = /\/(opengraph-image|twitter-image)(\?.*)?$/;

function withCsp(res: NextResponse) {
  res.headers.set("Content-Security-Policy", CSP);
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const segment = pathname.split("/")[1];

  // Imagens de metadado: o Next as gera em /pt/… e essa URL sai no og:image.
  if (METADATA_IMAGE.test(pathname)) {
    if (isLocale(segment)) return withCsp(NextResponse.next());
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return withCsp(NextResponse.rewrite(url));
  }

  // /pt é endereço interno: volta para a URL pública.
  if (segment === "pt") {
    const url = req.nextUrl.clone();
    url.pathname = localizePath("pt", pathname.slice("/pt".length) || "/");
    return withCsp(NextResponse.redirect(url, 308));
  }

  // Raiz exata: honra a preferência manual salva pelo seletor.
  // (O middleware não enxerga `RSC: 1` nem `?_rsc=` — o Next os remove antes —
  // então este redirect vale igualmente para requests RSC; o seletor de idioma
  // não faz prefetch por causa disso, ver nav/language-switch.tsx.)
  if (pathname === "/") {
    const pref = req.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(pref) && pref !== DEFAULT_LOCALE) {
      const url = req.nextUrl.clone();
      url.pathname = PREFIX[pref];
      return withCsp(NextResponse.redirect(url, 307));
    }
  }

  const { locale, internal, legacy } = internalizePath(pathname);

  // URL antiga → canônica final, num único salto.
  if (legacy) {
    const url = req.nextUrl.clone();
    url.pathname = localizePath(locale, internal);
    return withCsp(NextResponse.redirect(url, 308));
  }

  const url = req.nextUrl.clone();
  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, locale);

  // Rota desconhecida → caminho interno que nenhuma página atende: o Next
  // responde com o 404 global (app/not-found.tsx), que lê o idioma do header.
  // Sem `status: 404` no rewrite: a Vercel interceptaria e serviria o 404
  // estático dela; e notFound() sob o layout raiz dinâmico renderiza só o
  // shell genérico no servidor.
  url.pathname = isKnownInternalPath(internal) ? `/${locale}${internal === "/" ? "" : internal}` : `/${locale}/__not-found${internal}`;
  return withCsp(NextResponse.rewrite(url, { request: { headers } }));
}

export const config = {
  // Ignora assets estáticos (_next, arquivos com extensão) — o resto passa
  // pelo middleware pra ganhar o segmento de idioma e o CSP.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
