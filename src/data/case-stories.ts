import type { Localized } from "@/lib/content";

/**
 * Camada editorial dos cases selecionados. Cada campo aqui é derivado de
 * fatos que já estão nas narrativas de content.ts — nada é inventado.
 * Projetos sem entrada usam o fallback genérico em sections/case.
 */
export type Screen = { src: string; alt: Localized; layout: "full" | "wide" | "offset" | "crop" };

export type CaseVariant = "kavita" | "terral" | "vertex" | "aurex";

export type CaseStory = {
  /** Direção de arte/mecânica do case (hero, experience, diagrama). */
  variant: CaseVariant;
  /** Frase-headline do capítulo THE IDEA (curta, editorial). */
  ideaHeadline: Localized;
  ideaBody: Localized;
  /** Passos do capítulo EXPERIENCE: texto muda, mídia acompanha (sticky). */
  steps: { label: string; text: Localized; image: string }[];
  /** Momento full-bleed sem texto. */
  fullBleed: { src: string; alt: Localized };
  /** UNDER THE HOOD: resumo em pontos; cada ponto abre o parágrafo N da narrativa. */
  hood: { label: string; summary: Localized; paragraph: number }[];
  /** Fluxo técnico real, em caixas. */
  flow: string[];
  /** Números verdadeiros do projeto. */
  stats: { value: string; label: Localized }[];
  /** Resultado em duas linhas. */
  result: [Localized, Localized];
  screens: Screen[];
  /** Palavras da direção de arte (usadas como marquee/labels discretos). */
  words: string[];
};

