# MilWeb System — design

Data: 2026-09-12 · Status: escrita a partir de auditoria completa do código em `c176cad`, aguardando review do Rick antes do Sprint 03

## Objetivo

Fazer a MilWeb inteira parecer **um único sistema digital**: a mesma linguagem, a mesma
numeração, a mesma lógica de estado da abertura ao contato, e de lá para dentro de cada
case e do LAB. Não é um redesign: a composição de 10/09 (escultura orbital, tipografia em
grande escala, galeria editorial) fica. O que entra é infraestrutura: uma fonte canônica de
nós, um estado global mínimo, uma HUD persistente que lê esse estado, e movimento nos
projetos da home. Tudo com dado real ou nada.

O que motivou (verificado no código, não em memória):

- A numeração `MW/NNN` existia e o redesign de 10/09 apagou a metade da frente. Na home
  atual sobraram `MW/008` (`lab-teaser.tsx:235`), `MW/010` (`built-with.tsx:11`) e
  `MW/011` (`contact-cta.tsx:17`). `MW/001`–`MW/007` vivem em `build-hero.tsx` e
  `selected-work.tsx`, que nenhuma página importa. `MW/009` nunca existiu.
- Existem **quatro numerações paralelas** para as mesmas coisas: `MW/NNN` na home,
  `ATO 02..09` em `data-act` (lido só pelo observer da nav, que está oculto na home),
  `MW / 02` no case (posição no arquivo, `case-study.tsx:92`) e `LAB / 001`.
- `SEGURE PARA INSPECIONAR` está nos três dicionários (`hero.inspect`) e não é renderizado
  por ninguém: a interação de segurar continua ativa em todas as páginas, sem rótulo.
- Coordenadas existem em três formatos incompatíveis e nenhuma ligada a projeto
  (`earth-mask.ts:107`, `globe.config.ts:123`, `act-stages.tsx:93`, `logistics-geometry.ts:14`).
- 18 listeners globais sempre ativos antes de qualquer seção montar; 4 handlers de `click`
  em `document`/`window`; 6 handlers de `pointermove` no pior caso na home, 3 deles com
  `getBoundingClientRect()` dentro do handler; `prefers-reduced-motion` lido em 7 lugares
  sem fonte compartilhada; quatro conjuntos de breakpoints (Tailwind 720/1080, `MQ` 720/1080,
  seções 768, boot/quality 900).
- A galeria tem 11 imagens e zero vídeos. Os filmes de 60 s de Terral, Atelier Vertex,
  Aurex e Kavita existem em `~/Videos/TERRAL/` (Remotion, 1920×1080, 60 fps), fora do repo.
- Mobile e `prefers-reduced-motion` nunca foram conferidos em aparelho
  (`docs/visual-upgrade-2026-09.md`).

## Narrativa (o que o visitante vê)

1. A abertura carrega. No rodapé da tela, discreto, em mono: `MW/001 — SYSTEM` à esquerda;
   à direita, o que o sistema sabe de verdade sobre a sessão: `1440×900 · 2.0× · PONTEIRO
   FINO` (ou `TOQUE`), e `MOVIMENTO REDUZIDO` quando for o caso. Nada de porcentagem
   inventada, nada de "GPU LOAD".
2. Rolando, o rótulo troca sem a página reiniciar: `MW/002 — KAVITA · 2026`, `MW/003 —
   TERRAL · CASA DO TORRADOR`. À direita, o progresso real dentro do nó (`0 → 100`).
   O card dominante na tela decide o nó, não a seção inteira.
3. Passando o mouse (ou, no celular, quando o card domina a viewport), a captura do Terral
   ganha 4 s do filme do próprio projeto; sai do card, volta ao poster. Um vídeo por vez.
4. Clicando, a mídia do card vira o hero do case pela View Transition que já existe
   (`case-media-<slug>`); a HUD continua no mesmo lugar dizendo `MW/003 — TERRAL`. O
   cabeçalho do case deixa de dizer `MW / 02` (posição no arquivo) e passa a dizer o mesmo id.
5. No LAB, `MW/009 — LAB · 003 AO VIVO`. No `/estudio`, `MW/011 — RICK`. No contato,
   `MW/013 — CONTATO · ABERTO A PROJETOS`. Em qualquer rota sem nó estampado, a HUD volta
   ao nó raiz `MW/001 — SYSTEM`; nunca fica vazia, nunca mente.
6. No celular: `003 / TERRAL`. Só isso, no canto inferior esquerdo, dentro da área segura.

## Arquitetura

### Fonte canônica — `src/data/milweb-system.ts` (novo)

