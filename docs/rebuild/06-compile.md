# 06 — WE COMPILE IMPOSSIBLE REALITIES

Data: 28/08/2026 · Branch `main` · Fases 1–7 do briefing "nível Awwwards com linguagem própria"

Conceito: **a MilWeb compila realidades — e elas começam a ter comportamento próprio.**
`CODE SHOULD MOVE PEOPLE` continua sendo o manifesto (headline do hero);
`WE COMPILE IMPOSSIBLE REALITIES` é o conceito que rege o comportamento do site.

---

## 1. Auditoria inicial (Fase 1)

| # | Achado |
|---|---|
| Arquitetura | Next 15 App Router, `app/[lang]` como layout raiz (PT/EN/ES), middleware de rotas localizadas, dados em `src/lib/content*.ts` + `src/data/projects.ts` |
| Componentes | Boot, BuildHero, SelectedWork (4 mundos sticky), Capabilities, LabTeaser, BreakTheWebsite, Human, BuiltWith, ContactCta, InspectProvider, ViewTransitions |
| GSAP/ScrollTrigger/Lenis | Registro único em `animations/gsap.ts`; Lenis só em ponteiro fino, dentro do `gsap.ticker` (um rAF); `ScrollProvider` mata triggers órfãos na troca de rota. **Furo:** `components/reveal.tsx` registrava o plugin de novo — corrigido |
| WebGL | Um shader cru (Event Horizon), 1 draw call, sem three.js, sem context-loss handling, sem Page Visibility |
| Fora da viewport | Nada rodava solto: Event Horizon e a gravidade tipográfica paravam por IntersectionObserver |
| Canvas / loops / observers | 1 canvas WebGL + 1 canvas 2D (`/diagnostico`); rAF: ticker do GSAP, Event Horizon, gravidade do Lab, física do Break, Counter, InspectLayer |
| Assets | `public/lab` 67 MB (nenhum no primeiro acesso), `public/shots` 5,4 MB, `public/og` 4,8 MB |
| JS inicial (home, gzip) | **237,5 KB** |
| Vazamentos | `BreakTheWebsite` pendurava `_cleanup` no elemento e não chamava no unmount (listeners de pointer sobreviviam) — corrigido |
| ScrollTriggers duplicados | Nenhum órfão; `Reveal` cria 1 trigger por instância, morto no unmount |
| Gargalos | LCP mobile 3,6 s (overlay do Boot), TBT 290 ms (hidratação GSAP+SplitText+Lenis), CLS 0,07, 7 long tasks (214/200/192 ms) |
| Preservar | paleta papel/tinta/signal, Archivo variável + JetBrains Mono, grid 12/8/4, HOLD TO INSPECT, os 4 mundos, shared element Home→Case, Break/Rebuild, Boot SSR, i18n, SEO, reduced-motion |
| Genérico/desconectado | imagens flutuantes do hero sem função; Capabilities como truques isolados; Lab só uma lista de vídeos; nenhum objeto ligava hero → mundos → lab → contato; transição de rota única para todos os cases |

---

## 2. A escultura — THE COMPILER

Uma máquina impossível de compilar interfaces, **100 % procedural** (SDF raymarching num quad,
`src/webgl/compiler-frag.ts`): laje de vidro escuro (núcleo), placa metálica assimétrica, lâmina de
tinta, três barras de interface emissivas e um anel dentado que nunca para. Nada é asset baixado —
os estados são números.

- **Materiais**: vidro que *refrata a própria interface* (o canvas 2D `interface-texture.ts` desenha
  grid, régua e as linhas de texto atrás dela — o texto aparece dobrado dentro do vidro), metal
  escovado com reflexo de ambiente procedural, tinta líquida quase preta com especular alto,
  interface emissiva em signal green. Aberração cromática mínima (0,004) e só no vidro.
- **Comportamento**: campo magnético — a escultura se inclina rumo ao cursor com inércia (o ponteiro
  entra suavizado, não por frame); deriva orgânica lenta quando montada; o anel interno gira sempre.
- **Estados** (`features/compiler/store.ts`): `boot · assembled · kavita · terral · vertex · aurex ·
  lab · collapsed`. São 13 uniforms interpolados pelo GSAP — a transformação é contínua, nunca um
  corte. `collapsed` reduz tudo a uma linha horizontal: a régua da interface, no contato.
