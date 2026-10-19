# MilWeb OS — referências, evidências e decisões

Registro da pesquisa feita em 18/10/2026 para evoluir o portfólio da MilWeb em uma experiência de sistema operacional (área de trabalho no desktop, tela inicial de telefone no celular). Cada referência traz: o que foi observado, a evidência (arquivo:linha do código clonado ou captura em runtime), a decisão de adaptação e a licença quando houve reutilização de ideia ou trecho. Nenhuma linha de código de terceiros foi copiada; os mecanismos foram recriados em TypeScript/React sobre a stack da MilWeb.

Os clones e as capturas das referências ficaram em uma pasta temporária da sessão (fora do repositório). Os caminhos citados são relativos ao clone de cada repositório.

## Estado do projeto antes de mexer (auditoria)

| Item | Encontrado |
| --- | --- |
| Remote | `https://github.com/rickjs2005/milweb.git`, branch `main`. O local estava 7 commits atrás do remoto; a branch `feat/milweb-os` nasce de `origin/main` (Next 15.5.27, notas internas já fora do repositório público). |
| Stack real | Next.js 15.5.27 (App Router), React 19.0, TypeScript 5.7, Tailwind 3.4, GSAP 3.15 + @gsap/react, Lenis 1.3, Zustand 5.0.15 (já instalado), three/R3F (só no protótipo do Lab), pnpm 10, Node 24. `motion`/framer **não** existe no projeto — não há coexistência a delimitar. |
| i18n | Trilíngue por tabela de rotas (`src/i18n/routing.ts`): `/projetos/x`, `/en/work/x`, `/es/proyectos/x`; middleware reescreve para `app/[lang]/…` e decide o 404. Preservado integralmente. |
| Conteúdo | 26 cases em `src/lib/content-projects-*.ts` (fonte única), ordem/numeração em `src/data/projects.ts`, histórias editoriais em `src/data/case-stories.ts`, seis destaques em `src/data/work.ts`. `clientWork`/`live`/`status` separam cliente, demo e estudo. Reaproveitado sem alterar. |
| Contato | `PROFILE.whatsapp`, e-mail, LinkedIn, GitHub e o compositor de mensagem (`components/quote-composer.tsx`). Reaproveitados. |
| Home anterior | Boot, hero com globo WebGL, galeria editorial, capacidades, Break, Human, Built-with e CTA (`sections/home/*`, `features/globe`, `features/compiler`). Ficou no repositório sem rota; decisão de arquivar/apagar é do Rick. |
| Site observado em 18/10 | Work, Lab, Studio, Contact, PT/EN/ES e os seis destaques (Kavita, Terral, Atelier Vertex, Aurex, Inkvision, Logistics Demo) batem com `FEATURED` no repositório. |

## A. pkowadkar.com / p-kowadkar/portfolio-template

**Licença.** Não há arquivo LICENSE; `package.json:5` declara `"license": "MIT"` e o `README.md:300` diz "Template released for public use — attribution appreciated but not required". Conteúdo pessoal (fotos, textos) é exemplo e não foi usado. Nada foi copiado; só mecanismos lidos.

**Observado no código.**
- Divisão desktop/celular em `client/src/App.tsx:10,22-36` por `useIsMobile()` (`hooks/useMobile.tsx:5-12`): `innerWidth < 768` **e** `hasTouch`; trocar de shell desmonta tudo. Latch em `lib/shellLatch.ts` evita desmontar durante uma chamada.
- WindowManager: `hooks/useWindowManager.ts` (estado React) + `lib/windowState.ts` (transformers puros, mesma referência quando nada muda). Foco = `zIndex = maxOther + 1` só se não estiver no topo (`windowState.ts:121-127`). Minimizar não desmonta: `inert` + `aria-hidden`, voo até o ícone da dock medido com `getBoundingClientRect` (`Window.tsx:50-66,117-134`, `lib/dockTarget.ts:38-67`), depois `visibility:hidden`. Maximizar é override de render (`Window.tsx:171-176`) sem apagar o frame guardado.
- Arraste com **react-rnd 10.5.2**, `dragHandleClassName="window-drag-handle"`, `bounds="parent"`; área = viewport − 28 px de menubar − 72 px de dock (`windowState.ts:66-80`); mínimo 380×300; resize desativado.
- Celular: `components/mobile/MobileShell.tsx` — `AppScreen` é um `fixed inset-0` que entra de baixo (`y:'100%'→0`, 357-369); **não há** transição a partir do retângulo do ícone. Voltar = `setActiveApp(null)` (574). Zero `pushState`/histórico (grep em `client/src`); `vercel.json:6` reescreve tudo para `index.html`.
- Conteúdo: `data/projects.ts` é compartilhado, mas os componentes existem duas vezes (`apps/` e `mobile/apps/`), com registros e ids diferentes.

**Observado em runtime (Playwright, Chromium).** Desktop 1440×900: abrir "Showcase" criou `div.react-draggable[data-window-id="projects"]` 960×600 com `translate(240px,158px)` e z 11, URL inalterada; arrastar o título +100 px → x 240→340; minimizar → `inert` + voo (`matrix(0.05…)`) + `visibility:hidden`, ícone "Showcase, minimized"; clique na dock restaurou no mesmo x. `page.goBack()` saiu do site (`about:blank`). Celular 390×844: tocar em "Finder" criou `div.fixed.inset-0.z-50` subindo de `translateY(92.7%)` para 0 em ~1 s, URL igual; Back do navegador saiu do site.

**Decisão.** Adotado: manager puro fora do React (virou store Zustand vanilla com funções puras), frame no estado com maximizar como override, minimizar sem desmontar (`inert` + invisível + geometria preservada), área útil = viewport − barra − dock, um registro só de apps para os dois shells. Rejeitado: react-rnd, framer-motion, apps duplicados por shell, ausência de URL (na MilWeb a URL identifica o app em foco e o Voltar do navegador funciona), slide de baixo (fizemos a transição a partir do retângulo do ícone).

## B. dustinbrett.com / DustinBrett/daedalOS

**Licença.** `LICENSE:1-3`: "MIT License / Copyright (c) 2025 Dustin Brett / Permission is hereby granted, free of charge…". Stack: Next 16, React 19.3, react-rnd 10.5.3, styled-components, motion.

**Observado no código.**
- Processos/janelas: `contexts/process/useProcessContextState.ts:74-92` e `functions.ts:54-96` (pid, singleton só troca a URL, janela já aberta recebe `focus()`).
- Pilha: `contexts/session/useSessionContextState.ts:61-62` (`foregroundId`, `stackOrder`); `prependToStack` (119-124). z-index derivado: `zIndex = stackOrder.length + (minimized ? 1 : -stackOrder.indexOf(id)) + 1` (`Window/useFocusable.ts:38-39`) — sem contador que cresce sem teto; minimizada fica acima de todas para a animação até a taskbar.
- Foco por `onClickCapture/onFocusCapture` → `moveToFront` (`useFocusable.ts:69-84`); `StyledWindow` é `section role="dialog" tabIndex=-1`, `inert` quando minimizada (`Window/index.tsx:37-48`).
- Limites por **rejeição** no `onDragStop` (`useRnd.ts:52-73`, buffers em `Window/functions.ts:54-76`: 150 px à esquerda, 50 à direita, 15 acima); sem `bounds` do rnd. Resize do viewport: `useDraggable.ts:50-75` re-clampa.
- Teclado: `hooks/useGlobalKeyboardShortcuts.ts` (Ctrl+Alt+F4 fecha, Ctrl+Shift+↑/↓ maximiza/minimiza, Tab preso no `[role=dialog]` ativo, `utils/keyboard.ts:204-227,272-292`).
- Taskbar: clique = minimizada→restaura, em primeiro plano→minimiza, atrás→foca (`TaskbarEntry/index.tsx:65-78`).
- Persistência: `/session.json` em IndexedDB via BrowserFS; só `windowStates` (posição, tamanho, maximizado); posição salva só entra se estiver dentro do viewport (`useDraggable.ts:41-42`); janelas abertas não são salvas.
- Pastas: `FileManager` reseta a lista ao trocar de diretório (`useFolder.ts:737-741`); Voltar/Avançar só muda a URL do processo (`hooks/useHistory.ts:13-40`); **não** preserva scroll nem seleção.

