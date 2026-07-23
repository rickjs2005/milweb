import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP com nonce por request: 'strict-dynamic' libera os chunks que o próprio
 * Next injeta e os scripts que a Vercel Analytics/Speed Insights criam via
 * JS, sem precisar allowlist de domínio. https:/'unsafe-inline' ficam só de
 * fallback pra navegadores sem suporte a nonce/strict-dynamic (ignorados
 * pelos que suportam). style-src precisa de 'unsafe-inline': nonce não cobre
 * atributo style="" inline (só <style> e <link>), e o projeto usa style={{}}
 * bastante.
 */
function buildCsp(nonce: string) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

/**
 * i18n por URL: /en/* é reescrito para as rotas existentes com o cookie de
 * idioma normalizado pelo path (a URL é a fonte da verdade — o cookie vira
 * só o meio de transporte até o getLocale() do servidor).
 *
 * Resultado: / indexa em PT e /en indexa em EN como URLs distintas (hreflang
 * nos metadados), sem duplicar a árvore de rotas.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Substitui qualquer cookie `lang` do cliente pelo idioma do path.
  const headers = new Headers(req.headers);
  const rest = (headers.get("cookie") ?? "")
    .split("; ")
    .filter((c) => c && !c.startsWith("lang="))
    .join("; ");
  headers.set("cookie", rest ? `${rest}; lang=${isEn ? "en" : "pt"}` : `lang=${isEn ? "en" : "pt"}`);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const res = isEn
    ? (() => {
        const url = req.nextUrl.clone();
        url.pathname = pathname === "/en" ? "/" : pathname.slice("/en".length);
        return NextResponse.rewrite(url, { request: { headers } });
      })()
    : NextResponse.next({ request: { headers } });

  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Ignora assets estáticos (_next, arquivos com extensão) — o resto passa
  // pelo middleware pra normalizar o idioma.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
