# MilWeb — site institucional (estúdio de desenvolvimento criativo)

Tipo: institucional
Stack: Next.js 15.1 · App Router · React 19 · Tailwind 3.4 · GSAP 3.15 (ScrollTrigger, CustomEase; SplitText sob demanda) · Lenis 1.3 · WebGL cru (shaders próprios, sem three.js) · WebAudio procedural · @vercel/analytics
Branch: `main` · produção em https://milweb.com.br (Vercel)
Último deploy verificado: **30/08/2026 · `3dee38e`** — Milo Null no Hero da Home **ativo em produção** (`NEXT_PUBLIC_HERO_VISUAL=milo` em Production na Vercel; redeploy `milweb-h5xoez2tr`, aliasado em milweb.com.br)

## 30/08/2026 — MILO NULL, protótipo 01 (`/lab/milo-null`)

Personagem 3D procedural (sem modelos externos) em rota isolada de laboratório — `src/components/milo/`, três + R3F 9 + drei + zustand carregados só nessa rota (`next/dynamic`, shared bundle continua 106 kB). Pipeline real de render targets numa cena só separada por layers: grid → `sceneRT`, silhueta (normais de vista + fresnel) → `maskRT`, composite que redesenha a grid procedural nas coordenadas deslocadas dentro da máscara + wireframe fragmentado + partículas. Rig de grupos aninhados, IK analítica própria de dois ossos, idle/observe/touch/dissolve procedurais, estados via zustand + GSAP (reversíveis), 3 níveis de qualidade sobre `getQuality()`, pausa fora da aba/viewport, fallback SVG (sem WebGL / reduced-motion), debug só em dev. 61 FPS na Intel UHD em todos os estados, desktop e 390 px; `tsc`/`lint`/`build` verdes. Iteração 02 (30/08): pose em três quartos, +25 % de escala, silhueta com gola/abas assimétricas, cabeça angular, linhas estruturais por zona, distorção com 6 parâmetros (`milo.config.shader`), painel interativo, debug recolhido (tecla D). Iteração 03 (30/08): massa contínua (máscara dilatada+borrada, distorção pelo gradiente da forma), wireframe −80 % com `wireframeVisibility`, densidade/sombra interna, modos DISTORTION/WIREFRAME ONLY no debug, lime só em 4 pontos; teste definitivo (wireframe=0 → figura humana pela grid) passa. Iteração 04 (30/08): lapidação com multiplicadores regionais (região por parte no alpha da máscara: pélvis −28 % de densidade, hachura −20 % no tronco/coxas, cabeça +12 % de distorção, aba +10 %), partículas por estado (full 0,65), anti-alias das bordas por fwidth. Capturas em `scripts/.rsc-audit/milo-v7-*.png` + `milo-v7-comparison.png`. Integração experimental no Hero real (30/08, commit local): feature flag `NEXT_PUBLIC_HERO_VISUAL=compiler|milo` (padrão `compiler`, idêntico ao atual) em `src/features/hero-visual/`; `src/features/milo/hero/` monta o Milo no lugar do Compiler só na variante `milo` — réplica WebGL localizada da grid DOM (12 colunas medidas por ResizeObserver), composite transparente fora da silhueta, ponte que deriva tudo do `progress` do ScrollTrigger do BuildHero (reversível), eventos `mw:visual-assemble/ready` no Boot, fallback SVG no HTML, montagem só após interação + probe + frame medido. Validação: `node scripts/.rsc-audit/hero-milo.mjs <tag> [base]`. `/lab/milo-null` não está no sitemap; `noindex`.

**Hero v3 — aprimoramento (31/08, local, commit a seguir):** cards removidos de vez; composição reequilibrada (headline sobe, cabe em ~8,4 colunas via `.t-fit-hero` com `--chars`/`--chars-m`; Milo com 78 svh, para nas colunas 8–10; sub + CTA "VER PROJETOS ↓" PT/EN/ES no final); Milo mais presente no modo Hero (linhas/densidade/sombra/contorno +25–35 %, cabeça e tronco mais densos, onda curta localizada no contato); roteiro `HERO_SCENE` 0.15/0.45/0.55/0.60/0.76/0.78/0.90 (única fonte: labels da timeline; a ponte lê); interação = PUXADA de ~1,4 coluna (wdth 105→125, wght 700→900 sob a mão, `HEADLINE_AXES`), o Milo fica parado, mão e palavra derivam do mesmo objeto tweenado (`axes` + `onUpdate` → `--wdth` inline; gsap.set/fromTo em custom property sem unidade escrevia "0" → fonte clampava em 62 e o layout saltava — armadilha registrada); estágios com hierarquia (`is-active`/`is-past`); dica de scroll no rodapé técnico; overflow real corrigido (rótulo `.t-display-sm` em flex sem `min-w-0` no `#capabilities` → 467 px a 390) + `html, body { overflow-x: clip }` como guarda; reduced-motion = final estático com SVG entrando por CSS; tablet 768×1024 e 360×800 validados. Milo nunca deve ter `visibility < 1` depois de entrar (a ordem de dissolve começa pelas pernas). Restam: mídia do Selected Work a 360 px passa 9 px (transiente de animação, clipado, fora do Hero); mobile só emulado.