- **Silhueta sem shader**: `features/compiler/fallback.tsx` desenha a mesma silhueta em SVG. Ela está
  no HTML desde o primeiro paint (é o que o crawler vê) e some quando o canvas assume.

## 3. Narrativa contínua

| Seção | O que a escultura faz | O que a seção faz |
|---|---|---|
| Boot | fragmentos dispersos → montagem | linhas/planos saem de cena rumo ao hero |
| Hero | montada, grande à direita; encolhe rumo ao canto | headline entra no fim da introdução; anomalia sacode nav/grid/código |
| Kavita | abre em placas, varredura emissiva | contornos topográficos, rotas com drones, varredura que revela a estrutura da própria seção, cursor cartográfico com coordenadas, profundidade mapa/mídia/tipografia |
| Terral | fecha, esquenta (bordas suaves, tinta quente) | papel com fibra, mídia entra dobrada e vira imagem viva (impressão → foto), rastro de grãos no cursor, mancha-portal que revela a casa do torrador |
| Vertex | achata em planos | guias que se desenham e caem em perspectiva, planta técnica, cotas reais (ESC 1:75), porta que abre, três profundidades (guias/mídia/tipografia) |
| Aurex | espalha e acelera o mecanismo, página em tinta | anéis em velocidades opostas ao scroll, planos temporais, cursor com quatro fantasmas atrasados, letras do título com atraso individual |
| Lab | dissolve no Event Horizon | horizonte de eventos ocupa a tela, a tipografia é atraída pela massa |
| Break | colapsa e entra em anomalia; depois recompila | grid, régua, labels e palavras caem; RICK CAN FIX IT; REBUILD recompõe |
| Human | desaparece | só papel, espaço e uma frase |
| Contato | colapsa numa linha | a realidade vira uma interface simples: e-mail e WhatsApp |

## 4. Transições de rota (uma por destino)

`data-vt` no link → `html[data-vt]` → CSS em `globals.css`. Máximo 0,9 s; o atributo sai quando a
transição termina. Sem a API (Firefox), com reduced-motion ou sem JS, o link continua um link.

| Destino | Coreografia |
|---|---|
| Kavita | `scan` — a varredura revela o case da esquerda para a direita |
| Terral | `fold` — o papel dobra sobre a viewport (rotateX a partir do topo) |
| Vertex | `grid` — a planta implode numa linha e o case se constrói a partir dela |
| Aurex | `time` — os planos desmontam, **uma pausa de 180 ms**, e remontam |
| Lab | `horizon` — a página é absorvida por um círculo; o novo nasce do centro |

A mídia e o título continuam viajando pelo `view-transition-name` (shared element).

## 5. Lab — três experimentos reais

`features/lab/*`, cada um em seu módulo, importado **só no clique** e destruído por completo ao sair
(botão ENCERRAR ou Esc). Um por vez; pausam com a aba oculta e fora da viewport.

- **Reality Tear** — canvas 2D pinta a superfície de papel (grid, régua, tipografia) e o arrasto a
  apaga com `destination-out` em pinceladas irregulares, com borda de fibra. Sem rAF: desenha só no
  movimento do ponteiro.
- **Gravity Type** — palavras são `<span>` reais (legíveis, selecionáveis) com física própria:
  gravidade, paredes, chão com restituição e **colisão AABB par a par**. Arrastar funciona no mouse
  e no toque.
- **Time Distortion** — cinco faixas da mesma composição em velocidades de −0,6× a 3,2×; o cursor na
  horizontal dobra o eixo (0,08× a 2,2×). Um rAF, sem leitura de layout no loop.

## 6. Som — procedural, silencioso por padrão

`features/sound/sound.ts` sintetiza tudo (osciladores + ruído filtrado + envelope): **nenhum arquivo
é baixado, nem depois**. O AudioContext só nasce no clique do controle (`SOM ON/OFF` no header e no
menu mobile, com `aria-pressed`), master em 0,12, nada contínuo, suspende quando a aba some,
preferência em `localStorage`. Sinais: boot, scan (Kavita), paper (Terral), mech (Aurex), horizon
(Lab), break e rebuild.

## 7. Arquitetura WebGL