Módulo **server-only** (sem `"use client"`, importado só por páginas e seções que já são
server components). Deriva, não duplica: os projetos continuam donos de título, imagem,
status e stack (`data/projects.ts`, `data/work.ts`, `lib/content*.ts`); o registro só
atribui identidade de sistema e ordem.

```ts
export type SystemNodeType =
  | "system" | "project" | "capabilities" | "lab" | "interaction"
  | "human" | "technology" | "contact";

export type SystemNode = {
  /** "MW/003" — o id que aparece em tudo. */
  id: string;
  /** 3 — para ordenação e para o formato curto "003". */
  index: number;
  /** chave estável usada em `data-node`: "system" | <slug do projeto> | "lab" ... */
  key: string;
  type: SystemNodeType;
  /** Título curto em caixa alta, por idioma. Projetos: `SELECTED_WORK.name`. */
  title: Localized;
  /** Leitura secundária, sempre um fato: ano confirmado, "NO AR", rótulo técnico do
   *  projeto (`work.labels[slug][0]`, ex.: "CALIBRE AX-01 TOURBILLON"). Opcional. */
  readout?: Localized;
  /** Só quando verificada. Sprint 01 preenche apenas a origem do estúdio, e mesmo essa
   *  fica pendente de confirmação do Rick (o código usa −15.8/−47.9, que é Brasília). */
  coordinates?: { lat: number; lon: number };
  /** Caminho interno (`/work/terral`), localizado com `withLocale` no consumo. */
  route?: string;
  /** Chaves de nós relacionados — Sprint 05 (cases ↔ LAB). */
  related?: string[];
};
```

Ordem e numeração, **contíguas na ordem da home** e estáveis fora dela:

| id | key | type | onde aparece |
|---|---|---|---|
| MW/001 | system | system | abertura da home; fallback de qualquer rota sem nó |
| MW/002–007 | kavita-drones, terral, atelier-vertex, aurex-timepieces, inkvision, logistics-demo | project | cards da galeria; página do case; arquivo |
| MW/008 | capabilities | capabilities | seção Capacidades |
| MW/009 | lab | lab | teaser na home; página `/lab` |
| MW/010 | break | interaction | seção "Não aperte" |
| MW/011 | human | human | seção "Há uma pessoa"; página `/estudio` |
| MW/012 | built-with | technology | seção "Feito com" |
| MW/013 | contact | contact | seção final; página `/contato` |
| MW/014… | demais projetos do arquivo, na ordem de `PROJECT_INDEX`; depois os ocultos | project | páginas de case; arquivo |

`n` (posição no arquivo, "02 / 25") continua existindo como **posição**, não como id. O
cabeçalho do case mostra `MW/003 — TERRAL` à esquerda e `02 / 25` à direita, como hoje,
só trocando a primeira metade.

Helpers exportados: `SYSTEM_NODES`, `ROOT_NODE`, `nodeOf(key)`, `nodeOfProject(slug)`,
`nodeAttrs(node, locale)` → `{ "data-node": id, "data-node-title": ..., "data-node-readout"?: ... }`.
Os rótulos vão para o DOM como atributos; **o registro não entra no bundle do cliente**,
seguindo a regra do projeto de manter conteúdo e dicionário fora do JS.

Invariantes verificados no import (mesmo padrão de `projects.ts:139`): ids únicos,
índices contíguos a partir de 1, toda `FEATURED` com nó, todo slug de `ALL_SLUGS` com nó.

### Estado global — `src/features/system/system-store.ts` + `system-provider.tsx` (novos)

Mesmo padrão do `features/compiler/store.ts`: um objeto de valores mutáveis lido por
quem precisa a 60 Hz, e um contexto React só para o que muda raramente.

**Alta frequência (sem React, por `subscribe`)**: `nodeProgress` (0–1 dentro do nó
dominante), `globalProgress` (0–1 da página), `scrollDirection` (−1/0/1),
`scrollVelocity` (px/s, suavizada). Consumidores: a HUD (escreve `textContent`), e no
futuro o Milo.

**Baixa frequência (contexto React)**: `currentNode`, `previousNode`, `nextNode` (id,
title, readout lidos do DOM), `media` (`reduce`, `pointer: "fine" | "coarse"`,
`bp: "mobile" | "tablet" | "desktop"`), `viewport` (`w`, `h`, `dpr`), `audio`
(`on/off`, do singleton `sound`).

**Não entra** (fica local, decidido na auditoria): posição do ponteiro (cada seção que
usa já faz o próprio cálculo e a consolidação num broker é Sprint próprio, ver dívidas),
qualidade de GPU (`getQuality()` já tem cache e atributo), estado do Boot (é da home).

Como mede, sem ler layout em loop (regra 6 do orçamento):

