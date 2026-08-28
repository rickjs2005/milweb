import type { Localized } from "@/lib/content";

/**
 * Camada editorial dos cases selecionados. Cada campo aqui é derivado de
 * fatos que já estão nas narrativas de content.ts — nada é inventado.
 * Projetos sem entrada usam o fallback genérico em sections/case.
 */
export type Screen = { src: string; alt: Localized; layout: "full" | "wide" | "offset" | "crop" };

export type CaseVariant = "kavita" | "terral" | "vertex" | "aurex";

export type LocalizedList = { pt: string[]; en: string[]; es: string[] };

export type CaseStory = {
  /** Direção de arte/mecânica do case (hero, experience, diagrama). */
  variant: CaseVariant;
  /** Frase-headline do capítulo THE IDEA (curta, editorial). */
  ideaHeadline: Localized;
  ideaBody: Localized;
  /** Passos do capítulo EXPERIENCE: texto muda, mídia acompanha (sticky). */
  steps: { label: Localized; text: Localized; image: string }[];
  /** Momento full-bleed sem texto. */
  fullBleed: { src: string; alt: Localized };
  /** UNDER THE HOOD: resumo em pontos; cada ponto abre o parágrafo N da narrativa. */
  hood: { label: Localized; summary: Localized; paragraph: number }[];
  /** Fluxo técnico real, em caixas. */
  flow: LocalizedList;
  /** Números verdadeiros do projeto. */
  stats: { value: string; label: Localized }[];
  /** Resultado em duas linhas. */
  result: [Localized, Localized];
  screens: Screen[];
  /** Palavras da direção de arte (usadas como marquee/labels discretos). */
  words: LocalizedList;
};