**Observado em runtime (1440×900).** "My PC" abriu `section[role=dialog]` 447×355 em (496,257), z 2; segunda janela em cascata +26 px com z 3; clicar na primeira trocou z (3/2) e sombras; minimizar → `aria-hidden`, `inert`, `opacity:0`, `scale(.7)` em direção à taskbar; clique na taskbar restaurou e focou; clique na entrada em primeiro plano minimizou; arrastar +120 px → x 496→616; arrastar até x=−300 foi rejeitado (voltou a 616), até x=−250 ficou; maximizar → `section` 1440×870 com handles ocultos; duplo clique no título restaurou; Ctrl+Alt+F4 fechou a janela em foco. Após reload nenhuma janela reabre; reabrir "My PC" veio na posição salva.

**Decisão.** Adotado: pilha `order` como fonte do z-index (posição na pilha + base), foco = mover ao fim da pilha, `inert` em janela minimizada, re-clamp no `resize` do viewport, dock que restaura/foca (sem minimizar ao clicar na focada, por pedido do brief), persistir só geometria escolhida pelo visitante e validá-la na carga. Adaptado: em vez de rejeição com buffers, clamp inteiro dentro da área útil (critério de aceite: nenhuma janela perdida). Rejeitado: sistema de arquivos, pids, emuladores, IndexedDB, atalhos globais com Ctrl+Alt (ficam setas/Shift+setas/Enter/Esc com a barra de título em foco e `/` para a busca).

## C. macos-web.app / PuruVJ/macos-web

**Licença.** `LICENSE:1-3`: "MIT License / Copyright (c) 2021 Puru Vijay…". Svelte 5 + Vite, CSS com custom properties (sem SCSS no HEAD).

**Observado no código.** Menubar 1.8 rem, `hsla(light,.3)`, blur 12 px em um `::before` fixo (`TopBar.svelte:31-58`); dock 5.2 rem com `hsla(light,.4)`, raio 1.2 rem, blur 10 px no `::before`, sombra tripla (`Dock.svelte:73-146`); magnificação por spring escrevendo **`width`** (`DockItem.svelte:1-23,49-86`); wallpaper dinâmico por hora (`wallpaper.config.ts:57-77`); janela com raio .75 rem e sombra em dois níveis (inativa `.115/.23`, ativa `.28/.56`, `Window.svelte:151-185`); semáforo com glifo só no hover (`TrafficLights.svelte`); store `apps.svelte.ts:5-57` com `active_z_index` +2 por troca e renormalização quando passa de 50 (`WindowsArea.svelte:13-30`); arraste com `@neodrag/svelte` limitado só no topo (`Window.svelte:132-138`); **minimizar e resize não implementados**; maximizar com bug de offset (`transform` × `translate` no mesmo nó).

**Observado em runtime (1440×900).** Menubar 28.8 px `rgba(255,255,255,.3)` blur 12 px; dock 83.2 px, blur 10 px, z 80; hover no ícone: `width` 57.6→113.4 px em 50 ms; Calculator 250×353.5, raio 12 px, z 2; segunda janela z 4; clicar na primeira → z 6; amarelo (minimizar) sem efeito; arraste do título +150 px via `translate`; arraste pelo corpo também moveu (o `allow` não valeu em produção); verde → 1440×872.8 com x preso em 604.5 (transborda); vermelho removeu do DOM em <120 ms.

**Decisão.** Adotado como linguagem: barra translúcida discreta, dock em vidro com borda fina e sombra, dois níveis de sombra (ativa/inativa) com aro translúcido de 1 px, glifos dos controles só no hover/foco, camadas nomeadas (wallpaper / janelas / dock / barra / busca). Adaptado: magnificação por `transform: scale` (não `width`), barra superior quase opaca **sem** blur — o blur de fundo amostra pixels além da borda e a janela encostada abaixo vazava papel para dentro da barra (bug reproduzido e corrigido na própria MilWeb). Rejeitado: `transition` global em `*`, posicionar por `width`, `transform` e `translate` em disputa, ícones raster estilo Apple, cores do semáforo da Apple.

## D. xiaopeng-ye/macos-portfolio

**Licença.** Não há arquivo LICENSE; só `package.json:8` declara MIT. Tratado como "aprender com", sem copiar trechos.

**Observado.** `store/window.ts:6-45` (Zustand 5 + immer): `windows: Record<key,{isOpen,zIndex,data}>` + `nextZIndex` sem normalizar e sem `activeId`; `hoc/WindowWrapper.tsx` anima abertura com GSAP (`scale .8→1, y 40→0`), `Draggable.create` sem handle nem bounds, `display` alternado em `useLayoutEffect`; dock fecha o app ao clicar se já aberto (`Dock.tsx:63-78`); magnificação GSAP por mousemove sem `overwrite`; `#safari`/`#photos` recebem `translate` em CSS e `transform` do GSAP no mesmo nó. TypeScript `strict`, mas `windows[windowKey]` desestruturado sem checar `undefined`, `useWindowStore()` sem selector (re-render global), z-index ≥ 1001 cobre a dock.

**Decisão.** Só a ideia de `Record<id, estado>` por janela. Rejeitado: contador infinito, fechar pela dock, GSAP e CSS tocando a mesma propriedade, Draggable sem handle.

## E. bokuweb/react-rnd

