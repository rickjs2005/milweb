import type { Locale } from "@/i18n/config";

/**
 * GOOGLE PREFERRED SOURCES — a ponte tipada com o SDK oficial.
 *
 * O SDK (`https://news.google.com/swg/js/v1/publisher.js`, carregado UMA vez
 * no layout com `preferred-sources-control="manual"`) entrega a API por uma
 * fila global: `self.PREFERRED_SOURCE.push(cb)`. Aqui a fila vira uma Promise
 * única por carga de página — só um `push`, só um `init`, e quem chegar depois
 * recebe a mesma instância. Se o script foi bloqueado (extensão, rede, CSP) a
 * Promise rejeita por timeout e o componente cai no deep link oficial.
 *
 * O fluxo em si é do Google: `addPreferredSource()` abre um popup em
 * accounts.google.com → news.google.com/swg/ui/v1/addpreferredsource e volta
 * para a página. Não há callback de conclusão — não se registra "adicionado".
 *
 * ELEGIBILIDADE: o Google só aceita domínio/subdomínio (milweb.com.br está no
 * formato), mas o site precisa APARECER na ferramenta de fontes preferidas —
 * conferir em https://www.google.com/preferences/source digitando milweb.com.br.
 * Nada no código assume que isso já aconteceu.
 */
export type PreferredSourceApi = {
  init(options: { theme?: "light" | "dark"; lang?: string }): void;
  addPreferredSource(): void;
};

declare global {
  interface Window {
    PREFERRED_SOURCE?: Array<(api: PreferredSourceApi) => void>;
  }
}

export const PREFERRED_SOURCE_SDK = "https://news.google.com/swg/js/v1/publisher.js";
/** Deep link oficial (fallback sem JS / SDK bloqueado): leva ao site já dentro da ferramenta. */
export const PREFERRED_SOURCE_DEEP_LINK = "https://www.google.com/preferences/source?q=milweb.com.br";
/** Códigos da lista oficial (preferred-sources-languages.csv): pt-BR, en, es-419. */
export const PREFERRED_SOURCE_LANG: Record<Locale, string> = { pt: "pt-BR", en: "en", es: "es-419" };

let api: PreferredSourceApi | null = null;
let pending: Promise<PreferredSourceApi> | null = null;

/** A API já chegou? (síncrono — o clique usa isto para abrir o popup ainda no gesto do usuário) */
export const preferredSourceReady = () => api;

/**
 * Pede a API ao SDK. Idempotente: um `push` na fila por página; o `init` roda
 * uma vez com o idioma/tema de quem chamou primeiro. Rejeita se o SDK não
 * responder em `timeoutMs` (bloqueado ou fora do ar) — e libera um novo pedido.
 */
export function loadPreferredSource(options: { theme: "light" | "dark"; lang: string }, timeoutMs = 6000): Promise<PreferredSourceApi> {
  if (api) return Promise.resolve(api);
  if (pending) return pending;
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  pending = new Promise<PreferredSourceApi>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending = null;
      reject(new Error("preferred-source: SDK não respondeu"));
    }, timeoutMs);
    (window.PREFERRED_SOURCE = window.PREFERRED_SOURCE || []).push((ps) => {
      window.clearTimeout(timer);
      if (!api) {
        ps.init(options);
        api = ps;
      }
      resolve(api);
    });
  });
  return pending;
}
