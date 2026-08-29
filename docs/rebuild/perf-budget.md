# Orçamento de performance — MilWeb

Limites que valem para qualquer mudança daqui em diante. Medir sempre no **build de produção**
(`pnpm build && pnpm start`), com a máquina sem outras janelas de navegador abertas (processos de
medição anteriores distorcem o resultado em até 20 pontos).

## Limites

| Item | Limite | Onde nasce |
|---|---|---|
| Lighthouse mobile (home) | ≥ 85 | briefing |
| Lighthouse desktop (home) | ≥ 95 | briefing |
| LCP (home) | < 2,5 s | Core Web Vitals |
| CLS | < 0,1 | Core Web Vitals |
| TBT (proxy de INP) | < 400 ms mobile · < 100 ms desktop | briefing (INP < 200 ms) |
| JS inicial da home (gzip) | < 250 KB | briefing |
| Texturas iniciais | < 1,5 MB | briefing — hoje: 0 (a textura da interface é gerada em canvas) |
| Vídeo no primeiro acesso | < 3 MB | briefing — hoje: 0 (vídeo só em `/lab`, sob play) |
| Canvas WebGL simultâneos | 1 | arquitetura |
| Loops rAF simultâneos | ≤ 2 (ticker do GSAP + renderer) | arquitetura |
| Frame do shader (probe 170×100) | < 1,2 ms para HIGH · < 4 ms para rodar | `features/compiler/compiler.tsx` |

## Como medir

```bash
pnpm build && MW_LOCAL_HTTP=1 pnpm start -p 3005
# feche navegadores antes; cada execução deixa processos vivos
npx lighthouse http://localhost:3005/ --form-factor=mobile \
  --only-categories=performance,accessibility \
  --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=.audit/lh.json
node -e "const r=require('./.audit/lh.json'),a=r.audits;console.log(Math.round(r.categories.performance.score*100),a['largest-contentful-paint'].displayValue,a['total-blocking-time'].displayValue,a['cumulative-layout-shift'].displayValue)"
```

JS inicial (gzip):

```bash
for f in $(curl -s http://localhost:3005/ | grep -o '/_next/static/chunks/[^"]*\.js' | sort -u); do
  curl -s -H "Accept-Encoding: gzip" -o /dev/null -w "%{size_download}\n" "http://localhost:3005$f"
done | awk '{t+=$1} END {print t " bytes"}'
```

QA de comportamento (transições, reduced-motion, sem WebGL, teclado):

```bash
node .audit/qa-phase7.mjs      # Playwright
node scripts/i18n-audit.mjs http://localhost:3005
node scripts/i18n-visual.mjs http://localhost:3005
```

## Regras que sustentam o orçamento

1. Nada pesado no carregamento: a escultura monta na **primeira interação**.
2. Um canvas, um contexto, um loop — `webgl/renderer.ts` é o único dono do rAF de GPU.
3. Renderização sob demanda: `invalidate()` para um frame, `hold()` só enquanto há movimento visível.
4. Antes de subir a qualidade, medir: o `probeGpu()` e o probe do shader decidem, não a intuição.
5. Experimentos e módulos pesados sempre em `import()` no gesto do usuário.
6. Nenhuma leitura de layout (`getBoundingClientRect`, `getComputedStyle`) dentro de um loop.
