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
- `features/os/apps/*` — Destaques, Projetos, Estúdio, Lab, Serviços, Contato, Ajustes, Busca, caso remoto.
- `features/os/payload.ts` (servidor) — carga leve por idioma; `features/os/project-data.ts` + `/api/os/project/[lang]/[slug]` — dados do case (JSON estático gerado no build) para a janela sem foco; `project-detail-view.tsx` — a mesma view na página canônica e no JSON.
- Rotas canônicas preservadas (`/projetos/x`, `/en/work/x`, `/es/proyectos/x`, serviços, diagnóstico), metadata, canonical, hreflang, sitemap, robots, JSON-LD e analytics (`TrackConversions`) intactos. Protótipos do Lab (`/lab/milo-null`) e erros ficam fora do OS, com a navegação clássica.
- Animação: só CSS no sistema (transições/keyframes); GSAP continua nos componentes de conteúdo que já o usavam (`TerralHold`, `Reveal` com `scroller` apontando para o corpo da janela). Lenis não liga no OS (`<html data-os>`). `prefers-reduced-motion` e o ajuste "Reduzir" desligam tudo.
- Por que `children` não é cacheado: no App Router, `children` do layout é um slot do roteador, não um elemento estático — renderizá-lo de novo mostra a rota atual (reproduzido: ao focar o Estúdio a janela de Projetos esvaziava). Daí o JSON estático do case.

## Verificações

- `tsc --noEmit` e `eslint` limpos; `pnpm build` (lint + build, como o CI) — ver `project-state.md`.
- `scripts/os-check.mjs` (Playwright/Chromium): 103 verificações — desktop 1440×900 (abrir, focar, pilha, minimizar/restaurar, arraste com clamp, teclado, maximizar, alça, case na janela, cache remoto, Esc, atalho, busca, contato, reload, página de serviço, EN), celular 360/390/430 (tela inicial, toque, Voltar do app e do navegador, Início, contato, ES, alvos ≥ 44 px, sem rolagem horizontal), redimensionamento 1440→390→1920→844×390→768×1024, modo simples. Emulação de navegador, não aparelho físico.
- Sem erros de console nem de hidratação nos fluxos cobertos.
