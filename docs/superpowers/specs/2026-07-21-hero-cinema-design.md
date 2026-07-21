# Hero Cinematográfico — MilWeb

**Data:** 2026-07-21
**Status:** Aprovado pelo Rick (conversa de brainstorm)

## Objetivo

Substituir o hero atual (texto + dashboard fictício `HeroShowcase`) por um hero de
impacto cinematográfico: **uma imagem gerada no Higgsfield como fundo fullscreen**,
com motion codificado por cima (Ken Burns + parallax), mantendo Milo e os CTAs.

Motivação: o hero atual está "limpo demais"; Rick quer primeira dobra premium.

## Restrições

- **Orçamento Higgsfield: 4 créditos** (trial acaba 23/07/2026, renovação cancelada).
  Máximo de 1 geração + 1 retry. Se ambas falharem, parar e mostrar ao Rick antes
  de gastar mais.
- LCP: imagem final ≤ 250KB (AVIF). A auditoria anterior removeu imagem do hero
  por peso — não regredir além desse teto.
- Sem segunda imagem para mobile: crop central via `object-cover`.

## 1. Geração da imagem (Higgsfield)

- Consultar `models_explore(action:'recommend')` antes de gerar; escolher o modelo
  premium mais barato em créditos para foto cinematográfica 2K
  (candidatos: Seedream, Nano Banana).
- 1 geração, 16:9, 2K. Prompt art-directed:
  - Estúdio de engenharia digital escuro; bancada com telas exibindo
    código/interfaces **desfocadas** (nunca texto legível — texto de IA denuncia).
  - Luz volumétrica azul no tom do accent da MilWeb; reflexos em vidro/metal;
    névoa sutil; sem pessoas.
  - Composição com respiro no lado esquerdo (área da headline e CTAs).

## 2. Pipeline do asset

- Download → converter para **AVIF** (~150–250KB) + fallback WebP.
- Salvar em `public/` (ex.: `public/hero-cinema.avif` / `.webp`).
- Nunca servir o arquivo original sem otimização.

## 3. Código

### Novo: `src/components/hero-cinema.tsx`
- Wrapper do fundo fullscreen: `next/image` com `fill`, `object-cover`,
  `priority` (é o LCP), `sizes="100vw"`.
- **Ken Burns**: zoom lento contínuo (~20s, escala ~1.0→1.08) em CSS puro.
- **Parallax de mouse**: reaproveitar o mecanismo `data-depth` já lido pelo
  `HeroAnim` (nada de listener novo).
- **Overlay em 2 camadas**: gradiente escuro vindo da esquerda (legibilidade)
  + vinheta nas bordas.
- `bg-grid` atual vira textura sutil **por cima** da imagem (DNA visual).

### Alterado: `src/components/hero.tsx`
- Remove o uso de `HeroShowcase` (componente permanece no repo, sem uso no hero).
- Layout deixa de ser 2 colunas: conteúdo à esquerda sobre o fundo imersivo.
- Milo (`MiloLive`) continua com balão, ancorado no rodapé do hero.
- Hero **sempre dark nos dois temas**: tokens de cor fixos/locais na seção
  (imagem escura não convive com tema claro).

## 4. Erros e degradação

- Imagem falhou ao carregar → fundo atual (bg-grid + glow) permanece por baixo;
  o hero nunca quebra.
- `prefers-reduced-motion` → desliga Ken Burns e parallax.

## 5. Verificação

- `pnpm build` + typecheck sem erros.
- Screenshots desktop/mobile × light/dark via `shot.mjs` — conferir legibilidade
  do texto sobre a imagem nos 4 casos.
- Peso do asset final ≤ 250KB; conferir que a imagem é o LCP com `priority`.

## Fora de escopo

- Vídeo de fundo; imagem vertical dedicada para mobile; mudança de copy/headline;
  remoção do `HeroShowcase` do repositório (só sai do hero).
