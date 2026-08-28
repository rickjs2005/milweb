# MilWeb — Auditoria pré-reconstrução (28/08/2026)

Objetivo: transformar "portfólio de um dev muito bom" em "creative development
studio de nível internacional". Este documento é a base de decisão da reconstrução.

---

## 1. CURRENT STATE

**Stack**: Next.js 15.1 (App Router, segmento `[lang]` pt/en via middleware rewrite),
React 19, Tailwind 3.4, GSAP 3.15 (+ScrollTrigger, SplitText, @gsap/react), Lenis 1.3,
lucide-react, Vercel Analytics/SpeedInsights. `three`/R3F/drei instalados e **não usados**
(só existem casts em `reveal.tsx` e `split-heading.tsx` por causa do augment de JSX deles).

**Rotas** (`src/app/[lang]/`): `/` (home, 12 seções), `/projetos` (acervo com filtro),
`/projetos/[slug]` (26 cases), `/lab` (6 filmes Remotion/Three), `/diagnostico` (funil
comercial), páginas SEO de serviço (`/criacao-de-sites`, `/landing-pages`,
`/catalogo-whatsapp`, `/loja-virtual`, `/sistemas-sob-medida`). OG images dinâmicas,
sitemap, robots, llms.txt, JSON-LD ProfessionalService, CSP com nonce no middleware,
headers de segurança, redirect www→apex. 404/500 com identidade.

**Conteúdo** (`src/lib/content.ts`, 2.363 linhas): fonte única bilíngue. 26 projetos com
`problem/result/stack/metric/caseStudy{narrative,highlights,gallery}`. 6 clipes do Lab.
Serviços em `services.ts`. Copy atual: "freelancer que faz seu negócio vender" —
comercial, PT-first, dirigida a pequeno empresário.

**Home hoje**: Hero (badge + headline + sub + 2 CTAs + "terminal-construtor") →
Deliverables (6 cards) → Why (8 cards) → Stats → Projects (carrossel/grid) →
DiagnosticBanner → Lab (esteira 3D CSS) → Process → Tech (marquee de logos) → FAQ →
About (card) → Contact → Footer. Mais: mascote Lula (canvas seguindo o cursor), mascote
Milo (anda entre seções com balões), cursor-glow, mouse-parallax, Konami, FAB WhatsApp,
preloader com logo, theme toggle dark/light.

**Identidade**: preto #000 + marfim + prata + "fogo" na palavra-chave (8 trocas de
paleta em um dia — ver `git log`). Bricolage Grotesque + Inter + JetBrains Mono.
Glassmorphism, cards `rounded-2xl`, grão de filme, bg-grid.

**Motion**: `Reveal` (scrub GSAP em desktop / IO em mobile) em quase toda seção;
`HeroAnim` (boot + forja com SplitText); `SplitHeading`; `Magnetic`; `TiltCard`;
`FocusCard`; `CtaGlow`; `TechMarquee`; `ProcessLine`; `LabShowcase` (belt 3D);
`ProjectsShowcase`. View Transitions API para rotas. Lenis desligado em touch.
`reactStrictMode: false` por causa de ScrollTriggers órfãos.

**Assets**: `public/shots/*.webp` (26 prints + galerias), `public/lab/*.mp4` (67 MB —
`full-unveil` 19 MB, `full-blackhole` 17 MB), `avatar.png`, `logo-mw.png`.

**Build base**: verde. Home 198 kB First Load JS, shared 106 kB. HTML da home ~318 KB
(memória: corte adiado). Performance ○, A11y ○, QA ○ no project-state.

## 2. KEEP

- Infra de rota/i18n: middleware `[lang]`, `localeFrom/makeT/withLocale`, static params.
- SEO/segurança: `sitemap.ts`, `robots.ts`, `llms.txt`, OG images, CSP com nonce,
  headers, redirects, JSON-LD, `searchDescription`.
- Dados: `content.ts` como fonte de verdade (PROJECTS, LAB, PROFILE). Terral, Atelier
  Vertex, Aurex Motors/Timepieces, Kavita, Lumen já têm narrativa técnica e galeria.
- Páginas comerciais: `/diagnostico` e as páginas de serviço + `services.ts`. Saem da
  Home; `/services` agrega e as rotas SEO continuam no ar.
- Lab: os 6 filmes (posters + versões curtas). `full-*.mp4` só em /lab sob play explícito.
- Contato: WhatsApp/e-mail funcionais, `track-conversions`.
- Lenis + ScrollTrigger sync (ticker, lagSmoothing 0, off em touch/reduced).
- 404/500 com identidade (reescritos no novo sistema).
- `analytics`, `speed-insights`, `vercel.json` (gru1).

## 3. REMOVE

- Mascotes SquidFollower (~1.100 linhas) e Milo (~600 linhas): tom "fofo" conflita com
  studio; CPU permanente na home.