**Ficha (npm view, 18/10/2026).** 10.5.3, modificado 2026-03-10, peer `react/react-dom >=16.3.0`, dependências `re-resizable ^6.11.2`, `react-draggable ^4.5.0`, `tslib`; 86,9 kB unpacked (~22,7 kB gzip somando as três libs). API: `dragHandleClassName`, `cancel`, `bounds: 'parent'|'window'|'body'|seletor`, `enableResizing`, `minWidth/minHeight`, `onDragStop(e,{x,y,…})`, `onResizeStop(e,dir,ref,delta,pos)`; sem teclado nem ARIA. React 19: peer aceita e o daedalOS roda em 19.3, mas `react-draggable` usa `findDOMNode` (issue #771 aberta; react-rnd #984 "process is not defined" com React 19.2, #978 `deltaX/deltaY` zerados).

**Decisão: não usar.** O WindowManager custom tem ~150 linhas de Pointer Events (`setPointerCapture`, `requestAnimationFrame`, variáveis CSS escritas durante o gesto, commit no store ao soltar), três alças de redimensionamento, teclado (setas movem, Shift+setas redimensionam, Enter maximiza, Esc fecha), toque unificado (`touch-action: none`) e zero dependências. Foco, ordem, rotas e acessibilidade eram responsabilidade da aplicação de qualquer forma.

## REA (rea.tools)

Não estava disponível nesta sessão: nenhuma ferramenta `list_browser_targets`, `inspect_web_page`, `analyze_web_bundle` ou `observe_web_session` apareceu no ambiente. `npm view rea-agents` confirma o pacote `rea-agents@6.7.0` ("Reverse engineer anything from your terminal or agent with one CLI and MCP server", repositório morluto/rea). Para habilitar: o Rick precisa rodar `npx rea-agents setup` no terminal (o comando registra o servidor MCP na configuração do Claude Code) e reiniciar a sessão — ferramentas MCP não entram em uma sessão já aberta. **REA não foi executado.** As quatro perguntas de comportamento em execução foram respondidas com leitura de código + Playwright/Chromium (DOM, `getComputedStyle`, bounding boxes, URL e histórico), como registrado acima. O que ficou marcado como inferência: a transição do celular do template A (lida no código, medida só por `translateY`), a ausência de animação de fechar no C (transição local do Svelte não disparou) e a cascata de posição do B após reload (bbox capturada em meio à animação).

### As quatro perguntas (síntese)

| Pergunta | Observação comprovada | Adaptação na MilWeb |
| --- | --- | --- |
| Janela abre / foca / minimiza / restaura | A: `inert` + voo + `visibility:hidden`, frame preservado. B: z pela pilha, `prependToStack`, janela minimizada acima para animar. C: contador +2 renormalizado; minimizar inexistente. | `store.ts`: `order` é a pilha; `open/focus/minimize/restore/toggleMax/close`; minimizada = `inert` + invisível com transição até o item da dock; `pendingFocus` leva o foco de teclado à janela aberta pelo visitante; fechar devolve o foco ao controle que abriu. |
| Pasta mostra projetos e mantém contexto ao voltar | B: Voltar só muda a URL; scroll e seleção zeram. A: não há histórico. | `Projetos` é um app com grade + filtros; a posição de rolagem da raiz fica no store (`setScroll`) e volta ao sair do case; o case aberto fica marcado (`data-current`). |
| Tela do celular abre do ícone e volta ao início | A: slide de baixo, Voltar sem histórico. | `open(id, {origin})` guarda o retângulo do ícone; a tela anima de `translate(ox,oy) scale(sx,sy)` até ocupar a área útil (`os-from-icon`); cabeçalho com Voltar (rota pai) e Início; Voltar do navegador funciona porque a URL é a fonte do app em foco. |
| Navegação coerente ao redimensionar / Voltar | A: trocar de shell desmonta tudo. B: re-clamp no resize. | Um DOM só com dois layouts por media query (mesma regra no CSS e no JS); `setArea` re-clampa toda janela; o case segue a URL, então trocar de modo preserva o conteúdo e descarta só as coordenadas. |

## Decisões de arquitetura na MilWeb

- `features/os/registry.ts` — AppRegistry (ids, rotas internas, geometria, onde cada app aparece, `parseRoute`, `MOBILE_SHELL_MQ`).
- `features/os/store.ts` — WindowManager (Zustand vanilla, criado por shell, nasce da rota: SSR e cliente iguais; preferências e geometria salvas entram depois da hidratação, validadas).
- `features/os/os-shell.tsx` — DesktopShell + MobileShell no mesmo DOM; URL ↔ janela nas duas direções com guarda contra eco; modo simples; `/` abre a busca.
- `features/os/window.tsx` — janela: arraste, alças, teclado, `inert`, transição do ícone, foco.
- `features/os/apps/*` — Projetos, Estúdio, Lab, Serviços, Contato, Ajustes, Busca, caso remoto (Destaques saiu na revisão 2, abaixo).
- `features/os/payload.ts` (servidor) — carga leve por idioma; `features/os/project-data.ts` + `/api/os/project/[lang]/[slug]` — dados do case (JSON estático gerado no build) para a janela sem foco; `project-detail-view.tsx` — a mesma view na página canônica e no JSON.
- Rotas canônicas preservadas (`/projetos/x`, `/en/work/x`, `/es/proyectos/x`, serviços, diagnóstico), metadata, canonical, hreflang, sitemap, robots, JSON-LD e analytics (`TrackConversions`) intactos. Protótipos do Lab (`/lab/milo-null`) e erros ficam fora do OS, com a navegação clássica.
- Animação: só CSS no sistema (transições/keyframes); GSAP continua nos componentes de conteúdo que já o usavam (`TerralHold`, `Reveal` com `scroller` apontando para o corpo da janela). Lenis não liga no OS (`<html data-os>`). `prefers-reduced-motion` e o ajuste "Reduzir" desligam tudo.
- Por que `children` não é cacheado: no App Router, `children` do layout é um slot do roteador, não um elemento estático — renderizá-lo de novo mostra a rota atual (reproduzido: ao focar o Estúdio a janela de Projetos esvaziava). Daí o JSON estático do case.

## Verificações

- `tsc --noEmit` e `eslint` limpos; `pnpm build` (lint + build, como o CI) — ver `project-state.md`.
- `scripts/os-check.mjs` (Playwright/Chromium): 103 verificações — desktop 1440×900 (abrir, focar, pilha, minimizar/restaurar, arraste com clamp, teclado, maximizar, alça, case na janela, cache remoto, Esc, atalho, busca, contato, reload, página de serviço, EN), celular 360/390/430 (tela inicial, toque, Voltar do app e do navegador, Início, contato, ES, alvos ≥ 44 px, sem rolagem horizontal), redimensionamento 1440→390→1920→844×390→768×1024, modo simples. Emulação de navegador, não aparelho físico.
- Sem erros de console nem de hidratação nos fluxos cobertos.

## Revisão 2 (18/10/2026) — entrada limpa e globo

Pedido: raiz sem janela automática, sem Destaques, sem atalhos de case, sem widget no celular; a escultura orbital dá lugar a um globo terrestre em grafite; desktop recomposto (coluna de apps à esquerda, globo no centro/direita, assinatura pequena, dock compacta); celular como tela inicial de iPhone.

### O que mudou na origem (não em CSS)

- `registry.ts`: o app `home` deixou de existir. `parseRoute("/")` devolve `{ app: null, kind: "desktop" }` — a raiz é a área de trabalho, não a rota de um app. `SHORTCUT_SLUGS`, `payload.shortcuts` e `payload.featured` saíram; `ICON_ORDER` = Projetos, Estúdio, Lab, Serviços, Contato (Ajustes só na dock e na grade do celular).
- `store.ts`: a loja nasce sem janela na raiz; nova ação `blur()` (nenhum app em primeiro plano, janelas ficam onde estão). `close()` devolve a rota da janela à raiz do app — fechar Projetos num case e reabrir pelo ícone mostra a pasta, não o último case.
- `os-shell.tsx`: rota → store aplica `blur` na raiz (Voltar do navegador, Início do celular, marca da barra); a URL continua sendo a fonte do app em foco.
- `window.tsx`: sem casos especiais de `home`; `data-screen` = janela em foco.
- `apps/highlights.tsx` removido; `app-content.tsx`, `simple-shell.tsx` (raiz do modo simples = lema + mensagem + coleção) e os três dicionários (`os.apps.home`, `os.home.*`, `os.mobile.widget` removidos; `os.sign.{craft,origin,motto}` adicionados) acompanham.
- Elementos retirados não existem mais no DOM — nada fica recebendo foco invisível (conferido pela suíte: `#os-icon-home`, `[data-shortcut]`, `.os-highlights`, `.os-home__widget` = 0).

### Globo (`features/os/globe/`)

- **Reaproveitado** do globo do Hero antigo: o renderer WebGL 1 compartilhado (`webgl/renderer.ts`: um quad, loop só com `hold`, pausa em `visibilitychange`, perda de contexto tratada) e a máscara de terra em polígonos (`webgl/earth-mask.ts`, agora com `scale` para 512×256). **Não reaproveitado**: a lógica de letra "O", migração, saída e scroll (`globe-store`, `orb-metrics`, `GLOBE_LIFE` com arcos e pontos viajantes) — nada disso entra no bundle do OS.
- `globe-frag.ts` é um shader novo derivado do anterior: esfera analítica, continentes cheios (não pontilhado), relevo pelas costas (gradiente da máscara perturbando a normal), luz lateral macia com brilho acetinado largo, limbo claro do lado da luz, graticule a 3 %, um ponto lima no Brasil com anel fino e pulso lento (`uLive`), sombra de contato curta. Sem arcos, partículas, estrelas ou bloom.
- `os-globe.tsx`: camada visual pura (`pointer-events: none`, `aria-hidden`). O HTML entrega a **imagem** (`public/art/globe-still.webp` 1600 px / 85 KB e `-800` / 34 KB), gerada pelo mesmo shader na pose de repouso por `scripts/globe-still.mjs` (Playwright + SwiftShader; rodar de novo quando shader, máscara ou config mudarem). No desktop, com movimento permitido e GPU aprovada por sonda (frame real em buffer 0,12× medido com `gl.finish`, teto 4 ms), o canvas monta em idle e entra por crossfade; gira a 0,03 rad/s (uma volta em ~3,5 min, sentido leste), segue o cursor com inércia (yaw ±0,3 / pitch ±0,1 rad), para com a aba oculta e quando uma janela maximizada o cobre (`store.subscribe` solta o `hold`), e volta para a imagem com `prefers-reduced-motion` ou Ajustes › Reduzir. No celular nunca monta WebGL (só a imagem — fluidez no iPhone 11).
- A escultura orbital saiu do OS (preload, `.os-wallpaper__art`, grade, linhas, manchete gigante). O arquivo `public/art/orbital-sculpture-v2.webp` continua no repositório porque a home antiga (`sections/home/orbital-hero.tsx`, sem rota) ainda o referencia.
- Chunks: o shader fica num chunk preguiçoso de 4,8 KB; a raiz não o baixa até o canvas montar.

### Composição

- Desktop: barra superior (marca, app em foco, busca, idiomas, hora); coluna à esquerda (5 apps × 90 px; quebra em duas colunas abaixo de ~700 px de altura); globo `min(60vh, 44vw)` em 63 % / 47 %; assinatura no canto inferior esquerdo — lema "Códigos movem o mundo." como `h1` da raiz (fora dela, parágrafo) e a linha `MILWEB® · Desenvolvimento criativo · Brasil → Mundo` com o destino em lima (no tema papel, em tinta); dock compacta (ícones 40 px). Fundo: grafite com uma claridade radial atrás do globo e uma vinheta embaixo.
- Ícones: placa grafite fosca com borda fina, sem brilho nem relevo; traço 1,5 px; um acento lima por app; estados hover/active/focus na placa.
- Celular: cabeçalho (marca + busca + navegação simples, 44 px), globo `min(66vw, 38svh)` (viewport pequena: cabe com as barras do Safari à vista), assinatura centrada, grade 4 colunas (56 px), dock fixa Projetos/Estúdio/Lab/Contato. Paisagem (≤ 499 px de altura): grade em duas colunas à esquerda, globo à direita. Safe areas nos quatro lados, `100dvh`, alvos ≥ 44 px, sem arrasto.
- Armadilhas encontradas: (1) o wallpaper `position: fixed` do celular pintava por cima do conteúdo estático (rótulos e assinatura sumiam) — `z-index: -1` dentro do contexto da área de trabalho; (2) o bloco "tablet" (`min-width: 720px`) pegava o telefone deitado e empurrava o globo para fora — ganhou `and (min-height: 500px)`.

### REA

Não foi usado: nenhuma dúvida concreta sobre interação de referência surgiu nesta revisão (o comportamento pedido — nada abrir na raiz, pasta → case — já estava observado nas referências A e B na primeira rodada).

### Verificações (revisão 2)

- `tsc --noEmit`, `eslint` (só o aviso pré-existente do `<img>` em `opengraph-image.tsx`) e `pnpm build` (204 páginas) verdes.
- `scripts/os-check.mjs`: **128/128** no dev e no build de produção. Novos: raiz sem janela e sem foco; sem Destaques/atalhos; coluna de apps na ordem pedida; `h1` = lema; globo como imagem, `pointer-events: none`, sem a escultura; sem sobreposição entre globo, assinatura, apps e dock (desktop e 360/390/430); Voltar do navegador para a raiz tira o foco e Avançar refoca; pasta → card → case em duas ações; `prefers-reduced-motion` e Ajustes › Reduzir mantêm a imagem (sem `__mwOsGlobe`); celular: grade com rótulos legíveis, dock com os quatro apps, tela inicial cabe sem rolar, sem WebGL.
- Canvas vivo conferido num Chrome real com GPU (extensão): `data-state="live"`, frames avançando, `held` = false com janela maximizada e true ao restaurar/minimizar/fechar. A taxa de quadros real **não foi medida** (a janela da extensão fica em segundo plano e o Chrome estrangula o rAF a ~1,5 Hz ali).
- `scripts/i18n-audit.mjs`: 117 rotas; as mesmas 2 ocorrências pré-existentes no Logistics Demo (conteúdo).
- Capturas (emulação Playwright, build de produção) em `.audit/os-rev/review/`: 1024, 1440, 1920, 768, 1440 com Projetos, 1440 com case, reduced motion, papel; 360, 390, 430, 390 com Projetos, 844×390.
- Limitações: emulação de navegador, não aparelho físico (Safari iOS, teclado virtual, `svh` real, gestos de borda); fps do globo não medido; Lighthouse não rodado.

## Revisão 3 (18/10/2026) — o olho (Six Eyes) no lugar do globo

Pedido: trocar o globo do wallpaper por uma representação sofisticada do olho de Satoru Gojo (Six Eyes): íris azul-clara detalhada, camadas e padrões radiais, profundidade e refração, pálpebras orgânicas, olho vivo; piscar ao clicar/tocar (fecha, pausa, reabre com brilho), sem bloquear cliques nos apps; desktop e celular; reduced motion; fallback sem WebGL; sem dependência nova.

### Escolha técnica

- **2.5D em fragment shader**, sobre o renderer WebGL 1 já existente (`webgl/renderer.ts`) — o mesmo caminho do globo. R3F/three estão no projeto só para `/lab/milo-null` e trariam ~150 KB ao OS para desenhar um objeto que um shader analítico resolve com mais controle de direção (íris procedural, refração, pálpebras por curvas). GSAP ficou de fora da pálpebra de propósito: a timeline do piscar são três fases com easing próprio (~40 linhas), e carregar o GSAP na raiz só para isso custaria mais do que entrega.
- `features/os/eye/eye-frag.ts`: globo ocular = esfera analítica; íris = disco côncavo atrás da córnea alcançado por **refração** do raio de visão (profundidade e paralaxe reais quando o olhar muda); íris procedural (gradiente azul-gelo → azul fundo, três anéis concêntricos, fibras radiais em ruído, facetas, colarete, anel limbar azul-marinho, pupila pequena que respira); esclera fria sombreada pelas pálpebras com sombra curta no limbo; reflexos de córnea (janela, ponto, specular) e linha úmida na pálpebra inferior; pálpebras = duas curvas (olho alongado, canto externo mais alto) com pele grafite que esmaece para o wallpaper, vinco e cílios com ponta erguida; brilho ciano só na reabertura (`uGlow`), bloom contido; grão fino contra banding.
- `features/os/eye/os-eye.tsx`: imagem estática no HTML (`public/art/eye-still.webp` 1600×800 / 121 KB e `eye-still-mobile.webp` 1040×800 / 60 KB, geradas pelo mesmo shader por `scripts/eye-still.mjs`, que também exporta quadros de revisão com `--blink`/`--glow`); canvas monta em idle após sonda de GPU (frame real a 0,12× medido com `gl.finish`, teto 5 ms), crossfade, 30–40 fps, DPR ≤ 1,5 (desktop) / 1,25 (celular); olhar segue o cursor com inércia ou deriva devagar no toque; piscadas espontâneas a cada 6–11 s; **piscar ao clicar**: `pointerdown` na captura, passivo, em qualquer lugar da página — fecha 140 ms (ease in-out), segura 70 ms, reabre 400 ms (ease out) com brilho e dilatação decaindo; novo clique durante a reabertura fecha de novo a partir da pálpebra atual. Para com aba oculta (renderer), janela maximizada (desktop) e tela aberta (celular). `prefers-reduced-motion` ou Ajustes › Reduzir = imagem, sem canvas.
- Enquadramento: desktop 2:1 centrado (`min(60vw, 112vh)`), olho inteiro com margem; celular 1,3:1 sangrando até as bordas com o olho maior que o quadro (close-up: cantos saem, íris inteira), limitado por `40svh`; paisagem em coluna à direita. O esmaecimento lateral pelo quadro é um uniform (`uEdge`) porque o corte do celular precisa ser mais largo que o do desktop.
- Removidos: `features/os/globe/*`, `scripts/globe-still.mjs`, `public/art/globe-still*.webp`. O globo do Hero antigo (`features/globe`, `webgl/earth-mask.ts`) fica — a home antiga sem rota ainda o usa.

### Verificações (revisão 3)

- `tsc`, `eslint` (só o aviso antigo do OG image) e `pnpm build` (204 páginas) verdes; o shader fica num chunk preguiçoso de 8,5 KB.
- `scripts/os-check.mjs`: **130/130** no dev e no build de produção (os checks do wallpaper passaram a olhar `.os-eye`).
- Chromium **visível com GPU** (Playwright headed, `blink-check`): canvas vivo a 30 fps no desktop (DPR 1,5) e no celular emulado (DPR 1,15); clique fecha em ~200 ms e reabre por completo em ~750 ms; toque pisca; cliques repetidos não travam o estado; `held` cai com janela maximizada e com tela aberta no celular; zero erros de console. Quadros do piscar em `.audit/eye-review/`.
- `i18n-audit`: 117 rotas, as mesmas 2 ocorrências antigas.
- Limitações: Safari iOS e aparelho físico não testados; fps em aparelho intermediário real não medido (a sonda de GPU e o teto de DPR são a proteção); Lighthouse não rodado.

## Revisão 4 (18/10/2026) — controles de janela

Pedido: as janelas se sobrepõem e "não consigo fechá-las"; os três círculos no canto da janela não dizem o que fazem. Transformar em controles reais à la macOS (vermelho fecha, amarelo minimiza, verde maximiza/restaura, símbolo no hover; mouse, teclado e toque), fechar só a janela escolhida com saída curta e Esc, minimizar sem destruir estado e restaurar pela dock, maximizar na área útil e restaurar a geometria, gerenciador consistente (frente ao clicar, sem duplicar, dock indica abertos, fechar todas = só o wallpaper, nada inacessível), celular com Início e Fechar visíveis, animações no sistema existente com reduced motion, nove fluxos testados; commit `fix: implement functional window controls in MilWeb OS` na mesma branch.

### O que estava acontecendo

- Os três controles já existiam e estavam ligados ao store (fechar, minimizar, maximizar), mas eram três círculos cinza iguais de 12 px, sem cor e sem símbolo até o hover — não se leem como controles, e numa janela de trás ficam ainda mais anônimos.
- Dois bugs reais apareceram na investigação:
  1. **Hold to Inspect engolindo o clique seguinte** (`features/inspect/inspect-provider.tsx`). Quando o hold dispara (260 ms no mouse, 380 ms no toque) a marca `swallowClick` fica armada e só desarma no `click` seguinte. Um hold que termina **sem** click — rolagem no toque (`pointercancel`), janela que perdeu o foco, soltar fora da aba — deixava a marca armada, e o próximo clique em qualquer lugar (Fechar inclusive) era cancelado com `preventDefault` + `stopPropagation`: a janela "não fechava". Agora a marca zera a cada `pointerdown` e em `pointercancel`/`blur`; o click do mesmo gesto continua engolido (não navegar por acidente).
  2. **Duplo clique na barra nunca maximizou**. O arraste chama `setPointerCapture` na janela no `pointerdown`, e a captura redireciona `pointerup` e `click` para a janela — o `dblclick` da barra não chegava ao handler (sonda: só `pointerdown` era entregue à barra). O duplo clique/toque é detectado no próprio `pointerdown` (dois toques em 400 ms a menos de 6 px), sem depender do `dblclick`.
- Não reproduzido: fechar por clique simples falhando em algum fluxo (dev, build de produção, Playwright e Chrome real passaram em todos). Se voltar a acontecer, anotar navegador, aparelho e o gesto imediatamente anterior — a hipótese mais forte é o item 1.

### O que mudou

- **Luzes** (`os.css` › `.os-window__btn`): vermelho `#ff5f57`, amarelo `#febc2e`, verde `#28c840`, 12 px numa área de clique de 24 px (gap 8 px); símbolo (×, −, + / setas para dentro) ao pairar sobre o grupo ou ao focar pelo teclado, e sempre visível onde não há hover (`@media (hover: none)` → toque); `title` nativo em cada luz; anel de foco em lima; luzes da janela de trás a 55 % até o ponteiro chegar à barra. Glifos `max`/`restore` redesenhados em `icons.tsx` (+ e setas) porque o quadrado anterior virava um ponto a 8 px.
- **Fechar** (`window.tsx`): `close()` põe `data-anim="out"` (escala 1 → .96 e some em 200 ms, `pointer-events: none`), e a janela só deixa o store no `animationend` (`finishClose`); sem movimento (sistema ou Ajustes) o `animationName` computado é `none` e o fechamento é imediato; rede de segurança de 600 ms para aba em segundo plano; cliques repetidos não fecham duas vezes; o foco de teclado volta ao controle que abriu. **Esc** passou a ser global para a janela em primeiro plano no desktop (ouvinte em `document` enquanto `focused`), ignorando campos, `<details>` aberto, a busca (`dialog[open]`) e teclas vindas de outra janela; no celular Esc continua sendo Voltar.
- **Minimizar**: mecânica inalterada (`inert` + invisível, geometria preservada, transição até o item da dock); a dock mostra um **anel** em vez de ponto para app minimizado (`data-min` em `desktop.tsx`).
- **Maximizar/restaurar**: `zoom()` põe `data-zooming` por 380 ms e o CSS interpola `left/top/width/height/border-radius` só nesse intervalo (mover por teclado e o recálculo ao redimensionar o navegador seguem instantâneos; sem animação na carga por URL direta). Verde, duplo clique/toque na barra e Enter no título passam por ele. Um clique na barra sem movimento não marca mais a geometria como "escolhida pelo visitante".
- **Store** (`store.ts`): `close()` no celular devolve o foco a ninguém (tela inicial), nunca cai dentro de outro app; no desktop a próxima janela visível da pilha assume foco e URL. Os campos pedidos no brief mapeiam assim: `isOpen`→`open`, `isMinimized`→`min`, `isMaximized`→`max`, `position`+`size`→`rect`, `zIndex`→posição em `order`.
- **Celular**: cabeçalho com Voltar · título · Início · **Fechar (×)**, ambos 44 px. Início mantém o app aberto em segundo plano (como no telefone; a dock marca); × encerra o app e volta à tela inicial, reabrir mostra a raiz do app.

### Verificações (revisão 4)

- `tsc`, `next lint` (só o aviso antigo do OG image) e `pnpm build` verdes.
- `scripts/os-check.mjs` ganhou o grupo **`controls`** (42 checks): os nove fluxos do brief — abrir/fechar Projetos, abrir/fechar Lab, duas janelas e fechar só uma (a outra fica no lugar e em foco; reabrir não duplica), minimizar e restaurar pela dock com a mesma geometria, maximizar na área útil sem rolagem horizontal e restaurar (verde e duplo clique), alternar entre sobrepostas (faixa visível e dock), fechar todas (só wallpaper, dock sem indicadores), celular (Início mantém, × encerra, dois apps), controles depois de navegar (case → Serviços → Voltar) — mais luzes com as cores certas e símbolo só no hover, área ≥ 24 px, `title`, saída animada (janela ainda no DOM com `data-anim=out`), Esc global e Esc na busca, reduced motion fechando na hora e a regressão do Hold to Inspect (hold por toque cancelado → clique em Fechar funciona). Total **172/172** no dev e no build de produção.
- Capturas em `.audit/os-rev/controls/` (luzes em repouso/hover/janela de trás/foco de teclado/tema papel, maximizada, cabeçalho do celular na pasta e no case).
- Fora do escopo verificado: aparelho físico e Safari iOS.

## Revisão 5 (18/10/2026) — a pasta Projetos como cartazes de missão

Pedido: trocar a grade de cards de `/projetos` por uma apresentação com identidade e narrativa, inspirada na energia dos cartazes de recompensa de aventura/anime (sem copiar arte, layout ou assets oficiais de obra alguma): cartazes/dossiês com foto, título grande, tipo, cliente ou status, resumo, etiquetas, numeração e uma abstração de "missão/classe/caso"; animações com personalidade (entrada com impacto, parallax sutil, hover com energia, carimbo, varredura de luz), sem exagero; filtros repensados; adicionar Debby Tour, os guias da Tanzânia/Zanzibar (Said e os relacionados), Ace Diving Miami e Legends of Hollywood Tours; Kavita sem duplicar e sem link novo; desktop e celular; performance e `prefers-reduced-motion`; commit `feat: redesign projects experience with anime-inspired poster presentation` na mesma branch.

### Dados (`src/lib/content-projects-4.ts`, `src/data/projects.ts`, `src/data/slugs.ts`)

- Seis projetos novos, todos de turismo e guias, com fatos tirados dos próprios repositórios (README, `.claude/project-state.md`, `src/config/business.ts`) e nada inventado: **Debby Tours & Transfers** (Melbourne; demo de modernização, ao vivo), **Ace Diving Miami** (conceito "rolar é descer", Lighthouse móvel 93/100/100, ao vivo), **Legends of Hollywood Tours** (página única, empresa familiar desde 2010, ao vivo), **Said Guide Zanzibar** (demo pré-venda, marca do zero), **Mabrouk Zanzibar** (a demo fechou o cliente pagante → `clientWork`), **Serengeti Wildlife Safaris** (marca fictícia, três atos, ao vivo). Cada um com tagline/problema/resultado/status/nota/métrica em três idiomas, três destaques técnicos e duas telas de galeria.
- Said e Mabrouk estão atrás do login da Vercel: `live` ficou **comentado** no dado, com o campo novo `demo: true` no tipo `Project` mantendo o selo "demo" (e não "autoral") enquanto a URL pública não existe — descomentar a linha quando o cliente liberar. `kind` (payload e case) passou a considerar `demo`.
- Capturas das demos: `public/shots/<slug>.webp` (1200×750) + `<slug>/screen-1.webp` e `screen-2.webp`, feitas por Playwright nos sites ao vivo (as duas protegidas rodando localmente a partir dos repositórios) e re-encodadas em WebP pelo canvas do próprio navegador (scratch `capture-demos.mjs`/`capture-local.mjs`).
- Taxonomia: `TOURISM` (conjunto de slugs) → `ProjectEntry.tourism`; `DISPLAY` ganhou Ace Diving e Serengeti como SCROLL EXPERIENCE e Mabrouk como CLIENT WORK; `YEAR` 2026 para os seis (datas dos repositórios). Os projetos entram na ordem editorial depois de Alva Odontologia; o total passa a 31 (derivado, nunca fixo). Sitemap, `/api/os/project`, páginas de case e nós MW/NNN do MilWeb System acompanham sozinhos.
- Kavita (drones e institucional) continua como estava: dois cartazes, link interno do case apenas, nenhum link externo adicionado.

### Cartazes (`src/features/os/apps/projects.tsx`, `os.css` › "Projetos")

- Cada cartaz é um `li.os-project[data-slug][data-kind]` com um link real para o case: pino no topo, linha "DOSSIÊ · CASO 07" + a **missão** por tipo criativo (ENTREGA, TRAVESSIA, EXPLORAÇÃO, MISSÃO COMERCIAL, SISTEMA, PROJETO ESPECIAL, EXPERIMENTO — `os.projects.mission`), número em contorno, nome em Archivo expandido, foto emoldurada (grayscale/sépia leve no repouso, cor no hover) com **carimbo** rotacionado (CLIENTE em vermelho-tinta, DEMO, AUTORAL — `os.projects.stamp`), classe (tipo criativo), status (nome do cliente, NO AR ou status honesto), tagline, três etiquetas de stack e o rodapé "MW/OS · ano / Abrir case →". Papel: `--paper-2`, grão por SVG inline (feTurbulence num tile de 180 px), moldura dupla, sombra curta.
- Layout por **container query** do corpo da janela: 1 coluna (auto-fill ≥ 240 px) → 3 colunas a partir de 760 px (a do meio desce 26 px) → 4 colunas a partir de 1120 px (2ª e 4ª descem); inclinação de repouso alternada (−0,9°/+0,7°/−0,4°). Celular: coluna única, sem inclinação, filtros numa linha rolável (scroll-snap), foto sempre em cor.
- Movimento, tudo em CSS e variáveis (nenhuma biblioteca entra no pacote do OS): entrada "cai e assenta" (`os-poster-in`, translate + scale + rotação −2,2° → +0,6° → 0, cascata de 55 ms por `--i`) disparada por **um** IntersectionObserver para a coleção inteira que escreve `data-in="1"` direto no DOM (sem re-render) — quem cruza a janela entra, e quem já passou para cima (salto de rolagem, tecla End) é revelado no mesmo aviso; o carimbo "bate" 340 ms depois (`os-stamp-hit`, escala 1,7 → 1). Hover: inclinação ao cursor (`--rx/--ry` escritas num rAF, só `(hover: hover) and (pointer: fine)` e movimento permitido), o cartaz endireita (`--tilt: 0`), varredura de luz (`::after`), carimbo de novo (`os-stamp-again`), foto em cor com zoom lento. A chave da lista pelo filtro remonta a coleção, então os cartazes voltam a entrar ao trocar de filtro.
- `prefers-reduced-motion` e Ajustes › Reduzir: cartazes visíveis de imediato, retos, carimbo assentado, foto em cor, sem transição.
- Filtros (`archive.filters`): TODOS · CLIENTES · DEMOS · TURISMO & GUIAS · EXPERIÊNCIAS NO SCROLL · WEBGL / 3D · PRODUTOS DIGITAIS, cada um com a contagem; `demo` = sem cliente pagante e com URL pública ou `demo: true`.
- Rótulos novos nos três dicionários (`os.projects.{dossier, rank, classLabel, lead, stamp, mission}`); o payload expõe `tourism`, `kind`, `kindKey`, `status` e `metric` por projeto.

### Verificações (revisão 5)

- `tsc`, `next lint` (só o aviso antigo do OG image) e `pnpm build` verdes.
- `scripts/os-check.mjs` ganhou o grupo **`projects`** (27 checks): 31 cartazes sem a grade antiga, elementos de cada cartaz, entrada por rolagem (primeiros entram, os de baixo esperam; rolar até o fim revela todos), Kavita exatamente duas vezes e só com o link interno, os seis de turismo presentes com case, Mabrouk cliente / Said e Debby demos, hover (inclinação + foto em cor) e saída, sete filtros com contagem (Turismo = os seis; Clientes = Kavita ×2 + Mabrouk; Demos sem clientes e com Said), case do Debby abre na janela com o site ao vivo, case do Said sem link externo e com selo de demo, reduced motion, EN (DOSSIER · CASE 01, CLIENT, TOURISM & GUIDES); celular (coluna única, sem rolagem horizontal, filtros roláveis, sem inclinação, alvos de toque, toque abre o case). Suíte inteira: **199/199** no dev e no build de produção.
- `i18n-audit` no build de produção: 135 rotas (18 novas: 6 cases × 3 idiomas), sem vazamento novo.
- Capturas em `.audit/os-rev/posters/` (1440, 1920, hover, filtro Turismo, case do Ace Diving, celular 390).
- Fora do escopo verificado: aparelho físico; as fotos dentro das capturas das demos são as dos próprios sites demo (Ace Diving usa fotos da operadora; o repositório lista o consentimento como pendente com a empresa).

## Revisão 6 (18/10/2026) — THE BOUNTY COLLECTION: o mural de cartazes

Pedido: descartar a grade de cartazes da revisão 5 ("documentos corporativos") e reconstruir `/projetos` como uma experiência cinematográfica inspirada nos cartazes de recompensa (linguagem autoral, sem personagens, logotipos ou ilustrações de obra alguma): mural interativo com o cartaz principal centralizado e os vizinhos parcialmente visíveis, entrada "folhas ao vento", cartazes com faixa PROCURA-SE / MAIS PROCURADO / MISSÃO ESPECIAL, imagem tratada por projeto, selo, pouco texto; hover 3D; clique como UMA transformação física até um dossiê (sem abrir "uma página comum"); fechamento que reverte e mantém o ponto da coleção; filtros compactos; 31 projetos preservados; Kavita sem links externos; performance, acessibilidade e reduced motion; commit `feat: build cinematic bounty collection for projects`.

### Direção de arte

- **Parede** grafite com grão e uma luz na cor do projeto em foco (`MOOD` em `data/projects.ts`: rgb por projeto — Ace Diving azul-profundo, Debby verde-mar, Legends dourado-sépia, Serengeti âmbar, Said turquesa, Mabrouk pôr do sol, Aurex aço, Terral café…), que muda com transição entre cartazes (`@property --mood-r/g/b`).
- **Cartaz**: papel quente (#e8e0cf) com grão (feTurbulence), manchas por semente, bordas levemente irregulares (`clip-path: polygon` com 16 pontos estáveis por índice), sombra própria; faixa em Archivo expandido (PROCURA-SE para demos/produtos, MAIS PROCURADO para clientes, MISSÃO ESPECIAL para WebGL e autorais — tamanho da faixa por `data-tier` para caber numa linha), imagem com máscara radial que funde no papel, tinta e vinheta na cor do projeto (`.bounty__tint`, multiply) e recorte por projeto (`focus`), nome em display, "MW/OS · CASO 07 / 31", selo rotacionado (CLIENTE em vermelho-tinta, DEMO, EXPERIMENTO, WEBGL, PRODUTO DIGITAL) e a frase curta. Nada de stack, status ou badges na frente — isso é do dossiê. Tudo escala com o papel (`cqw`), então o mesmo componente serve ao mural, ao voo e ao dossiê.
- **Mural**: trilho em perspectiva (1400 px); cada cartaz recebe `--d` (distância assinada ao principal) e `--ad`, e o CSS resolve `translate3d(d·step, 0, −ad·150px) rotateY(clamp(±24°, −d·11°)) scale(1 − min(ad,4)·.07)` com opacidade decrescente; além de 6 fica oculto (e só até 8 carrega imagem). `--poster-w = min(30cqw, 66cqh·.72)`: a geometria se adapta ao tamanho da janela sem JS (o corpo da janela de Projetos vira `container-type: size`). Celular: `74cqw`, sem 3D, vizinhos espiando 14 px de intervalo.

### Coreografia (GSAP carregado sob demanda em `apps/bounty/mural.tsx`)

- **Entrada** (~1,8–2,4 s, sem bloquear): os cartazes próximos chegam de fora (x até 430 px, y −150…−280) com rotação em Z (18°+) e Y (34°), desaceleram (`power3.out`/`back.out`), pousam com um pequeno impacto (escala .985 → elástica) e a sombra acompanha; a câmera (o trilho) recua de 1,08 para 1 em 1,9 s. Repete ao trocar de filtro.
- **Hover** (ponteiro fino): inclinação ao cursor (`--rx/--ry` num rAF), levanta 34 px no eixo Z, sombra maior, imagem com paralaxe (`--px/--py`) e cor mais viva.
- **Clique = uma transformação**: o cartaz se desprende (um voador com o mesmo visual), os outros recuam e escurecem (`scale(.92)` + opacidade .28 + véu), o voador avança para a câmera (escala ×1,1, rotateY −14°) e cruza a janela até a coluna esquerda da folha do dossiê (FLIP manual: retângulo de origem → retângulo do destino, escala uniforme porque os dois são 3:4; `power3.inOut`, assenta com elástico); o case entra em sequência (`bounty-rise` com atraso por filho). A URL muda para a rota canônica do case ao mesmo tempo (`navigate(/work/<slug>)`), o conteúdo é o mesmo server component da página, e a janela de Projetos passa a renderizar o mural SEMPRE com o case como `dossier` por cima (window.tsx → AppContent → ProjectsApp) — por isso o voltar reverte o voo (o trilho destransforma: `undim`) e o visitante continua no mesmo cartaz. Link direto e janela sem foco (JSON) abrem com o dossiê pronto.
- **Navegação**: roda/trackpad (delta acumulado, trava de 380 ms), arraste e swipe (`--drag` enquanto segura; solta por distância ou velocidade; o click que segue um arraste é descartado), setas/Home/End/PageUp/PageDown no trilho (`tabindex=0`), clique nos vizinhos, fita de posição (um traço por projeto, `aria-current`), "Ver todos" (grade com os 31 para saltar direto) e setas. Esc fecha a grade ou o dossiê antes de fechar a janela (captura em `document` com `preventDefault`; a janela respeita `defaultPrevented`).
- **Reduced motion** (sistema ou Ajustes): sem entrada, sem inclinação, dossiê aparece pronto, trilho sem transição.

### Dados e integridade

- 31 projetos preservados; Kavita (drones e institucional) sem link externo nem botão de visita no OS (`NO_EXTERNAL` em `data/projects.ts` → `live` e `repos` vazios no payload e no case), com o dossiê intacto. Said e Mabrouk continuam sem URL pública (login da Vercel) — `demo: true` mantém o selo; os quatro demos públicos têm o botão do site.
- Filtros: todos · clientes · demos · turismo & guias · experimentos · WebGL/3D · produtos digitais (`archive.filters.experiment` novo; "experimento" = autoral sem URL pública); contagem em cada pílula; sem duplicar projeto.
- Modo simples: lista direta (`ProjectsList`), sem mural.

### Verificações (revisão 6)

- `tsc`, `next lint` (só o aviso antigo do OG image) e `pnpm build` verdes.
- `scripts/os-check.mjs` › grupo `projects` reescrito para o mural (40 checks): entrada em curso, 31 cartazes/um principal/grade antiga ausente, cartaz íntegro (faixa e nome dentro do papel), vizinhos visíveis e distantes ocultos, imagens só nos próximos, 7 filtros compactos, Kavita só com link interno, seis de turismo, principal centrado, setas/End/Home, roda, fita, ver todos, arraste, hover, filtros Turismo e Demos, clique → voador em voo + recuo, dossiê (cartaz à esquerda, case ao lado, URL, título, seções, botão do site, rolagem interna, véu), Esc reverte e mantém o ponto, link direto com Kavita sem link externo, maximizar/restaurar, reduced motion (mural pronto, dossiê direto), EN; celular: cartaz inteiro com vizinho espiando, sem rolagem horizontal, pé acima da dock, swipe, toque abre dossiê, botão não cobre o cartaz, fecha mantendo o cartaz. Os outros grupos ganharam esperas para o pouso da entrada e o Esc em dois níveis. Suíte inteira: **213/213** no dev e no build de produção.
- `i18n-audit` no build de produção: sem vazamento novo.
- Capturas em `.audit/os-rev/bounty/` (entrada, repouso, hover, voo, dossiê, fechamento, End, ver todos, filtro, maximizada, celular).
- Fora do escopo verificado: aparelho físico; fps medido só por amostragem de transform em Chromium headless.

## Revisão 7 (18/10/2026) — redes do estúdio ao redor do olho (SOCIAL CONNECTIONS)

Pedido (com imagem de referência): LinkedIn num painel à esquerda do olho; GitHub e Instagram em dois painéis à direita, um sobre o outro; módulos de HUD em vidro escuro com borda ciano fina, ícones reconhecíveis, seta de link externo e microtextos ("Conexões e oportunidades", "Código e experimentos", "Bastidores e processo criativo"); circuitos finos ligando os painéis ao olho, com pontos e pulsos; entrada progressiva sem bloquear; hover que eleva, ilumina e manda um pulso; clique em nova aba; links reais numa configuração central; celular com fileira compacta sob o olho; nada do OS alterado (olho, piscar, dock, barra, janelas, apps, idiomas); commit `feat: add animated social connections to MilWeb OS homepage`.

### Decisões

- **Links** em `src/data/social.ts` (`SOCIAL`): LinkedIn e GitHub vêm de `PROFILE` (`lib/content.ts`, já existiam: `linkedin.com/in/rick-januario-41211b238` e `github.com/rickjs2005`); Instagram é o único novo (`instagram.com/milweb01`). `null` = sem URL confirmada → o painel não existe, nunca um link quebrado. O payload do OS expõe `social`.
- **Composição** (`features/os/social-hud.tsx` + `os.css` › "redes do estúdio"): posições em CSS relativas ao quadro do olho (`--eye-w`, o mesmo `min(60vw, 112vh)` do olho; `min(64vw, 100vh)` no tablet): o painel entra 16 % no quadro, sobre a pele esmaecida, nunca sobre o globo; LinkedIn na altura do olho, GitHub a 13 % acima e Instagram a 3 % abaixo. Cartão = pílula de vidro escuro (`rgb(8 14 20 / .66)`, blur 10 px) com borda `rgb(96 204 236 / .42)`, linha interna, ponto que respira no canto, ícone da rede em cores oficiais (placa azul do LinkedIn, círculo preto do GitHub com o octicon, degradê do Instagram), nome em mono e seta ↗; microtexto FORA do cartão, abaixo, em até duas linhas. Nada de neon forte: o brilho só cresce no hover.
- **Circuitos**: um SVG sobre a área de trabalho (`pointer-events: none`), medido no cliente (ResizeObserver no desktop e no olho, redesenhado ao redimensionar): toco de 34 px a partir da borda do painel até um ponto, e dali reto até um nó no olho — canto externo esquerdo (−20,5 % da largura, −4 % da altura), sobrancelha direita (+16 %, −19 %) e cílios inferiores direitos (+16,5 %, +12 %), valores medidos sobre a imagem do shader (o globo ocupa ~40 % do quadro). Nós com anel; a linha tem um duplo (fina + brilho largo).
- **Movimento**: circuitos se desenham com `stroke-dashoffset` (`pathLength=1`, 0,6 s + 0,15 s por painel), nós aparecem, painéis entram em fade + 12 px (1 s + 0,18 s por painel), pulsos azuis percorrem cada linha a cada 2,8 s por **SMIL `animateMotion`** (zero JS por quadro); no hover/foco um pulso extra corre a linha (`beginElement`) e o anel do nó pulsa. Tudo começa no load pelo CSS (`data-in` estático no HTML: sem JS o HUD fica visível). `prefers-reduced-motion`/Ajustes › Reduzir: tudo pronto e parado, pulsos escondidos. Sem GSAP nem WebGL: o root do OS não ganhou biblioteca.
- **Olho intacto**: o `pointerdown` global e passivo do olho continua; clicar num painel também pisca. O olho segue `pointer-events: none`.
- **Celular**: o olho encolheu de 40 para 32 svh para abrir espaço; os três módulos viram uma fileira de 44 px sob o olho (ícone + nome + seta, sem microtexto, sem circuitos); paisagem: fileira na coluna esquerda, sob a grade. Tudo cabe sem rolar nos três aparelhos emulados.
- **Teclado**: os painéis são `<a target="_blank" rel="noopener noreferrer">`, alcançáveis por Tab, com anel de foco lima e o mesmo hover (`:focus-visible`).

### Verificações (revisão 7)

- `tsc`, `next lint` (só o aviso antigo do OG image) e `pnpm build` verdes.
- `scripts/os-check.mjs`: checks novos — desktop 1440: lados certos (LinkedIn à esquerda, GitHub sobre Instagram à direita), links reais em nova aba com `noopener noreferrer` e microtextos, painéis dentro da viewport sem cobrir ícones/assinatura/dock/barra, circuitos em SVG decorativo desenhados até o olho, hover eleva + pulso, clique abre o GitHub em nova aba, Tab alcança os painéis com foco visível, olho sem ponteiro; 1920×1080 e 1366×768: lados, sobreposição e circuitos; reduced motion: HUD pronto sem animação nem pulsos; celular (360/390/430): fileira sob o olho dentro da tela, sem circuitos, alvos ≥ 44 px, tela inicial sem rolar. Suíte inteira: **227/227** no dev e no build de produção.
- `i18n-audit` no build de produção: sem vazamento novo.
- Capturas em `.audit/os-rev/hud/` (1440, 1920, 1366, tablet 1024, reduced motion, celular e paisagem; hover).
- Fora do escopo verificado: aparelho físico (iPhone/Android reais); o piscar com clique nos painéis foi conferido pela natureza do ouvinte (global, passivo), não num Chrome com GPU.

## Revisão 8 (19/10/2026) — celular com o acabamento do desktop (só o modo celular muda)

Pedido: refinar a experiência em smartphones (home, dock, controles, Projetos/cartazes, case, contato, busca, teclado, safe areas) com o mesmo nível do desktop, **alterando apenas o modo celular**: desktop visual e funcionalmente igual, verificado por regressão em 1024/1440/1920; reutilizar a definição de celular (`MOBILE_SHELL_MQ`, incluindo o telefone deitado); não ampliar a container query compartilhada de janela estreita; alvos de 48 × 48; contato na primeira tela; rótulos ≥ 12 px; dock com nomes; cartazes legíveis em toda a faixa (o problema do `@container (max-width: 420px)` que deixava o 430 px com a apresentação de desktop); swipe previsível com rolagem vertical e zoom livres; validação na matriz 360×640, 375×667, 390×844, 414×896, 430×932, 844×390 e 932×430.

### Isolamento

- Todo o CSS novo vive num bloco `@media (max-width: 719px), ((max-height: 499px) and (max-width: 1079px))` próprio (a MESMA regra do registro) e no bloco do telefone deitado; a container query `@container (max-width: 420px)` (janela estreita do desktop) ficou intocada. Os únicos acréscimos fora de media query são regras `display: none` para elementos que só existem no celular (`.os-sign .os-sign__desc/.os-sign__cta`, `.bounty__progress`, `.bounty__filters-btn`) — com especificidade dupla, porque `.os-cta` mais abaixo define `display` por conta própria (foi exatamente isso que a primeira rodada de regressão pegou: a chamada do WhatsApp aparecendo no desktop).
- Regressão do desktop (scratch `regress.mjs`): 27 capturas (8 rotas × 3 larguras + Projetos maximizada), movimento reduzido, relógio mascarado, comparação pixel a pixel por canvas → **0 capturas com diferença** (dev × dev, depois da correção acima). A comparação final, feita com o build de produção contra as referências do dev, acusa só o selo do Next dev no canto inferior esquerdo (caixa de ~35 × 35 px em x 20–55 px), que o servidor de desenvolvimento desenha e o `next start` não.
- A única mudança de comportamento comum a todos os modos é no arraste do mural (abaixo); não tem efeito visual.

### O que mudou no celular

- **Tela inicial**: cabeçalho → olho (32 svh) → lema + descrição curta (`os.mobile.message`) + **"Falar no WhatsApp"** (lima, 48 px, `wa.me` real; string existente `LAB_PAGE.ctaButton` exposta em `payload.contact.cta`) → redes (cartões de 48 px) → aplicativos com rótulos de 12 px. A primeira tela traz olho, lema e WhatsApp acima da dock até em 360×640; o resto rola naturalmente (o teste de "cabe sem rolar" virou "contato na primeira tela").
- **Dock** com os nomes permanentes (11 px), itens de 64 px; `--os-mdock` passa a 88 px (76 px deitado) só no celular, e todas as telas reservam esse espaço.
- **Alvos de 48 px**: busca e navegação da home, Voltar/Início/Fechar (barra de 56 px), chips de filtro/Ajustes, canais e opções do compositor de contato (agora pílulas com estado ativo preenchido, continuam opcionais), setas, "Ver todos", filtros do mural, "Voltar à coleção", busca (campo 48 px/16 px e Fechar 48 px, lista com itens de 56 px, altura em `dvh` para caber com o teclado).
- **Projetos**: o mural passa a ser dimensionado pelo **palco** (`.bounty__stage` vira `container-type: size` só no celular): `--poster-w = min(74cqw, 84cqh·.75)` — largura E altura disponíveis — então 360, 390, 414 e 430 recebem o cartaz inteiro com o vizinho espiando; textos do cartaz com piso legível (`max(21px, 10.5cqw)` no nome, 13 px na frase, 11 px no identificador); setas e "Ver todos" de 48 px; a fita de traços dá lugar a uma barra de progresso; `touch-action: pan-y pinch-zoom` com reconhecimento de direção no arraste. Deitado: filtros recolhidos atrás de um botão de 48 px no pé (mostra o filtro ativo), eyebrow oculto, cartaz por `min(40cqw, 94cqh·.75)`.
- **Arraste com direção** (`mural.tsx`, vale em todos os modos): o gesto só vira navegação depois de se declarar horizontal (> 8 px); vertical ou `pointercancel` não troca de cartaz. Com mouse/caneta, o click que fecha um arraste vertical também é descartado (`moved` fica armado até o `pointerup`) — a suíte inteira pegou isso em 844×390: o gesto vertical abria o dossiê. No toque o `pan-y` já entrega `pointercancel` sem click.
- **Case**: dossiê em coluna (cartaz no topo a 44 %, botão de voltar de 48 px fora do cartaz), corpo a 16 px/1,6.
- **Olho**: nada mudou (imagem estática, sonda de GPU, DPR ≤ 1,25, pisca ao toque).

### Verificações (revisão 8)

- `tsc`, `next lint` (só o aviso antigo do OG image) e `pnpm build` verdes.
- `scripts/os-check.mjs` › grupo **`phones`** (matriz 360×640, 375×667, 390×844, 414×896, 430×932, 844×390, 932×430 + busca em 390×420 "com teclado"): celular sem rolagem horizontal e nada aberto; WhatsApp e descrição na primeira tela; rótulos ≥ 12 px sem cortes e dock com nomes; alvos ≥ 48 px na home; Voltar/Início/Fechar/setas/filtros/Ver todos ≥ 48 px; cartaz inteiro e legível com vizinho; `pan-y`, barra de progresso, pé acima da dock; swipe horizontal avança e gesto vertical não; case em coluna com texto ≥ 16 px e Voltar de 48 px; Voltar à coleção devolve o cartaz; Ver todos com os 31; Contato com opções de 48 px e estado ativo; busca curta com campo, resultado e Fechar visíveis. Suíte inteira: **320/320** no dev e no build de produção.
- `i18n-audit` no build de produção: só as 3 ocorrências antigas do Logistics Demo (`capabilities`/`screens`), fora do escopo.
- Capturas antes/depois em `.audit/regress/before` e `.audit/regress/after` (desktop e celular) e as do grupo `phones` em `.audit/os-prod/ph-*.png`.
- Emulação (Playwright/Chromium), não aparelho físico: iPhone/Android reais, Safari iOS, teclado de verdade e fps não foram medidos. Nada de Lighthouse nesta revisão.
