import { NextResponse, type NextRequest } from "next/server";

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

  // Substitui qualquer cookie `lang` do cliente pelo idioma do path.
  const headers = new Headers(req.headers);
  const rest = (headers.get("cookie") ?? "")
    .split("; ")
    .filter((c) => c && !c.startsWith("lang="))
    .join("; ");
  headers.set("cookie", rest ? `${rest}; lang=${isEn ? "en" : "pt"}` : `lang=${isEn ? "en" : "pt"}`);

  if (isEn) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/en" ? "/" : pathname.slice("/en".length);
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Ignora assets estáticos (_next, arquivos com extensão) — o resto passa
  // pelo middleware pra normalizar o idioma.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
