# MilWeb (site institucional — reconstrução "nível Awwwards" · Fase 04 concluída em 28/08/2026)

Tipo: institucional
Stack: Next.js 15, App Router, React 19, Tailwind 3.4, GSAP 3.15 (ScrollTrigger, SplitText, CustomEase), Lenis 1.3, WebGL cru (shader próprio), @vercel/analytics
Branch: `main` (rebuild/awwwards mergeada em 28/08/2026, deploy e0e7594 no ar em milweb.com.br)
Documento-base: `docs/rebuild/00-audit.md` (auditoria + direção + plano)

## Progresso
Fase 01 — Briefing              ✓  (brief completo do Rick em 28/08/2026: studio internacional, conceito "the website that builds itself")
Fase 02 — Arquitetura           ✓  (/ · /work · /work/[slug] · /lab · /studio · /services · /contact · /diagnostico · páginas SEO de serviço; /projetos → /work com 308)
Fase 03 — UX                    ✓  (home em 9 atos; HOLD TO INSPECT; Break/Rebuild; mobile com versão própria sem pin)
Fase 04 — UI                    ✓  (tokens em styles/tokens.css: paper #F2F0EA · ink #111 · signal #B7FF37 · neutral #DAD8D1; Archivo variável eixo wdth + JetBrains Mono; grid 12/8/4; zero radius/sombra/blur)
Fase 05 — Conteúdo              ◐  (Fase 03: data/case-stories.ts com Idea/Experience/Under the hood/Details/Screens dos 4 selecionados — só fatos das narrativas; os outros 20 cases usam o fallback editorial derivado; revisão final de ortografia pendente)
Fase 06 — Frontend              ✓  (404/500 novos com identidade; build verde; componentes legados removidos — mascotes, cursor, parallax, glass)
Fase 07 — Motion Design         ✓  (Fase 03: Selected Work em 4 mundos — Kavita scanner, Terral calor/grão→pontos, Vertex guias/fatias→convergência radial, Aurex anéis→desaceleração; Capabilities realinha ao grid; case com Experience sticky e Next Experience entrando por baixo; shared element home→case via View Transitions com nomes case-media/case-title-{slug})
Fase 08 — SEO On-Page           ✓  (metadata/canonical/hreflang por rota nova; sitemap com /work /studio /services /contact; JSON-LD preservado; redirects /projetos)
Fase 09 — Performance           ✓  (Fase 04, prod local: Home 98 desktop / 81 mobile; cases 100 / 85–88. Lenis sob demanda, setup no idle, sem getBBox por elemento. Ver docs/rebuild/04-report.md)
Fase 10 — Acessibilidade        ✓  (Lighthouse a11y 100 em ambos; foco visível signal; Inspect por tecla I; Break/Rebuild são botões; reduced-motion coerente em todos os atos)
Fase 11 — Analytics e conversão ◐  (track-conversions mantido; eventos reais não confirmados em produção)
Fase 12 — Segurança             ✓  (CSP estático, headers e redirects mantidos do site anterior; strict mode reativado)
Fase 13 — QA                    ◐  (Fase 04: matriz Playwright Chromium PASS 15/15, WebKit PASS 15/15 com limitação de fonte variável do build Windows; Firefox NÃO testável neste host; Safari/Firefox físicos pendentes — docs/rebuild/04-report.md)
Fase 14 — Deploy                ✓  (Vercel READY, aliases apex/www/vercel.app; redirects /projetos→/work 308 conferidos; console limpo em produção)
Fase 15 — Indexação             ◐  (sitemap novo publicado; falta reenviar no Search Console e pedir indexação de /work, /studio, /services, /contact)
Fase 16 — Entrega               ○

## Bloqueios
- Firefox: o build do Playwright não abre página neste Windows; sem Firefox físico. Safari físico também não disponível — tipografia variável precisa de olho humano lá.
- OG image dos cases não renderiza em `next dev` no Windows (bug do @vercel/og); em produção validada em 28/08 com frame real (public/og/*.png via outputFileTracingIncludes).
- Lighthouse mobile ~72: o custo é hidratação (GSAP+SplitText+Lenis no chunk da home) em CPU 4x mais lenta. Candidatos: carregar `SelectedWork`/`Capabilities`/`Break` sob `next/dynamic` após idle; subset menor do Archivo (só latin já é); avaliar `font-display: optional` no mono.
- `/diagnostico` e seus componentes (dependency-calc, google-sim, fair-price, included) só passaram por shim CSS plano — ainda têm cara do site antigo (sliders azuis, rounded). Funcionais, mas destoam.
- Vídeos `public/lab/full-*.mp4` (67 MB) continuam no repo — só carregam sob play, mas pesam no clone.

## Próxima ação
1. Fase 03 publicada e OG validada. Falta conferir a olho a transição Home→Case no Chrome (View Transitions; Firefox cai no cross-fade) e o Selected Work em trackpad/touch real.
2. Search Console: reenviar sitemap.xml, pedir indexação das rotas novas, acompanhar os 308 de /projetos.
2. Performance mobile: dynamic import dos atos abaixo da dobra + medir de novo.
3. QA Safari (iOS) e Firefox: View Transitions cai no fallback; conferir `font-stretch` no Safari e o WebGL do Lab.
4. Reskin de verdade do `/diagnostico` no sistema novo.

## Notas de N/A
- (nenhuma)