**Cena cinematográfica do Hero (31/08, local — versão anterior, arrasto de ré):** o Hero virou uma cena — o Milo entra ANDANDO pela direita (totalmente fora da tela em p=0), para, desce o braço até a extremidade de "PESSOAS.", segura e ARRASTA a palavra para a direita andando de ré enquanto a Archivo expande (wdth 62→125); impacto (recuo, impulso na grid, presença mais sólida) e composição final parada. Cards flutuantes de projetos removidos do Hero (Kavita/Terral/Vertex) com tudo que só existia por eles. Roteiro em `HERO_SCENE` (`build-hero.tsx`): design 0.08 · walkStart 0.20 · walkEnd/armStart 0.57 · contact 0.68 · pullEnd 0.84 · impactEnd 0.92 — timeline com duração exatamente 1 (labels == progresso), a ponte (`MiloHeroBridge`) lê as labels da própria timeline. Caminhada procedural por DISTÂNCIA (`animation/walk.ts`: fase = deslocamento/passo, apoio linear → sem deslizamento; passo ajustado para fechar em ciclos inteiros). Mão/palavra/corpo derivam do mesmo `--wdth` (fromTo — com `invalidateOnRefresh` o `to` relia o início como 0 e a fonte clampava em 62: a expansão "pulava"). Headline em spans por palavra (`data-word`; no mobile cada palavra é uma linha — layout estável durante a expansão), `aria-label` completo no h1; a mão ancora em `[data-headline-word=last]` medido por `Range` por frame. O canvas agora é PORTALADO para dentro da `#top` (a section pinada é `position:fixed` = contexto de empilhamento; canvas fixo fora dela ficava por cima de tudo, inclusive do SHIP). Mobile/touch: mesma cena com pin `+=220%`, canvas em qualidade `low` (política de montagem abriu para coarse). Reduced-motion: composição final estática, SVG em cena. Validação: `node scripts/.rsc-audit/hero-scene.mjs [base]` (4 viewports: sequência, reverso, FPS, overflow) + `hero-reduced.mjs` + `hero-frames.mjs`; capturas `scripts/.rsc-audit/final-*.png`, `scene-*.png`, `scene-m-*.png`. Decisão de direção: como a 2ª linha expandida ocupa ~82 % da largura, nenhum braço parado acompanha a extremidade — por isso o Milo arrasta andando de ré e termina na direita segurando o fim da frase (não "centro-direita" literal do briefing).

**Coreografia da headline (30/08, `3dee38e`, no ar — SUBSTITUÍDA pela cena acima, ainda não publicada):** o braço só trabalha durante a transformação tipográfica (wdth 62 % → 125 %) — labels `typeAnticipate`/`typeReach`/`typeContact`/`typePullEnd`/`typeRelease`/`typeSettle` na mesma timeline do BuildHero (contato→pullEnd = o tween de wdth, 0,38 + 0,18; normalizado 0,365 → 0,538). Âncora medida no DOM real (`Range` sobre `[data-headline-line=primary]`, `.right`), remedida a cada refresh/frame; `pullProgress` = `(--wdth − 62)/63` lido do `h1`. Braço em descanso em imagens/scan/ship; sem interação com cursor; tick lime na palma (`uContact`); transferência de peso no tronco. Tudo função pura do `progress` → reversível (validado: mesma posição ida/volta, 60 FPS em 1920/1440/1366). Debug dev-only na tecla **H**. Validação: `node scripts/.rsc-audit/hero-gesture.mjs [base]`; capturas `scripts/.rsc-audit/milo-type-*.png` + `milo-type-sequence.png`. **Limitação aceita:** com o Milo em cx 0,69 a ponta condensada de "CÓDIGO DEVE" fica ~300 px fora do alcance no contato; a mão aponta e só encontra a linha perto da expansão total (~110 px acima). Fechar de vez = mover/escalar o Milo ou ancorar na linha 2 — decisão pendente do Rick. Produção mostra o Milo só em ponteiro fino ≥ 720 px sem reduced-motion e com GPU aprovada; caso contrário fica o SVG (`MiloHeroFallback`). Voltar ao Compiler: `vercel env rm NEXT_PUBLIC_HERO_VISUAL production` + redeploy.

