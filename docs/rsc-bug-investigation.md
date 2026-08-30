# Investigação — "payload RSC bruto" ao navegar (29/08/2026)

Relatório da missão de routing/RSC. Método: reproduzir → medir → isolar → provar → corrigir → testar.
Ferramenta: `scripts/rsc-navigation-audit.mjs` (Playwright, Chromium + WebKit, 390 e 1440) e sondas em `scripts/.rsc-audit/*.mjs`.

## Sintoma

Relato: "ao navegar entre algumas páginas, em determinados momentos o navegador exibe conteúdo bruto de React Server Components / Flight em vez da página".

O que foi efetivamente observado (Chromium e WebKit, local e produção): a navegação client-side **quebra o app** e o Next mostra a página de erro global (`<html id="__next_error__">`, texto "Application error: a client-side exception has occurred"), `html lang=""`, sem nav, sem `<main>`; só sobram os `<script>` do Flight no `<body>`. Em nenhum dos ~470 passos auditados um documento foi servido como `text/x-component`.

## Como reproduzir

1. Abrir `/` (Home) numa aba nova.
2. **Deixar o Boot terminar** (primeira visita ≈ 6 s; visita recorrente ≈ 2,5 s).
3. Clicar em qualquer link interno (Projetos, EN, um case…).

Resultado: `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.` (WebKit: `NotFoundError: The object can not be found here.`) e a página de erro global.

Determinístico (4/4 no `--only dwell`, 3/3 sondas de swap de idioma). Se o clique acontece **antes** do Boot terminar, não quebra — por isso parecia intermitente.

Reprodução automatizada: `node scripts/rsc-navigation-audit.mjs --base <url> --only dwell`.

## Browser afetado

Chromium 1440×900 e 390×844, WebKit 1440×900, Chrome real (produção). Firefox do Playwright não abre página neste host (limitação já registrada em `matrix.mjs`).

## Rotas afetadas

Qualquer navegação **saindo da Home** (`/`, `/en`, `/es`) depois que o Boot concluiu: `/ → /projetos`, `/ → /en`, `/en → /en/studio`, `/es → /`, `/ → EN → ES` (a segunda troca de idioma quebra porque a Home em EN reexecuta o Boot).

Páginas sem Boot (`/contato`, `/projetos`, cases) navegam e trocam de idioma sem erro — `/contato → EN → ES → PT` passou.

## Request que falha / Response recebida / Content-Type

Nenhum. O request RSC da navegação que quebra responde `200 text/x-component` normalmente (ex.: `/es?_rsc=vukrv`). O erro é 100 % client-side, no commit do React, depois de o payload chegar.

Documentos: sempre `text/html` (47 aberturas diretas em 2 engines, incluindo `/pt`, `/work`, `/en/projetos` → 308 e `/nao-existe` → 404 HTML).

## Fluxo de navegação (mapa)

```
CLICK em <a> (next/link)
↓ document capture: ViewTransitions.onClick  (src/components/view-transitions.tsx)
   preventDefault  (+ stopPropagation — removido na correção)
   html[data-vt] = link.dataset.vt
   document.startViewTransition(() => router.push(href))
↓ next/link onClick (bubble): chama onClick do consumidor, vê defaultPrevented → não faz push próprio
↓ App Router: fetch `<href>?_rsc=<hash>` com RSC: 1 / Next-Router-State-Tree / Next-Url
↓ src/middleware.ts
   METADATA_IMAGE → rewrite /pt/…
   /pt/* → 308 público · "/" + cookie milweb_locale≠pt → 307 /en|/es · segmento legado → 308 canônica
   internalizePath (src/i18n/routing.ts) → rewrite /<locale>/<interno> (+ header x-milweb-locale)
   rota desconhecida → rewrite /<locale>/__not-found/… → app/not-found.tsx (404 HTML)
↓ app/layout.tsx (passagem) → app/[lang]/layout.tsx (<html>/<body>, Nav, ViewTransitions, ScrollProvider)
↓ React commit: troca de segmento [lang] = desmonta/monta <html>/<body> (singletons React 19)
   ← AQUI: body.removeChild(#mw-boot) falha se o Boot já tirou o nó do DOM
↓ ViewTransitions: effect de pathname resolve a promise → transição termina
```

## Suspeitas descartadas (com evidência)