export const CASE_STORIES: Record<string, CaseStory> = {
  "kavita-drones": {
    variant: "kavita",
    ideaHeadline: { pt: "A revenda precisava transformar catálogo em conversa.", en: "The reseller needed to turn a catalog into a conversation." },
    ideaBody: {
      pt: "Uma landing de drones agrícolas não vende sozinha — ela precisa entregar um orçamento pronto, no WhatsApp da filial certa, sem inventar uma especificação sequer. Sem framework, sem build: só HTML, CSS e JavaScript escritos à mão.",
      en: "An agricultural-drone landing page doesn't sell on its own — it has to deliver a ready quote to the right branch's WhatsApp, without inventing a single spec. No framework, no build step: hand-written HTML, CSS and JavaScript.",
    },
    steps: [
      { label: "CATALOG", text: { pt: "26 equipamentos em 5 categorias, cada item com status de confirmação por campo. Filtros de categoria e de compatibilidade com os 3 drones (T25P, T70P, T100) combinados em AND.", en: "26 pieces of equipment across 5 categories, each with per-field confirmation status. Category and drone-compatibility filters (T25P, T70P, T100) combined with AND logic." }, image: "/shots/kavita-drones/equipamentos.webp" },
      { label: "DRONES", text: { pt: "Três modelos DJI Agras comparados lado a lado: pulverização, dispersão, garantia. Contadores animados nascem do próprio HTML — sem JS, o número já está certo.", en: "Three DJI Agras models compared side by side: spraying, spreading, warranty. Animated counters are born from the HTML itself — with no JS, the final number is already right." }, image: "/shots/kavita-drones/drones.webp" },
      { label: "BUDGET", text: { pt: "Um mini-carrinho sem loja: drones, equipamentos e serviços entram num orçamento que persiste em localStorage entre visitas, com contador em tempo real.", en: "A mini-cart with no store behind it: drones, equipment and services go into a budget that persists in localStorage across visits, with a live counter." }, image: "/shots/kavita-drones/hero.webp" },
      { label: "ROUTING", text: { pt: "No envio, a mensagem sai estruturada em blocos e vai para o WhatsApp da unidade escolhida — 4 filiais em MG, ES e RJ, com fallback para o número padrão.", en: "On submit, the message goes out structured in blocks to the chosen unit's WhatsApp — 4 branches across MG, ES and RJ, with a default fallback." }, image: "/shots/kavita-drones.webp" },
    ],
    fullBleed: { src: "/shots/kavita-drones/hero.webp", alt: { pt: "Hero da Kavita Drones: drone DJI Agras sobre a lavoura", en: "Kavita Drones hero: a DJI Agras drone over the field" } },
    hood: [
      { label: "ZERO FRAMEWORK", summary: { pt: "HTML5 semântico, CSS puro e JS vanilla, sem build. Cloudflare Workers servindo estáticos.", en: "Semantic HTML5, plain CSS and vanilla JS, no build step. Cloudflare Workers serving static assets." }, paragraph: 0 },
      { label: "DATA MODEL", summary: { pt: "Catálogo como dado governado: cada item carrega status confirmado/pendente. Nada é inventado.", en: "Catalog as governed data: every item carries a confirmed/pending status. Nothing is invented." }, paragraph: 1 },
      { label: "BUDGET + ROUTING", summary: { pt: "Orçamento em localStorage com fallback silencioso; REPRESENTATIVES mapeia 4 filiais para 4 números.", en: "localStorage budget with a silent fallback; REPRESENTATIVES maps 4 branches to 4 numbers." }, paragraph: 2 },
      { label: "PERFORMANCE", summary: { pt: "preload + fetchpriority no hero, vídeo pausa fora da viewport, contadores em rAF com easing manual, tema via matchMedia.", en: "preload + fetchpriority on the hero, video pauses off-screen, rAF counters with hand-written easing, theme via matchMedia." }, paragraph: 3 },
    ],
    flow: ["USER", "CATALOG", "BUDGET", "BRANCH ROUTING", "WHATSAPP"],
    stats: [
      { value: "26", label: { pt: "equipamentos", en: "equipment items" } },
      { value: "04", label: { pt: "rotas regionais", en: "regional routes" } },
      { value: "0", label: { pt: "frameworks", en: "frameworks" } },
      { value: "~7.200", label: { pt: "linhas à mão", en: "hand-written lines" } },
    ],
    result: [{ pt: "No ar em kavita.com.br", en: "Live at kavita.com.br" }, { pt: "Cliente real — Kavita Agro", en: "Real client — Kavita Agro" }],
    screens: [
      { src: "/shots/kavita-drones/drones.webp", alt: { pt: "Comparativo dos 3 modelos DJI Agras", en: "Comparison of the 3 DJI Agras models" }, layout: "full" },
      { src: "/shots/kavita-drones/equipamentos.webp", alt: { pt: "Catálogo de equipamentos com filtros", en: "Equipment catalog with filters" }, layout: "offset" },
      { src: "/shots/kavita-drones.webp", alt: { pt: "Hero em produção", en: "Production hero" }, layout: "crop" },
    ],
    words: ["PRECISION", "FIELD", "TECHNOLOGY", "AGRICULTURE", "ROUTING"],
  },

  terral: {
    variant: "terral",
    ideaHeadline: { pt: "Café é sobre esperar o tempo certo.", en: "Coffee is about waiting the right amount of time." },
    ideaBody: {
      pt: "Sites de café mostram sacas paradas. O Terral conta o caminho do grão em cinco capítulos guiados pelo scroll — Caparaó, Terreiro, Tambor, Moenda, Xícara — em que a tipografia gigante faz o papel da imagem e o vídeo real faz o papel do argumento.",
      en: "Coffee sites show static bags. Terral tells the bean's path in five scroll-driven chapters — Caparaó, drying yard, drum, grind, cup — where giant typography does the image's job and real footage does the argument's.",
    },
    steps: [
      { label: "CAPARAÓ", text: { pt: "Cada capítulo divide a tela entre imagem viva e título editorial. Grãos flutuam em parallax costurando as transições.", en: "Each chapter splits the screen between living imagery and an editorial title. Beans float in parallax, stitching the transitions." }, image: "/shots/terral.webp" },
      { label: "TERREIRO", text: { pt: "O sol faz metade do trabalho: terreiros de secagem e a pá revolvendo os grãos, em vídeo e fotografia reais.", en: "The sun does half the work: drying beds and a paddle turning the beans, in real video and photography." }, image: "/shots/terral/sol.webp" },
      { label: "VERTENTE", text: { pt: "Depois da jornada o site vira loja: três blends com origem, altitude, nota SCA e perfil sensorial, pedido direto no WhatsApp.", en: "Past the journey the site becomes a shop: three blends with origin, altitude, SCA score and tasting profile, ordered directly on WhatsApp." }, image: "/shots/terral/vertente.webp" },
      { label: "HOLD 6S", text: { pt: "Um botão discreto pede que o visitante segure por seis segundos. Quem espera ganha a casa do torrador e um código que dobra o café do primeiro pacote.", en: "A discreet button asks the visitor to hold for six seconds. Whoever waits earns the roaster's house and a code that doubles the first bag." }, image: "/shots/terral/casa-do-torrador.webp" },
    ],
    fullBleed: { src: "/shots/terral/sol.webp", alt: { pt: "Terreiro de secagem ao sol", en: "Sun-drying yard" } },
    hood: [
      { label: "CHAPTER ENGINE", summary: { pt: "Cinco capítulos no scroll, meia tela de história, meia de vídeo e foto reais; grãos em parallax nas transições.", en: "Five scroll chapters, half a screen of story, half of real video and photo; parallax beans across transitions." }, paragraph: 0 },
      { label: "SHOP", summary: { pt: "Vitrine de blends com notas SCA e pedido no WhatsApp; rodapé com letreiro TERRAL de ponta a ponta e marquee.", en: "Blend showcase with SCA scores and WhatsApp ordering; footer with an edge-to-edge TERRAL letterpress and marquee." }, paragraph: 1 },
      { label: "THE SECRET", summary: { pt: "Hold de seis segundos revela a casa do torrador — a tese do site num gesto.", en: "A six-second hold reveals the roaster's house — the site's thesis in one gesture." }, paragraph: 2 },
    ],
    flow: [],
    stats: [
      { value: "05", label: { pt: "capítulos", en: "chapters" } },
      { value: "03", label: { pt: "blends", en: "blends" } },
      { value: "6s", label: { pt: "de espera pelo segredo", en: "hold for the secret" } },
      { value: "2×", label: { pt: "café no primeiro pacote", en: "coffee in the first bag" } },
    ],
    result: [{ pt: "Projeto autoral, no ar", en: "Studio project, live" }, { pt: "Marca fictícia — conceito MilWeb", en: "Fictional brand — a MilWeb concept" }],
    screens: [
      { src: "/shots/terral/vertente.webp", alt: { pt: "Vitrine VERTENTE", en: "VERTENTE showcase" }, layout: "full" },
      { src: "/shots/terral/casa-do-torrador.webp", alt: { pt: "A casa do torrador", en: "The roaster's house" }, layout: "wide" },
      { src: "/shots/terral.webp", alt: { pt: "Abertura com o grão", en: "Opening with the bean" }, layout: "crop" },
    ],
    words: ["ORIGIN", "TIME", "HEAT", "TEXTURE", "PATIENCE"],
  },

  "atelier-vertex": {
    variant: "vertex",
    ideaHeadline: { pt: "Rolar constrói o prédio. Voltar desconstrói.", en: "Scrolling builds the building. Scrolling back tears it down." },
    ideaBody: {
      pt: "Um escritório de arquitetura vende execução, não fotos. O site é um filme real de obra — do andaime à fachada — cujo tempo pertence 100% ao scroll, sem autoplay. No meio, o vídeo escurece e vira mesa de luz: a planta se desenha com cotas reais.",
      en: "An architecture firm sells execution, not photos. The site is a real construction film — scaffolding to façade — whose time belongs entirely to the scroll, no autoplay. Midway, the video dims into a light table: the floor plan draws itself with real dimensions.",
    },
    steps: [
      { label: "SCRUB", text: { pt: "Um ScrollTrigger por seção escreve (cena, progresso); um rAF lê isso a cada frame e persegue o currentTime do vídeo com damping. Pular de cena é um dolly de tempo, nunca um corte seco.", en: "One ScrollTrigger per section writes (scene, progress); a rAF loop reads it every frame and chases the video's currentTime with damping. Jumping scenes is a time dolly, never a hard cut." }, image: "/shots/atelier-vertex.webp" },
      { label: "PRANCHA", text: { pt: "O vídeo escurece até virar uma mesa de luz e a planta do pavimento tipo se desenha amarrada ao scroll: paredes, mobiliário, cotas e carimbo (ESC 1:75).", en: "The video dims into a light table and the floor plan draws itself in sync with scroll: walls, furniture, dimensions and a drafting stamp (SCALE 1:75)." }, image: "/shots/atelier-vertex/prancha.webp" },
      { label: "ENTREGUE", text: { pt: "Depois do filme, o site vira o arquivo do estúdio: obras, processo e contato, com trilho de progresso e cursor próprio.", en: "After the film, the site becomes the studio's archive: works, process and contact, with a progress rail and a custom cursor." }, image: "/shots/atelier-vertex/entregue.webp" },
    ],
    fullBleed: { src: "/shots/atelier-vertex/prancha.webp", alt: { pt: "Planta se desenhando sobre o vídeo escurecido", en: "Floor plan drawing itself over the dimmed video" } },
    hood: [
      { label: "SCROLL ENGINE", summary: { pt: "Estado mutável compartilhado (world.ts), ScrollTrigger escreve, rAF lê e persegue o vídeo com damping. Roteiro em scenes.ts.", en: "Shared mutable state (world.ts): ScrollTrigger writes, rAF reads and chases the video with damping. Script in scenes.ts." }, paragraph: 0 },
      { label: "VIDEO SCRUB", summary: { pt: "GOP 1 — todo frame é keyframe, senão o seek engasga. Arquivo maior, pago conscientemente.", en: "GOP 1 — every frame is a keyframe, otherwise seeking stutters. Bigger file, paid knowingly." }, paragraph: 0 },
      { label: "BLUEPRINT", summary: { pt: "Planta com pathLength=1; fronteiras das cenas calibradas extraindo frames a cada 0,5 s (transformação real entre 40% e 70%).", en: "Floor plan via pathLength=1; scene boundaries calibrated by extracting frames every 0.5 s (real transformation between 40% and 70%)." }, paragraph: 1 },
      { label: "DESIGN AUDIT", summary: { pt: "Auto-auditoria 0–10 contra o build real: header ilegível e menu mobile quebrado por backdrop-filter — corrigidos.", en: "0–10 self-audit against the real build: illegible header and a mobile menu broken by backdrop-filter — both fixed." }, paragraph: 2 },
    ],
    flow: [],
    stats: [
      { value: "100%", label: { pt: "do vídeo no scroll", en: "of the film on scroll" } },
      { value: "GOP 1", label: { pt: "todo frame é keyframe", en: "every frame a keyframe" } },
      { value: "0,5s", label: { pt: "entre frames analisados", en: "between sampled frames" } },
      { value: "1:75", label: { pt: "escala da prancha", en: "blueprint scale" } },
    ],
    result: [{ pt: "Projeto autoral, no ar", en: "Studio project, live" }, { pt: "Vídeo real de obra, 100% scroll-driven", en: "Real construction footage, 100% scroll-driven" }],
    screens: [
      { src: "/shots/atelier-vertex/entregue.webp", alt: { pt: "Cena final: prédio entregue", en: "Final scene: building delivered" }, layout: "full" },
      { src: "/shots/atelier-vertex.webp", alt: { pt: "Abertura: do andaime à fachada", en: "Opening: scaffolding to façade" }, layout: "offset" },
      { src: "/shots/atelier-vertex/prancha.webp", alt: { pt: "Prancha — planta e cotas", en: "Blueprint — plan and dimensions" }, layout: "crop" },
    ],
    words: ["GRID", "MEASURE", "PROCESS", "CONSTRUCTION"],
  },

  "aurex-timepieces": {
    variant: "aurex",
    ideaHeadline: { pt: "Foto parada não justifica preço. Mecânica, sim.", en: "A still photo doesn't justify a price. Mechanics do." },
    ideaBody: {
      pt: "O AX-01 é um calibre 100% procedural que se desmonta peça por peça conforme o scroll — caixa, bezel, coroa, mostrador, ponteiros, trem de engrenagens, espiral, escape, rotor, tourbillon — e remonta no caminho inverso exato.",
      en: "The AX-01 is a 100% procedural calibre that disassembles piece by piece on scroll — case, bezel, crown, dial, hands, gear train, hairspring, escapement, rotor, tourbillon — and reassembles along the exact reverse path.",
    },
    steps: [
      { label: "FILM", text: { pt: "Quinze cenas com canvas fixo, roteiro em arquivo único e câmera com damping — a arquitetura herdada do Aurex Motors.", en: "Fifteen scenes with a fixed canvas, a single-file script and a damped camera — the architecture inherited from Aurex Motors." }, image: "/shots/aurex-timepieces.webp" },
      { label: "EXPLODE", text: { pt: "Cada <Part> tem posição de origem, deslocamento, rotação e uma janela (delay/span). Um smoothstep lê o valor global de explosão e cada peça sai e volta em cascata.", en: "Every <Part> has a home position, offset, rotation and a window (delay/span). A smoothstep reads the global explode value and each piece slides out and back in cascade." }, image: "/shots/aurex-timepieces/config.webp" },
      { label: "CONFIGURE", text: { pt: "Configurador com troca de material em tempo real e galeria 360° por arrasto; quatro expressões do mesmo calibre.", en: "A configurator with real-time material swaps and a drag-to-rotate 360° gallery; four expressions of the same calibre." }, image: "/shots/aurex-timepieces/colecao.webp" },
    ],
    fullBleed: { src: "/shots/aurex-timepieces.webp", alt: { pt: "Time perfected — o AX-01 em close", en: "Time perfected — the AX-01 up close" } },
    hood: [
      { label: "EXPLOSION SYSTEM", summary: { pt: "Janela delay/span por peça + smoothstep sobre um progresso global; remontagem é o caminho inverso, não outra animação.", en: "Per-part delay/span window + smoothstep over a global progress; reassembly is the reverse path, not another animation." }, paragraph: 0 },
      { label: "PROCEDURAL WATCH", summary: { pt: "Caixa em anel (ExtrudeGeometry), 5 engrenagens paramétricas com dentes instanciados, espiral de Arquimedes, escape, tourbillon.", en: "Ring case (ExtrudeGeometry), 5 parametric gears with instanced teeth, Archimedean spiral, escapement, tourbillon." }, paragraph: 1 },
      { label: "RAYCAST DEBUG", summary: { pt: "Uma tampa invisível tapou o mostrador por uma sessão inteira; um raycast do centro da tela listou os hits e expôs o bug.", en: "An invisible cap hid the dial for an entire session; a raycast from screen center listed hits and exposed the bug." }, paragraph: 1 },
      { label: "MATERIALS", summary: { pt: "CanvasTexture no mostrador foi o maior salto de realismo a custo zero; vidro em MeshBasicMaterial para matar o véu de Fresnel.", en: "A CanvasTexture on the dial was the biggest realism jump at zero cost; glass as MeshBasicMaterial to kill the Fresnel veil." }, paragraph: 2 },
    ],
    flow: [],
    stats: [
      { value: "15", label: { pt: "cenas", en: "scenes" } },
      { value: "10", label: { pt: "peças que se desmontam", en: "parts that come apart" } },
      { value: "05", label: { pt: "engrenagens paramétricas", en: "parametric gears" } },
      { value: "360°", label: { pt: "galeria por arrasto", en: "drag gallery" } },
    ],
    result: [{ pt: "Projeto autoral, no ar", en: "Studio project, live" }, { pt: "Relógio 100% procedural em R3F", en: "100% procedural watch in R3F" }],
    screens: [
      { src: "/shots/aurex-timepieces/config.webp", alt: { pt: "Configurador em tempo real", en: "Real-time configurator" }, layout: "full" },
      { src: "/shots/aurex-timepieces/colecao.webp", alt: { pt: "A coleção: quatro expressões", en: "The collection: four expressions" }, layout: "wide" },
      { src: "/shots/aurex-timepieces.webp", alt: { pt: "Time perfected", en: "Time perfected" }, layout: "crop" },
    ],
    words: ["MECHANICS", "TIME", "PRECISION", "EXPLOSION", "ROTATION"],
  },
};

/** Convenção de idioma: rótulos estruturais em inglês (voz do studio); corpo localizado. */
export const CASE_LABELS = {
  intro: "PROJECT",
  hero: "01 / HERO",
  idea: "02 / THE IDEA",
  experience: "03 / EXPERIENCE",
  hood: "04 / UNDER THE HOOD",
  details: "05 / DETAILS",
  result: "06 / RESULT",
  screens: "07 / SELECTED SCREENS",
  next: "NEXT EXPERIENCE",
  client: "CLIENT",
  studio: "STUDIO",
  type: "TYPE",
  year: "YEAR",
  status: "STATUS",
  live: "LIVE",
  visit: "VISIT",
  code: "CODE",
  builtWith: "BUILT WITH",
  expand: { pt: "Ler o detalhe técnico", en: "Read the technical detail" } as Localized,
  allWork: "ALL WORK",
  enter: { pt: "Entrar na experiência", en: "Enter experience" } as Localized,
};
