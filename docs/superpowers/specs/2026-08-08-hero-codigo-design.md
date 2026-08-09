# Hero "uma linha vira um sistema" — design

Data: 2026-08-08 · Status: aprovado em conversa, aguardando review da spec

## Objetivo

Evoluir o hero do site da MilWeb: manter a identidade existente (16k partículas
que formam o monograma MW e morfam nas palavras dos serviços) e trocar a matéria
das partículas por **glifos de código**, com uma **linha de terminal digitada**
que "compila" cada formação. A narrativa vendida ao visitante: *uma linha de
código vira um sistema*.

Não é um redesign do hero — headline, CTAs, atmosfera (`hero-cinema`) e gates de
performance permanecem.

## Narrativa (o que o visitante vê)

1. Hero carrega; na área da cena (direita do H1), um cursor de terminal pisca e
   digita `milweb.criar("um site que vende")`, seguido de "Enter".
2. A linha estoura em ~16k glifos de código (`{ } < / > ; = ( )` e afins) que
   voam e se organizam formando **SITES**.
3. Loop: colapso → nova linha → nova forma, no ciclo:

   | Linha (PT) | Linha (EN) | Forma |
   |---|---|---|
   | `milweb.criar("um site que vende")` | `milweb.create("a website that sells")` | SITES |
   | `milweb.criar("um app sob medida")` | `milweb.create("a custom-built app")` | APPS |
   | `milweb.criar("sua presença na web")` | `milweb.create("your presence on the web")` | WEB |
   | `milweb.assinar()` | `milweb.sign()` | monograma MW |

4. **Clique em qualquer ponto do hero** antecipa o colapso: sucção
   gravitacional em espiral dos glifos de volta pra posição da linha.
5. O cursor do mouse **curva** as trajetórias dos glifos ao passar perto
   (lente gravitacional — substitui a repulsão magnética atual). Glifos
   próximos das bordas da tela se separam em RGB (aberração cromática).

## Arquitetura

### `src/components/hero-scene-canvas.tsx` (evolui)
- Partículas deixam de ser pontos e passam a **sprites de glifo** via atlas de
  textura **gerado em runtime**: um canvas 2D desenha o conjunto de caracteres
  uma única vez; cada partícula recebe UV aleatório do atlas + variação de
  tamanho. Sem asset novo no bundle.
- Shader das partículas ganha:
  - **Aberração cromática**: offset das amostras R/B proporcional à velocidade
    da partícula e à distância da borda do viewport.
  - **Lente gravitacional do cursor**: componente perpendicular adicionada à
    velocidade quando perto do ponteiro (curvar, não repelir).
  - Brilho por **blending aditivo** no próprio shader — **sem bloom pass, sem
    pós-processamento novo**.
- Máquina de estados do morph ganha fases: `typing → burst → formação →
  collapse` (o morph atual entre palavras vira caso particular:
  `collapse → typing` da próxima linha).
- No `burst`, os glifos partem da posição em tela da linha digitada
  (conversão DOM → mundo pela câmera).

### `src/components/hero-terminal.tsx` (novo)
- A linha digitada é **DOM real** (texto nítido, selecionável por leitores de
  tela, participa do i18n) posicionada na área da cena.
- Sincronização com a cena por estado compartilhado simples (ref/evento — sem
  lib de estado nova): o canvas avisa `collapse-done`, o terminal digita e
  avisa `line-executed`, o canvas dispara o burst e esconde a linha.
- Efeito de digitação com timing natural (jitter leve entre caracteres);
  respeita `prefers-reduced-motion` (linha aparece pronta, sem animação).

### `src/lib/content.ts` (evolui)
- As linhas PT/EN entram no dicionário `UI` existente, pareadas com as formas.
  A palavra formada e a linha ficam na MESMA estrutura pra não dessincronizar
  tradução de forma.

### Clique-colapso
- Listener na **seção** do hero (canvas continua `pointer-events-none`);
  cliques em `a`, `button` ou dentro deles são ignorados — CTAs intocados.

### Mobile / acessibilidade / gates
- Cena 3D continua montando só em ≥1280px + ponteiro fino + sem
  reduced-motion (decisão atual preservada).
- **Mobile ganha apenas a linha digitada em CSS** (animação de steps) como eco
  da ideia — sem canvas, sem JS de cena.
- Com `prefers-reduced-motion`: sem cena (como hoje) e linha estática.

## O que NÃO entra (decidido)

- Bloom/pós-processamento HDR — custo de GPU e risco de Lighthouse sem ganho
  proporcional; o aditivo no shader cobre o brilho.
- Substituir o hero pela galáxia do artifact "Herogalaxiamax" — a galáxia é
  genérica; o monograma que escreve os serviços é identidade da MilWeb.
- Rastros/afterimage no morph — fica pra depois se sobrar orçamento de frame.

## Performance (orçamento)

- Mesmo COUNT de partículas (16k) e mesmo pipeline de render; atlas é uma
  textura pequena gerada uma vez.
- Meta: zero regressão no Lighthouse da home (medir antes/depois, desktop e
  mobile — mobile nem monta a cena, não deve mexer).
- Peso do bundle: nenhuma dependência nova.

## Validação

1. Playwright headless: screenshots em cada fase (typing, burst, formação,
   colapso, lente no cursor) e **inspeção visual real dos prints** (regra da
   casa — nunca aprovar só por code review).
2. Lighthouse antes/depois na home.
3. Teste nos dois locales (PT/EN).
4. Após deploy, repetir a verificação visual na URL de produção.

## Entrega

Branch de feature → review final → merge na main + push (regra da casa).
Deploy do milweb é via CLI (`vercel --prod`) e **só com pedido explícito** do
Rick — push pro GitHub sempre antes.