- Os nós são os elementos `[data-node]` da página. Seus retângulos (`top`, `height`) são
  medidos **uma vez** e re-medidos só em `ScrollTrigger` `refresh`, em `resize` e quando o
  `ResizeObserver` do `document.body` acusa mudança de altura do documento (imagens
  carregando, seções que expandem). Um observer, um listener de resize.
- A cada tick do `gsap.ticker` (que já roda para o Lenis e o ScrollTrigger; **nenhum rAF
  novo**), se o scroll mudou, calcula com os retângulos em cache: sobreposição de cada nó
  com a viewport → nó dominante (maior área visível; empate favorece o mais abaixo);
  progresso do nó = `(scrollY − max(0, top − vh)) / (top + height − max(0, top − vh))`,
  limitado a 0–1, o que dá 0 % na abertura e 100 % quando o nó sai por cima.
- Direção e velocidade vêm do delta de `scrollY` entre ticks, com suavização exponencial.
- Fonte de scroll: `window.scrollY` (funciona com Lenis, que rola o documento de verdade,
  e no mobile sem Lenis). Sem listener de `scroll` adicional.
- Troca de nó dominante → `setState` (raro). Progresso → só `subscribe`.
- Troca de rota (`usePathname`) → re-coleta `[data-node]` no próximo frame e re-mede.

Registro de mídia: um `matchMedia` por query (`reduce`, `(pointer: coarse)`, `min-width:
720px`, `min-width: 1080px`), com `change` ouvido uma vez, exposto no contexto **e** como
atributos em `<html>`: `data-reduce="1"`, `data-pointer="fine|coarse"`,
`data-bp="mobile|tablet|desktop"`. Isso dá uma fonte só para CSS e JS; as sete leituras
avulsas migram aos poucos (Sprint 01 migra a nav; as demais ficam como dívida listada).
Breakpoints: os do `tokens.css`/Tailwind (720/1080). Os 768 das seções novas viram dívida.

Milo, depois: passa a ser mais um assinante de `subscribe` e mais um leitor do contexto.
Nada no provider assume canvas, WebGL ou personagem.

### HUD — `src/components/system-hud.tsx` (novo) + `src/styles/system.css` (novo)

Cliente, montado em `[lang]/layout.tsx` depois de `<Nav>`, recebendo do servidor as
strings do nó raiz (`ROOT_NODE` no idioma) e os rótulos de leitura do dispositivo.

Desktop (≥ 720 px): barra fixa no rodapé, altura 28 px, `padding: 0 var(--margin)`,
`t-mono` em `--step--1`, `mix-blend-difference` na mesma cor da nav (`#F2F0EA`), sem
pointer events. Esquerda: `MW/003 — TERRAL · CASA DO TORRADOR`. Direita: `042` (progresso
do nó em três dígitos, `tnum`) e, no nó raiz, a leitura real do dispositivo
(`1440×900 · 2.0× · PONTEIRO FINO`). Troca de rótulo: `clip-path` de 240 ms com
`--ease-out-expo`; sob `data-reduce`, troca seca.

Mobile (< 720 px): `003 / TERRAL` no canto inferior esquerdo, `font-size: 10px`,
`padding-bottom: max(12px, env(safe-area-inset-bottom))`, sem progresso, sem leitura de
dispositivo. Some enquanto o `<dialog>` do menu está aberto (o dialog é top layer; a HUD
ainda ganha `visibility: hidden` via `html:has(dialog[open])` para não vazar em capturas).

Regras:

- `aria-hidden="true"`. A HUD é redundante com os headings; não vira live region. A nav
  mantém seu `aria-live` fora da home.
- Some em `html.inspecting` (o modo inspeção tem a própria HUD) e em `html.booting`.
- Recebe `view-transition-name: mw-hud` para ser fotografada à parte na troca de rota e
  ficar parada enquanto o resto transita.
- Nunca mostra um valor que o provider não mediu. Sem nó, mostra o raiz.

O hero perde a linha `BRASIL — MUNDO` do rodapé (a origem passa a ser leitura do nó raiz na
HUD) e a assinatura decorativa `MW` (redundante com a HUD). O CTA fica.

### Estampagem dos nós (evoluem)

- `orbital-hero.tsx`: `{...nodeAttrs(system)}` no `<section>`; remove `origin`/`signature`.
- `project-gallery.tsx`: cada `<article>` recebe `nodeAttrs(nodeOfProject(slug))`, vindos
  em `items[]` do servidor (o componente é cliente; recebe os atributos prontos).
- `capabilities.tsx`, `lab-teaser.tsx`, `break-the-website.tsx`, `human.tsx`,
  `built-with.tsx`, `contact-cta.tsx`: recebem `node` como prop e estampam. Os literais
  `MW/008`, `MW/010`, `MW/011` viram `node.id`.