## 29/08/2026 — bug de navegação ("RSC bruto") investigado e corrigido

Relatório completo em `docs/rsc-bug-investigation.md`. Não era RSC/middleware/View Transitions: o Boot removia do DOM (`el.remove()`) um nó renderizado pelo React e a navegação seguinte saindo da Home caía em `NotFoundError: removeChild` → página de erro global do Next. Reproduzido em Chromium e WebKit, local e produção; corrigido em `boot-controller.tsx` (esconder, não remover). De carona: `ViewTransitions` sem `stopPropagation` (o cookie de idioma voltou a ser gravado) e `LanguageSwitch` com `prefetch={false}` (o prefetch de "/" seguia o redirect do cookie e prendia o clique em PT no inglês). Teste automatizado: `node scripts/rsc-navigation-audit.mjs --base http://127.0.0.1:3000` (`--only dwell` reproduz o crash antigo). Deploy `334d541` no ar e validado em produção (sondas dwell, lang-swap e cookie).

## Onde paramos (28/08/2026, fim do dia)

Quatro entregas grandes fecharam hoje, todas no ar e verificadas em produção:

1. **Fase 03/04** — Selected Work em mundos, cases cinematográficos, polimento cross-browser (`docs/rebuild/04-report.md`).
2. **Trilíngue PT/EN/ES** — rotas localizadas, dicionários tipados, 404 por idioma, SEO internacional (`docs/rebuild/05-i18n.md`).
3. **"WE COMPILE IMPOSSIBLE REALITIES"** — escultura procedural THE COMPILER, leis por mundo, transições por case, Lab com 3 experimentos, som opcional (`docs/rebuild/06-compile.md`).
4. **SplitText sob demanda** — fora do bundle inicial + correção do repouso da física do Break.

## Progresso (checklist `site-institucional`)

```
Fase 01 — Briefing              ✓  conceito "the website that builds itself" + "we compile impossible realities"
Fase 02 — Arquitetura           ✓  trilíngue por tabela (src/i18n/routing.ts); URLs antigas 308 direto; 05-i18n.md
Fase 03 — UX                    ✓  home em 9 atos; HOLD TO INSPECT; Break/Rebuild; mobile com versão própria
Fase 04 — UI                    ✓  tokens em styles/tokens.css; Archivo variável (eixo wdth) + JetBrains Mono; grid 12/8/4
Fase 05 — Conteúdo              ◐  PT/EN/ES completos e tipados; falta LEITURA HUMANA do espanhol e revisão fina de ortografia
Fase 06 — Frontend              ✓  404/500 com identidade, build verde, sem componentes legados
Fase 07 — Motion Design         ✓  escultura com 8 estados, leis por mundo, 5 transições de rota, 3 experimentos no Lab
Fase 08 — SEO On-Page           ✓  canonical/hreflang/x-default, og:locale, sitemap 111 URLs em 3 idiomas, JSON-LD inLanguage
Fase 09 — Performance           ✓  mobile 86 · desktop 96 · a11y 100 · JS inicial 246,2 KB gzip (orçamento em perf-budget.md)
Fase 10 — Acessibilidade        ✓  a11y 100; teclado, foco visível, reduced-motion, conteúdo sem canvas, controle de som com aria-pressed
Fase 11 — Analytics e conversão ◐  track-conversions instalado; eventos reais ainda não confirmados em produção
Fase 12 — Segurança             ✓  CSP estático, headers e redirects; strict mode
Fase 13 — QA                    ◐  Chromium/WebKit automatizados OK (+ auditoria de navegação/RSC 29/08: 1285 passos Chromium, 0 falhas); Safari e Firefox FÍSICOS pendentes
Fase 14 — Deploy                ✓  Vercel READY; rotas, redirects e 404 conferidos em produção
Fase 15 — Indexação             ◐  falta reenviar o sitemap trilíngue no Search Console e pedir indexação
Fase 16 — Entrega               ○  não iniciada
```

## Métricas atuais (Lighthouse 13, build de produção local, máquina sem carga)