`src/webgl/renderer.ts`: **um canvas, um contexto, um loop**.

- `invalidate()` pinta um frame; `hold()` mantém frames contínuos e devolve o release — o loop só
  existe enquanto alguém segura ou algo mudou.
- Teto de FPS (40 em HIGH, 30 no resto): a escultura tem movimento lento; isso corta metade do custo.
- `visibilitychange` cancela o rAF; `webglcontextlost/restored` recompila os programas.
- `destroy()` apaga programas, texturas e buffer e chama `WEBGL_lose_context`.
- DPR do perfil: 1,5 (HIGH) · 1,15 (MEDIUM) · 1 (LOW).
- O Event Horizon do Lab foi absorvido pelo mesmo programa — o canvas próprio do teaser foi removido.

## 8. Qualidade adaptativa (`src/lib/quality.ts`)

| Nível | Como entra | O que muda |
|---|---|---|
| HIGH | ponteiro fino, ≥ 4 núcleos/4 GB, ≥ 900 px, GPU rápida no teste | 56 passos de raymarch, DPR 1,5, 40 fps, refração + partes internas |
| MEDIUM | ponteiro grosso, hardware modesto ou GPU intermediária | 34 passos, DPR 1,15, 30 fps, mesma narrativa |
| LOW | `saveData`, rede 2g, ≤ 2 núcleos/2 GB, sem WebGL, **GPU lenta no teste** | sem canvas: silhueta SVG + animações DOM |
| REDUCED | `prefers-reduced-motion` | composições estáticas, sem física, sem parallax, intro removida |

Duas defesas encadeadas, ambas **fora do caminho crítico**:

1. **Micro-benchmark de GPU** (shader curto, 128×128, `gl.finish`) — roda no momento de montar, não
   no carregamento. > 3 ms ⇒ LOW.
2. **Probe do shader real** com DPR 0,12 (≈ 170×100 px) antes do primeiro pixel visível: > 4 ms ⇒
   desliga o WebGL e entrega a silhueta; > 1,2 ms ⇒ MEDIUM.

`?quality=high|medium|low|reduced` força o nível (QA) e nunca é rebaixado.

## 9. Performance — o que custou e o que foi feito

O primeiro build com a escultura ligada marcou **44** no mobile (TBT 9.850 ms): sem GPU, compilar e
rodar o raymarch consome a thread. As correções, em ordem de impacto:

| Correção | Efeito |
|---|---|
| **Montar a escultura só na primeira interação** (pointermove/wheel/touch/keydown/scroll) — até lá, a silhueta SVG | 67 → 87 no mobile |
| Micro-benchmark de GPU **preguiçoso** (só quando vai montar) | TBT 750 → 360 ms |
| Probe do shader real antes do primeiro pixel | 59 → 66 antes das demais |
| Textura da interface enxuta: 1024 px, ≤ 12 nós, leitura em bloco, texto numa segunda tarefa | tarefa de 4 s eliminada |
| Teto de FPS + menos passos (72 → 56/34) e loop 96 → 64 | metade do custo por frame |
| Intro curta no mobile (1,5 s) e overlay saindo em 2,1 s no desktop | LCP 3,6 → 2,4 s |
| **SplitText sob demanda** (`animations/split-text.ts`): sai do bundle inicial, carrega no idle (hero/Lab) e no hover do botão (Break) | −2,6 KB gzip · TBT desktop 60 → 20 ms |
| Altura fixa nas linhas do boot | CLS de fonte estabilizado |

### Antes × depois (Lighthouse 13, Edge headless, build de produção local, máquina sem carga)

| Página | Antes | Depois |
|---|---|---|
| Home mobile | **81** · LCP 3,6 s · TBT 290 ms · CLS 0,07 | **86** (84/84/89) · LCP 2,4 s · TBT 320 ms · CLS 0,08 |
| Home desktop | **98** · LCP 0,7 s · TBT 70 ms · CLS 0,004 | **96** · LCP 0,6 s · TBT 60 ms · CLS 0,005 |
| Case Kavita mobile | **88** · LCP 3,5 s · TBT 170 ms | **92** · LCP 3,2 s · TBT 150 ms |
| /lab mobile | — | **91** · LCP 3,3 s · TBT 140 ms |
| /contato mobile | — | **90** · LCP 2,8 s · TBT 240 ms |
| a11y (todas) | 100 | **100** |
| JS inicial da home (gzip) | 237,5 KB | **246,2 KB** (limite: 250) |

