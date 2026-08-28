# MilWeb (site institucional — reconstrução "nível Awwwards")

Tipo: institucional
Stack: Next.js 15, App Router, React 19, Tailwind 3.4, GSAP 3.15 (ScrollTrigger, SplitText, CustomEase), Lenis 1.3, WebGL cru (shader próprio), @vercel/analytics
Branch de trabalho: `rebuild/awwwards` (main ainda tem o site antigo)
Documento-base: `docs/rebuild/00-audit.md` (auditoria + direção + plano)

## Progresso
Fase 01 — Briefing              ✓  (brief completo do Rick em 28/08/2026: studio internacional, conceito "the website that builds itself")
Fase 02 — Arquitetura           ✓  (/ · /work · /work/[slug] · /lab · /studio · /services · /contact · /diagnostico · páginas SEO de serviço; /projetos → /work com 308)
Fase 03 — UX                    ✓  (home em 9 atos; HOLD TO INSPECT; Break/Rebuild; mobile com versão própria sem pin)
Fase 04 — UI                    ✓  (tokens em styles/tokens.css: paper #F2F0EA · ink #111 · signal #B7FF37 · neutral #DAD8D1; Archivo variável eixo wdth + JetBrains Mono; grid 12/8/4; zero radius/sombra/blur)
Fase 05 — Conteúdo              ◐  (copy nova em data/brand.ts, data/work.ts, data/case-extras.ts, data/studio.ts; cases além dos 4 selecionados usam fallback Idea/Experience; revisão final de ortografia pendente)
Fase 06 — Frontend              ✓  (404/500 novos com identidade; build verde; componentes legados removidos — mascotes, cursor, parallax, glass)
Fase 07 — Motion Design         ✓  (Boot SSR em CSS; BuildHero pin+scrub; mosaico de tiles entre cases; Capabilities reativas; Lab em GLSL; Break com física verlet; primitiva Reveal secundária; View Transitions cross-fade)
Fase 08 — SEO On-Page           ✓  (metadata/canonical/hreflang por rota nova; sitemap com /work /studio /services /contact; JSON-LD preservado; redirects /projetos)
Fase 09 — Performance           ◐  (prod: desktop 96 · mobile 78 — LCP mobile ainda acima de 2,5s por hidratação em CPU throttled; TBT 370ms; ver "Próxima ação")
Fase 10 — Acessibilidade        ✓  (Lighthouse a11y 100 em ambos; foco visível signal; Inspect por tecla I; Break/Rebuild são botões; reduced-motion coerente em todos os atos)
Fase 11 — Analytics e conversão ◐  (track-conversions mantido; eventos reais não confirmados em produção)
Fase 12 — Segurança             ✓  (CSP estático, headers e redirects mantidos do site anterior; strict mode reativado)
Fase 13 — QA                    ◐  (validado em Edge/Chromium desktop 1440 e mobile 390 via scripts/shot.mjs; Safari/Firefox e tablet NÃO testados)
Fase 14 — Deploy                ○  (branch não mergeada nem publicada; produção ainda é o site antigo)
Fase 15 — Indexação             ○  (após deploy: reenviar sitemap, conferir redirects /projetos no Search Console)
Fase 16 — Entrega               ○

## Bloqueios
- Lighthouse mobile 78: o custo é hidratação (GSAP+SplitText+Lenis no chunk da home) em CPU 4x mais lenta. Candidatos: carregar `SelectedWork`/`Capabilities`/`Break` sob `next/dynamic` após idle; subset menor do Archivo (só latin já é); avaliar `font-display: optional` no mono.
- `/diagnostico` e seus componentes (dependency-calc, google-sim, fair-price, included) só passaram por shim CSS plano — ainda têm cara do site antigo (sliders azuis, rounded). Funcionais, mas destoam.
- Vídeos `public/lab/full-*.mp4` (67 MB) continuam no repo — só carregam sob play, mas pesam no clone.

## Próxima ação
1. Merge de `rebuild/awwwards` em `main` e deploy na Vercel (preview primeiro; conferir OG images, redirects e o Boot em rede real).
2. Performance mobile: dynamic import dos atos abaixo da dobra + medir de novo.
3. QA Safari (iOS) e Firefox: View Transitions cai no fallback; conferir `font-stretch` no Safari e o WebGL do Lab.
4. Reskin de verdade do `/diagnostico` no sistema novo.

## Notas de N/A
- (nenhuma)