| Página | Perf | LCP | TBT | CLS | a11y |
|---|---|---|---|---|---|
| Home mobile | **86** (83/85/90) | 2,4 s | ~350 ms | 0,08 | 100 |
| Home desktop | **96** | 0,6 s | 20 ms | 0,005 | 100 |
| Case (Kavita) mobile | **92** | 3,2 s | 150 ms | 0,035 | 100 |
| /lab mobile | **91** | 3,3 s | 140 ms | — | 100 |
| /contato mobile | **90** | 2,8 s | 240 ms | — | 100 |

JS inicial da home: **246,2 KB gzip** (limite documentado: 250).

## Como validar (scripts prontos)

```bash
pnpm build && MW_LOCAL_HTTP=1 pnpm start -p 3005   # feche navegadores antes de medir
node scripts/i18n-audit.mjs http://localhost:3005   # vazamento de idioma + SEO (114 rotas)
node scripts/i18n-visual.mjs http://localhost:3005  # 4 viewports × 3 idiomas, seletor, menu
node .audit/qa-phase7.mjs                           # transições, reduced-motion, sem WebGL, teclado
node .audit/split-test.mjs                          # headline, Break e gravidade do Lab
bash .audit/routes.sh                               # rotas 200 · legadas 308 · cookie · 404
```

Os scripts em `.audit/` são locais (ignorados pelo git); os de `scripts/` estão versionados.

## Bloqueios / armadilhas (ler antes de mexer)

- **A escultura só monta na primeira interação e só com GPU acelerada.** É decisão de performance, não bug: pagar a compilação do shader no carregamento levava o TBT mobile de 290 ms para 9.850 ms. Até lá vale a silhueta SVG. Ver `docs/rebuild/06-compile.md` §9.
- **404 por idioma**: `notFound()` sob o layout raiz dinâmico `[lang]` só manda o shell genérico, e a Vercel intercepta rewrite com status 404. Por isso a rota desconhecida é decidida no middleware → `app/not-found.tsx` lê `x-milweb-locale`. Ver `05-i18n.md`.
- **Medição de performance**: cada execução do Lighthouse deixa processos do Edge vivos; sem matá-los, a nota cai até 20 pontos. `taskkill //F //IM msedge.exe` entre execuções.
- **Firefox**: o build do Playwright não abre página neste Windows; sem Firefox físico. Safari físico também indisponível — a tipografia variável precisa de olho humano lá.
- **OG image dos cases** não renderiza em `next dev` no Windows (bug do @vercel/og); em produção está validada.
- **`/diagnostico`** e seus componentes (dependency-calc, google-sim, fair-price) ainda usam o shim CSS plano — funcionam, mas destoam do sistema novo.
- **Vídeos `public/lab/full-*.mp4` (67 MB)** continuam no repo; não entram no primeiro acesso, mas pesam no clone.
- **`pnpm build` e `next dev` não podem dividir a mesma `.next` ao mesmo tempo**: o build sobrescreve os chunks do dev server (erro "Cannot find module './vendor-chunks/gsap@3.15.0.js'"). Pare o dev, ou rode o build, e depois `rm -rf .next` + subir de novo.
- **`NEXT_PUBLIC_HERO_VISUAL` é inlined no build**: trocar a variante exige reiniciar o dev server / redeploy. Em produção está `milo`.

## Próxima ação (para amanhã, em ordem)

0. **Revisar a cena nova do Hero localmente com GPU real** (`NEXT_PUBLIC_HERO_VISUAL=milo pnpm dev`): caminhada, contato em "PESSOAS.", arrasto de ré, impacto; mobile real (o pin no mobile é novo — conferir barra de endereço/jank em iOS); depois push + redeploy. Lighthouse mobile depois do pin novo (era sem pin por custo).
1. **Olho humano em GPU real** (Chrome desktop, não headless): hero com a escultura, troca de estados nos quatro mundos, as cinco transições de rota e os três experimentos do Lab. É o único teste que ainda não foi feito de verdade — todo o QA automatizado roda em rasterização por software.
2. **Revisão humana do espanhol** (variante neutra LatAm) antes de divulgar para esse mercado.
3. **Search Console**: reenviar o sitemap trilíngue e pedir indexação das rotas novas; acompanhar os 308.
4. **Analytics**: confirmar em produção que os eventos de conversão (WhatsApp, e-mail, CTA) estão chegando — é o que falta para fechar a Fase 11.
5. **Reskin do `/diagnostico`** no sistema novo (última página com cara antiga).
6. Evoluções opcionais já mapeadas em `06-compile.md` §12: pré-aquecer o shader após a primeira interação, estender leis de mundo aos 20 cases restantes, quarto experimento no Lab.

## Notas de N/A

- (nenhuma até aqui — nenhuma fase foi dispensada)