| Suspeita | Veredito | Evidência |
|---|---|---|
| A — ViewTransitions (capture + preventDefault + stopPropagation + router.push em startViewTransition) | **Não causa o crash.** Causa um bug secundário. | Matriz completa passa com VT ativo em páginas sem Boot (Chromium 53/53, WebKit 53/53). O crash reproduz com clique nativo em `<a>` (sonda `probe-dwell.mjs`) — o handler VT não aparece no stack. Secundário: `stopPropagation` impedia o `onClick` do `LanguageSwitch` (cookie) de rodar — com cookie `milweb_locale=en` o clique em PT ficava em `/en` (`probe-redirect.mjs`, local e produção). |
| B — Middleware / rewrite de requests RSC | **Não causa.** | curl: cada URL pública devolve `text/x-component` com `RSC: 1` e `text/html` sem; `x-middleware-rewrite` correto; headers `Next-Router-*` preservados; query preservada no rewrite. O crash acontece após um RSC 200 válido. Achado lateral: redirects (`/pt/*`, legados, `/` com cookie) descartam `?_rsc=` — comportamento do próprio Next (`stripInternalSearchParams` em `server/web/adapter.js`), classe do issue vercel/next.js#79346. Inofensivo aqui porque produção serve tudo `Cache-Control: private, no-store` (nada é cacheado), mas fica registrado como risco. |
| C — `app/layout.tsx` de passagem + `<html>/<body>` em `[lang]/layout.tsx` | **Não causa; é o palco.** | React 19 trata html/body como singletons e o swap PT→EN→ES funciona em `/contato` e `/projetos` (3 trocas seguidas, sem erro). O erro é a deleção de um nó filho do body que já não está no DOM — aconteceria com qualquer layout. `X-Matched-Path`, metadata, 404 por idioma e `html lang` corretos em todas as aberturas diretas. |
| D — Versão do Next (15.1.12) | **Não causa.** | O bug é `NotFoundError` em `removeChild` provocado por mutação de DOM fora do React (`el.remove()`), reproduzido sem nenhuma dependência de versão. `npm view next`: linha 15 vai até 15.5.24; os fixes relacionados a RSC nessa janela (#77963 preserva `_rsc` em redirects de `next.config`; #79426 reverte Vary) não tocam este cenário. Sem upgrade nesta missão. |
| Prefetch | Não contribui | Prefetches (`Next-Router-Prefetch: 1`) chegam `200 text/x-component`; o crash não depende de ter prefetch (sonda com clique imediato após load, sem prefetch consumido, também quebra). |
| Cache CDN / browser (payload RSC servido como HTML) | Descartado | Produção: `X-Vercel-Cache: MISS` e `private, no-cache, no-store` em HTML e RSC; `Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, …`. Nenhuma resposta cacheável para misturar. |
| Service worker / PWA / Cloudflare | Descartado | `grep serviceWorker|workbox` em `src/` e `public/`: nada. `vercel.json` só define região. |

## Causa confirmada

`src/sections/home/boot-controller.tsx` removia do DOM, por fora do React, um nó que o React renderizou:

```ts
window.setTimeout(() => el.remove(), 900);   // el = document.getElementById("mw-boot")
```

`<div id="mw-boot">` é JSX de `src/sections/home/boot.tsx`, renderizado na Home (`app/[lang]/page.tsx`) como filho direto do `<body>`. Depois do `el.remove()` a fiber continua apontando para o nó solto. Na próxima navegação que desmonta a Home (qualquer rota, ou troca de `[lang]`), o React executa `body.removeChild(div)` → `NotFoundError` no commit → sem error boundary acima do layout raiz → página de erro global do Next.

Agravante: numa revisita client-side da Home a classe `html.booted` não existe (o `<script>` inline do Boot só executa no HTML do servidor e o `<html className>` é reaplicado pelo React na troca de idioma), então o Boot rodava de novo em toda revisita e rearmava o crash (`/ → EN → ES` quebrava na segunda troca).

## Evidência

- `probe-dom-mutations.mjs` (monkeypatch de `removeChild/appendChild/insertBefore/remove` no body): a única mutação fora do React antes do erro é `remove BODY DIV#mw-boot @/ at app/[lang]/page-*.js` — em seguida `removeChild BODY DIV#mw-boot at 3ddf97e7-*.js (React)` lança `NotFoundError`.
- `probe-dwell.mjs`: `/` + 8 s + clique → crash em Chromium local, Chromium produção, WebKit produção (`bootPresentBeforeClick: false`); `/` + 1,5 s + clique → sem erro (`bootPresentBeforeClick: true`).
- `probe-lang-swap.mjs`: `/ → EN → ES` quebra na 2ª troca (local e produção); `/contato → EN → ES → PT` e `/projetos → EN → ES → PT` passam.
- `probe-lang-swap-booted.mjs` (sessionStorage `mw:booted=1`, mas sem a classe `booted` na revisita): quebra na 3ª troca — a revisita da Home reexecutava o Boot mesmo com a sessão bootada.
- Auditoria `--only dwell` antes da correção: **4/4 FAIL** (`dwell-before-fix.json`).

## Limitação do ambiente: WebKit headless 390 px "Page crashed" (não resolvido, não é o bug)

Na rodada final o WebKit 390×844 devolvia `Page crashed` (processo de render morto) em ~60–70 % dos passos — **também antes de qualquer correção** (`baseline2`), nunca em 1440×900 e nunca em Chromium. Sondas (`probe-webkit-*.mjs`, 390 px):

- `probe-webkit-vt.mjs`: navegar pelo menu mobile com `startViewTransition` presente → crash 4/4; com a API apagada via `addInitScript` → 0/4; links da página com VT → 0/4.
- `probe-webkit-timing/stage/selector/overlay.mjs` (mesmas ações de usuário — abrir menu, clicar, esperar 0,6–2,5 s; com e sem `scrollIntoView`; com e sem a query `:not(#nav-overlay *)`): **0 crashes em 26 execuções, com VT ligado**.
- Um bail-out experimental em `ViewTransitions` (ignorar cliques dentro de `#nav-overlay`) **não** eliminou o crash da sonda que crasha → foi revertido: sem evidência de que a View Transition seja a causa, e a regra da missão é não mexer em VT por hipótese.
- Touch emulation não influencia (`probe-webkit-touch.mjs`).

Conclusão: instabilidade do WebKit headless do Playwright no Windows sensível a detalhes do harness, não um comportamento reproduzível por ações de usuário. Fica como **risco residual**: validar navegação pelo menu mobile num Safari/iOS físico (item já pendente na Fase 13 do `project-state.md`). Os 30–40 passos que o WebKit 390 completou por rodada não mostraram vazamento de RSC nem hard navigation.

## Solução proposta (implementada)

1. `boot-controller.tsx` — `finish()` esconde o overlay (`el.style.display = "none"`) em vez de `el.remove()`; o React remove o nó ao desmontar. A detecção de "sessão já bootada" passa a ler `sessionStorage` diretamente (além da classe `booted`), escondendo o overlay na revisita sem reexecutar a sequência.
2. `view-transitions.tsx` — remove `e.stopPropagation()`; mantém `preventDefault()`. O `next/link` chama o `onClick` do consumidor e depois desiste do push próprio ao ver `defaultPrevented` (`node_modules/next/dist/client/app-dir/link.js`), então não há push duplicado e o cookie de idioma volta a ser gravado.

Nada mudou em middleware, layouts, i18n, Hero, URLs, metadata ou 404.

## Risco da solução

- Baixo. O nó `#mw-boot` fica no DOM (`display:none`) até a Home desmontar — invisível, fora do fluxo, sem eventos.
- Revisita da Home na mesma sessão não mostra mais o Boot (comportamento que o código já declarava como intenção).
- Sem `stopPropagation`, outros listeners de clique em bubble passam a ver o evento com `defaultPrevented = true` — só `next/link` e `ScrollProvider` (âncoras `#`, que o VT já ignora) escutam clique no documento.

## Testes após a correção

`pnpm tsc --noEmit` ✓ · `pnpm lint` ✓ (só o aviso pré-existente de `<img>` no OG do case) · `pnpm build` ✓.

| Rodada (build final, `next start` local) | Passos | Falhas | RSC bruto | Hard nav inesperada |
|---|---|---|---|---|
| Chromium 320×700 · matriz + 20 ciclos | 257 | 0 | 0 | 0 |
| Chromium 390×844 · matriz + 20 ciclos | 257 | 0 | 0 | 0 |
| Chromium 430×932 · matriz + 20 ciclos | 257 | 0 | 0 | 0 |
| Chromium 768×1024 · matriz + 20 ciclos | 257 | 0 | 0 | 0 |
| Chromium 1440×900 · matriz + 20 ciclos | 257 | 0 | 0 | 0 |
| WebKit 1440×900 · matriz + 20 ciclos | 257 | 0 | 0 | 0 |
| WebKit 390×844 · matriz + 5 ciclos | 101 | 60–71 (todas `Page crashed`, ver limitação acima) | 0 | 0 |
| `--only dwell` (o caso do bug) antes → depois | 4 | 4 → **0** | — | — |

Matriz = 14 navegações por clique, 4 com espera do Boot, 9 trocas de idioma, 7 operações de histórico (back/forward/reload), 23 aberturas diretas (incl. `/pt`, `/work`, `/en/projetos` → 308 e `/nao-existe` → 404). Ciclo de estresse = Home → Projetos → case → próximo → Estúdio → Serviços → Contato → Home → EN → ES → PT.

Sondas na build final: cookie `en` + clique em PT → `/` em `pt-BR`, cookie `pt`, sem 307 (`probe-redirect.mjs`); `/ → EN → ES → PT → EN` sem erro (`probe-lang-swap.mjs`); Chrome real em produção (antes da correção) — 9 navegações + back×4/forward×2 sem RSC bruto, confirmando que o sintoma exige o Boot concluído.

## Riscos restantes

1. **WebKit headless 390** instável no harness (acima) — validar menu mobile em Safari físico.
2. Redirects do middleware descartam `?_rsc=` (Next). Inofensivo enquanto as respostas forem `no-store`; se um dia a CDN passar a cachear HTML/RSC, revisar (classe do issue vercel/next.js#79346; Next ≥ 15.4 preserva `_rsc` só em redirects de `next.config`).
3. O overlay do Boot permanece no DOM (`display:none`) até a Home desmontar — sem efeito visual; se alguém voltar a removê-lo por fora, o crash volta (o `--only dwell` pega).