- `sections/case/case-study.tsx`: `<article>` estampa o nó do projeto; cabeçalho troca
  `MW / {n}` por `{node.id}`; `opengraph-image.tsx` idem.
- `app/[lang]/lab/page.tsx`, `studio/page.tsx`, `contact/page.tsx`, `work/page.tsx`:
  estampam no `<main>`/raiz o nó correspondente (`lab`, `human`, `contact`, `system`).
- `data-act` e `d.acts` **saem** (dicionário, tipo e seções). Eram a numeração paralela
  "ATO 02..09" e o único leitor era o observer duplicado da nav.
- `components/nav/nav.tsx`: remove o `IntersectionObserver` próprio (`:47-71`) e o
  `matchMedia` de 768; lê `currentNode` e `media.bp` do contexto. O indicador central fora
  da home passa a mostrar `node.id — node.title`.

### Selected Work com vida (Sprint 02) — `src/components/project-motion.tsx` (novo)

Só Terral e Atelier Vertex neste sprint. Material: cortes de 3–5 s dos filmes de 60 s em
`~/Videos/TERRAL/` (`terral-60s-master.mp4`, `atelier-vertex-v2-60s-web.mp4`), escolhidos
por folha de contato, um trecho que **mostre a natureza do projeto** (Terral: grão e
parallax do scroll; Vertex: a obra sendo revelada no scroll). Nada de efeito genérico.

Encoding (ffmpeg, documentado em `scripts/project-motion.sh`): 24 fps, sem áudio, corte
na proporção do card (Terral e Vertex são retrato 4:5), altura 720, `webm` VP9 CRF 34 + `mp4` H.264
CRF 26 como fallback, alvo ≤ 500 KB por arquivo, em `public/motion/<slug>.{webm,mp4}`.
Poster continua sendo a captura já existente (a imagem não sai do card; o vídeo entra
por cima com `opacity` quando `canplay`).

Comportamento:

- `<video muted playsInline loop preload="none" poster>` dentro de `.gallery-project__media`,
  `aria-hidden`, sem controles. `preload="none"` garante **0 bytes** de vídeo no primeiro
  acesso (orçamento: < 3 MB).
- Desktop com ponteiro fino: `pointerenter`/`focus-visible` no link → `play()`; `leave`/`blur`
  → `pause()`, `currentTime = 0`, opacidade a 0 em 300 ms. O `src` só é atribuído no
  primeiro hover (lazy real).
- Toque/coarse: um único `IntersectionObserver` (threshold 0.6) sobre os cards com vídeo;
  toca só o card com maior razão visível; **no máximo um vídeo ativo**; pausa ao sair;
  pausa em `visibilitychange`.
- `data-reduce`, `navigator.connection.saveData` ou `prefers-reduced-data`: nunca atribui
  `src`; o card fica na captura. Nenhuma informação vive só no vídeo.
- Falha de `play()` (autoplay bloqueado, decode): silenciosa, volta ao poster.

Custo documentado: +1 IO no mobile (nenhum no desktop), 2 listeners por card com vídeo,
0 rAF, 0 canvas. Memória: um decoder ativo no máximo.

### Home → Case (Sprint 03, só desenhado aqui)

Já existe: `data-vt` por slug, `case-media-<slug>` e `case-title-<slug>` nos dois lados,
interceptor em `view-transitions.tsx` com orçamento de 900 ms. O que falta: o `::view-
transition-group(case-media-*)` hoje só cross-fade; o desenho é a mídia crescer do card
para o hero com `transform` interpolado pelo navegador (grupo com `animation-duration`
própria), a interface do card (caption, número) saindo em 200 ms antes, e o `<h1>` do case
chegando por `clip-path`. Volta (`back`) faz o inverso pelos mesmos nomes. Sem canvas entre
rotas; sem tocar em nós fora do React; o mesmo teste `.audit/qa-phase7.mjs` cobre.

### Hero (Sprint 04, só desenhado aqui)

Blender conectado: reconstruir as fitas da escultura como malha, casar com a composição
atual (mesmo enquadramento e silhueta do WebP), renderizar `beauty`, `depth`, `normal` e
uma máscara. No navegador, um shader leve sobre a imagem: parallax por profundidade,
iluminação especular reagindo ao ponteiro via normal map, aberração só nas bordas.
Refração fica fora salvo se a geometria justificar. O WebP atual continua sendo o poster,
o LCP e o fallback. Nenhum depth estimado por IA.

### LAB ↔ cases (Sprint 05, só desenhado aqui)

`related` no registro: `aurex-timepieces → ["lab:time"]`, `terral → ["lab:tear"]`, etc.,
sempre com base no que o experimento de fato explora. O case ganha `RELATED RESEARCH →`
no capítulo "Under the hood"; o experimento ganha `USED / EXPLORED IN →`. Os seis filmes
do LAB e os três experimentos viram sub-nós `MW/009/01..09` na mesma tabela.