- `cursor-glow`, `mouse-parallax`, `konami`, `cta-glow`, `tilt-card`, `focus-card`,
  `tech-marquee`, `lighthouse-rings`, `google-sim` (Home).
- Glassmorphism, grão, bg-grid decorativo, gradiente "fogo", hero-embers, hero-cinema,
  hero-builder (o conceito "site que se constrói" vira o Hero inteiro, não um card).
- Seções da Home: Deliverables, Why, Stats, DiagnosticBanner, Process, Tech, FAQ,
  About-card → conteúdo migra para `/services` e `/studio`.
- Theme toggle (identidade única; o Dev Mode do Inspect é a inversão).
- Preloader atual (vira o Act 01 — Boot).
- Deps: `three`, `@react-three/fiber`, `@react-three/drei` (voltam via dynamic import
  quando o WebGL entrar), `lucide-react` (ícones viram SVG inline).
- `reactStrictMode: false` → volta a `true` com `useGSAP` escopado.
- Lixo na raiz: `server.log`, `server.err.log`, `shot.mjs`, `tsconfig.*.tsbuildinfo`.

## 4. REFACTOR

- `Reveal` → primitivas com hierarquia (primary/secondary/micro) e tokens CSS↔GSAP.
- `SmoothScroll` → `ScrollProvider`: Lenis owner único do rAF, contexto, `stop/start`
  durante Boot/Break/transição de rota.
- `ViewTransitions` → nomes sistemáticos (`case-image-{slug}`, `case-title-{slug}`),
  fallback GSAP `clip-path` em Firefox.
- `Nav` → MILWEB® / WORK LAB STUDIO CONTACT + `MW / 2026`.
- `CaseStudy` → 01 Challenge · 02 Idea · 03 Experience · 04 Engineering · 05 Result ·
  06 Selected Screens. `problem`→Challenge, `narrative`→Engineering, `result`→Result;
  novos campos `idea`/`experience`/`hero` só nos 4 selected (demais herdam fallback).
- `content.ts` → dividir em `data/{brand,projects,lab,ui}.ts`.
- Lab → cada experimento assume a interface.
- Contact/Footer → viewport final.
- Tokens → `tailwind.config.ts` + `styles/tokens.css` reescritos.

## 5. NEW ARCHITECTURE

```
src/
  app/[lang]/
    page.tsx                  /
    work/page.tsx             /work
    work/[slug]/page.tsx      /work/[slug]   (308 de /projetos/*)
    lab/page.tsx              /lab
    studio/page.tsx           /studio
    services/page.tsx         /services       (+ rotas SEO antigas mantidas)
    contact/page.tsx          /contact
    diagnostico/              (mantido)
  components/ui/              Button, Eyebrow, Rule, Container, Grid, MonoLabel, Wordmark
  components/nav/             Nav, NavIndicator
  sections/home/              Boot, BuildHero, SelectedWork, Capabilities, LabTeaser,
                              BreakTheWebsite, Human, BuiltWith, ContactCta
  sections/case/              CaseHero, CaseChapter, CaseScreens, CaseNext
  features/inspect/           InspectProvider, useInspect, InspectLayer, Inspectable
  features/break/             BreakProvider, verlet physics
  features/transitions/       RouteTransition
  animations/                 gsap.ts, easings.ts, primitives
  webgl/                      Canvas (dynamic), scenes/, shaders/
  hooks/                      useLenis, useMedia, useReducedMotion
  lib/                        i18n, csp, seo, inline-scripts
  data/                       brand, projects, lab, services, ui
  styles/                     tokens.css, globals.css
```

## 6. CREATIVE DIRECTION

Conceito: **THE WEBSITE THAT BUILDS ITSELF** — STRUCTURE → DESIGN → MOTION →
INTERACTION → EXPERIENCE → SHIP.

- Papel quente `#F2F0EA` como superfície principal. Tinta `#111111`. Signal Green
  `#B7FF37` só para estado ativo, cursor de inspeção, labels técnicos e a régua de 1px.
  Neutral `#DAD8D1` para grades.
- **Dev Mode invertido**: HOLD TO INSPECT inverte para tinta `#111` com linhas verdes e
  labels mono — prancha/blueprint. O frame é reconhecível nos dois estados.
- Tipografia: **Archivo** (variável, eixo `wdth` — headlines Expanded 900, tracking
  -0.04em, line-height 0.86) + **JetBrains Mono**. Dois pesos, um mono. Sem Inter.
- Grid 12 / 8 / 4. Linhas de 1px (`Rule`) como composição. Zero radius > 2px, zero
  sombra, zero blur. Profundidade = camada de estrutura atrás do design.
