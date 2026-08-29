# docs/rebuild — a reconstrução da MilWeb

Ordem de leitura. Cada documento é o registro de uma fase: o que foi decidido, o que custou e o
que ficou pendente. O estado vivo do projeto (progresso, bloqueios, próxima ação) fica em
`.claude/project-state.md`.

| Documento | Assunto | Data |
|---|---|---|
| [`00-audit.md`](00-audit.md) | Auditoria do site anterior, direção de arte e plano da reconstrução "nível Awwwards" | 28/08/2026 |
| [`04-report.md`](04-report.md) | Fase 04: polimento cross-browser, cases bespoke (Terral/Vertex/Aurex), performance mobile | 28/08/2026 |
| [`05-i18n.md`](05-i18n.md) | Trilíngue PT-BR/EN/ES: rotas localizadas, dicionários tipados, 404 por idioma, SEO internacional | 28/08/2026 |
| [`06-compile.md`](06-compile.md) | "WE COMPILE IMPOSSIBLE REALITIES": escultura procedural, leis por mundo, transições por case, Lab, som, e a batalha de performance | 28/08/2026 |
| [`perf-budget.md`](perf-budget.md) | Orçamento de performance: limites, como medir e as regras que os sustentam | 28/08/2026 |

## Mapa rápido do código

| Onde | O quê |
|---|---|
| `src/i18n/` | Configuração, tabela de rotas e dicionários tipados (pt/en/es) — `es` é obrigatório no tipo |
| `src/middleware.ts` | Público → interno, 308 das URLs antigas, cookie de idioma, 404 com `x-milweb-locale` |
| `src/webgl/renderer.ts` | Um canvas, um contexto, um loop — render sob demanda, Page Visibility, context loss, DPR |
| `src/webgl/compiler-frag.ts` | A escultura (SDF raymarching) + Event Horizon no mesmo programa |
| `src/features/compiler/` | Store de estados, diretor de scroll, silhueta SVG de fallback |
| `src/features/lab/` | Reality Tear, Gravity Type, Time Distortion — cada um carregado sob demanda |
| `src/features/sound/` | Síntese procedural, desligada por padrão |
| `src/lib/quality.ts` | HIGH/MEDIUM/LOW/REDUCED + os dois probes de GPU |
| `src/sections/home/world-laws.ts` | As leis de cursor/scroll de cada mundo |
| `src/lib/route-transition.ts` | Que coreografia cada destino usa (`data-vt`) |
| `scripts/i18n-audit.mjs` · `scripts/i18n-visual.mjs` | Auditoria de vazamento de idioma e QA visual/comportamental |