## O que NÃO entra (decidido)

- Telemetria decorativa: nada de GPU %, "system unstable", altitude, coordenadas de
  projetos sem fonte. FPS fica fora do Sprint 01 (precisaria de amostragem e exibição
  com throttle; entra quando houver consumidor real, o Milo).
- Loader novo. O Boot existente já é a inicialização; nenhuma contagem falsa.
- Mesh 3D em tempo real no hero. Canvas persistente entre rotas.
- Reescrita de copy. A voz do `/estudio` para a home é um sprint próprio, com o Rick.
- Seção pessoal. Fica o conceito (bastidores reais, mesa, processo) para depois.
- Remoção dos componentes mortos do hero/atos antigos neste sprint (ver dívidas).

## Responsive

- Breakpoints do sistema: 720 e 1080 (`tokens.css`/Tailwind/`MQ`). Nenhum 768 novo.
- HUD: desktop barra completa; tablet barra sem leitura de dispositivo; mobile só
  `NNN / TÍTULO`.
- Galeria: vídeo por hover só com `(hover: hover) and (pointer: fine)`; por visibilidade
  só com `(pointer: coarse)`. Nunca os dois.
- Área segura: `env(safe-area-inset-bottom)` na HUD.
- Landscape no celular (altura < 500 px): HUD some (a barra roubaria 6 % da altura).

## Performance (orçamento)

Baseline medida nesta sessão, build de produção `c176cad` (números em
`.audit/system/lh-before.txt`; JS da home 13,1 kB + 176 kB de primeiro carregamento
segundo o Next). Limites do `docs/rebuild/perf-budget.md` continuam valendo.

Custos previstos e como ficam dentro do orçamento:

| Item | Custo | Limite |
|---|---|---|
| Provider | 4 `matchMedia`, 1 `ResizeObserver`, 1 `resize`, 1 callback no ticker existente | rAF ≤ 2 (não adiciona) |
| Nav | −1 `IntersectionObserver` (8 alvos), −1 `matchMedia` | |
| HUD | ≤ 2 `textContent` por tick só quando o valor muda; 1 troca de `clip-path` por nó | CLS 0 (barra fixa fora do fluxo) |
| Vídeo (Sprint 02) | 0 bytes no carregamento; ≤ 500 KB por loop sob demanda; 1 decoder ativo | vídeo 1º acesso < 3 MB |
| JS | provider + HUD ≈ 3 kB gzip estimados; motion ≈ 1,5 kB | JS inicial < 250 KB |

Medição depois de cada sprint com o mesmo `.audit/system/lh.sh <tag>`: Lighthouse mobile e
desktop, LCP, TBT, CLS, JS gzip. Se cair abaixo do orçamento, a mudança não fecha.

## Acessibilidade e reduced-motion

- HUD `aria-hidden`; sem live region nova. Contraste garantido por `mix-blend-difference`
  sobre os dois fundos do site (`#080909` e `#F2F0EA`), conferido nas duas seções.
- `data-reduce="1"` no `<html>` desliga: transição de rótulo, autoplay de vídeo, o scrub da
  escultura (já desligado por CSS). O progresso do nó continua sendo mostrado (é
  informação, não animação).
- Vídeo: `muted`, sem áudio, sem controles, nunca portador de informação exclusiva; o
  link do card continua sendo o único alvo de teclado e o `focus-visible` dispara o loop
  como o hover.
- Nada essencial em hover. A captura e a legenda do projeto continuam sempre visíveis.
- Sem WebGL: nada muda (Sprint 01 e 02 não usam GPU).

## Estratégia de rollout

- **Sprint 01 — Fundação**: registro canônico → provider e atributos em `<html>` → HUD
  desktop e mobile → estampagem em todas as páginas → nav lendo o contexto → `acts` fora.
  Sem mudança visual além da HUD e do rodapé do hero.
- **Sprint 02 — Selected Work**: folha de contato → cortes → `project-motion` → Terral e
  Vertex → medir → só então os outros quatro (Aurex e Kavita têm filme; InkVision e
  Logistics precisam de captura nova).
- Sprint 03 → Home → Case. Sprint 04 → Hero. Sprint 05 → grafo LAB ↔ cases.
- Cada sprint: commit próprio, `lint` + `build` (o typecheck do projeto é o do build),
  `.audit/system/lh.sh`, conferência desktop e mobile no navegador, `project-state.md`.

## Riscos

- **Retângulos em cache ficam velhos** se alguma seção mudar de altura sem disparar
  `refresh`/`ResizeObserver`. Mitigação: o observer do `body` pega qualquer mudança de
  altura do documento; a re-medição é barata (≤ 40 nós).
