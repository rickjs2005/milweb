import type { Project } from "./content";

/**
 * Projetos — parte 4/4: turismo e guias (demos comerciais e conceitos de
 * 2026). A ordem editorial mora em src/data/projects.ts.
 *
 * Fatos vêm dos próprios repositórios (README, estado do projeto, dados de
 * negócio) — nada inventado. Duas demos (Said e Mabrouk) ficam atrás do login
 * da Vercel: `live` fica comentado até a URL pública existir; enquanto isso
 * `demo: true` mantém o selo de demonstração.
 */
export const PROJECTS_4: Project[] = [
  {
    slug: "debby-tour",
    category: "institucional-premium",
    title: "Debby Tours & Transfers",
    tagline: { pt: "Passeios e transfers em Melbourne · proposta de site novo", en: "Tours and transfers in Melbourne · new website proposal", es: "Paseos y traslados en Melbourne · propuesta de sitio nuevo" },
    problem: {
      pt: "A operadora de passeios e transfers de Melbourne tinha um site de catálogo que não contava a experiência: quatro passeios, transfers de aeroporto e transporte para artistas misturados numa lista.",
      en: "The Melbourne tour and transfer operator had a catalogue website that didn't tell the experience: four tours, airport transfers and artist transport mixed into one list.",
      es: "La operadora de paseos y traslados de Melbourne tenía un sitio de catálogo que no contaba la experiencia: cuatro paseos, traslados de aeropuerto y transporte para artistas mezclados en una lista.",
    },
    result: {
      pt: "Demo em inglês e português com abertura em paisagem, quatro passeios como destinos próprios (Great Ocean Road com roteiro visual em sete etapas), transfers em quatro abas com mapa da rota, transporte para artistas, planejador com pedido contínuo e um painel de demonstração que roda só no navegador.",
      en: "English and Portuguese demo with a landscape opening, four tours as destinations of their own (Great Ocean Road with a seven-step visual itinerary), transfers in four tabs with route maps, artist transport, a planner with a continuous order and a demo admin panel that runs only in the browser.",
      es: "Demo en inglés y portugués con apertura en paisaje, cuatro paseos como destinos propios (Great Ocean Road con itinerario visual en siete etapas), traslados en cuatro pestañas con mapa de ruta, transporte para artistas, planificador con pedido continuo y un panel de demostración que corre solo en el navegador.",
    },
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind 4"],
    metric: { pt: "4 passeios · 4 transfers · 2 idiomas", en: "4 tours · 4 transfers · 2 languages", es: "4 paseos · 4 traslados · 2 idiomas" },
    status: { pt: "Proposta comercial · demo", en: "Commercial proposal · demo", es: "Propuesta comercial · demo" },
    note: { pt: "Demo de modernização para a empresa real; não é o site oficial.", en: "Modernisation demo for the real company; not the official website.", es: "Demo de modernización para la empresa real; no es el sitio oficial." },
    live: "https://debby-tour.vercel.app",
    image: "/shots/debby-tour.webp",
    caseStudy: {
      narrative: [],
      highlights: [
        {
          label: { pt: "Pedido contínuo", en: "Continuous order", es: "Pedido continuo" },
          detail: { pt: "Planejador e páginas de passeio leem e gravam o mesmo registro na aba: privativo para seis segue privativo para seis, com o transfer junto.", en: "Planner and tour pages read and write the same record in the tab: private for six stays private for six, transfer included.", es: "Planificador y páginas de paseo leen y escriben el mismo registro en la pestaña: privado para seis sigue privado para seis, con el traslado incluido." },
        },
        {
          label: { pt: "Transfers com mapa", en: "Transfers with maps", es: "Traslados con mapa" },
          detail: { pt: "Quatro abas, cada uma com cena, mapa da rota e botão que abre o formulário já com o serviço escolhido; o horário aparece no relógio da cidade.", en: "Four tabs, each with a scene, a route map and a button that opens the form with the service preselected; time shown on the city's clock.", es: "Cuatro pestañas, cada una con escena, mapa de ruta y botón que abre el formulario con el servicio elegido; la hora aparece en el reloj de la ciudad." },
        },
        {
          label: { pt: "Painel só no navegador", en: "Browser-only panel", es: "Panel solo en el navegador" },
          detail: { pt: "Publicações em dois idiomas, campanha da temporada e indicadores, tudo em localStorage: sem backend, banco ou login.", en: "Posts in two languages, seasonal campaign and indicators, all in localStorage: no backend, database or login.", es: "Publicaciones en dos idiomas, campaña de temporada e indicadores, todo en localStorage: sin backend, base de datos ni login." },
        },
      ],
      gallery: [
        { src: "/shots/debby-tour/screen-1.webp", alt: { pt: "Passeios como destinos próprios, em fotos grandes", en: "Tours as destinations of their own, in large photos", es: "Paseos como destinos propios, en fotos grandes" } },
        { src: "/shots/debby-tour/screen-2.webp", alt: { pt: "Transfers em abas, com mapa da rota", en: "Transfers in tabs, with the route map", es: "Traslados en pestañas, con el mapa de la ruta" } },
      ],
    },
  },
  {
    slug: "ace-diving-miami",
    category: "institucional-premium",
    title: "Ace Diving Miami",
    tagline: { pt: "Rolar é descer ao fundo do mar · conceito para operadora de mergulho", en: "Scrolling is descending · concept for a dive operator", es: "Desplazarse es descender al fondo del mar · concepto para operadora de buceo" },
    problem: {
      pt: "Uma operadora de mergulho de Miami vende recifes, naufrágios e cursos pelo próprio sistema de reservas, mas a apresentação não transmitia a sensação de descer.",
      en: "A Miami dive operator sells reefs, wrecks and courses through its own booking system, but the presentation didn't convey the feeling of going down.",
      es: "Una operadora de buceo de Miami vende arrecifes, naufragios y cursos con su propio sistema de reservas, pero la presentación no transmitía la sensación de descender.",
    },
    result: {
      pt: "Home conceito em que rolar é descer: da superfície aos 40 metros, com medidor de profundidade que acompanha, dez pontos de mergulho de 10 a 100 pés filtráveis por recifes e naufrágios, capítulo editorial escuro dos naufrágios e cada oferta com fatos, inclusões, política e o link exato de reserva. Lighthouse móvel 93 de desempenho e 100 de acessibilidade na URL ao vivo.",
      en: "Concept homepage where scrolling is descending: from the surface to 40 metres with a depth meter that follows, ten dive sites from 10 to 100 ft filterable by reefs and wrecks, a dark editorial wrecks chapter and every offer with facts, inclusions, policy and the exact booking link. Mobile Lighthouse 93 performance and 100 accessibility on the live URL.",
      es: "Home concepto en la que desplazarse es descender: de la superficie a los 40 metros con un medidor de profundidad que acompaña, diez puntos de buceo de 10 a 100 pies filtrables por arrecifes y naufragios, capítulo editorial oscuro de los naufragios y cada oferta con datos, inclusiones, política y el enlace exacto de reserva. Lighthouse móvil 93 en rendimiento y 100 en accesibilidad en la URL en vivo.",
    },
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind 4"],
    metric: { pt: "Lighthouse 93 · 100 · 100 no celular", en: "Mobile Lighthouse 93 · 100 · 100", es: "Lighthouse móvil 93 · 100 · 100" },
    status: { pt: "Proposta comercial · demo", en: "Commercial proposal · demo", es: "Propuesta comercial · demo" },
    note: { pt: "Conceito comercial para a empresa real; as reservas abrem no sistema da operadora.", en: "Commercial concept for the real company; bookings open the operator's own system.", es: "Concepto comercial para la empresa real; las reservas abren el sistema de la operadora." },
    live: "https://ace-diving-miami.vercel.app",
    image: "/shots/ace-diving-miami.webp",
    caseStudy: {
      narrative: [],
      highlights: [
        {
          label: { pt: "Descida sem GSAP", en: "Descent without GSAP", es: "Descenso sin GSAP" },
          detail: { pt: "Um controlador em rAF escreve variáveis CSS conforme a rolagem; nada de Lenis nem timeline pesada.", en: "One rAF-throttled controller writes CSS custom properties as you scroll; no Lenis, no heavy timeline.", es: "Un controlador en rAF escribe variables CSS según el desplazamiento; sin Lenis ni timeline pesada." },
        },
        {
          label: { pt: "Fatos verificados", en: "Verified facts", es: "Datos verificados" },
          detail: { pt: "Cada oferta guarda fonte, data e status de verificação; preços e links só vêm dos dados.", en: "Every offer carries source, date and verification status; prices and links only come from data.", es: "Cada oferta guarda fuente, fecha y estado de verificación; precios y enlaces solo vienen de los datos." },
        },
        {
          label: { pt: "Medidor de profundidade", en: "Depth meter", es: "Medidor de profundidad" },
          detail: { pt: "Dez pontos de 10 a 100 pés com filtro por recifes e naufrágios e um medidor por ponto.", en: "Ten sites from 10 to 100 ft with a reefs-and-wrecks filter and a gauge per site.", es: "Diez puntos de 10 a 100 pies con filtro por arrecifes y naufragios y un medidor por punto." },
        },
      ],
      gallery: [
        { src: "/shots/ace-diving-miami/screen-1.webp", alt: { pt: "Pontos de mergulho de 10 a 100 pés, com medidor de profundidade", en: "Dive sites from 10 to 100 ft, with the depth meter", es: "Puntos de buceo de 10 a 100 pies, con el medidor de profundidad" } },
        { src: "/shots/ace-diving-miami/screen-2.webp", alt: { pt: "Capítulo dos naufrágios, editorial escuro", en: "Wrecks chapter, dark editorial", es: "Capítulo de los naufragios, editorial oscuro" } },
      ],
    },
  },
  {
    slug: "legends-of-hollywood-tours",
    category: "landing-premium",
    title: "Legends of Hollywood Tours",
    tagline: { pt: "Página única para uma empresa familiar de tours em Los Angeles", en: "One-page site for a family-owned Los Angeles tour company", es: "Página única para una empresa familiar de tours en Los Ángeles" },
    problem: {
      pt: "Empresa familiar de tours em Los Angeles desde 2010, com nota 4,9 e mais de mil avaliações no Tripadvisor, apresentada por um site que não fazia jus à prova social nem às fotos reais.",
      en: "Family-owned Los Angeles tour company since 2010, rated 4.9 across more than a thousand Tripadvisor reviews, presented by a website that didn't live up to the social proof or the real photos.",
      es: "Empresa familiar de tours en Los Ángeles desde 2010, con nota 4,9 y más de mil reseñas en Tripadvisor, presentada por un sitio que no hacía justicia a la prueba social ni a las fotos reales.",
    },
    result: {
      pt: "Demo de página única com onze seções sobre fotografia real da empresa: abertura em foto única, momentos do dia, preços e links de reserva vindos só dos dados, galeria em folha de contato e barra de ação fixa no celular. Cada fato carrega um status de confirmação; nada inventado chega à tela.",
      en: "One-page demo with eleven sections over the company's real photography: single-photo opening, moments of the day, prices and booking links sourced only from data, a contact-sheet gallery and a sticky mobile action bar. Every fact carries a confirmation status; nothing invented reaches the screen.",
      es: "Demo de página única con once secciones sobre fotografía real de la empresa: apertura en foto única, momentos del día, precios y enlaces de reserva que vienen solo de los datos, galería en hoja de contacto y barra de acción fija en el móvil. Cada dato lleva un estado de confirmación; nada inventado llega a la pantalla.",
    },
    stack: ["Next.js 16", "TypeScript", "Tailwind 4", "GSAP ScrollTrigger", "Lenis"],
    metric: { pt: "11 seções · fotos 100% reais", en: "11 sections · 100% real photos", es: "11 secciones · fotos 100% reales" },
    status: { pt: "Proposta comercial · demo", en: "Commercial proposal · demo", es: "Propuesta comercial · demo" },
    note: { pt: "Demo para a empresa real; as reservas passam pelo sistema dela.", en: "Demo for the real company; bookings go through its own system.", es: "Demo para la empresa real; las reservas pasan por su propio sistema." },
    live: "https://legends-of-hollywood-tours.vercel.app",
    image: "/shots/legends-of-hollywood-tours.webp",
    caseStudy: {
      narrative: [],
      highlights: [
        {
          label: { pt: "Fatos com status", en: "Facts with status", es: "Datos con estado" },
          detail: { pt: "Preços, links de reserva, avaliações e atrações vivem nos dados com status confirmado ou pendente, nunca nos componentes.", en: "Prices, booking links, reviews and attractions live in data with a confirmed or pending status, never inside components.", es: "Precios, enlaces de reserva, reseñas y atracciones viven en los datos con estado confirmado o pendiente, nunca en los componentes." },
        },
        {
          label: { pt: "Só fotografia real", en: "Real photography only", es: "Solo fotografía real" },
          detail: { pt: "Nenhuma pessoa, van ou experiência gerada; a abertura é uma única foto da empresa.", en: "No generated people, vans or experiences; the opening is a single photo from the company.", es: "Ninguna persona, van o experiencia generada; la apertura es una única foto de la empresa." },
        },
        {
          label: { pt: "Movimento com fallback", en: "Motion with a fallback", es: "Movimiento con fallback" },
          detail: { pt: "ScrollTrigger e Lenis registrados uma vez; tudo aparece sem JS e respeita o movimento reduzido.", en: "ScrollTrigger and Lenis registered once; everything shows without JS and respects reduced motion.", es: "ScrollTrigger y Lenis registrados una vez; todo aparece sin JS y respeta el movimiento reducido." },
        },
      ],
      gallery: [
        { src: "/shots/legends-of-hollywood-tours/screen-1.webp", alt: { pt: "Momentos do dia sobre fotografia real da empresa", en: "Moments of the day over the company's real photography", es: "Momentos del día sobre fotografía real de la empresa" } },
        { src: "/shots/legends-of-hollywood-tours/screen-2.webp", alt: { pt: "Galeria em folha de contato", en: "Contact-sheet gallery", es: "Galería en hoja de contacto" } },
      ],
    },
  },
  {
    slug: "said-zanzibar",
    category: "institucional-premium",
    title: "Said Guide Zanzibar",
    tagline: { pt: "Experiências privadas em Zanzibar com um guia local · demo pré-venda", en: "Private Zanzibar experiences with a local guide · pre-sale demo", es: "Experiencias privadas en Zanzíbar con un guía local · demo preventa" },
    problem: {
      pt: "Um guia privado de Kizimkazi, com nota 5,0 em 44 avaliações no Google, precisava de uma presença à altura dos passeios: golfinhos, Mnemba, Safari Blue, Jozani, Stone Town e especiarias.",
      en: "A private guide from Kizimkazi, rated 5.0 across 44 Google reviews, needed a presence worthy of the trips: dolphins, Mnemba, Safari Blue, Jozani, Stone Town and spice tours.",
      es: "Un guía privado de Kizimkazi, con nota 5,0 en 44 reseñas de Google, necesitaba una presencia a la altura de los paseos: delfines, Mnemba, Safari Blue, Jozani, Stone Town y especias.",
    },
    result: {
      pt: "Doze seções com marca criada do zero (um S em onda com o sol na curva), experiências primeiro e o guia como camada de confiança, história dos golfinhos em capítulos, fundo que muda de cor entre seções, dez avaliações reais e pedido direto no WhatsApp. Fotos reais do catálogo do próprio guia, comprimidas, sem CMS nem backend.",
      en: "Twelve sections with a brand created from scratch (a wave-shaped S with the sun in the curve), experiences first and the guide as the trust layer, the dolphin story in chapters, a background that shifts colour between sections, ten real reviews and direct WhatsApp requests. Real photos from the guide's own catalogue, compressed, no CMS or backend.",
      es: "Doce secciones con marca creada desde cero (una S en forma de ola con el sol en la curva), experiencias primero y el guía como capa de confianza, historia de los delfines en capítulos, fondo que cambia de color entre secciones, diez reseñas reales y pedido directo por WhatsApp. Fotos reales del catálogo del propio guía, comprimidas, sin CMS ni backend.",
    },
    stack: ["Next.js 16", "TypeScript", "Tailwind 4", "GSAP ScrollTrigger", "Lenis"],
    metric: { pt: "12 seções · 10 avaliações reais", en: "12 sections · 10 real reviews", es: "12 secciones · 10 reseñas reales" },
    status: { pt: "Demo pré-venda", en: "Pre-sale demo", es: "Demo preventa" },
    note: { pt: "Demo para o guia real; link privado até a aprovação.", en: "Demo for the real guide; private link until approval.", es: "Demo para el guía real; enlace privado hasta la aprobación." },
    // live: "https://said-zanzibar.vercel.app" — atrás do login da Vercel; descomentar quando o Said aprovar a URL pública.
    demo: true,
    image: "/shots/said-zanzibar.webp",
    caseStudy: {
      narrative: [],
      highlights: [
        {
          label: { pt: "Marca do zero", en: "Brand from scratch", es: "Marca desde cero" },
          detail: { pt: "Logo em S de onda com o sol na curva, Instrument Serif nos títulos e Manrope na interface; paleta Ocean Black, Indian Ocean e Sand.", en: "A wave-shaped S logo with the sun in the curve, Instrument Serif for headings and Manrope for the interface; Ocean Black, Indian Ocean and Sand palette.", es: "Logo en S de ola con el sol en la curva, Instrument Serif en los títulos y Manrope en la interfaz; paleta Ocean Black, Indian Ocean y Sand." },
        },
        {
          label: { pt: "Fundo contínuo", en: "Continuous background", es: "Fondo continuo" },
          detail: { pt: "A cor de fundo flui entre as seções com ScrollTrigger; três armadilhas de medição ficaram documentadas para quem mexer depois.", en: "The background colour flows between sections with ScrollTrigger; three measurement traps were documented for whoever touches it next.", es: "El color de fondo fluye entre las secciones con ScrollTrigger; tres trampas de medición quedaron documentadas para quien lo toque después." },
        },
        {
          label: { pt: "Acessível de verdade", en: "Genuinely accessible", es: "Accesible de verdad" },
          detail: { pt: "O teal da marca ganhou uma variante escura só para texto depois de falhar no contraste; axe sem violações.", en: "The brand teal got a darker text-only variant after failing contrast; axe reports no violations.", es: "El teal de la marca ganó una variante oscura solo para texto tras fallar el contraste; axe sin violaciones." },
        },
      ],
      gallery: [
        { src: "/shots/said-zanzibar/screen-1.webp", alt: { pt: "Experiências primeiro: os passeios em destaque", en: "Experiences first: the trips in focus", es: "Experiencias primero: los paseos en foco" } },
        { src: "/shots/said-zanzibar/screen-2.webp", alt: { pt: "História dos golfinhos em capítulos", en: "The dolphin story in chapters", es: "La historia de los delfines en capítulos" } },
      ],
    },
  },
  {
    slug: "mabrouk-zanzibar",
    category: "institucional-premium",
    title: "Mabrouk Zanzibar",
    tagline: { pt: "Zanzibar pelos olhos de um guia local · a demo que fechou o cliente", en: "Zanzibar through a local guide's eyes · the demo that closed the client", es: "Zanzíbar con los ojos de un guía local · la demo que cerró al cliente" },
    problem: {
      pt: "Guia independente em Zanzibar, encontrado por prospecção internacional, respondeu ao contato pedindo para ver um site antes de fechar.",
      en: "An independent guide in Zanzibar, found through international prospecting, answered the outreach asking to see a website before closing.",
      es: "Guía independiente en Zanzíbar, encontrado por prospección internacional, respondió al contacto pidiendo ver un sitio antes de cerrar.",
    },
    result: {
      pt: "Demo pronta para o WhatsApp em dias: hero \"Karibu Zanzibar\", quatro experiências confirmadas por nome (Prison Island, Jozani, Stone Town e a costa), galeria horizontal presa ao scroll, mural de memórias com fotos reais flutuando, mapa ilustrado da ilha, três avaliações reais verbatim e planejador que monta a mensagem. O link fechou o cliente.",
      en: "A WhatsApp-ready demo in days: \"Karibu Zanzibar\" hero, four experiences confirmed by name (Prison Island, Jozani, Stone Town and the coastline), a scroll-pinned horizontal gallery, a memories mural with real photos floating, an illustrated island map, three verbatim real reviews and a planner that composes the message. The link closed the client.",
      es: "Demo lista para WhatsApp en días: hero \"Karibu Zanzibar\", cuatro experiencias confirmadas por nombre (Prison Island, Jozani, Stone Town y la costa), galería horizontal fijada al scroll, mural de recuerdos con fotos reales flotando, mapa ilustrado de la isla, tres reseñas reales textuales y planificador que arma el mensaje. El enlace cerró al cliente.",
    },
    stack: ["Next.js 16", "TypeScript", "Tailwind 4", "GSAP ScrollTrigger", "Lenis"],
    metric: { pt: "A demo que fechou o cliente", en: "The demo that closed the client", es: "La demo que cerró al cliente" },
    metricProof: true,
    clientWork: true,
    clientName: "Mabrouk",
    status: { pt: "Cliente fechado a partir da demo", en: "Client won from the demo", es: "Cliente cerrado a partir de la demo" },
    // live: "https://mabrouk-zanzibar.vercel.app" — atrás do login da Vercel; descomentar quando o site do Mabrouk tiver URL pública.
    demo: true,
    image: "/shots/mabrouk-zanzibar.webp",
    caseStudy: {
      narrative: [],
      highlights: [
        {
          label: { pt: "Mural de memórias", en: "Memories mural", es: "Mural de recuerdos" },
          detail: { pt: "Fotos reais, mini-avaliações e rótulos flutuando com parallax por profundidade num único ScrollTrigger; grade no celular.", en: "Real photos, mini-reviews and labels floating with depth parallax from a single ScrollTrigger; a grid on mobile.", es: "Fotos reales, mini-reseñas y etiquetas flotando con parallax por profundidad en un único ScrollTrigger; grilla en el móvil." },
        },
        {
          label: { pt: "Galeria presa ao scroll", en: "Scroll-pinned gallery", es: "Galería fijada al scroll" },
          detail: { pt: "Rolagem horizontal com containerAnimation no desktop e fallback vertical editorial no celular.", en: "Horizontal scrolling with containerAnimation on desktop and an editorial vertical fallback on mobile.", es: "Desplazamiento horizontal con containerAnimation en escritorio y fallback vertical editorial en el móvil." },
        },
        {
          label: { pt: "Nada inventado", en: "Nothing invented", es: "Nada inventado" },
          detail: { pt: "Só experiências confirmadas por nome, três avaliações verificadas e fotos da ficha do Google do próprio guia.", en: "Only experiences confirmed by name, three verified reviews and photos from the guide's own Google listing.", es: "Solo experiencias confirmadas por nombre, tres reseñas verificadas y fotos de la ficha de Google del propio guía." },
        },
      ],
      gallery: [
        { src: "/shots/mabrouk-zanzibar/screen-1.webp", alt: { pt: "Experiências confirmadas por nome", en: "Experiences confirmed by name", es: "Experiencias confirmadas por nombre" } },
        { src: "/shots/mabrouk-zanzibar/screen-2.webp", alt: { pt: "Mural de memórias com fotos reais", en: "Memories mural with real photos", es: "Mural de recuerdos con fotos reales" } },
      ],
    },
  },
  {
    slug: "serengeti-wildlife-safaris",
    category: "institucional-premium",
    title: "Serengeti Wildlife Safaris",
    tagline: { pt: "Conceito de safári na Tanzânia em três atos · marca fictícia", en: "Tanzania safari concept in three acts · fictional brand", es: "Concepto de safari en Tanzania en tres actos · marca ficticia" },
    problem: {
      pt: "Explorar até onde vai o storytelling digital de uma marca de safári premium sem cliente por trás: vídeo, destinos em atos, roteiros editoriais e um planejador.",
      en: "Explore how far the digital storytelling of a premium safari brand can go with no client behind it: video, destinations in acts, editorial itineraries and a planner.",
      es: "Explorar hasta dónde llega el storytelling digital de una marca de safari premium sin cliente detrás: video, destinos en actos, itinerarios editoriales y un planificador.",
    },
    result: {
      pt: "Home como viagem contínua costurada por uma linha de rota: vídeo em loop, planícies, pico e mar em três atos com painel preso, o Kilimanjaro em \"5.895 M\" monumental, seis roteiros com página própria e dia a dia, pedido de orçamento e planejador em três passos. Nada sai do navegador; com movimento reduzido tudo aparece no estado final.",
      en: "Homepage as one continuous journey stitched by a route line: looping video, plains, peak and sea in three pinned acts, Kilimanjaro as a monumental \"5,895 M\", six itineraries with their own day-by-day pages, a pricing request and a three-step planner. Nothing leaves the browser; with reduced motion everything shows in its final state.",
      es: "Home como viaje continuo cosido por una línea de ruta: video en loop, llanuras, cima y mar en tres actos con panel fijo, el Kilimanjaro en un \"5.895 M\" monumental, seis itinerarios con página propia y día a día, pedido de presupuesto y planificador en tres pasos. Nada sale del navegador; con movimiento reducido todo aparece en su estado final.",
    },
    stack: ["Next.js 16", "TypeScript", "Tailwind 4", "GSAP ScrollTrigger"],
    metric: { pt: "3 atos · 6 roteiros", en: "3 acts · 6 itineraries", es: "3 actos · 6 itinerarios" },
    status: { pt: "Projeto autoral · demo", en: "Studio project · demo", es: "Proyecto propio · demo" },
    note: { pt: "Marca fictícia; sem afiliação com operadoras reais.", en: "Fictional brand; no affiliation with real operators.", es: "Marca ficticia; sin afiliación con operadoras reales." },
    live: "https://serengeti-wildlife-safaris.vercel.app",
    image: "/shots/serengeti-wildlife-safaris.webp",
    caseStudy: {
      narrative: [],
      highlights: [
        {
          label: { pt: "Linha de rota", en: "Route line", es: "Línea de ruta" },
          detail: { pt: "Um motivo visual único costura hero, rótulos de seção, história, chamada final e rodapé.", en: "A single visual motif stitches hero, section labels, story, closing call and footer.", es: "Un único motivo visual cose hero, etiquetas de sección, historia, llamada final y pie." },
        },
        {
          label: { pt: "Três atos presos", en: "Three pinned acts", es: "Tres actos fijos" },
          detail: { pt: "Planícies, pico e mar trocam por rolagem num painel fixo; no celular, foto no lugar do vídeo.", en: "Plains, peak and sea switch by scrolling inside a pinned panel; on mobile, a photo replaces the video.", es: "Llanuras, cima y mar cambian con el desplazamiento en un panel fijo; en el móvil, una foto reemplaza al video." },
        },
        {
          label: { pt: "Pedido sem envio", en: "Request without sending", es: "Pedido sin envío" },
          detail: { pt: "Orçamento e planejador montam um resumo copiável; nenhuma requisição sai do site.", en: "Pricing request and planner build a copyable summary; no request leaves the site.", es: "Presupuesto y planificador arman un resumen copiable; ninguna solicitud sale del sitio." },
        },
      ],
      gallery: [
        { src: "/shots/serengeti-wildlife-safaris/screen-1.webp", alt: { pt: "Os três atos: planícies, pico e mar", en: "The three acts: plains, peak and sea", es: "Los tres actos: llanuras, cima y mar" } },
        { src: "/shots/serengeti-wildlife-safaris/screen-2.webp", alt: { pt: "Roteiros editoriais com dia a dia", en: "Editorial itineraries, day by day", es: "Itinerarios editoriales, día a día" } },
      ],
    },
  },
];
