# Hero "uma linha vira um sistema" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** As 16k partículas do hero viram glifos de código e cada formação passa a ser "compilada" por uma linha de terminal digitada em DOM, com colapso gravitacional no clique e lente gravitacional no cursor.

**Architecture:** Evolução do `hero-scene-canvas.tsx` existente (R3F + shaders GLSL custom): atlas de glifos gerado em runtime vira a textura dos pontos; a máquina de morph ganha fases `typing → burst → hold → collapse` sincronizadas com um novo componente DOM (`hero-terminal.tsx`) por um pub/sub mínimo (`hero-bus.ts`). Zero dependência nova, zero pós-processamento novo.

**Tech Stack:** Next.js (App Router) + React Three Fiber + three (shaders GLSL inline) + Tailwind. Sem lib de estado; sem bloom pass.

**Spec:** `docs/superpowers/specs/2026-08-08-hero-codigo-design.md`

## Global Constraints

- Nenhuma dependência nova no `package.json`.
- Sem pós-processamento (sem bloom/EffectComposer) — brilho só via blending aditivo já existente.
- `COUNT = 16000` inalterado; gates de montagem inalterados (≥1280px + `hover:hover` + `pointer:fine` + sem reduced-motion + probe WebGL em `hero-scene.tsx` — não tocar nesse arquivo).
- Canvas continua `pointer-events-none`; CTAs do hero continuam clicáveis.
- Linhas do terminal EXATAMENTE como na spec (PT/EN):
  1. `milweb.criar("um site que vende")` / `milweb.create("a website that sells")` → **SITES**
  2. `milweb.criar("um app sob medida")` / `milweb.create("a custom-built app")` → **APPS**
  3. `milweb.criar("sua presença na web")` / `milweb.create("your presence on the web")` → **WEB**
  4. `milweb.assinar()` / `milweb.sign()` → **monograma MW**
- Mobile: só a linha digitada em CSS/JS leve — nunca montar canvas.
- `prefers-reduced-motion`: cena não monta (já é assim) e a linha aparece completa, estática.
- Comentários em PT, no estilo do arquivo (explicam POR QUÊ, não o quê).
- Validação visual é obrigatória: olhar os screenshots do Playwright, não só o build (regra da casa).
- Repo não tem framework de teste: o ciclo de cada task é `npm run lint` + `npm run build` + verificação visual com Playwright headless (instale nada — usar `/c/Users/rickj/projetos/digudinho/node_modules/playwright` via `require()` absoluto num script de scratch).

---

### Task 0: Branch de feature

**Files:** nenhum (git apenas)

- [ ] **Step 1: Criar a branch a partir da main limpa**

```bash
cd /c/Users/rickj/projetos/milweb
git checkout main && git pull && git checkout -b hero-linha-codigo
```

- [ ] **Step 2: Sanidade — build atual passa antes de mexer**

Run: `npm run build`
Expected: build verde. Se falhar aqui, PARE — o problema não é seu.

---

### Task 1: Linhas do terminal no dicionário de conteúdo

**Files:**
- Modify: `src/lib/content.ts` (dentro de `UI.hero`, após `miloHi`, ~linha 1865)

**Interfaces:**
- Produces: `UI.hero.terminal.lines: { pt: string; en: string }[]` (4 itens, ordem = ordem do ciclo) e `UI.hero.terminal.prompt: Localized`. Tasks 4 e 5 leem daqui.

- [ ] **Step 1: Adicionar o bloco `terminal` em `UI.hero`**

Logo após a linha `miloHi: { ... },`:

```ts
    /* Linhas do terminal do hero ("uma linha vira um sistema"). A ORDEM
       importa: cada linha compila a forma correspondente do ciclo da cena
       (SITES → APPS → WEB → monograma MW). Linha e forma vivem juntas aqui
       pra tradução nunca dessincronizar da coreografia. */
    terminal: {
      prompt: { pt: "❯", en: "❯" },
      lines: [
        { pt: 'milweb.criar("um site que vende")', en: 'milweb.create("a website that sells")' },
        { pt: 'milweb.criar("um app sob medida")', en: 'milweb.create("a custom-built app")' },
        { pt: 'milweb.criar("sua presença na web")', en: 'milweb.create("your presence on the web")' },
        { pt: "milweb.assinar()", en: "milweb.sign()" },
      ] as Localized[],
    },
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npm run lint`
Expected: verde (o `as Localized[]` segue o padrão de `benefits`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/content.ts
git commit -m "feat(hero): linhas do terminal no dicionario PT/EN"
```

---

### Task 2: Bus de sincronização cena ↔ terminal

**Files:**
- Create: `src/components/hero-bus.ts`

**Interfaces:**
- Produces (Tasks 4 e 5 dependem das assinaturas EXATAS):

```ts
export type HeroBusEvents = {
  /** cena montou e está com as partículas colapsadas — terminal pode digitar a linha `index` */
  "scene-ready": { index: number };
  /** terminal terminou de digitar e "executou"; origin em NDC (-1..1) do centro da linha */
  "line-executed": { index: number; origin: { x: number; y: number } };
  /** colapso terminou — terminal deve digitar a próxima linha `index` */
  "collapse-done": { index: number };
  /** clique no hero pedindo colapso antecipado */
  "collapse-request": undefined;
};
export function on<K extends keyof HeroBusEvents>(ev: K, fn: (data: HeroBusEvents[K]) => void): () => void;
export function emit<K extends keyof HeroBusEvents>(ev: K, data: HeroBusEvents[K]): void;
```

- [ ] **Step 1: Implementar o bus**

```ts
/**
 * Pub/sub mínimo entre a cena 3D e o terminal do hero. Módulo e não Context:
 * a cena monta via dynamic ssr:false e o terminal é DOM comum — um Context
 * exigiria provider acima dos dois e re-render a cada evento; aqui nada
 * re-renderiza, os dois lados só trocam sinais imperativos por frame.
 */
export type HeroBusEvents = {
  "scene-ready": { index: number };
  "line-executed": { index: number; origin: { x: number; y: number } };
  "collapse-done": { index: number };
  "collapse-request": undefined;
};

type Handler = (data: never) => void;
const handlers = new Map<keyof HeroBusEvents, Set<Handler>>();

export function on<K extends keyof HeroBusEvents>(ev: K, fn: (data: HeroBusEvents[K]) => void): () => void {
  if (!handlers.has(ev)) handlers.set(ev, new Set());
  handlers.get(ev)!.add(fn as Handler);
  return () => handlers.get(ev)?.delete(fn as Handler);
}

export function emit<K extends keyof HeroBusEvents>(ev: K, data: HeroBusEvents[K]): void {
  handlers.get(ev)?.forEach((fn) => (fn as (d: HeroBusEvents[K]) => void)(data));
}
```

- [ ] **Step 2: Lint + commit**

```bash
npm run lint
git add src/components/hero-bus.ts
git commit -m "feat(hero): bus de sincronizacao cena-terminal"
```

---

### Task 3: Partículas viram glifos de código (atlas em runtime)

**Files:**
- Modify: `src/components/hero-scene-canvas.tsx` (função `LogoParticles`, shaders `particleVertex`/`particleFragment`, ~linhas 95-292)

**Interfaces:**
- Consumes: nada de fora — mudança interna à cena.
- Produces: shader com uniforms novos `uAtlas`, e attribute novo `aGlyph`. Comportamento do morph inalterado nesta task (a máquina de fases entra na Task 4).

- [ ] **Step 1: Gerar o atlas de glifos (acima de `LogoParticles`)**

```ts
/* Atlas de glifos: os caracteres viram UMA textura desenhada em runtime
   (nada novo no bundle). Grade 5x4 = 20 células; cada partícula sorteia uma
   célula fixa no nascimento. Glifos de sintaxe e não letras: de longe a
   forma continua lendo como massa de luz, de perto revela código. */
const GLYPHS = ["{", "}", "<", ">", "/", "(", ")", ";", "=", "+", "*", "#", "&", "$", "%", "?", "!", ":", "~", "."];
const ATLAS_COLS = 5;
const ATLAS_ROWS = 4;

function makeGlyphAtlas(): THREE.CanvasTexture {
  const cell = 64;
  const c = document.createElement("canvas");
  c.width = ATLAS_COLS * cell;
  c.height = ATLAS_ROWS * cell;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.round(cell * 0.78)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  GLYPHS.forEach((g, i) => {
    ctx.fillText(g, (i % ATLAS_COLS) * cell + cell / 2, Math.floor(i / ATLAS_COLS) * cell + cell / 2);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
```

- [ ] **Step 2: Attribute `aGlyph` + uniform `uAtlas`**

No `useMemo` de `LogoParticles` (junto de `rands`):

```ts
    const glyphs = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) glyphs[i] = (Math.random() * GLYPHS.length) | 0;
```

Retornar `glyphs` no objeto do memo. No JSX do `<bufferGeometry>`:

```tsx
        <bufferAttribute attach="attributes-aGlyph" args={[glyphs, 1]} />
```

No `useMemo` dos `uniforms`:

```ts
      uAtlas: { value: makeGlyphAtlas() },
```

- [ ] **Step 3: Vertex shader — passar o glifo e engordar o ponto**

Em `particleVertex`, adicionar `attribute float aGlyph;` e `varying float vGlyph;`, e no `main()`: `vGlyph = aGlyph;`. Trocar a linha do `gl_PointSize`:

```glsl
    // glifo é mais fino que um disco — ponto ~30% maior compensa a massa
    gl_PointSize = (39.0 * (0.45 + aRand)) / -mv.z;
```

- [ ] **Step 4: Fragment shader — amostrar o atlas no lugar do disco**

Substituir `particleFragment` inteiro por:

```glsl
  uniform float uTime;
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform sampler2D uAtlas;
  varying float vRand;
  varying float vP;
  varying float vX;
  varying float vGlyph;

  void main() {
    // célula do glifo no atlas 5x4; clamp evita sangrar na célula vizinha
    vec2 cell = vec2(mod(vGlyph, 5.0), floor(vGlyph / 5.0));
    vec2 pc = clamp(gl_PointCoord, 0.03, 0.97);
    float a = texture2D(uAtlas, (cell + pc) / vec2(5.0, 4.0)).a;
    vec3 c = mix(uColA, uColB, vRand);
    // pulso de energia varrendo a forma da esquerda pra direita
    float wave = mod(uTime * 1.6, 9.0) - 1.5;
    float pulse = exp(-pow((vX - wave) * 1.8, 2.0));
    c += vec3(0.5, 0.8, 1.0) * pulse * 0.9;
    gl_FragColor = vec4(c, a * (0.2 + 0.8 * vP) * (1.0 + pulse * 0.6));
  }
```

- [ ] **Step 5: Build + screenshot de verificação**

```bash
npm run lint && npm run build && npm run start &
```

Script de scratch (`<scratchpad>/shot-hero.js`, ajuste o scratchpad da sessão):

```js
const { chromium } = require("C:/Users/rickj/projetos/digudinho/node_modules/playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto("http://localhost:3000/pt");
  await p.waitForTimeout(6000); // montagem + dolly-in
  await p.screenshot({ path: "hero-glifos.png" });
  await b.close();
})();
```

Run: `node <scratchpad>/shot-hero.js` e **ABRIR o PNG e olhar**: as formações (MW/SITES) devem ler de longe como antes, e um `zoom` no print deve mostrar caracteres, não discos. Se os glifos estiverem de cabeça pra baixo, inverter no fragment: `pc.y = 1.0 - pc.y;` após o clamp.
Expected: forma legível + glifos visíveis de perto.

- [ ] **Step 6: Commit**

```bash
git add src/components/hero-scene-canvas.tsx
git commit -m "feat(hero): particulas viram glifos de codigo via atlas em runtime"
```

---

### Task 4: Lente gravitacional no cursor + aberração cromática

**Files:**
- Modify: `src/components/hero-scene-canvas.tsx` (shaders)

**Interfaces:**
- Consumes: shader da Task 3 (varyings `vGlyph`; sampler `uAtlas`).
- Produces: varying novo `vAber` (força da aberração 0..~0.2) usado no fragment.

- [ ] **Step 1: Vertex — trocar repulsão por lente e calcular `vAber`**

Em `particleVertex`, adicionar `varying float vAber;`. Substituir o bloco da repulsão magnética:

```glsl
    // lente gravitacional do cursor: em vez de repelir, o ponteiro CURVA as
    // trajetórias ao redor de si (componente tangencial + leve sucção),
    // como luz passando perto de massa
    vec2 d = pos.xy - uMouse;
    float dist = length(d);
    vec2 dir = d / max(dist, 0.0001);
    float infl = smoothstep(1.9, 0.0, dist);
    pos.xy += vec2(-dir.y, dir.x) * infl * 0.55 - dir * infl * 0.12;
```

Após o cálculo de `gl_Position`, antes do `gl_PointSize`:

```glsl
    // aberração cromática cresce na borda do viewport e durante a turbulência
    vec2 ndc = gl_Position.xy / gl_Position.w;
    vAber = smoothstep(0.45, 1.15, length(ndc)) * 0.14 + uTurb * 0.05;
```

- [ ] **Step 2: Fragment — separar RGB pela aberração**

Em `particleFragment`, adicionar `varying float vAber;` e substituir a amostragem única por três:

```glsl
    vec2 cell = vec2(mod(vGlyph, 5.0), floor(vGlyph / 5.0));
    vec2 grid = vec2(5.0, 4.0);
    vec2 pcG = clamp(gl_PointCoord, 0.03, 0.97);
    vec2 pcR = clamp(gl_PointCoord + vec2(vAber, 0.0), 0.03, 0.97);
    vec2 pcB = clamp(gl_PointCoord - vec2(vAber, 0.0), 0.03, 0.97);
    float sR = texture2D(uAtlas, (cell + pcR) / grid).a;
    float sG = texture2D(uAtlas, (cell + pcG) / grid).a;
    float sB = texture2D(uAtlas, (cell + pcB) / grid).a;
    vec3 c = mix(uColA, uColB, vRand);
    float wave = mod(uTime * 1.6, 9.0) - 1.5;
    float pulse = exp(-pow((vX - wave) * 1.8, 2.0));
    c += vec3(0.5, 0.8, 1.0) * pulse * 0.9;
    vec3 rgb = vec3(c.r * sR, c.g * sG, c.b * sB);
    float a = max(sR, max(sG, sB));
    gl_FragColor = vec4(rgb, a * (0.2 + 0.8 * vP) * (1.0 + pulse * 0.6));
```

(Se o Step 5 da Task 3 exigiu o flip do `pc.y`, aplicar o mesmo flip nos três `pc*`.)

- [ ] **Step 3: Build + verificação visual da lente**

Rebuild + restart do `next start`. Adicionar ao script de shot um passo com mouse:

```js
  await p.mouse.move(1150, 420);
  await p.waitForTimeout(800);
  await p.screenshot({ path: "hero-lente.png" });
```

**Olhar os prints**: perto do cursor os glifos devem ORBITAR/entortar (não abrir um buraco como antes); nas bordas do print, franja RGB visível em zoom.
Expected: curvatura visível; centro da formação sem aberração.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero-scene-canvas.tsx
git commit -m "feat(hero): lente gravitacional no cursor e aberracao cromatica"
```

---

### Task 5: Máquina de fases typing → burst → hold → collapse

**Files:**
- Modify: `src/components/hero-scene-canvas.tsx` (`LogoParticles`: timeline, uniforms, vertex shader)

**Interfaces:**
- Consumes: `on`/`emit` de `./hero-bus` (assinaturas da Task 2).
- Produces: a cena emite `scene-ready {index:0}` e `collapse-done {index}` e reage a `line-executed`/`collapse-request`. Uniforms novos: `uCollapse` (0..1), `uOrigin` (vec2, mundo).

- [ ] **Step 1: Vertex — colapso em espiral pra origem da linha**

Em `particleVertex`, adicionar uniforms/varying:

```glsl
  uniform float uCollapse;
  uniform vec2 uOrigin;
  varying float vCol;
```

No `main()`, DEPOIS do bloco do `uScatter` e ANTES da lente do cursor:

```glsl
    // colapso gravitacional: sucção em espiral pra posição da linha do
    // terminal; cada partícula gira uma quantidade própria (aRand) pra
    // parecer redemoinho e não zoom-out
    vCol = uCollapse;
    float ang = uCollapse * (5.0 + aRand * 5.0);
    vec2 rel = pos.xy - uOrigin;
    mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    pos.xy = uOrigin + mix(rel, rot * rel * (1.0 - uCollapse * 0.985), uCollapse);
    pos.z *= 1.0 - uCollapse * 0.9;
```

E encolher o ponto no fim do `main()`:

```glsl
    gl_PointSize = (39.0 * (0.45 + aRand)) / -mv.z * (1.0 - uCollapse * 0.8);
```

No fragment, adicionar `varying float vCol;` e multiplicar o alfa final por `(1.0 - vCol * 0.55)` (a massa apaga ao ser sugada; a linha DOM assume o palco).

- [ ] **Step 2: Uniforms novos no `useMemo`**

```ts
      uCollapse: { value: 1 }, // nasce colapsada: a 1ª linha digita antes do 1º burst
      uOrigin: { value: new THREE.Vector2(LOGO_X, LOGO_Y) },
```

- [ ] **Step 3: Substituir a timeline do morph pela máquina de fases**

Substituir `SHAPES`/`HOLD_M`/`HOLD_WORD`/`MORPH` e o bloco do morph dentro do `useFrame` por:

```ts
/* Ciclo narrativo: cada linha do terminal compila uma forma. Índices das
   formas nos attributes: 0 = monograma MW, 1 = SITES, 2 = APPS, 3 = WEB.
   (O alvo 4, a palavra MILWEB, saiu do ciclo: a marca agora fecha no
   monograma — manter a palavra deixaria o ciclo com 5 estados e ~30s.) */
const CYCLE = [1, 2, 3, 0];
const HOLD = 3.4;      // formação parada (com vida própria) antes de colapsar
const BURST_T = 1.0;   // colapso→forma (explosão)
const COLLAPSE_T = 0.85;
```

```ts
  const phase = useRef<{ name: "boot" | "typing" | "burst" | "hold" | "collapse"; line: number; t: number }>({
    name: "boot",
    line: 0,
    t: 0,
  });

  useEffect(() => {
    const offExec = on("line-executed", ({ index, origin }) => {
      const u = mat.current?.uniforms;
      if (!u) return;
      // origem NDC → mundo (mesma conversão do mouseWorld do canvas raiz)
      u.uOrigin.value.set(origin.x * (viewportRef.current.w / 2), origin.y * (viewportRef.current.h / 2));
      const w = u.uW.value as number[];
      w.fill(0);
      w[CYCLE[index % CYCLE.length]] = 1;
      phase.current = { name: "burst", line: index, t: 0 };
    });
    const offClick = on("collapse-request", () => {
      if (phase.current.name === "hold") phase.current = { ...phase.current, name: "collapse", t: 0 };
    });
    return () => {
      offExec();
      offClick();
    };
  }, []);
```

(`viewportRef` é o `viewport` ref que já existe no componente raiz — passar como prop pra `LogoParticles` junto com `mouse`.)

Dentro do `useFrame`, substituir o bloco "Morph em loop" por:

```ts
    const ph = phase.current;
    ph.t += dt;
    switch (ph.name) {
      case "boot":
        // espera a montagem (uProgress) terminar com tudo colapsado
        u.uCollapse.value = 1;
        if (u.uProgress.value >= 1) {
          emit("scene-ready", { index: 0 });
          phase.current = { name: "typing", line: 0, t: 0 };
        }
        break;
      case "typing":
        u.uCollapse.value = 1; // massa quieta na origem enquanto o DOM digita
        break;
      case "burst": {
        const m = Math.min(1, ph.t / BURST_T);
        const e = 1 - Math.pow(1 - m, 3);
        u.uCollapse.value = 1 - e;
        u.uTurb.value = Math.sin(m * Math.PI) * 0.9;
        if (m >= 1) phase.current = { name: "hold", line: ph.line, t: 0 };
        break;
      }
      case "hold":
        u.uTurb.value = THREE.MathUtils.lerp(u.uTurb.value, 0, 0.06);
        if (ph.t >= HOLD) phase.current = { name: "collapse", line: ph.line, t: 0 };
        break;
      case "collapse": {
        const m = Math.min(1, ph.t / COLLAPSE_T);
        u.uCollapse.value = m * m * (3 - 2 * m);
        if (m >= 1) {
          const next = (ph.line + 1) % CYCLE.length;
          emit("collapse-done", { index: next });
          phase.current = { name: "typing", line: next, t: 0 };
        }
        break;
      }
    }
```

O guard existente de `uScatter`/`uProgress` continua acima desse switch (scroll desmancha tudo como hoje — só não zerar o `uTurb` duas vezes).

- [ ] **Step 4: Limpar o alvo morto (palavra MILWEB)**

Remover `sampleWord("MILWEB", COUNT)` do memo, o attribute `aT4`, o `attribute vec3 aT4;`/termo `aT4 * uW[4]` do vertex e encolher `uW` pra `[1, 0, 0, 0]` (`uniform float uW[4];`). Isso poupa 192KB de attribute na GPU.

- [ ] **Step 5: Build (a cena ainda não anda sozinha — normal)**

Run: `npm run lint && npm run build`
Expected: verde. Em runtime a cena fica em `boot`→`typing` esperando o terminal (Task 6) — partículas colapsadas e quietas é o estado esperado AGORA.

- [ ] **Step 6: Commit**

```bash
git add src/components/hero-scene-canvas.tsx
git commit -m "feat(hero): maquina de fases typing/burst/hold/collapse via bus"
```

---

### Task 6: Componente hero-terminal (DOM) + clique-colapso

**Files:**
- Create: `src/components/hero-terminal.tsx`
- Modify: `src/components/hero.tsx` (montar o terminal dentro da seção, após `<HeroScene />`)

**Interfaces:**
- Consumes: `UI.hero.terminal` (Task 1); `on`/`emit` do bus (Task 2); eventos `scene-ready`/`collapse-done` da cena (Task 5).
- Produces: emite `line-executed {index, origin}` e `collapse-request`.

- [ ] **Step 1: Implementar `hero-terminal.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { on, emit } from "./hero-bus";
import { UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";

/**
 * A linha de terminal que "compila" cada formação da cena. É DOM de verdade
 * (nítido em qualquer DPR, legível por leitor de tela, entra no i18n) — o
 * canvas só recebe a POSIÇÃO dela via bus pra sugar/explodir os glifos dali.
 *
 * Dois modos:
 * - desktop (cena montada): dirigido pelo bus — digita quando a cena pede.
 * - mobile/sem cena: loop autônomo digita as linhas como eco da ideia.
 * - reduced-motion: primeira linha completa, estática, sem loop.
 */
const TYPE_MS_MIN = 34;
const TYPE_MS_JIT = 46;
const EXEC_PAUSE = 420; // pausa pós-linha antes do "Enter"
const MOBILE_HOLD = 2600;

export function HeroTerminal({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const lines = UI.hero.terminal.lines.map((l) => t(l));
  const [shown, setShown] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [running, setRunning] = useState(false); // true = linha "executada" (some no desktop)
  const wrap = useRef<HTMLDivElement>(null);
  const driven = useRef(false); // cena assumiu o controle?
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* Digita `text` e chama onDone ao final (jitter humano no timing). */
  const type = (text: string, onDone: () => void) => {
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) timer.current = setTimeout(tick, TYPE_MS_MIN + Math.random() * TYPE_MS_JIT);
      else timer.current = setTimeout(onDone, EXEC_PAUSE);
    };
    tick();
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(lines[0]);
      return;
    }

    const typeFor = (index: number) => {
      setLineIdx(index);
      setRunning(false);
      setShown("");
      type(lines[index % lines.length], () => {
        // centro da linha em NDC — a cena converte pra mundo
        const r = wrap.current?.getBoundingClientRect();
        const origin = r
          ? { x: ((r.left + r.width / 2) / window.innerWidth) * 2 - 1, y: -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1) }
          : { x: 0.5, y: 0.3 };
        setRunning(true);
        emit("line-executed", { index: index % lines.length, origin });
      });
    };

    const offReady = on("scene-ready", ({ index }) => {
      driven.current = true;
      typeFor(index);
    });
    const offCollapse = on("collapse-done", ({ index }) => typeFor(index));

    // fallback autônomo (mobile / cena não montou): espera 1.2s pela cena
    const auto = setTimeout(() => {
      if (driven.current) return;
      let i = 0;
      const loop = () => {
        setLineIdx(i % lines.length);
        setShown("");
        type(lines[i % lines.length], () => {
          timer.current = setTimeout(() => {
            i += 1;
            loop();
          }, MOBILE_HOLD);
        });
      };
      loop();
    }, 1200);

    return () => {
      offReady();
      offCollapse();
      clearTimeout(auto);
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  /* Clique-colapso: escuta na SEÇÃO (canvas é pointer-events-none) e ignora
     cliques em qualquer link/botão — CTAs continuam donos do clique. */
  useEffect(() => {
    const section = wrap.current?.closest("section") ?? document.getElementById("top");
    if (!section) return;
    const onClick = (e: Event) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      emit("collapse-request", undefined);
    };
    section.addEventListener("click", onClick);
    return () => section.removeEventListener("click", onClick);
  }, []);

  return (
    <div
      ref={wrap}
      data-hero
      className={`pointer-events-none z-[2] mt-8 w-fit rounded-lg border border-line/15 bg-bg/60 px-4 py-2.5 font-mono text-sm text-accent-soft backdrop-blur-sm transition-opacity duration-300 xl:absolute xl:left-[56%] xl:top-[30%] xl:mt-0 ${
        running ? "xl:opacity-0" : "opacity-100"
      }`}
    >
      <span className="mr-2 select-none text-accent" aria-hidden>
        {t(UI.hero.terminal.prompt)}
      </span>
      <span>{shown}</span>
      <span className="ml-0.5 inline-block h-[1.05em] w-[0.55ch] translate-y-[0.15em] animate-pulse bg-accent-soft/80" aria-hidden />
      <span className="sr-only">{lines[lineIdx]}</span>
    </div>
  );
}
```

- [ ] **Step 2: Montar na seção do hero**

Em `src/components/hero.tsx`: importar `import { HeroTerminal } from "./hero-terminal";` e renderizar `<HeroTerminal locale={locale} />` logo após `<HeroScene />` (irmão, dentro da seção — o posicionamento absoluto em xl usa a seção como referência; abaixo de xl ele entra no fluxo após o bloco de conteúdo: mover pra DENTRO do `container-page`, após o último CTA, se o layout brigar — decidir no visual).

- [ ] **Step 3: Build + verificação visual COMPLETA da coreografia**

Rebuild + `npm run start`. Script de shots por fase:

```js
const { chromium } = require("C:/Users/rickj/projetos/digudinho/node_modules/playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto("http://localhost:3000/pt");
  await p.waitForTimeout(3500);
  await p.screenshot({ path: "fase-1-typing.png" });   // linha digitando, massa colapsada
  await p.waitForTimeout(2500);
  await p.screenshot({ path: "fase-2-burst.png" });    // explosão formando SITES
  await p.waitForTimeout(2500);
  await p.screenshot({ path: "fase-3-hold.png" });     // SITES formado
  await p.click("body", { position: { x: 1100, y: 700 } }); // clique fora de CTA
  await p.waitForTimeout(600);
  await p.screenshot({ path: "fase-4-collapse.png" }); // sucção em espiral
  await p.waitForTimeout(2500);
  await p.screenshot({ path: "fase-5-linha2.png" });   // segunda linha digitando
  // mobile: só a linha CSS
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto("http://localhost:3000/pt");
  await m.waitForTimeout(3000);
  await m.screenshot({ path: "fase-6-mobile.png" });
  await b.close();
})();
```

**Abrir e OLHAR os 6 prints**, checando: linha legível; burst nasce DA posição da linha; SITES íntegro; espiral no colapso; segunda linha diferente da primeira; mobile mostra terminal digitando SEM canvas. Testar também `/en` (uma captura em `fase-3` basta).
Expected: coreografia completa nas capturas.

- [ ] **Step 4: Checar CTAs clicáveis**

No mesmo script (página desktop): `await p.click("text=Ver projetos")` e confirmar que navegou (`p.url()` contém `#projects` ou rolou) — o clique-colapso não pode ter roubado o clique.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero-terminal.tsx src/components/hero.tsx
git commit -m "feat(hero): terminal DOM que compila as formacoes + clique-colapso"
```

---

### Task 7: Performance e regressão

**Files:** nenhum novo (ajustes pontuais se a medição pedir)

- [ ] **Step 1: Lighthouse desktop e mobile na home**

Com `npm run start` rodando:

```bash
npx -y lighthouse http://localhost:3000/pt --preset=desktop --quiet --chrome-flags="--headless" --output=json --output-path=./lh-desktop.json
npx -y lighthouse http://localhost:3000/pt --quiet --chrome-flags="--headless" --output=json --output-path=./lh-mobile.json
node -e "for (const f of ['lh-desktop.json','lh-mobile.json']) { const r = require('./' + f).categories; console.log(f, Object.values(r).map(c => c.id + ':' + Math.round(c.score * 100)).join(' ')); }"
```

Expected: sem regressão vs main (medir na main antes se não houver número de referência). Mobile não monta cena — deve ficar idêntico a menos da linha CSS.

- [ ] **Step 2: Apagar os relatórios**

```bash
rm lh-desktop.json lh-mobile.json
```

- [ ] **Step 3: FPS de sanidade**

No DevTools do Chrome de verdade (não headless), gravar 10s de Performance na home: frames estáveis ~60fps durante burst e collapse. Se cair, o primeiro suspeito é o atlas com `LinearFilter` sem mipmap em DPR alto — subir `cell` pra 96 e conferir de novo.

- [ ] **Step 4: Commit (se houve ajuste)**

```bash
git add -A && git commit -m "perf(hero): ajustes pos-medicao"
```

---

### Task 8: Review final e entrega

- [ ] **Step 1: Diff review completo**

`git diff main...hero-linha-codigo` — reler como revisor: comentários no estilo do arquivo, nenhum `console.log`, nenhum TODO.

- [ ] **Step 2: Rick aprova o visual**

Mandar os prints das fases pro Rick (SendUserFile) e esperar aprovação explícita.

- [ ] **Step 3: Merge + push (regra da casa: branch aprovada = merge na main + push, sem menu)**

```bash
git checkout main && git merge --no-ff hero-linha-codigo -m "feat: hero 'uma linha vira um sistema'" && git push
```

- [ ] **Step 4: Deploy SÓ com pedido explícito**

`vercel --prod` NÃO roda automaticamente (regra da casa). Se o Rick pedir: push já feito → `vercel --prod` → **verificar a coreografia na URL de produção** (rodar o script de shots contra ela — regra: scrub/cena que passa local pode quebrar na CDN).