- **`html:has(dialog[open])`** não existe em navegadores antigos; degrada para a HUD
  visível sob o dialog, sem quebra.
- **View Transition da HUD**: um elemento com `view-transition-name` fora da raiz precisa
  existir nos dois lados da rota; a HUD está no layout, logo existe. Se a rota destino
  não tiver nó, a HUD mostra o raiz e a transição não trava.
- **Vídeo em Safari iOS** exige `playsinline` e `muted` no atributo, não só na propriedade;
  `preload="none"` + `play()` no IO pode precisar de `load()` explícito. Testar em aparelho.
- **Autoplay em economia de bateria** falha silenciosamente; o poster cobre.
- **Remover `acts`** toca os três dicionários e o tipo; erro de tipo aparece no build, o
  que é a proteção.
- **Chave de sincronização com o MilLead**: nenhuma fase do checklist muda de status nesta
  entrega (07 e 09 seguem `✓`); nada a espelhar.

## Critérios de aceite

1. Um único módulo define todo `MW/NNN` do site; `grep -rn "MW/0" src` só encontra o
   registro e testes. Ids contíguos de 001 em diante, na ordem da home.
2. A HUD mostra o nó correto em: abertura (001), cada um dos seis cards, capacidades, LAB,
   quebra, pessoa, feito com, contato, `/projetos/terral`, `/lab`, `/estudio`, `/contato`,
   `/projetos`, e o raiz em `/servicos`.
3. Nenhum valor exibido pela HUD é fixo: viewport, DPR, ponteiro, reduced-motion e
   progresso vêm de medição; readouts vêm do registro (fatos já publicados no site).
4. `<html>` carrega `data-reduce`, `data-pointer`, `data-bp`; a nav não tem mais observer
   próprio; nenhuma `IntersectionObserver` nova no desktop.
5. Terral e Vertex tocam no hover (desktop) e por visibilidade (mobile), um por vez, nunca
   sob `data-reduce`, com 0 bytes de vídeo antes do gesto.
6. Lighthouse mobile ≥ baseline − 2 e desktop ≥ baseline − 1; CLS = 0 adicional; JS inicial
   < 250 KB.
7. `pnpm lint` e `pnpm build` verdes; `.audit/qa-phase7.mjs` verde nas 5 transições.
8. Conferido em 1440×900 e 375×812 no navegador, e em aparelho real quando houver.

## Testes

- `scripts/system-check.mjs` (novo, Playwright): abre `/`, rola por cada `[data-node]`,
  lê o texto da HUD e compara com o `data-node` dominante; repete em `/en` e `/es`;
  verifica atributos do `<html>`; verifica que com `reducedMotion: "reduce"` a HUD não anima
  e nenhum `<video>` recebe `src`; em viewport 375×812 verifica o formato curto e a área
  segura; conta `IntersectionObserver` via `PerformanceObserver` não é possível, então
  conta pelos `data-` e pelo `getEventListeners` do CDP.
- `scripts/motion-check.mjs` (Sprint 02): hover em Terral → `video.readyState ≥ 2` e
  `!paused`; leave → `paused && currentTime === 0`; mobile: só um `!paused` por vez.
- `.audit/qa-phase7.mjs` continua sendo a regressão de navegação.
- Medição: `.audit/system/lh.sh after-s01`, `after-s02`.

## O que a implementação mudou em relação ao desenho (12/09)

Sprints 01 e 02 implementados e verificados. Três decisões mudaram durante a execução:

1. **Nó dominante por CENTRO, não por sobreposição.** O desenho dizia "maior área visível".
   Na galeria de duas colunas isso elege o card largo da esquerda mesmo quando o estreito da
   direita é o que está no meio da tela. Passou a ser a menor distância entre o centro do nó e o
   centro da viewport, entre os nós visíveis. O `system-check` cobria exatamente esse caso e
   pegou a falha em três dos seis cards.
2. **Medição adiada para depois do `load`.** Medir os retângulos durante o carregamento
   significava um reflow forçado por imagem que chegava, dentro da janela do LCP — 11 imagens na
   home. Agora nada é medido antes do `load`, e o `ResizeObserver` do corpo só age quando a
   ALTURA do documento muda de fato. Até lá o nó dominante é o raiz, que é o que abre a página.
3. **Armar e tocar viraram coisas separadas no vídeo.** A primeira versão fazia cada card
   recém-carregado chamar `play()`, então o último a carregar roubava a vez do card que estava na
   tela: no celular o Terral tocava e era pausado pelo Vertex, que estava quase fora do
   enquadramento — e os dois baixavam o arquivo. Agora só o card dominante é armado (baixa) e só
   ele toca; quem decide é o observador, nunca o efeito de carregamento.