- Numeração editorial: `01 / KAVITA`, `LAB / 001`, `MW / 2026`.
- Copy: `CODE SHOULD MOVE PEOPLE.` · `WE BUILD DIGITAL EXPERIENCES.` ·
  `BEHIND ALL THIS CODE IS A HUMAN.` · `HAVE SOMETHING WORTH BUILDING?`

## 7. EXPERIENCE MAP (Home)

| Ato | Seção | O que acontece | Motion |
|---|---|---|---|
| 01 BOOT | Boot | MILWEB® / CREATIVE DEVELOPMENT STUDIO / BRAZIL — 2026 + 4 linhas mono, ≤1.4 s, 1× por sessão, skippable | primary |
| 02 BUILD | BuildHero | Pin ~300vh. `<h1>MILWEB</h1>` em mono → wireframe → grid 12 → tipografia → motion → imagens dos cases → WebGL → SHIP: CODE SHOULD MOVE PEOPLE. | primary scrub |
| — | InspectHint | HOLD TO INSPECT fixo no rodapé da viewport | micro |
| 03 WORK | SelectedWork | 4 cases, 100vh cada, sticky; `01 / KAVITA — AGRICULTURE REIMAGINED.` | primary |
| — | transição | imagem A → mosaico de tiles → reorganiza em B | primary |
| 04 | Capabilities | lista editorial 01–05, hover reage na página | secondary |
| 05 LAB | LabTeaser | LAB / 001 EVENT HORIZON assume a interface | primary |
| 06 BREAK | BreakTheWebsite | DO NOT PRESS → física → YOU BROKE THE INTERNET. [REBUILD] | primary |
| 07 HUMAN | Human | tela limpa, BEHIND ALL THIS CODE IS A HUMAN. → RICK JANUARIO | primary lento |
| 08 | BuiltWith | IDEAS / CODE / MOTION / TOO MUCH COFFEE + stack mono | micro |
| 09 | ContactCta | HAVE SOMETHING WORTH BUILDING? START A PROJECT → | primary + micro |

Reduced motion: BuildHero vira 3 frames estáticos sem pin; Break vira toggle de estado;
Lab mostra poster.

## 8. TECHNICAL PLAN

- GSAP: registro único em `animations/gsap.ts`; `useGSAP` com `scope`; `gsap.matchMedia`
  para pointer/reduced/breakpoints; um ScrollTrigger por seção; refresh após fontes.
- Lenis: `ScrollProvider` único, `lenis.raf` no ticker, `stop()` em Boot/Break/rota.
  Touch e reduced: nativo.
- WebGL: `webgl/Canvas` via `next/dynamic` só nas seções que precisam; R3F
  `frameloop="demand"` fora da viewport; `dpr [1,1.5]`; sem post-processing na Home.
  Fallback: CSS tiles → imagem.
- Rotas: View Transitions API + `view-transition-name` sistemático; fallback GSAP.
- Performance: HTML Home < 120 KB (4 cases no servidor); `next/font` swap; `next/image`
  com `sizes`; vídeos só em /lab `preload="none"`; motion/WebGL após idle.
  Metas: LCP < 2.5 s (h1 texto), CLS < 0.1 (pin com altura reservada), INP < 200 ms.
- Mobile: hero sem pin; Inspect por hold de 350 ms; Break com menos corpos; sem WebGL no hero.
- A11y: reduced-motion CSS + matchMedia; foco verde; Inspect por teclado; Break/Rebuild
  como botões reais; headings por ato; `aria-hidden` nas camadas decorativas.

## 9. COMPONENT MAP

Criar: `ui/*`, `nav/*`, `sections/home/*` (9), `sections/case/*` (4),
`features/{inspect,break,transitions}`, `animations/*`, `webgl/*`, `hooks/*`, `data/*`.

Refatorar: Nav, SmoothScroll→ScrollProvider, ViewTransitions, CaseStudy, Contact/Footer,
not-found, error, opengraph-image, service-page.

Remover: SquidFollower/*, milo*, cursor-glow, mouse-parallax, konami, hero*,
deliverables, why, stats, diagnostic-banner, process*, tech*, faq (Home), about,
tilt-card, focus-card, cta-glow, lab-showcase, projects-showcase, projects,
theme-toggle, lighthouse-rings, google*.

## 10. IMPLEMENTATION ORDER

1. Branch `rebuild/awwwards`. Limpeza de deps/arquivos. Tokens + fontes + grid + tipografia.
2. Nav + layout base + 404/500. Build verde.
3. Boot (Act 01).
4. BuildHero (Act 02) — CSS/scroll primeiro, WebGL depois.
5. Inspect Mode.
6. Selected Work + transições.
7. Case study + /work.
8. Capabilities.
9. Lab teaser + /lab.
10. Break the Website.
11. Human + /studio.
12. Built With + Contact + /contact + /services.
13. Transições de rota.
14. Mobile-specific.
15. Performance, A11y, cross-browser QA, polish.