export const CASE_STORIES: Record<string, CaseStory> = {
  "kavita-drones": {
    variant: "kavita",
    ideaHeadline: { pt: "A revenda precisava transformar catálogo em conversa.", en: "The reseller needed to turn a catalog into a conversation.", es: "La reventa necesitaba convertir el catálogo en conversación." },
    ideaBody: {
      pt: "Uma landing de drones agrícolas não vende sozinha — ela precisa entregar um orçamento pronto, no WhatsApp da filial certa, sem inventar uma especificação sequer. Sem framework, sem build: só HTML, CSS e JavaScript escritos à mão.",
      en: "An agricultural-drone landing page doesn't sell on its own — it has to deliver a ready quote to the right branch's WhatsApp, without inventing a single spec. No framework, no build step: hand-written HTML, CSS and JavaScript.",
      es: "Una landing de drones agrícolas no vende sola: tiene que entregar un presupuesto listo, en el WhatsApp de la sucursal correcta, sin inventar una sola especificación. Sin framework, sin build: solo HTML, CSS y JavaScript escritos a mano.",
    },
    steps: [
      { label: { pt: "CATÁLOGO", en: "CATALOG", es: "CATÁLOGO" }, text: { pt: "26 equipamentos em 5 categorias, cada item com status de confirmação por campo. Filtros de categoria e de compatibilidade com os 3 drones (T25P, T70P, T100) combinados em AND.", en: "26 pieces of equipment across 5 categories, each with per-field confirmation status. Category and drone-compatibility filters (T25P, T70P, T100) combined with AND logic.", es: "26 equipos en 5 categorías, cada ítem con estado de confirmación por campo. Filtros de categoría y de compatibilidad con los 3 drones (T25P, T70P, T100) combinados en AND." }, image: "/shots/kavita-drones/equipamentos.webp" },
      { label: { pt: "DRONES", en: "DRONES", es: "DRONES" }, text: { pt: "Três modelos DJI Agras comparados lado a lado: pulverização, dispersão, garantia. Contadores animados nascem do próprio HTML — sem JS, o número já está certo.", en: "Three DJI Agras models compared side by side: spraying, spreading, warranty. Animated counters are born from the HTML itself — with no JS, the final number is already right.", es: "Tres modelos DJI Agras comparados lado a lado: pulverización, dispersión, garantía. Los contadores animados nacen del propio HTML: sin JS, el número ya está correcto." }, image: "/shots/kavita-drones/drones.webp" },
      { label: { pt: "ORÇAMENTO", en: "BUDGET", es: "PRESUPUESTO" }, text: { pt: "Um mini-carrinho sem loja: drones, equipamentos e serviços entram num orçamento que persiste em localStorage entre visitas, com contador em tempo real.", en: "A mini-cart with no store behind it: drones, equipment and services go into a budget that persists in localStorage across visits, with a live counter.", es: "Un minicarrito sin tienda: drones, equipos y servicios entran en un presupuesto que persiste en localStorage entre visitas, con contador en tiempo real." }, image: "/shots/kavita-drones/hero.webp" },
      { label: { pt: "ROTEAMENTO", en: "ROUTING", es: "ENRUTAMIENTO" }, text: { pt: "No envio, a mensagem sai estruturada em blocos e vai para o WhatsApp da unidade escolhida — 4 filiais em MG, ES e RJ, com fallback para o número padrão.", en: "On submit, the message goes out structured in blocks to the chosen unit's WhatsApp — 4 branches across MG, ES and RJ, with a default fallback.", es: "Al enviar, el mensaje sale estructurado en bloques y va al WhatsApp de la unidad elegida: 4 sucursales en MG, ES y RJ, con fallback al número predeterminado." }, image: "/shots/kavita-drones.webp" },
    ],
    fullBleed: { src: "/shots/kavita-drones/hero.webp", alt: { pt: "Hero da Kavita Drones: drone DJI Agras sobre a lavoura", en: "Kavita Drones hero: a DJI Agras drone over the field", es: "Hero de Kavita Drones: dron DJI Agras sobre el cultivo" } },
    hood: [
      { label: { pt: "SEM FRAMEWORK", en: "ZERO FRAMEWORK", es: "SIN FRAMEWORK" }, summary: { pt: "HTML5 semântico, CSS puro e JS vanilla, sem build. Cloudflare Workers servindo estáticos.", en: "Semantic HTML5, plain CSS and vanilla JS, no build step. Cloudflare Workers serving static assets.", es: "HTML5 semántico, CSS puro y JS vanilla, sin build. Cloudflare Workers sirviendo estáticos." }, paragraph: 0 },
      { label: { pt: "MODELO DE DADOS", en: "DATA MODEL", es: "MODELO DE DATOS" }, summary: { pt: "Catálogo como dado governado: cada item carrega status confirmado/pendente. Nada é inventado.", en: "Catalog as governed data: every item carries a confirmed/pending status. Nothing is invented.", es: "Catálogo como dato gobernado: cada ítem lleva estado confirmado/pendiente. Nada es inventado." }, paragraph: 1 },
      { label: { pt: "ORÇAMENTO + ROTEAMENTO", en: "BUDGET + ROUTING", es: "PRESUPUESTO + ENRUTAMIENTO" }, summary: { pt: "Orçamento em localStorage com fallback silencioso; REPRESENTATIVES mapeia 4 filiais para 4 números.", en: "localStorage budget with a silent fallback; REPRESENTATIVES maps 4 branches to 4 numbers.", es: "Presupuesto en localStorage con fallback silencioso; REPRESENTATIVES mapea 4 sucursales a 4 números." }, paragraph: 2 },
      { label: { pt: "PERFORMANCE", en: "PERFORMANCE", es: "PERFORMANCE" }, summary: { pt: "preload + fetchpriority no hero, vídeo pausa fora da viewport, contadores em rAF com easing manual, tema via matchMedia.", en: "preload + fetchpriority on the hero, video pauses off-screen, rAF counters with hand-written easing, theme via matchMedia.", es: "preload + fetchpriority en el hero, el video se pausa fuera del viewport, contadores en rAF con easing manual, tema vía matchMedia." }, paragraph: 3 },
    ],
    flow: { pt: ["USUÁRIO", "CATÁLOGO", "ORÇAMENTO", "ROTEAMENTO POR FILIAL", "WHATSAPP"], en: ["USER", "CATALOG", "BUDGET", "BRANCH ROUTING", "WHATSAPP"], es: ["USUARIO", "CATÁLOGO", "PRESUPUESTO", "ENRUTAMIENTO POR SUCURSAL", "WHATSAPP"] },
    stats: [
      { value: "26", label: { pt: "equipamentos", en: "equipment items", es: "equipos" } },
      { value: "04", label: { pt: "rotas regionais", en: "regional routes", es: "rutas regionales" } },
      { value: "0", label: { pt: "frameworks", en: "frameworks", es: "frameworks" } },
      { value: "~7.200", label: { pt: "linhas à mão", en: "hand-written lines", es: "líneas a mano" } },
    ],
    result: [{ pt: "No ar em kavita.com.br", en: "Live at kavita.com.br", es: "En línea en kavita.com.br" }, { pt: "Cliente real — Kavita Agro", en: "Real client — Kavita Agro", es: "Cliente real — Kavita Agro" }],
    screens: [
      { src: "/shots/kavita-drones/drones.webp", alt: { pt: "Comparativo dos 3 modelos DJI Agras", en: "Comparison of the 3 DJI Agras models", es: "Comparativo de los 3 modelos DJI Agras" }, layout: "full" },
      { src: "/shots/kavita-drones/equipamentos.webp", alt: { pt: "Catálogo de equipamentos com filtros", en: "Equipment catalog with filters", es: "Catálogo de equipos con filtros" }, layout: "offset" },
      { src: "/shots/kavita-drones.webp", alt: { pt: "Hero em produção", en: "Production hero", es: "Hero en producción" }, layout: "crop" },
    ],
    words: { pt: ["PRECISÃO", "CAMPO", "TECNOLOGIA", "AGRICULTURA", "ROTEAMENTO"], en: ["PRECISION", "FIELD", "TECHNOLOGY", "AGRICULTURE", "ROUTING"], es: ["PRECISIÓN", "CAMPO", "TECNOLOGÍA", "AGRICULTURA", "ENRUTAMIENTO"] },
  },

  terral: {
    variant: "terral",
    ideaHeadline: { pt: "Café é sobre esperar o tempo certo.", en: "Coffee is about waiting the right amount of time.", es: "El café es cuestión de esperar el tiempo justo." },
    ideaBody: {
      pt: "Sites de café mostram sacas paradas. O Terral conta o caminho do grão em cinco capítulos guiados pelo scroll — Caparaó, Terreiro, Tambor, Moenda, Xícara — em que a tipografia gigante faz o papel da imagem e o vídeo real faz o papel do argumento.",
      en: "Coffee sites show static bags. Terral tells the bean's path in five scroll-driven chapters — Caparaó, drying yard, drum, grind, cup — where giant typography does the image's job and real footage does the argument's.",
      es: "Los sitios de café muestran sacos quietos. Terral cuenta el camino del grano en cinco capítulos guiados por el scroll —Caparaó, patio de secado, tambor, molienda, taza— donde la tipografía gigante hace el papel de la imagen y el video real hace el papel del argumento.",
    },
    steps: [
      { label: { pt: "CAPARAÓ", en: "CAPARAÓ", es: "CAPARAÓ" }, text: { pt: "Cada capítulo divide a tela entre imagem viva e título editorial. Grãos flutuam em parallax costurando as transições.", en: "Each chapter splits the screen between living imagery and an editorial title. Beans float in parallax, stitching the transitions.", es: "Cada capítulo divide la pantalla entre imagen viva y título editorial. Los granos flotan en parallax cosiendo las transiciones." }, image: "/shots/terral.webp" },
      { label: { pt: "TERREIRO", en: "TERREIRO", es: "TERREIRO" }, text: { pt: "O sol faz metade do trabalho: terreiros de secagem e a pá revolvendo os grãos, em vídeo e fotografia reais.", en: "The sun does half the work: drying beds and a paddle turning the beans, in real video and photography.", es: "El sol hace la mitad del trabajo: patios de secado y la pala removiendo los granos, en video y fotografía reales." }, image: "/shots/terral/sol.webp" },
      { label: { pt: "VERTENTE", en: "VERTENTE", es: "VERTENTE" }, text: { pt: "Depois da jornada o site vira loja: três blends com origem, altitude, nota SCA e perfil sensorial, pedido direto no WhatsApp.", en: "Past the journey the site becomes a shop: three blends with origin, altitude, SCA score and tasting profile, ordered directly on WhatsApp.", es: "Después del recorrido el sitio se vuelve tienda: tres blends con origen, altitud, puntaje SCA y perfil sensorial, pedido directo por WhatsApp." }, image: "/shots/terral/vertente.webp" },
      { label: { pt: "HOLD 6S", en: "HOLD 6S", es: "HOLD 6S" }, text: { pt: "Um botão discreto pede que o visitante segure por seis segundos. Quem espera ganha a casa do torrador e um código que dobra o café do primeiro pacote.", en: "A discreet button asks the visitor to hold for six seconds. Whoever waits earns the roaster's house and a code that doubles the first bag.", es: "Un botón discreto le pide al visitante que mantenga presionado seis segundos. Quien espera gana la casa del tostador y un código que duplica el café del primer paquete." }, image: "/shots/terral/casa-do-torrador.webp" },
    ],
    fullBleed: { src: "/shots/terral/sol.webp", alt: { pt: "Terreiro de secagem ao sol", en: "Sun-drying yard", es: "Patio de secado al sol" } },
    hood: [
      { label: { pt: "MOTOR DE CAPÍTULOS", en: "CHAPTER ENGINE", es: "MOTOR DE CAPÍTULOS" }, summary: { pt: "Cinco capítulos no scroll, meia tela de história, meia de vídeo e foto reais; grãos em parallax nas transições.", en: "Five scroll chapters, half a screen of story, half of real video and photo; parallax beans across transitions.", es: "Cinco capítulos en el scroll, media pantalla de historia, media de video y foto reales; granos en parallax en las transiciones." }, paragraph: 0 },
      { label: { pt: "LOJA", en: "SHOP", es: "TIENDA" }, summary: { pt: "Vitrine de blends com notas SCA e pedido no WhatsApp; rodapé com letreiro TERRAL de ponta a ponta e marquee.", en: "Blend showcase with SCA scores and WhatsApp ordering; footer with an edge-to-edge TERRAL letterpress and marquee.", es: "Vitrina de blends con puntajes SCA y pedido por WhatsApp; pie con letrero TERRAL de punta a punta y marquee." }, paragraph: 1 },
      { label: { pt: "O SEGREDO", en: "THE SECRET", es: "EL SECRETO" }, summary: { pt: "Hold de seis segundos revela a casa do torrador — a tese do site num gesto.", en: "A six-second hold reveals the roaster's house — the site's thesis in one gesture.", es: "Un hold de seis segundos revela la casa del tostador: la tesis del sitio en un gesto." }, paragraph: 2 },
    ],
    flow: { pt: [], en: [], es: [] },
    stats: [
      { value: "05", label: { pt: "capítulos", en: "chapters", es: "capítulos" } },
      { value: "03", label: { pt: "blends", en: "blends", es: "blends" } },
      { value: "6s", label: { pt: "de espera pelo segredo", en: "hold for the secret", es: "de espera por el secreto" } },
      { value: "2×", label: { pt: "café no primeiro pacote", en: "coffee in the first bag", es: "de café en el primer paquete" } },
    ],
    result: [{ pt: "Projeto autoral, no ar", en: "Studio project, live", es: "Proyecto propio, en línea" }, { pt: "Marca fictícia — conceito MilWeb", en: "Fictional brand — a MilWeb concept", es: "Marca ficticia — concepto MilWeb" }],
    screens: [
      { src: "/shots/terral/vertente.webp", alt: { pt: "Vitrine VERTENTE", en: "VERTENTE showcase", es: "Vitrina VERTENTE" }, layout: "full" },
      { src: "/shots/terral/casa-do-torrador.webp", alt: { pt: "A casa do torrador", en: "The roaster's house", es: "La casa del tostador" }, layout: "wide" },
      { src: "/shots/terral.webp", alt: { pt: "Abertura com o grão", en: "Opening with the bean", es: "Apertura con el grano" }, layout: "crop" },
    ],
    words: { pt: ["ORIGEM", "TEMPO", "CALOR", "TEXTURA", "PACIÊNCIA"], en: ["ORIGIN", "TIME", "HEAT", "TEXTURE", "PATIENCE"], es: ["ORIGEN", "TIEMPO", "CALOR", "TEXTURA", "PACIENCIA"] },
  },

  "atelier-vertex": {
    variant: "vertex",
    ideaHeadline: { pt: "Rolar constrói o prédio. Voltar desconstrói.", en: "Scrolling builds the building. Scrolling back tears it down.", es: "Desplazarse construye el edificio. Volver lo desmonta." },
    ideaBody: {
      pt: "Um escritório de arquitetura vende execução, não fotos. O site é um filme real de obra — do andaime à fachada — cujo tempo pertence 100% ao scroll, sem autoplay. No meio, o vídeo escurece e vira mesa de luz: a planta se desenha com cotas reais.",
      en: "An architecture firm sells execution, not photos. The site is a real construction film — scaffolding to façade — whose time belongs entirely to the scroll, no autoplay. Midway, the video dims into a light table: the floor plan draws itself with real dimensions.",
      es: "Un estudio de arquitectura vende ejecución, no fotos. El sitio es una película real de obra —del andamio a la fachada— cuyo tiempo pertenece 100% al scroll, sin autoplay. A la mitad, el video se oscurece y se vuelve mesa de luz: el plano se dibuja con cotas reales.",
    },
    steps: [
      { label: { pt: "SCRUB", en: "SCRUB", es: "SCRUB" }, text: { pt: "Um ScrollTrigger por seção escreve (cena, progresso); um rAF lê isso a cada frame e persegue o currentTime do vídeo com damping. Pular de cena é um dolly de tempo, nunca um corte seco.", en: "One ScrollTrigger per section writes (scene, progress); a rAF loop reads it every frame and chases the video's currentTime with damping. Jumping scenes is a time dolly, never a hard cut.", es: "Un ScrollTrigger por sección escribe (escena, progreso); un rAF lo lee en cada frame y persigue el currentTime del video con damping. Saltar de escena es un dolly de tiempo, nunca un corte seco." }, image: "/shots/atelier-vertex.webp" },
      { label: { pt: "PRANCHA", en: "SHEET", es: "LÁMINA" }, text: { pt: "O vídeo escurece até virar uma mesa de luz e a planta do pavimento tipo se desenha amarrada ao scroll: paredes, mobiliário, cotas e carimbo (ESC 1:75).", en: "The video dims into a light table and the floor plan draws itself in sync with scroll: walls, furniture, dimensions and a drafting stamp (SCALE 1:75).", es: "El video se oscurece hasta volverse mesa de luz y el plano de la planta tipo se dibuja atado al scroll: paredes, mobiliario, cotas y rótulo (ESC 1:75)." }, image: "/shots/atelier-vertex/prancha.webp" },
      { label: { pt: "ENTREGUE", en: "DELIVERED", es: "ENTREGADO" }, text: { pt: "Depois do filme, o site vira o arquivo do estúdio: obras, processo e contato, com trilho de progresso e cursor próprio.", en: "After the film, the site becomes the studio's archive: works, process and contact, with a progress rail and a custom cursor.", es: "Después de la película, el sitio se vuelve el archivo del estudio: obras, proceso y contacto, con riel de progreso y cursor propio." }, image: "/shots/atelier-vertex/entregue.webp" },
    ],
    fullBleed: { src: "/shots/atelier-vertex/prancha.webp", alt: { pt: "Planta se desenhando sobre o vídeo escurecido", en: "Floor plan drawing itself over the dimmed video", es: "Plano dibujándose sobre el video oscurecido" } },
    hood: [
      { label: { pt: "MOTOR DE SCROLL", en: "SCROLL ENGINE", es: "MOTOR DE SCROLL" }, summary: { pt: "Estado mutável compartilhado (world.ts), ScrollTrigger escreve, rAF lê e persegue o vídeo com damping. Roteiro em scenes.ts.", en: "Shared mutable state (world.ts): ScrollTrigger writes, rAF reads and chases the video with damping. Script in scenes.ts.", es: "Estado mutable compartido (world.ts): ScrollTrigger escribe, rAF lee y persigue el video con damping. Guion en scenes.ts." }, paragraph: 0 },
      { label: { pt: "VIDEO SCRUB", en: "VIDEO SCRUB", es: "VIDEO SCRUB" }, summary: { pt: "GOP 1 — todo frame é keyframe, senão o seek engasga. Arquivo maior, pago conscientemente.", en: "GOP 1 — every frame is a keyframe, otherwise seeking stutters. Bigger file, paid knowingly.", es: "GOP 1 — cada frame es keyframe; si no, el seek se traba. Archivo más pesado, pagado a conciencia." }, paragraph: 0 },
      { label: { pt: "PLANTA", en: "BLUEPRINT", es: "PLANO" }, summary: { pt: "Planta com pathLength=1; fronteiras das cenas calibradas extraindo frames a cada 0,5 s (transformação real entre 40% e 70%).", en: "Floor plan via pathLength=1; scene boundaries calibrated by extracting frames every 0.5 s (real transformation between 40% and 70%).", es: "Plano con pathLength=1; fronteras de las escenas calibradas extrayendo frames cada 0,5 s (transformación real entre 40% y 70%)." }, paragraph: 1 },
      { label: { pt: "AUDITORIA DE DESIGN", en: "DESIGN AUDIT", es: "AUDITORÍA DE DISEÑO" }, summary: { pt: "Auto-auditoria 0–10 contra o build real: header ilegível e menu mobile quebrado por backdrop-filter — corrigidos.", en: "0–10 self-audit against the real build: illegible header and a mobile menu broken by backdrop-filter — both fixed.", es: "Autoauditoría 0–10 contra el build real: header ilegible y menú móvil roto por backdrop-filter — corregidos." }, paragraph: 2 },
    ],
    flow: { pt: [], en: [], es: [] },
    stats: [
      { value: "100%", label: { pt: "do vídeo no scroll", en: "of the film on scroll", es: "del video en el scroll" } },
      { value: "GOP 1", label: { pt: "todo frame é keyframe", en: "every frame a keyframe", es: "cada frame es keyframe" } },
      { value: "0,5s", label: { pt: "entre frames analisados", en: "between sampled frames", es: "entre frames analizados" } },
      { value: "1:75", label: { pt: "escala da prancha", en: "blueprint scale", es: "escala del plano" } },
    ],
    result: [{ pt: "Projeto autoral, no ar", en: "Studio project, live", es: "Proyecto propio, en línea" }, { pt: "Vídeo real de obra, 100% scroll-driven", en: "Real construction footage, 100% scroll-driven", es: "Video real de obra, 100% scroll-driven" }],
    screens: [
      { src: "/shots/atelier-vertex/entregue.webp", alt: { pt: "Cena final: prédio entregue", en: "Final scene: building delivered", es: "Escena final: edificio entregado" }, layout: "full" },
      { src: "/shots/atelier-vertex.webp", alt: { pt: "Abertura: do andaime à fachada", en: "Opening: scaffolding to façade", es: "Apertura: del andamio a la fachada" }, layout: "offset" },
      { src: "/shots/atelier-vertex/prancha.webp", alt: { pt: "Prancha — planta e cotas", en: "Blueprint — plan and dimensions", es: "Lámina — plano y cotas" }, layout: "crop" },
    ],
    words: { pt: ["GRID", "MEDIDA", "PROCESSO", "CONSTRUÇÃO"], en: ["GRID", "MEASURE", "PROCESS", "CONSTRUCTION"], es: ["GRID", "MEDIDA", "PROCESO", "CONSTRUCCIÓN"] },
  },

  "aurex-timepieces": {
    variant: "aurex",
    ideaHeadline: { pt: "Foto parada não justifica preço. Mecânica, sim.", en: "A still photo doesn't justify a price. Mechanics do.", es: "Una foto quieta no justifica el precio. La mecánica, sí." },
    ideaBody: {
      pt: "O AX-01 é um calibre 100% procedural que se desmonta peça por peça conforme o scroll — caixa, bezel, coroa, mostrador, ponteiros, trem de engrenagens, espiral, escape, rotor, tourbillon — e remonta no caminho inverso exato.",
      en: "The AX-01 is a 100% procedural calibre that disassembles piece by piece on scroll — case, bezel, crown, dial, hands, gear train, hairspring, escapement, rotor, tourbillon — and reassembles along the exact reverse path.",
      es: "El AX-01 es un calibre 100% procedural que se desarma pieza por pieza con el scroll —caja, bisel, corona, esfera, agujas, tren de engranajes, espiral, escape, rotor, tourbillon— y se rearma por el camino inverso exacto.",
    },
    steps: [
      { label: { pt: "FILME", en: "FILM", es: "PELÍCULA" }, text: { pt: "Quinze cenas com canvas fixo, roteiro em arquivo único e câmera com damping — a arquitetura herdada do Aurex Motors.", en: "Fifteen scenes with a fixed canvas, a single-file script and a damped camera — the architecture inherited from Aurex Motors.", es: "Quince escenas con canvas fijo, guion en un único archivo y cámara con damping: la arquitectura heredada de Aurex Motors." }, image: "/shots/aurex-timepieces.webp" },
      { label: { pt: "EXPLOSÃO", en: "EXPLODE", es: "EXPLOSIÓN" }, text: { pt: "Cada <Part> tem posição de origem, deslocamento, rotação e uma janela (delay/span). Um smoothstep lê o valor global de explosão e cada peça sai e volta em cascata.", en: "Every <Part> has a home position, offset, rotation and a window (delay/span). A smoothstep reads the global explode value and each piece slides out and back in cascade.", es: "Cada <Part> tiene posición de origen, desplazamiento, rotación y una ventana (delay/span). Un smoothstep lee el valor global de explosión y cada pieza sale y vuelve en cascada." }, image: "/shots/aurex-timepieces/config.webp" },
      { label: { pt: "CONFIGURAR", en: "CONFIGURE", es: "CONFIGURAR" }, text: { pt: "Configurador com troca de material em tempo real e galeria 360° por arrasto; quatro expressões do mesmo calibre.", en: "A configurator with real-time material swaps and a drag-to-rotate 360° gallery; four expressions of the same calibre.", es: "Configurador con cambio de material en tiempo real y galería 360° por arrastre; cuatro expresiones del mismo calibre." }, image: "/shots/aurex-timepieces/colecao.webp" },
    ],
    fullBleed: { src: "/shots/aurex-timepieces.webp", alt: { pt: "Time perfected — o AX-01 em close", en: "Time perfected — the AX-01 up close", es: "Time perfected — el AX-01 de cerca" } },
    hood: [
      { label: { pt: "SISTEMA DE EXPLOSÃO", en: "EXPLOSION SYSTEM", es: "SISTEMA DE EXPLOSIÓN" }, summary: { pt: "Janela delay/span por peça + smoothstep sobre um progresso global; remontagem é o caminho inverso, não outra animação.", en: "Per-part delay/span window + smoothstep over a global progress; reassembly is the reverse path, not another animation.", es: "Ventana delay/span por pieza + smoothstep sobre un progreso global; el rearmado es el camino inverso, no otra animación." }, paragraph: 0 },
      { label: { pt: "RELÓGIO PROCEDURAL", en: "PROCEDURAL WATCH", es: "RELOJ PROCEDURAL" }, summary: { pt: "Caixa em anel (ExtrudeGeometry), 5 engrenagens paramétricas com dentes instanciados, espiral de Arquimedes, escape, tourbillon.", en: "Ring case (ExtrudeGeometry), 5 parametric gears with instanced teeth, Archimedean spiral, escapement, tourbillon.", es: "Caja en anillo (ExtrudeGeometry), 5 engranajes paramétricos con dientes instanciados, espiral de Arquímedes, escape, tourbillon." }, paragraph: 1 },
      { label: { pt: "RAYCAST DEBUG", en: "RAYCAST DEBUG", es: "RAYCAST DEBUG" }, summary: { pt: "Uma tampa invisível tapou o mostrador por uma sessão inteira; um raycast do centro da tela listou os hits e expôs o bug.", en: "An invisible cap hid the dial for an entire session; a raycast from screen center listed hits and exposed the bug.", es: "Una tapa invisible cubrió la esfera durante una sesión entera; un raycast desde el centro de la pantalla listó los hits y expuso el bug." }, paragraph: 1 },
      { label: { pt: "MATERIAIS", en: "MATERIALS", es: "MATERIALES" }, summary: { pt: "CanvasTexture no mostrador foi o maior salto de realismo a custo zero; vidro em MeshBasicMaterial para matar o véu de Fresnel.", en: "A CanvasTexture on the dial was the biggest realism jump at zero cost; glass as MeshBasicMaterial to kill the Fresnel veil.", es: "CanvasTexture en la esfera fue el mayor salto de realismo a costo cero; vidrio en MeshBasicMaterial para matar el velo de Fresnel." }, paragraph: 2 },
    ],
    flow: { pt: [], en: [], es: [] },
    stats: [
      { value: "15", label: { pt: "cenas", en: "scenes", es: "escenas" } },
      { value: "10", label: { pt: "peças que se desmontam", en: "parts that come apart", es: "piezas que se desarman" } },
      { value: "05", label: { pt: "engrenagens paramétricas", en: "parametric gears", es: "engranajes paramétricos" } },
      { value: "360°", label: { pt: "galeria por arrasto", en: "drag gallery", es: "galería por arrastre" } },
    ],
    result: [{ pt: "Projeto autoral, no ar", en: "Studio project, live", es: "Proyecto propio, en línea" }, { pt: "Relógio 100% procedural em R3F", en: "100% procedural watch in R3F", es: "Reloj 100% procedural en R3F" }],
    screens: [
      { src: "/shots/aurex-timepieces/config.webp", alt: { pt: "Configurador em tempo real", en: "Real-time configurator", es: "Configurador en tiempo real" }, layout: "full" },
      { src: "/shots/aurex-timepieces/colecao.webp", alt: { pt: "A coleção: quatro expressões", en: "The collection: four expressions", es: "La colección: cuatro expresiones" }, layout: "wide" },
      { src: "/shots/aurex-timepieces.webp", alt: { pt: "Time perfected", en: "Time perfected", es: "Time perfected" }, layout: "crop" },
    ],
    words: { pt: ["MECÂNICA", "TEMPO", "PRECISÃO", "EXPLOSÃO", "ROTAÇÃO"], en: ["MECHANICS", "TIME", "PRECISION", "EXPLOSION", "ROTATION"], es: ["MECÁNICA", "TIEMPO", "PRECISIÓN", "EXPLOSIÓN", "ROTACIÓN"] },
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
  expand: { pt: "Ler o detalhe técnico", en: "Read the technical detail", es: "Leer el detalle técnico" } as Localized,
  allWork: "ALL WORK",
  enter: { pt: "Entrar na experiência", en: "Enter experience", es: "Entrar a la experiencia" } as Localized,
};