Verificação do bundle: o registro de nós **não** chega ao navegador (nenhum chunk do cliente
contém `MW/013`, `ABERTO A PROJETOS` ou `data-node-readout`). O dicionário completo aparece num
chunk carregado por `/[lang]/error` e `/[lang]/not-found` — é pré-existente (`error.tsx` já era
`"use client"` com `getDict` antes desta entrega) e a home não carrega esse chunk.

## Revisão adversarial e correções (12–13/09)

Depois da implementação, uma revisão em seis dimensões (correção do provider, performance,
vídeo/motion, acessibilidade, dados/i18n, CSS/responsivo/transições) levantou 31 achados. Cada um
passou por três verificadores independentes tentando refutá-lo; 15 sobreviveram (dois grupos de
verificadores bateram no limite de sessão no meio do processo — os 9 dessas duas dimensões foram
reverificados manualmente, direto no código, quando a sessão voltou). Os 16 refutados não geraram
mudança. Os 18 confirmados foram todos corrigidos:

**Correção alta.** O provider mantinha um listener permanente no ticker do GSAP, o que impede
o `autoSleep` do GSAP (que dorme o loop de animação depois de ~120 quadros ociosos) de agir —
mas só em toque e movimento reduzido, exatamente as duas condições em que o `ScrollProvider`
deliberadamente NÃO liga o Lenis, para deixar o ticker dormir. Nessas duas condições agora existe
um laço próprio (`requestAnimationFrame`) que só pede quadros enquanto scroll de fato acontece e
dorme sozinho quando pára — nunca junto com o ticker do GSAP.

**Correções médias**, cada uma com o arquivo onde vive:
- `system-provider.tsx`: `compute()` lia `window.innerHeight`/`html.scrollHeight` a cada
  quadro (leitura de layout dentro do loop, contra a regra 6 do orçamento) — agora cacheados em
  `measure()`. `readViewport` recriava o objeto em todo resize mesmo sem mudança, re-renderizando
  a Nav e a HUD à toa — ganhou a mesma guarda que `read()` já tinha. `nodeProgress` nunca chegava
  a 100% no nó que termina perto do fim do documento (o déficit era do tamanho do rodapé) — o fim
  da janela de progresso agora é limitado ao alcance real de scroll.
- `system.css`: a HUD usava `mix-blend-mode: difference`, que sobre a fotografia da galeria (não
  uma cor plana) caía a até 1,2:1 de contraste — trocado por um fundo com gradiente que garante
  contraste sobre qualquer conteúdo. `html.booting .mw-hud, html.inspecting .mw-hud,
  html:has(dialog[open]) .mw-hud` era uma lista de seletores só: sem suporte a `:has()`, a regra
  inteira cairia, levando o boot e a inspeção junto — separada em duas regras, a segunda dentro de
  `@supports selector(:has(*))`. `::view-transition-old(mw-hud)` não recebia `opacity: 0` (como
  `case-media-*` já fazia) — os dois rótulos, de quem sai e de quem chega, ficavam empilhados e
  opacos por 0,7s na troca de rota.
- `home-experience.css`: `.orbital-hero__title` continuava em `bottom: 13svh` depois que
  `.orbital-hero__bottom` ganhou os 28px de folga para a HUD — a barra passou a riscar o pé da
  manchete em qualquer janela abaixo de ~854px de altura (comum em notebook com a barra do
  navegador visível). Ganhou a mesma folga. No celular, o botão "explorar" vira uma barra opaca de
  50px no rodapé do card — o vídeo não tinha essa reserva e tocava escondido atrás dela.
- `scripts/project-motion.sh`: o loop do Atelier Vertex foi cortado em 7:5, mas o card dele na
  galeria é retrato 4:5 (o 7:5 pertence ao card do Aurex, que não tem loop) — com
  `object-fit: cover`, 43% do quadro ficava fora do card. Recortado de novo em 4:5, conferido por
  folha de contato: a fachada continua centralizada e legível, só a etiqueta do canto do filme
  original sai do quadro.
- `project-motion.tsx`: `prefers-reduced-motion` só era lido na montagem — ligar a preferência no
  meio da sessão não parava um vídeo já tocando. Ganhou um listener de `change` que pausa na hora,
  mais um `display: none` em CSS como reforço.

