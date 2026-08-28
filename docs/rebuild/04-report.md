# Fase 04 — Polish, hardening e cases bespoke (28/08/2026)

## Matriz cross-browser (Playwright, build de produção local, `MW_LOCAL_HTTP=1`)

Viewports: 1920×1080 · 1440×900 · 1366×768 · 430×932 (touch) · 390×844 (touch).
Páginas: `/` · `/work` · `/work/kavita-drones`. Por célula: console (error+warning),
pageerror, requests falhas, overflow horizontal, scroll em passos + reverse,
resize ×3 (desktop) / rotação portrait→landscape→portrait (mobile).

| Engine | Desktop (1920/1440/1366) | Mobile (430/390) | View Transitions | Status |
|---|---|---|---|---|
| Chromium 1.62 (Playwright) | PASS ×9 | PASS ×6 | shared element | **PASS** |
| WebKit 1.62 (Playwright, Windows) | PASS ×9 (layout, scroll, sticky, clip-path, SVG, resize) | PASS ×6 (touch, orientação) | suportado | **PASS com limitação** — o backend de fontes desse build não aplica os eixos `wdth/wght` da Archivo variável (títulos saem regulares e espaçados). `font-variation-settings` explícito foi adicionado; **Safari físico (macOS/iOS) não foi testado** e precisa de conferência visual da tipografia. |
| Firefox 153 (Playwright) | — | — | fallback (cross-fade) | **NÃO TESTADO** — o build do Firefox do Playwright não consegue abrir página neste host Windows (`browser.newPage: Target page, context or browser has been closed`, headless e headed). Firefox físico também não estava disponível. Ver "Pendências". |

Falsos negativos encontrados e corrigidos no processo (não no site):
- `waitUntil: networkidle` nunca resolve por causa do script da Vercel Insights (404 local) — matriz usa `load` + timeouts.
- CSP `upgrade-insecure-requests` faz o WebKit promover `localhost`/`127.0.0.1` para HTTPS → sem CSS/JS. Switch `MW_LOCAL_HTTP=1` remove a diretiva só em teste local; produção intacta.
- Dev server e `next start` não podem compartilhar `.next`.

## Bugs reais corrigidos nesta fase
- GSAP com `getBBox` em ~156 elementos SVG (dots + ticks) → tarefa de 2,2 s / TBT 2,4 s no mobile. Agora só grupos são animados e o setup dos mundos, Capabilities e Lab roda em `requestIdleCallback`.
- Hydration mismatch por floats de `Math.cos` nos ticks do Aurex (`toFixed`).
- Alvo GSAP inexistente (`[data-measure]`) no mundo Vertex.
- Cabeçalho INDEX/PROJECT/TYPE aparecia no `/work` mobile (`grid-12` vencia `hidden`).
- Pontos do Terral invadiam a nav.
- Alvo de toque do link ALL WORK (a11y 96 → 100 esperado).
- Lenis passou a ser `import()` sob demanda só com ponteiro fino.

## Cases bespoke (nenhum é skin do Kavita)
| Case | Hero | Experience (troca de mídia) | Under the hood |
|---|---|---|---|
| Kavita | linha de varredura única | corte técnico horizontal (inOutQuart) | fluxo USER → CATALOG → BUDGET → BRANCH ROUTING → WHATSAPP |
| Terral | papel quente, grão, câmera lenta 1.06→1 com deriva (scrub) | dissolve lento com deriva (smooth 1,4 s) | trilho dos 5 capítulos + **o mecanismo real: segure 6 s** (botão de verdade, teclado Space/Enter) |
| Vertex | guias 1px que se desenham + cotas (GRID/MEASURE/PROCESS) sobre a mídia | fatias verticais (a mesma linguagem do mundo) | **pipeline ao vivo**: SCROLL → ScrollTrigger(progress) → world.ts → rAF+damping (valor perseguido) → `video.currentTime` (DIA n/132) |
| Aurex | tinta, anel de ticks que freia com peso (outQuint) | abertura circular | **explosão**: 10 peças reais, `v = smoothstep(delay, delay+span, progress)`, janelas em cascata (valores exatos vivem em cada `<Part>` do projeto — dito no código) |

## Lighthouse (produção local, `next start`, Edge headless)
| Página | Desktop | Mobile |
|---|---|---|
| Home | **98** · a11y 100 · LCP 0,7 s · TBT 40 ms | **81** · LCP 2,9 s · TBT 490 ms · CLS 0,03 |
| Kavita | 100 · LCP 0,8 s | 87 · LCP 3,3 s · TBT 240 ms |
| Terral | 100 | 85 · TBT 310 ms |
| Vertex | 100 | 88 · TBT 210 ms |
| Aurex | 100 | 86 · TBT 280 ms |

Antes da fase: Home 88/72, case 100/71. Meta (≥80 mobile) atingida sem remover identidade.
Números oscilam ±5 nesta máquina entre execuções.

## Easing — sistema
outExpo (entradas) · outQuint (desacelerações com peso) · inOutQuart (transições/cortes) ·
smooth (scrub com respiro) · none (scrub puro). `snap` removido.

## Pendências honestas
- **Firefox**: sem automação possível neste host. Risco conhecido: View Transitions não existe → cross-fade (arquitetura já cai no fallback); `font-stretch` em fonte variável é suportado no Firefox, mas não foi visto.
- **Safari físico** (macOS/iOS): tipografia variável, `100svh` com a barra do navegador, momentum scroll nos mundos sticky — não verificados fisicamente.
- Trackpad/stylus reais: não testados (Playwright só simula wheel/touch).
- Vídeos de projeto continuam inexistentes; mídia é screenshot coreografada.
