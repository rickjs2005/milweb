/**
 * Content-Security-Policy ESTÁTICO.
 *
 * Era nonce por request, gerado no middleware e lido com `headers()` no
 * layout. Isso custava caro: ler headers() opta a rota por render dinâmico,
 * então TODA página do site virava `ƒ Dynamic` — resposta `Cache-Control:
 * private, no-store`, `X-Vercel-Cache: MISS` em 100% dos acessos e uma
 * invocação de função por visita. Medido em produção: 1757ms de TTFB no
 * primeiro acesso (cold start) contra 250-450ms nos seguintes. Como o site é
 * conteúdo público e igual pra todo mundo, pagar SSR por request era puro
 * desperdício.
 *
 * TROCA CONSCIENTE: nonce e prerender estático são incompatíveis. O App
 * Router injeta o payload RSC como <script> inline (self.__next_f.push) em
 * cada página; sem nonce, esses blocos só executam com 'unsafe-inline'. E
 * como o conteúdo deles muda a cada página e a cada build, hash não resolve
 * — testado: com hash na lista o browser IGNORA 'unsafe-inline', bloqueia o
 * payload e a hidratação nunca acontece (o site aparece em branco a partir
 * do hero, porque o <Reveal> segura tudo em opacity:0).
 *
 * O que sobra ainda é uma política apertada, e a superfície de XSS aqui é
 * nula na prática: não há input de usuário, formulário, conteúdo gerado por
 * terceiros nem query string refletida no HTML — tudo é compilado de
 * arquivos .ts no build. Seguem valendo default-src 'self', object-src
 * 'none', base-uri 'self', form-action 'self', frame-ancestors 'none' e
 * connect-src/img-src restritos, que são o que barra exfiltração e clickjack.
 *
 * Se um dia entrar formulário, comentário ou qualquer HTML vindo de fora, a
 * conta muda: aí vale voltar ao nonce (e ao render dinâmico) nessas rotas.
 *
 * style-src precisa de 'unsafe-inline' pelo mesmo motivo de sempre: nonce e
 * hash não cobrem atributo style="" (só <style> e <link>), e o projeto usa
 * style={{}} bastante.
 *
 * DESENVOLVIMENTO: o `next dev` compila os módulos com eval() (HMR e source
 * maps). Sem 'unsafe-eval' o browser derruba o bundle inteiro com EvalError e
 * a hidratação nunca completa. O HMR também precisa de ws: no connect-src.
 * Nada disso vaza pra produção: as exceções são compiladas fora quando
 * NODE_ENV !== "development".
 */

const VERCEL_SCRIPTS = "https://va.vercel-scripts.com";

export function buildCsp({ dev }: { dev: boolean }): string {
  const scriptSrc = [
    `'self'`,
    `'unsafe-inline'`,
    VERCEL_SCRIPTS,
    ...(dev ? [`'unsafe-eval'`] : []),
  ].join(" ");

  const connectSrc = [
    `'self'`,
    `https://vitals.vercel-insights.com`,
    VERCEL_SCRIPTS,
    ...(dev ? [`ws:`] : []),
  ].join(" ");

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src ${connectSrc}`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}