**Correções baixas**: a direção do scroll podia ficar presa (nascia do delta bruto, não da
velocidade já com o piso aplicado, então o `<html data-scroll>` não zerava no mesmo quadro em que
a velocidade zerava); a primeira amostra de velocidade depois de qualquer pausa longa dividia por
todo o tempo ocioso em vez de um quadro (o relógio só avançava dentro de `compute()`, que fica
parado enquanto nada muda) — as duas em `system-provider.tsx`. A HUD formatava a string do
progresso a cada quadro antes de comparar se tinha mudado — agora compara o número primeiro. A
especificidade de `.t-mono` (carregada depois no `<head>`) vencia o próprio tamanho/espaçamento
da HUD, em empate de especificidade — `.mw-hud.t-mono` resolve. O indicador de ato na nav virou
uma região `aria-live="polite"` disparada a cada troca de nó no scroll (antes só mudava por rota) —
removido o `aria-live`, a HUD (`aria-hidden`) já mostra o mesmo nó. A seção do Selected Work e os
cards perderam o rótulo do modo inspeção ao trocar `data-act` por `data-node` — `data-inspect`
voltou para a seção, e cada card ganhou o seu. `SystemNode.status` era calculado e nunca lido —
removido, junto com o export não usado de `shortId`.

**Verificação final**, build de produção, máquina em silêncio (dois processos de servidor
esquecidos de passos anteriores contaminaram uma leitura no meio do caminho — derrubados antes da
medição valer):

| | mobile perf | mobile LCP | mobile TBT | desktop perf | desktop LCP | desktop TBT | CLS (desktop) |
|---|---|---|---|---|---|---|---|
| antes do MilWeb System (`c176cad`) | 75 | 3,5 s | 440 ms | 94 | 0,7 s | 20 ms | 0,016 |
| depois dos sprints 01+02 e das 18 correções | **82** | 3,6 s | **250 ms** | 93 | 0,9 s | **0 ms** | 0,029 |

Mobile subiu (o ganho esperado do ticker que agora dorme e das leituras de layout cacheadas), TBT
caiu quase pela metade nos dois lados, LCP ficou estável. O CLS de desktop em 0,029 (era 0,016
antes do redesign de 10/09) é anterior a este trabalho — já estava assim antes de qualquer sprint
do MilWeb System — e segue dentro do orçamento (< 0,1); registrado como dívida, não investigado
agora. JS inicial: 246,3 KB gzip (limite 250).

`pnpm build`, `pnpm lint` e `tsc --noEmit` verdes. `scripts/system-check.mjs`: 75 asserções,
todas passam (a HUD sem `mix-blend-mode`, com fundo em gradiente e o tamanho de fonte correto
entraram na bateria depois da correção de contraste/especificidade). `scripts/motion-check.mjs`:
13 asserções, todas passam. `.audit/qa-phase7.mjs`: OK.

## Dívidas registradas (não entram nestes sprints)

- Ponteiro: um broker para os 6 handlers de `pointermove` da home (3 leem layout dentro
  do handler) — `orbital-hero.tsx:69`, `capabilities.tsx:82`, `lab-teaser.tsx:154`.
- `document.documentElement.style.overflow` com três donos (`scroll-provider`, `nav`,
  `html.booting`).
- `sound.ts:70` registra `visibilitychange` e nunca remove; dois `SoundToggle` montados.
- `features/compiler/store.ts` recebe `compileTo` do boot e do break sem renderer montado.
- Componentes mortos: `sections/home/build-hero.tsx`, `selected-work.tsx`, `work/*`,
  `hero-world-bridge.tsx`, `features/hero-visual/*`, `features/globe/*`,
  `features/compiler/fallback.tsx`, `CASE_LABELS`, `CASE_CHAPTERS`, `SelectedWork.kind`.
  Decisão do Rick: arquivar em `archive/` fora do `src` ou apagar. Os rótulos técnicos de
  `d.work.labels` foram aproveitados como `readout` dos nós.
- Breakpoint 768 nas seções novas e no CSS da home (`home-experience.css`).
- `YEAR` só tem Kavita; os outros cinco projetos precisam de ano confirmado pelo Rick.
- Coordenada de origem do estúdio: confirmar com o Rick antes de exibir. O código usa
  −15,8 / −47,9, que é Brasília, não Minas Gerais — nenhum nó exibe coordenada hoje por isso.
- `/[lang]/error` e `/[lang]/not-found` embarcam o dicionário inteiro no cliente (pré-existente).
- `.audit/qa-phase7.mjs` está fora do controle de versão (a pasta `.audit` é ignorada) e tem a
  porta 3005 fixa. Foi preciso corrigir nele uma checagem que ainda procurava `.compiler-fallback`,
  removido no redesign de 10/09. Um script de QA que não versiona apodrece sem ninguém ver.
- Ponteiro no celular: `matchMedia("(hover: hover) and (pointer: fine)")` decide o modo do vídeo
  uma vez, na montagem. Aparelho híbrido (tablet com mouse acoplado depois) fica no modo errado
  até recarregar.