Metas do briefing: mobile ≥ 85 ✔ (média 86; a variância entre execuções é de ±3) · desktop ≥ 95 ✔ ·
LCP < 2,5 s ✔ na home (nos cases o LCP é o hero em imagem: 3,2 s) · CLS < 0,1 ✔ · JS < 250 KB ✔.

### SplitText sob demanda

O plugin só é usado em três telas (headline do hero no desktop, tipografia gravitacional do Lab e a
quebra do Break) e em nenhuma delas no primeiro paint. Saiu do registro central (`animations/gsap.ts`)
para `animations/split-text.ts`, que faz `import()` memorizado e registra o plugin uma vez:

- **hero e Lab** carregam no `requestIdleCallback` — a primeira tentativa foi carregar na hidratação
  e custou 7 pontos no mobile (79 vs 86): o round-trip caía dentro da janela de hidratação;
- **Break** carrega no clique, com prefetch por intenção no `pointerenter`/`focus` do botão;
- a headline nunca depende do chunk para existir: o `<html data-headline>` guarda que a introdução já
  liberou, então se o plugin chega depois do evento, o texto entra na hora em vez de ficar escondido.

Resultado: 7,1 KB (2,6 KB gzip) fora do bundle inicial, TBT desktop 60 → 20 ms, mesma nota no mobile.

## 10. Orçamento de performance

`docs/rebuild/perf-budget.md` — os limites e como medir. Sem CI no projeto; a verificação é o script
de Lighthouse documentado lá.

## 11. Testes executados

- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` — limpos (1 warning pré-existente do `<img>` do Satori).
- `.audit/qa-phase7.mjs` (Playwright): transições exclusivas dos 4 cases, `data-vt` limpo depois,
  **zero ScrollTrigger órfão**, botão voltar, cadeia próximo-projeto, reduced-motion (sem canvas, sem
  física, Break reversível), **sem WebGL** (silhueta + conteúdo íntegro), aba em background, teclado
  (seletor de idioma e controle de som alcançáveis). **OK**.
- `.audit/lab-test.mjs`: os três experimentos carregam sob demanda, respondem ao arrasto e o Esc
  destrói tudo — console limpo.
- `scripts/i18n-audit.mjs`: 114 rotas, **0 vazamentos** (os textos dentro dos experimentos foram para
  o dicionário; só os nomes próprios dos experimentos ficam em inglês).
- `scripts/i18n-visual.mjs`: 4 viewports × 3 idiomas, sem overflow, seletor e menu OK.
- `.audit/routes.sh`: rotas 200, legadas 308, cookie, 404 — inalterados.

### Correção no Break (achada pelo teste do SplitText)

Com as colunas do grid virando corpos, a física nunca "assentava" (uma coluna inteira é um corpo alto
demais, e a repulsão do cursor parado impedia o repouso) — a tela **RICK CAN FIX IT** podia nunca
aparecer, deixando o REBUILD inalcançável. Agora: cada coluna cai em 4 segmentos, a tolerância de
repouso é mais folgada, a repulsão do cursor só entra 1,8 s depois da queda e existe um teto de 4,2 s
que declara o repouso de qualquer forma. O estado quebrado deixou de depender de sorte física.

## 12. Limitações honestas

- **Sem GPU acelerada, a escultura não roda** (por escolha): o probe rebaixa para a silhueta SVG. Em
  ambiente headless/software a compilação do shader chega a travar a thread por segundos — é
  exatamente o cenário que o probe evita.
- A escultura só monta **na primeira interação**. Quem abre a home e não move o mouse, não rola e não
  toca a tela vê a silhueta SVG. Foi a troca escolhida para não pagar a compilação no carregamento.
- O Speed Index do mobile (~4,4 s) é o preço da introdução: overlay escuro por 1,5 s.
- CLS 0,08 no mobile (dentro da meta, igual à baseline) — vem da fonte do boot.
- Firefox: sem View Transitions, as rotas trocam sem coreografia (o conteúdo é idêntico).
- Safari/Firefox físicos continuam pendentes desde a Fase 04.
