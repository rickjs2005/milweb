import type { Project } from "./content";
import { GH } from "./content-shared";

/** Projetos — parte 2/3. A ordem editorial mora em src/data/projects.ts. */
export const PROJECTS_2: Project[] = [
  {
    slug: "terral",
    category: "landing-premium",
    title: "TERRAL",
    tagline: { pt: "Torrefação artesanal · do grão à xícara em cinco capítulos", en: "Artisanal coffee roastery · bean to cup in five chapters", es: "Tostaduría artesanal · del grano a la taza en cinco capítulos" },
    problem: { pt: "Sites de café especial mostram sacas e xícaras paradas. Nada explica o caminho que o grão percorre nem por que uma torra artesanal vale mais.", en: "Specialty coffee sites show static bags and cups. Nothing explains the path the bean travels or why an artisanal roast costs more.", es: "Los sitios de café de especialidad muestran sacos y tazas estáticas. Nada explica el camino que recorre el grano ni por qué un tostado artesanal vale más." },
    result: { pt: "Uma jornada editorial guiada pelo scroll: Caparaó, o terreiro ao sol, o fogo do tambor, a moenda e a xícara, cada capítulo com vídeo e fotografia reais ao lado de tipografia gigante. O funil fecha na vitrine de blends com notas sensoriais e pedido pelo WhatsApp. E tem um segredo: quem segura o botão certo por seis segundos descobre a casa do torrador.", en: "An editorial journey driven by scroll: Caparaó, the sun-drying yard, the drum's fire, the grind and the cup, each chapter pairing real video and photography with giant typography. The funnel closes on a blend showcase with tasting notes and WhatsApp ordering. And there's a secret: hold the right button for six seconds and you find the roaster's house.", es: "Un recorrido editorial guiado por el scroll: Caparaó, el patio de secado al sol, el fuego del tambor, la molienda y la taza, cada capítulo con video y fotografía reales junto a tipografía gigante. El embudo cierra en la vitrina de blends con notas sensoriales y pedido por WhatsApp. Y hay un secreto: quien mantiene presionado el botón correcto durante seis segundos descubre la casa del tostador." },
    stack: ["Next.js", "TypeScript", "GSAP", "Lenis", "Tailwind"],
    metric: { pt: "5 capítulos · vídeo e foto reais", en: "5 chapters · real video and photography", es: "5 capítulos · video y foto reales" },
    status: { pt: "Projeto autoral · no ar", en: "Personal project · live", es: "Proyecto propio · en línea" },
    live: "https://terral-cafe.vercel.app",
    featured: true,
    homeFeatured: true,
    image: "/shots/terral.webp",
    imageStatic: true,
    caseStudy: {
      narrative: [
        {
          pt: "O site conta o caminho do café em cinco capítulos guiados pelo scroll: Caparaó, Terreiro, Tambor, Moenda e Xícara. Cada capítulo divide a tela entre imagem viva (vídeo e fotografia reais de lavoura, secagem e torra) e tipografia editorial gigante, com grãos flutuando em parallax costurando as transições. Os títulos são personagens: XÍCARA entra em camadas sobrepostas, VERTENTE abre a vitrine dos blends.",
          en: "The site tells coffee's path in five scroll-driven chapters: Caparaó, the drying yard, the drum, the grind and the cup. Each chapter splits the screen between living imagery (real footage of farm, drying and roasting) and giant editorial typography, with beans floating in parallax to stitch the transitions. The titles are characters: XÍCARA arrives in stacked layers, VERTENTE opens the blend showcase.",
          es: "El sitio cuenta el camino del café en cinco capítulos guiados por el scroll: Caparaó, Patio, Tambor, Molienda y Taza. Cada capítulo divide la pantalla entre imagen viva (video y fotografía reales de cultivo, secado y tostado) y tipografía editorial gigante, con granos flotando en parallax que cosen las transiciones. Los títulos son personajes: XÍCARA entra en capas superpuestas, VERTENTE abre la vitrina de los blends.",
        },
        {
          pt: "Depois da jornada o site vira loja de verdade: três blends com origem, altitude, nota SCA e perfil sensorial, cada um com pedido direto pelo WhatsApp. O rodapé fecha com hierarquia de jornal, um letreiro TERRAL de ponta a ponta e um marquee com as palavras da casa: silêncio, tempo, paciência, origem, altitude, fogo.",
          en: "Past the journey the site becomes a real shop: three blends with origin, altitude, SCA score and tasting profile, each with direct WhatsApp ordering. The footer closes with newspaper hierarchy, an edge-to-edge TERRAL letterpress and a marquee of the house words: silence, time, patience, origin, altitude, fire.",
          es: "Después del recorrido el sitio se convierte en una tienda de verdad: tres blends con origen, altitud, puntaje SCA y perfil sensorial, cada uno con pedido directo por WhatsApp. El pie cierra con jerarquía de periódico, un letrero TERRAL de punta a punta y un marquee con las palabras de la casa: silencio, tiempo, paciencia, origen, altitud, fuego.",
        },
        {
          pt: "E tem a recompensa escondida: um botão discreto pede que o visitante SEGURE por seis segundos, sem prometer nada. Quem espera ganha a casa do torrador, uma página com foto viva do tambor, um texto sobre paciência e um código que dá o dobro de café no primeiro pacote. É a tese do site inteira num gesto: café é sobre esperar o tempo certo.",
          en: "And there's the hidden reward: a discreet button asks the visitor to HOLD for six seconds, promising nothing. Whoever waits earns the roaster's house, a page with living footage of the drum, a text about patience and a code that doubles the coffee in the first bag. It's the site's whole thesis in one gesture: coffee is about waiting the right amount of time.",
          es: "Y está la recompensa escondida: un botón discreto pide al visitante que MANTENGA PRESIONADO durante seis segundos, sin prometer nada. Quien espera gana la casa del tostador, una página con imagen viva del tambor, un texto sobre la paciencia y un código que duplica el café del primer paquete. Es la tesis entera del sitio en un gesto: el café se trata de esperar el tiempo justo.",
        },
      ],
      highlights: [
        { label: { pt: "Capítulos no scroll", en: "Chapters on scroll", es: "Capítulos en el scroll" }, detail: { pt: "Caparaó, Terreiro, Tambor, Moenda e Xícara: meia tela de história, meia de vídeo e foto reais.", en: "Caparaó, drying yard, drum, grind and cup: half a screen of story, half of real video and photo.", es: "Caparaó, Patio, Tambor, Molienda y Taza: media pantalla de historia, media de video y foto reales." } },
        { label: { pt: "Tipografia como cena", en: "Typography as scene", es: "Tipografía como escena" }, detail: { pt: "Títulos gigantes fazem o papel de imagem: entram em camadas, ancoram capítulos e abrem a vitrine.", en: "Giant titles do an image's job: they layer in, anchor chapters and open the showcase.", es: "Títulos gigantes hacen el papel de imagen: entran en capas, anclan capítulos y abren la vitrina." } },
        { label: { pt: "O segredo da casa", en: "The house secret", es: "El secreto de la casa" }, detail: { pt: "Segurar um botão por seis segundos revela a casa do torrador e um código de dobro de café.", en: "Holding a button for six seconds reveals the roaster's house and a double-coffee code.", es: "Mantener presionado un botón durante seis segundos revela la casa del tostador y un código de café doble." } },
      ],
      gallery: [
        { src: "/shots/terral/sol.webp", alt: { pt: "Capítulo do Terreiro: o sol faz metade do trabalho, com os terreiros de secagem e a pá revolvendo os grãos", en: "Drying-yard chapter: the sun does half the work, with drying beds and a paddle turning the beans", es: "Capítulo del Patio: el sol hace la mitad del trabajo, con los patios de secado y la pala removiendo los granos" } },
        { src: "/shots/terral/vertente.webp", alt: { pt: "Vitrine dos blends: VERTENTE em tipografia gigante com pacote, fogo e notas sensoriais", en: "Blend showcase: VERTENTE in giant type with the bag, fire and tasting notes", es: "Vitrina de los blends: VERTENTE en tipografía gigante con paquete, fuego y notas sensoriales" } },
        { src: "/shots/terral/casa-do-torrador.webp", alt: { pt: "A casa do torrador: a página-recompensa de quem segurou o botão por seis segundos", en: "The roaster's house: the reward page for holding the button six seconds", es: "La casa del tostador: la página-recompensa de quien mantuvo presionado el botón durante seis segundos" } },
      ],
    },
  },
  {
    slug: "one-piece",
    category: "landing-premium",
    title: "ONE PIECE",
    tagline: { pt: "Site cinematográfico · a saga contada no scroll", en: "Cinematic site · the saga told through scroll", es: "Sitio cinematográfico · la saga contada en el scroll" },
    problem: { pt: "Conteúdo de anime na web quase sempre vira lista de wiki: muita informação e nenhuma emoção. Ninguém sente a jornada que fez a obra ser o que é.", en: "Anime content on the web almost always turns into a wiki list: lots of information and zero emotion. Nobody feels the journey that made the work what it is.", es: "El contenido de anime en la web casi siempre termina en lista de wiki: mucha información y ninguna emoción. Nadie siente el viaje que hizo que la obra sea lo que es." },
    result: { pt: "Uma página única que conta a história de One Piece: a cena de abertura obedece ao scroll e dali o site atravessa a Era dos Piratas, apresenta os Chapéus de Palha, desenha a rota até o fim do mapa e guarda as falas que marcaram. Tudo animado em código, sem vídeo pesado.", en: "A single page that tells the One Piece story: the opening scene follows the scroll, and from there the site crosses the Age of Pirates, introduces the Straw Hats, draws the route to the end of the map and keeps the lines every fan knows. All animated in code, no heavy video.", es: "Una página única que cuenta la historia de One Piece: la escena de apertura obedece al scroll y desde ahí el sitio atraviesa la Era de los Piratas, presenta a los Sombreros de Paja, dibuja la ruta hasta el fin del mapa y guarda las frases que marcaron. Todo animado en código, sin video pesado." },
    stack: ["Next.js", "TypeScript", "Tailwind", "GSAP", "Lenis"],
    metric: { pt: "Página única · animação 100% em código", en: "Single page · animation 100% in code", es: "Página única · animación 100% en código" },
    status: { pt: "Projeto autoral · em breve no ar", en: "Personal project · live soon", es: "Proyecto propio · pronto en línea" },
    note: { pt: "Projeto de fã, sem vínculo com os detentores dos direitos da obra.", en: "Fan project, unaffiliated with the rights holders.", es: "Proyecto de fan, sin vínculo con los titulares de los derechos de la obra." },
    image: "/shots/one-piece.webp",
    imageStatic: true,
    caseStudy: {
      narrative: [
        {
          pt: "O site abre numa cena controlada pelo scroll: nada acontece sozinho, é o dedo do visitante que puxa a história. Essa escolha define o resto da página, porque transforma leitura em travessia. GSAP com ScrollTrigger cuida das transições e o Lenis suaviza a rolagem pra animação nunca engasgar.",
          en: "The site opens on a scroll-controlled scene: nothing plays on its own, the visitor's finger pulls the story forward. That choice defines the rest of the page, because it turns reading into a crossing. GSAP with ScrollTrigger drives the transitions and Lenis smooths the scroll so the animation never stutters.",
          es: "El sitio abre en una escena controlada por el scroll: nada ocurre solo, es el dedo del visitante el que empuja la historia. Esa decisión define el resto de la página, porque convierte la lectura en travesía. GSAP con ScrollTrigger se encarga de las transiciones y Lenis suaviza el desplazamiento para que la animación nunca se trabe.",
        },
        {
          pt: "O conteúdo segue a lógica da obra: a execução de Roger acende a Era dos Piratas, cada Chapéu de Palha entra com o próprio peso, a rota desenha o caminho até o fim do mapa e as falas que todo fã conhece ganham espaço de respiro. É um projeto de fã, feito pra mostrar o quanto uma página só carrega quando o código faz o papel de um trailer.",
          en: "The content follows the logic of the source: Roger's execution ignites the Age of Pirates, each Straw Hat lands with their own weight, the route draws the path to the end of the map, and the lines every fan knows get room to breathe. It's a fan project, built to show how much a single page can carry when code plays the role of a trailer.",
          es: "El contenido sigue la lógica de la obra: la ejecución de Roger enciende la Era de los Piratas, cada Sombrero de Paja entra con su propio peso, la ruta dibuja el camino hasta el fin del mapa y las frases que todo fan conoce ganan espacio para respirar. Es un proyecto de fan, hecho para mostrar cuánto puede cargar una sola página cuando el código hace el papel de un tráiler.",
        },
      ],
      gallery: [
        { src: "/shots/one-piece/cena-1.webp", alt: { pt: "Bandeira dos Chapéus de Palha ao pôr do sol: \"Uma bandeira não é uma ameaça. É uma promessa.\"", en: "The Straw Hat flag at sunset: \"A flag is not a threat. It's a promise.\"", es: "Bandera de los Sombreros de Paja al atardecer: \"Una bandera no es una amenaza. Es una promesa.\"" } },
        { src: "/shots/one-piece/cena-2.webp", alt: { pt: "Capítulo da Jornada: o arco de Alabasta com a cidade dourada no deserto", en: "Journey chapter: the Alabasta arc with the golden desert city", es: "Capítulo del Viaje: el arco de Alabasta con la ciudad dorada en el desierto" } },
      ],
    },
  },
  {
    slug: "alva-odontologia",
    homeFeatured: true,
    category: "landing-premium",
    title: "ALVA Odontologia",
    tagline: { pt: "Clínica odontológica premium · um filme aberto pelo scroll", en: "Premium dental clinic · a film driven by scroll", es: "Clínica dental premium · una película que abre el scroll" },
    problem: { pt: "Site de dentista costuma ser igual em todo lugar: lista de tratamentos, foto de banco de imagem e nenhum motivo pra escolher aquela clínica.", en: "Dental clinic sites look the same everywhere: a list of treatments, stock photos and no reason to choose that clinic.", es: "Los sitios de dentistas suelen ser iguales en todas partes: lista de tratamientos, fotos de banco de imágenes y ningún motivo para elegir esa clínica." },
    result: { pt: "Um filme em 7 planos amarrado ao scroll abre o site: rolar atravessa a clínica enquanto a manhã nasce. O conceito da alvorada guia a identidade inteira, do nome à luz das cenas, e o arco da marca volta em três usos diferentes. Depois do filme, o site apresenta a clínica e leva o agendamento direto pro WhatsApp.", en: "A 7-shot film tied to the scroll opens the site: scrolling moves through the clinic as the morning rises. The daybreak concept drives the whole identity, from the name to the light of every scene, and the brand's arch returns in three different uses. Past the film, the site presents the clinic and sends booking straight to WhatsApp.", es: "Una película en 7 planos atada al scroll abre el sitio: desplazarse atraviesa la clínica mientras nace la mañana. El concepto del amanecer guía toda la identidad, del nombre a la luz de las escenas, y el arco de la marca vuelve en tres usos distintos. Después de la película, el sitio presenta la clínica y lleva la reserva directo a WhatsApp." },
    stack: ["Next.js", "TypeScript", "GSAP", "Lenis", "Tailwind"],
    metric: { pt: "Filme de 7 planos · scrub no scroll", en: "7-shot film · scroll scrub", es: "Película de 7 planos · scrub en el scroll" },
    status: { pt: "Projeto autoral · no ar", en: "Personal project · live", es: "Proyecto propio · en línea" },
    live: "https://alva-odontologia.vercel.app",
    featured: true,
    image: "/shots/alva-odontologia.webp",
    imageStatic: true,
    caseStudy: {
      narrative: [
        {
          pt: "O hero é um vídeo de verdade cujo tempo pertence ao scroll: nada de autoplay, cada rolada avança a câmera pela clínica. Pra esse scrub ficar liso, o vídeo é codificado com todo frame como keyframe, porque buscar um tempo específico num vídeo comum engasga. E teve uma lição de produção aqui: a versão que rodava perfeita no ambiente local quebrou na CDN, então o corte final foi validado contra a URL pública, não contra o localhost.",
          en: "The hero is a real video whose time belongs to the scroll: no autoplay, every scroll advances the camera through the clinic. For that scrub to stay smooth the video is encoded with every frame as a keyframe, because seeking into a regular video stutters. And there was a production lesson here: the version that ran perfectly locally broke on the CDN, so the final cut was validated against the public URL, not localhost.",
          es: "El hero es un video de verdad cuyo tiempo pertenece al scroll: nada de autoplay, cada desplazamiento avanza la cámara por la clínica. Para que ese scrub quede fluido, el video se codifica con cada frame como keyframe, porque buscar un instante específico en un video común se traba. Y hubo una lección de producción aquí: la versión que corría perfecta en el entorno local se rompió en la CDN, así que el corte final se validó contra la URL pública, no contra localhost.",
        },
        {
          pt: "A marca sustenta o resto: ALVA vem de alvorada, e a luz de manhã cedo atravessa as cenas, os textos e as cores. O arco que desenha o logotipo reaparece em três papéis diferentes ao longo da página, costurando filme e conteúdo numa identidade só. O funil termina simples, como clínica precisa: conhecer, confiar e agendar pelo WhatsApp.",
          en: "The brand carries the rest: ALVA comes from the Portuguese word for daybreak, and early morning light runs through the scenes, the copy and the colors. The arch that draws the logo returns in three different roles along the page, stitching film and content into a single identity. The funnel ends the way a clinic needs it to: know, trust, and book via WhatsApp.",
          es: "La marca sostiene el resto: ALVA viene de alvorada, amanecer en portugués, y la luz de la mañana temprano atraviesa las escenas, los textos y los colores. El arco que dibuja el logotipo reaparece en tres papeles distintos a lo largo de la página, cosiendo película y contenido en una sola identidad. El embudo termina simple, como una clínica lo necesita: conocer, confiar y reservar por WhatsApp.",
        },
      ],
      gallery: [
        { src: "/shots/alva-odontologia/plano.webp", alt: { pt: "Plano 03 do filme, O Encontro: a dentista recebe a paciente na sala de espera", en: "Film shot 03, The Welcome: the dentist greets a patient in the waiting room", es: "Plano 03 de la película, El Encuentro: la dentista recibe a la paciente en la sala de espera" } },
        { src: "/shots/alva-odontologia/marca.webp", alt: { pt: "Rodapé com o wordmark ALVA e o arco dourado da identidade", en: "Footer with the ALVA wordmark and the golden identity arch", es: "Pie de página con el wordmark ALVA y el arco dorado de la identidad" } },
        { src: "/shots/alva-odontologia/contato.webp", alt: { pt: "Fecho de conversão: pronto para transformar seu sorriso, com agendamento", en: "Conversion closing: ready to transform your smile, with booking", es: "Cierre de conversión: listo para transformar tu sonrisa, con reserva" } },
      ],
    },
  },
  {
    slug: "as-copas",
    category: "landing-premium",
    title: "As Copas",
    tagline: { pt: "Site imersivo · estádios históricos em 3D (WebGL)", en: "Immersive site · historic stadiums in 3D (WebGL)", es: "Sitio inmersivo · estadios históricos en 3D (WebGL)" },
    problem: { pt: "Conteúdo esportivo na web é tudo igual: listas de texto sem identidade, nada que alguém queira compartilhar.", en: "Sports content on the web all looks the same: identity-less text lists, nothing anyone wants to share.", es: "El contenido deportivo en la web es todo igual: listas de texto sin identidad, nada que alguien quiera compartir." },
    result: { pt: "Tributo às Copas do Mundo com 8 estádios icônicos modelados em 3D (arquibancadas, setores e torcida), Modo cinema para gravar vídeos, álbum de figurinhas com os áudios virais e identidade editorial própria. É 100% estático e rápido até no 3G.", en: "A World Cup tribute with 8 iconic stadiums modeled in 3D (stands, sectors and crowd), a Cinema mode for recording videos, a sticker album with viral audios and its own editorial identity. It's 100% static and fast even on 3G.", es: "Tributo a los Mundiales con 8 estadios icónicos modelados en 3D (gradas, sectores e hinchada), Modo cine para grabar videos, álbum de figuritas con los audios virales e identidad editorial propia. Es 100% estático y rápido incluso en 3G." },
    stack: ["Next.js", "TypeScript", "Three.js", "React Three Fiber", "Tailwind", "Framer Motion"],
    metric: { pt: "8 estádios em 3D · Modo cinema", en: "8 stadiums in 3D · Cinema mode", es: "8 estadios en 3D · Modo cine" },
    status: { pt: "Projeto autoral · no ar", en: "Personal project · live", es: "Proyecto propio · en línea" },
    live: "https://copa2026-alpha.vercel.app",
    featured: true,
    image: "/shots/copa2026.webp",
    caseStudy: {
      narrative: [
        {
          pt: "Site 100% estático em Next.js (App Router), sem backend e sem banco de dados: história, curiosidades, estádios e figurinhas moram em módulos TypeScript tipados dentro de src/data. Isso vira SSG puro, incluindo páginas dedicadas por estádio (/estadios/[slug]) geradas via generateStaticParams, cada uma com metadata e canonical próprios. É o que explica a sensação de carregamento instantâneo mesmo em 3G: zero round-trip a qualquer API para renderizar conteúdo.",
          en: "A 100% static Next.js site (App Router), no backend and no database: history, trivia, stadiums and stickers live in typed TypeScript modules under src/data. That compiles to pure SSG, including dedicated per-stadium pages (/estadios/[slug]) generated via generateStaticParams, each with its own metadata and canonical URL. It's what explains the instant-load feel even on 3G: zero round-trips to any API to render content.",
          es: "Sitio 100% estático en Next.js (App Router), sin backend y sin base de datos: historia, curiosidades, estadios y figuritas viven en módulos TypeScript tipados dentro de src/data. Eso se convierte en SSG puro, incluyendo páginas dedicadas por estadio (/estadios/[slug]) generadas vía generateStaticParams, cada una con metadata y canonical propios. Es lo que explica la sensación de carga instantánea incluso en 3G: cero round-trips a cualquier API para renderizar contenido.",
        },
        {
          pt: "O diferencial é um gerador procedural de estádios em React Three Fiber. Cada um dos 8 estádios icônicos é descrito por um StadiumParams tipado: perfil radial em pontos [raio, altura] revolucionado com LatheGeometry, proporções sx/sz próprias e um \"landmark\" único, como a torre art déco no Centenário, o anel plano no Maracanã, o arco gigante em Wembley, a coroa dourada em Lusail e as lâminas de aço no MetLife. As arquibancadas em degraus não são um asset importado: é uma BufferGeometry construída na mão, fileira por fileira, com vertex colors para simular corredores de setor e degraus alternados. E a torcida é um InstancedMesh de milhares de esferas posicionadas por um PRNG determinístico (mulberry32, seed por hash do slug), pra nunca variar entre servidor e cliente e nunca quebrar a hidratação.",
          en: "The differentiator is a procedural stadium generator in React Three Fiber. Each of the 8 iconic stadiums is described by a typed StadiumParams object: a radial profile of [radius, height] points revolved with LatheGeometry, its own sx/sz proportions and a unique \"landmark\", like an art-deco tower for Estádio Centenário, a flat overhanging ring for Maracanã, a giant arch for Wembley, a golden crown for Lusail and steel blades for MetLife. The terraced stands aren't an imported asset: they're a hand-built BufferGeometry, row by row, with vertex colors simulating sector aisles and alternating steps. And the crowd is an InstancedMesh of thousands of spheres placed by a deterministic PRNG (mulberry32, seeded from a hash of the slug), so it never varies between server and client and never breaks hydration.",
          es: "El diferencial es un generador procedural de estadios en React Three Fiber. Cada uno de los 8 estadios icónicos se describe con un StadiumParams tipado: perfil radial en puntos [radio, altura] revolucionado con LatheGeometry, proporciones sx/sz propias y un \"landmark\" único, como la torre art déco en el Centenario, el anillo plano en el Maracanã, el arco gigante en Wembley, la corona dorada en Lusail y las láminas de acero en el MetLife. Las gradas escalonadas no son un asset importado: es una BufferGeometry construida a mano, fila por fila, con vertex colors para simular pasillos de sector y escalones alternados. Y la hinchada es un InstancedMesh de miles de esferas posicionadas por un PRNG determinístico (mulberry32, seed por hash del slug), para nunca variar entre servidor y cliente y nunca romper la hidratación.",
        },
        {
          pt: "A experiência 3D foi escrita para sobreviver ao mundo real: teste de contexto WebGL antes de montar o Canvas (com fallback textual e fotos reais se falhar), frameloop=\"never\" quando o card sai da viewport ou a aba fica oculta (IntersectionObserver mais visibilitychange, economizando bateria no mobile), dica de gravação que detecta touch e user agent para não instruir \"Win+Alt+R\" num iPhone, e um Modo cinema com câmera respirando (seno suave em Y) mais uma marca d'água discreta gravada no canto do vídeo. Essa última existe porque o objetivo do site é ser compartilhado, e um clipe sem atribuição não traz ninguém de volta.",
          en: "The 3D experience was written to survive the real world: a WebGL context probe before mounting the Canvas (falling back to text and real photos if it fails), frameloop=\"never\" when the card leaves the viewport or the tab goes hidden (IntersectionObserver plus visibilitychange, saving mobile battery), a recording hint that detects touch and user-agent so it never tells an iPhone user to press \"Win+Alt+R\", and a Cinema mode with a gently breathing camera (a soft sine on Y) plus a discreet watermark baked into the corner of the shot. That last one exists because the whole point of the site is to be shared, and an unattributed clip brings nobody back.",
          es: "La experiencia 3D fue escrita para sobrevivir al mundo real: prueba de contexto WebGL antes de montar el Canvas (con fallback textual y fotos reales si falla), frameloop=\"never\" cuando la tarjeta sale del viewport o la pestaña queda oculta (IntersectionObserver más visibilitychange, ahorrando batería en el celular), pista de grabación que detecta touch y user agent para no indicar \"Win+Alt+R\" en un iPhone, y un Modo cine con cámara respirando (seno suave en Y) más una marca de agua discreta grabada en la esquina del video. Esta última existe porque el objetivo del sitio es ser compartido, y un clip sin atribución no trae a nadie de vuelta.",
        },
        {
          pt: "O projeto nasceu com uma auto-auditoria sênior de UX, UI, SEO e acessibilidade, rodada sobre o próprio código e sobre o HTML servido em produção (14 dimensões, contrastes WCAG calculados par a par). Boa parte do roadmap gerado ali já foi implementada: countdown com estado pós-final, botão de compartilhar por estádio e por curiosidade, fallback de WebGL, pausa do render fora de tela, páginas individuais por estádio para SEO long-tail e a marca d'água do Modo cinema. É o tipo de disciplina de \"projeto pessoal tratado como produto\" que normalmente só aparece em trabalho remunerado.",
          en: "The project started with a senior-level self-audit of UX, UI, SEO and accessibility, run against its own code and the HTML served in production (14 dimensions, WCAG contrast ratios calculated pairwise). Most of the resulting roadmap has since shipped: a post-final countdown state, a share button on every stadium and trivia card, a WebGL fallback, off-screen render pausing, individual per-stadium pages for long-tail SEO and the Cinema-mode watermark. It's the kind of \"side project treated like a real product\" discipline that usually only shows up in paid work.",
          es: "El proyecto nació con una autoauditoría senior de UX, UI, SEO y accesibilidad, corrida sobre el propio código y sobre el HTML servido en producción (14 dimensiones, contrastes WCAG calculados par a par). Buena parte del roadmap generado ahí ya fue implementada: countdown con estado posfinal, botón de compartir por estadio y por curiosidad, fallback de WebGL, pausa del render fuera de pantalla, páginas individuales por estadio para SEO long-tail y la marca de agua del Modo cine. Es el tipo de disciplina de \"proyecto personal tratado como producto\" que normalmente solo aparece en trabajo remunerado.",
        },
      ],
      highlights: [
        {
          label: { pt: "100% estático", en: "100% static", es: "100% estático" },
          detail: { pt: "Sem backend nem banco: conteúdo em módulos TypeScript, SSG total incluindo página própria por estádio.", en: "No backend, no database: content lives in TypeScript modules, full SSG including a dedicated page per stadium.", es: "Sin backend ni base de datos: contenido en módulos TypeScript, SSG total incluyendo página propia por estadio." },
        },
        {
          label: { pt: "Estádios procedurais", en: "Procedural stadiums", es: "Estadios procedurales" },
          detail: { pt: "8 estádios em 3D gerados por parâmetros (LatheGeometry + BufferGeometry escrita à mão), não modelos importados.", en: "8 stadiums in 3D generated from parameters (LatheGeometry + hand-built BufferGeometry), not imported models.", es: "8 estadios en 3D generados por parámetros (LatheGeometry + BufferGeometry escrita a mano), no modelos importados." },
        },
        {
          label: { pt: "Torcida determinística", en: "Deterministic crowd", es: "Hinchada determinística" },
          detail: { pt: "Milhares de instâncias posicionadas por PRNG com seed fixa: mesmo resultado no servidor e no cliente, zero erro de hidratação.", en: "Thousands of instances placed by a seeded PRNG: identical output on server and client, zero hydration mismatch.", es: "Miles de instancias posicionadas por PRNG con seed fija: mismo resultado en el servidor y en el cliente, cero errores de hidratación." },
        },
        {
          label: { pt: "3D com consciência de bateria", en: "Battery-aware 3D", es: "3D consciente de la batería" },
          detail: { pt: "Render pausa fora da viewport e com a aba oculta; fallback amigável se o WebGL falhar.", en: "Rendering pauses off-viewport and on hidden tabs; a friendly fallback kicks in if WebGL fails.", es: "El render se pausa fuera del viewport y con la pestaña oculta; fallback amigable si WebGL falla." },
        },
      ],
      gallery: [
        { src: "/shots/as-copas/hero.webp", alt: { pt: "Página inicial de As Copas", en: "As Copas homepage", es: "Página de inicio de As Copas" } },
        { src: "/shots/as-copas/estadios-3d.webp", alt: { pt: "Estádio procedural em 3D", en: "Procedural 3D stadium", es: "Estadio procedural en 3D" } },
        { src: "/shots/as-copas/historia.webp", alt: { pt: "Seção de história e curiosidades", en: "History and trivia section", es: "Sección de historia y curiosidades" } },
      ],
    },
  },
  {
    slug: "ecoa",
    category: "sistema-saas",
    title: "ECOA",
    tagline: { pt: "Rede social anônima · produto completo com IA", en: "Anonymous social network · full product with AI", es: "Red social anónima · producto completo con IA" },
    problem: { pt: "Pessoas querem desabafar e ser ouvidas sem expor o rosto, e as redes tradicionais punem a vulnerabilidade.", en: "People want to vent and be heard without showing their face, and traditional networks punish vulnerability.", es: "Las personas quieren desahogarse y ser escuchadas sin exponer el rostro, y las redes tradicionales castigan la vulnerabilidad." },
    result: { pt: "Rede só-texto onde cada pessoa é um número: anonimato garantido pela arquitetura do banco (nem a API consegue ligar conta a post), moderação em 2 estágios com IA, recuperação de conta sem e-mail e LGPD de ponta a ponta.", en: "Text-only network where each person is a number: anonymity guaranteed by the database architecture (not even the API can link account to post), 2-stage AI moderation, e-mail-free account recovery and end-to-end privacy compliance.", es: "Red solo de texto donde cada persona es un número: anonimato garantizado por la arquitectura de la base de datos (ni la API puede vincular cuenta con post), moderación en 2 etapas con IA, recuperación de cuenta sin e-mail y cumplimiento de la LGPD de punta a punta." },
    stack: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Claude API"],
    metric: { pt: "Anonimato por arquitetura · IA de moderação", en: "Anonymity by architecture · AI moderation", es: "Anonimato por arquitectura · IA de moderación" },
    status: { pt: "MVP no ar", en: "MVP live", es: "MVP en línea" },
    live: "https://ecoa-teal.vercel.app",
    featured: true,
    image: "/shots/ecoa.webp",
    imageStatic: true,
    caseStudy: {
      narrative: [
        {
          pt: "O stack em produção é Next.js 16 (App Router, Turbopack) sobre Supabase Postgres na região sa-east-1, escolhida por residência de dados no Brasil, pensando em LGPD. É deliberadamente mais simples que a arquitetura-alvo documentada no blueprint do projeto (NestJS, Redis, NATS JetStream, Meilisearch, React Native/Expo): o MVP trocou tudo isso por um atalho de validação rápida. Como o produto é só texto e não tem grafo social (sem seguir, sem seguidores), o problema mais caro de uma rede social, que é o fan-out de timeline, simplesmente não existe. Cada post pesa poucos KB e a query do feed é uma view Postgres com paginação por keyset, sem fila nem cache dedicado.",
          en: "The production stack is Next.js 16 (App Router, Turbopack) on Supabase Postgres in the sa-east-1 region, chosen for in-Brazil data residency with LGPD in mind. It's deliberately simpler than the target architecture documented in the project's blueprint (NestJS, Redis, NATS JetStream, Meilisearch, React Native/Expo): the MVP swapped all of that for a faster validation shortcut. Since the product is text-only with no social graph (no following, no followers), the most expensive problem in a social network, timeline fan-out, simply doesn't exist. Each post weighs a few KB and the feed query is a Postgres view with keyset pagination, with no queue or dedicated cache needed.",
          es: "El stack en producción es Next.js 16 (App Router, Turbopack) sobre Supabase Postgres en la región sa-east-1, elegida por residencia de datos en Brasil, pensando en la LGPD. Es deliberadamente más simple que la arquitectura objetivo documentada en el blueprint del proyecto (NestJS, Redis, NATS JetStream, Meilisearch, React Native/Expo): el MVP cambió todo eso por un atajo de validación rápida. Como el producto es solo texto y no tiene grafo social (sin seguir, sin seguidores), el problema más caro de una red social, el fan-out del timeline, simplemente no existe. Cada post pesa pocos KB y la query del feed es una view de Postgres con paginación por keyset, sin cola ni caché dedicado.",
        },
        {
          pt: "Anonimato aqui não é 'sem cadastro', é uma garantia de banco de dados. Cada pessoa entra via signInAnonymously() do Supabase e recebe um public_number gerado por uma função Postgres (sorteio com checagem de unicidade), exibido como \"Usuário #48291\". O UUID interno (profiles.id) nunca sai do banco: um revoke select remove o acesso padrão das tabelas posts, comments e profiles para o papel authenticated, e um grant select seguinte devolve acesso só a uma lista explícita de colunas, sem user_id. Na prática, mesmo uma query client-side maliciosa não consegue ligar conta a conteúdo, porque o privilégio pra isso não existe no papel do banco. Não é uma regra de aplicação que dá pra contornar. Também não existe página de perfil navegável: tocar num \"#48291\" não abre histórico nenhum, decisão deliberada anti-stalking.",
          en: "Anonymity here isn't 'no signup', it's a database-level guarantee. Each person enters via Supabase's signInAnonymously() and gets a public_number generated by a Postgres function (random draw with a uniqueness check), shown as \"User #48291\". The internal UUID (profiles.id) never leaves the database: a revoke select strips the default table privilege on posts, comments and profiles from the authenticated role, then a grant select restores access only to an explicit column list, excluding user_id. In practice, even a malicious client-side query can't join account to content, because the privilege to do so doesn't exist at the database-role level. It isn't an application rule that could be worked around. There's no browsable profile page either: tapping a \"#48291\" opens no history, a deliberate anti-stalking design choice.",
          es: "El anonimato aquí no es 'sin registro', es una garantía de base de datos. Cada persona entra vía signInAnonymously() de Supabase y recibe un public_number generado por una función Postgres (sorteo con verificación de unicidad), mostrado como \"Usuario #48291\". El UUID interno (profiles.id) nunca sale de la base: un revoke select quita el acceso por defecto a las tablas posts, comments y profiles para el rol authenticated, y un grant select posterior devuelve acceso solo a una lista explícita de columnas, sin user_id. En la práctica, ni siquiera una query maliciosa del lado del cliente puede vincular cuenta con contenido, porque el privilegio para eso no existe en el rol de la base. No es una regla de aplicación que se pueda eludir. Tampoco existe página de perfil navegable: tocar un \"#48291\" no abre ningún historial, decisión deliberada anti-stalking.",
        },
        {
          pt: "A moderação roda em dois estágios, ambos em lib/moderation.ts. O estágio 0 é determinístico e instantâneo: normalização Unicode NFKC (contra bypass por homóglifos), bloqueio de links, regex de PII (e-mail e telefone) que só sinaliza, e um regex de sinal de crise (\"quero morrer\", \"me machucar\") que nunca bloqueia a publicação, porque só existe pra acionar apoio. O estágio 2 é opcional: uma chamada à Claude Haiku com saída JSON estruturada, cujo prompt de sistema instrui explicitamente \"na dúvida, não sinalize\", porque um falso positivo silenciando alguém em sofrimento é tratado como pior que um falso negativo. O design é fail-open por princípio: se a API cair ou estourar o timeout de 8s, o conteúdo passa. Hoje, sem crédito de API configurado em produção, só o estágio 0 está realmente ativo. Denúncias da comunidade viram auto-remoção via trigger Postgres a partir de 3 denunciantes distintos, sem fila de moderação dedicada. O painel do Supabase faz esse papel no MVP.",
          en: "Moderation runs in two stages, both in lib/moderation.ts. Stage 0 is deterministic and instant: Unicode NFKC normalization (against homoglyph bypass tricks), link blocking, a PII regex (email and phone) that only flags, and a crisis-signal regex (\"I want to die\", \"hurt myself\") that never blocks publishing, because it only exists to trigger support. Stage 2 is optional: a call to Claude Haiku with structured JSON output, whose system prompt explicitly instructs \"when in doubt, don't flag\", because a false positive silencing someone in distress is treated as worse than a false negative. The design is fail-open by principle: if the API goes down or hits its 8-second timeout, content passes through. Today, with no API budget provisioned in production, only stage 0 is actually active. Community reports auto-remove content via a Postgres trigger once 3 distinct reporters flag the same item, with no dedicated moderation queue app. The raw Supabase dashboard fills that role in the MVP.",
          es: "La moderación corre en dos etapas, ambas en lib/moderation.ts. La etapa 0 es determinística e instantánea: normalización Unicode NFKC (contra bypass por homoglifos), bloqueo de links, regex de PII (e-mail y teléfono) que solo marca, y un regex de señal de crisis (\"quiero morir\", \"hacerme daño\") que nunca bloquea la publicación, porque solo existe para activar apoyo. La etapa 2 es opcional: una llamada a Claude Haiku con salida JSON estructurada, cuyo prompt de sistema instruye explícitamente \"ante la duda, no marques\", porque un falso positivo que silencia a alguien en sufrimiento se trata como peor que un falso negativo. El diseño es fail-open por principio: si la API cae o supera el timeout de 8 s, el contenido pasa. Hoy, sin crédito de API configurado en producción, solo la etapa 0 está realmente activa. Las denuncias de la comunidad se convierten en autoeliminación vía trigger de Postgres a partir de 3 denunciantes distintos, sin cola de moderación dedicada. El panel de Supabase cumple ese papel en el MVP.",
        },
        {
          pt: "Algumas decisões deixam claro o tipo de produto que é. Nunca vai ter mensagem privada, tratada no projeto como \"vetor de assédio e aliciamento\". Nunca vai ter hashtag livre: só uma taxonomia curada de 13 tópicos, justamente pra impedir campanhas coordenadas. E o feed é cronológico, sem scroll infinito, com \"marcos de respiro\" a cada ~50 posts, que é decisão estrutural anti-vício e não só de UX. A recuperação de conta sem e-mail usa uma frase de 6 palavras (lista de 240 termos, ~47 bits de entropia) com hash bcrypt, reatribuída via RPC com ON UPDATE CASCADE propagando pra posts, comentários e reações. Os limites atuais estão documentados com honestidade: o contador de tentativas de recuperação é anulado pelo rollback da mesma transação que gera o erro de autenticação. É um detalhe reconhecido e aceito, porque a entropia da frase e o custo do bcrypt já seguram a maior parte do risco. Uma suíte e2e de 19 cenários roda contra o banco real, incluindo checagem de que a privacidade por coluna realmente impede o vazamento de user_id.",
          en: "A few decisions make the kind of product this is clear. There will never be private messaging, treated in the project as \"a harassment and grooming vector\". There will never be free-form hashtags: just a curated taxonomy of 13 topics, specifically to prevent coordinated campaigns. And the feed is chronological, with no infinite scroll, with a \"breathing milestone\" every ~50 posts, a structural anti-addiction decision rather than just a UX nicety. Email-free account recovery uses a 6-word passphrase (a 240-word list, ~47 bits of entropy) hashed with bcrypt, reassigned via an RPC with ON UPDATE CASCADE propagating through posts, comments and reactions. The current limits are documented honestly: the recovery-attempt counter gets wiped out by the same transaction rollback that produces the auth error. It's a known, accepted gap, since the passphrase's entropy and bcrypt's cost already cover most of the risk. A 19-scenario e2e suite runs against the real database, including a check that column-level privacy actually prevents user_id from leaking.",
          es: "Algunas decisiones dejan claro el tipo de producto que es. Nunca habrá mensajes privados, tratados en el proyecto como \"vector de acoso y captación\". Nunca habrá hashtags libres: solo una taxonomía curada de 13 temas, justamente para impedir campañas coordinadas. Y el feed es cronológico, sin scroll infinito, con \"hitos de respiro\" cada ~50 posts, que es una decisión estructural antiadicción y no solo de UX. La recuperación de cuenta sin e-mail usa una frase de 6 palabras (lista de 240 términos, ~47 bits de entropía) con hash bcrypt, reasignada vía RPC con ON UPDATE CASCADE propagando a posts, comentarios y reacciones. Los límites actuales están documentados con honestidad: el contador de intentos de recuperación queda anulado por el rollback de la misma transacción que genera el error de autenticación. Es un detalle reconocido y aceptado, porque la entropía de la frase y el costo de bcrypt ya contienen la mayor parte del riesgo. Una suite e2e de 19 escenarios corre contra la base de datos real, incluyendo la verificación de que la privacidad por columna realmente impide la fuga de user_id.",
        },
      ],
      highlights: [
        {
          label: { pt: "Anonimato por privilégio de coluna", en: "Anonymity via column privilege", es: "Anonimato por privilegio de columna" },
          detail: { pt: "revoke select + grant em lista explícita de colunas: nem a API consegue ligar conta a post.", en: "revoke select plus an explicit column-list grant: not even the API can link account to post.", es: "revoke select + grant en lista explícita de columnas: ni la API puede vincular cuenta con post." },
        },
        {
          label: { pt: "Moderação em 2 estágios, fail-open", en: "2-stage moderation, fail-open", es: "Moderación en 2 etapas, fail-open" },
          detail: { pt: "Regex determinístico sempre ativo mais Claude Haiku opcional. Indisponibilidade da IA nunca bloqueia a publicação.", en: "Always-on deterministic regex plus optional Claude Haiku. AI downtime never blocks a post from publishing.", es: "Regex determinístico siempre activo más Claude Haiku opcional. La indisponibilidad de la IA nunca bloquea la publicación." },
        },
        {
          label: { pt: "Recuperação sem e-mail", en: "Email-free recovery", es: "Recuperación sin e-mail" },
          detail: { pt: "Frase de 6 palavras com hash bcrypt reatribui a conta via RPC, sem precisar de nenhum dado pessoal.", en: "A 6-word bcrypt-hashed passphrase reassigns the account via RPC, with zero personal data required.", es: "Una frase de 6 palabras con hash bcrypt reasigna la cuenta vía RPC, sin necesitar ningún dato personal." },
        },
        {
          label: { pt: "Anti-manipulação por design", en: "Anti-manipulation by design", es: "Antimanipulación por diseño" },
          detail: { pt: "Sem hashtag livre, sem DM e com 13 tópicos curados: estrutura pensada contra campanhas coordenadas.", en: "No free hashtags, no DMs and 13 curated topics: a structure built against coordinated campaigns.", es: "Sin hashtags libres, sin DM y con 13 temas curados: estructura pensada contra campañas coordinadas." },
        },
      ],
      gallery: [
        { src: "/shots/ecoa/ecoa-onboarding-1-so-palavras.webp", alt: { pt: "Onboarding do ECOA:\"Aqui, só palavras\"", en: "ECOA onboarding:\"Here, only words\"", es: "Onboarding de ECOA:\"Aquí, solo palabras\"" } },
        { src: "/shots/ecoa/ecoa-onboarding-2-regras-da-casa.webp", alt: { pt: "Onboarding do ECOA:regras da comunidade", en: "ECOA onboarding:community rules", es: "Onboarding de ECOA:reglas de la comunidad" } },
        { src: "/shots/ecoa/ecoa-onboarding-3-voce-e-um-numero.webp", alt: { pt: "Onboarding do ECOA:\"Você é um número\"", en: "ECOA onboarding:\"You are a number\"", es: "Onboarding de ECOA:\"Eres un número\"" } },
      ],
    },
  },
  {
    slug: "loja-iphone",
    category: "sistema-saas",
    title: "Loja de iPhone",
    tagline: { pt: "E-commerce white-label · checkout no WhatsApp", en: "White-label e-commerce · WhatsApp checkout", es: "E-commerce white-label · checkout por WhatsApp" },
    problem: { pt: "Lojas de iPhone vendem só pelo Instagram, sem uma vitrine própria e profissional.", en: "iPhone stores sell only on Instagram, without a proper professional storefront.", es: "Las tiendas de iPhone venden solo por Instagram, sin una vitrina propia y profesional." },
    result: { pt: "Loja completa com catálogo, painel admin de produtos e estoque, e pedido direto no WhatsApp. É uma base white-label que vira várias lojas trocando só cor, logo e contato.", en: "Full store with catalog, admin panel for products and stock, and orders straight to WhatsApp. It's a white-label base that becomes many stores by swapping color, logo and contact.", es: "Tienda completa con catálogo, panel admin de productos e inventario, y pedido directo por WhatsApp. Es una base white-label que se convierte en varias tiendas cambiando solo color, logo y contacto." },
    stack: ["Next.js", "TypeScript", "Tailwind", "Supabase", "Zustand"],
    metric: { pt: "1 base white-label → várias lojas", en: "1 white-label base → many stores", es: "1 base white-label → varias tiendas" },
    // live removido: o deploy de demonstração tem um 500 conhecido em
    // /produtos/[id] — sem link até o fix (o screenshot cobre a demo)
    repos: [{ label: "Código", url: `${GH}/loja-iphone` }],
    featured: true,
    image: "/shots/loja-iphone.jpg",
    caseStudy: {
      narrative: [
        {
          pt: "Next.js 15 (App Router) com TypeScript, Tailwind v4 com tema 100% CSS-first (sem tailwind.config: as cores vivem em @theme inline no globals.css) e Supabase cobrindo Auth, Postgres e Storage. A personalização multi-cliente não é feita por fork. Um único arquivo (src/config/theme.config.ts) define nome, WhatsApp, logo e paleta, que o <ThemeInjector> converte em CSS variables (--store-*) no :root, e os componentes só consomem utilitários (bg-bg, text-primary). Para revenda em série, o mesmo theme.config.ts lê variáveis NEXT_PUBLIC_STORE_* e NEXT_PUBLIC_COLOR_* com fallback: cada loja nova é o mesmo código com Environment Variables diferentes na Vercel. O único artefato por cliente é o arquivo do logo em /public.",
          en: "Next.js 15 (App Router) with TypeScript, Tailwind v4 with a fully CSS-first theme (no tailwind.config: colors live in an @theme inline block in globals.css) and Supabase covering Auth, Postgres and Storage. Multi-client customization isn't done by forking. A single file (src/config/theme.config.ts) defines name, WhatsApp number, logo and palette, which <ThemeInjector> turns into CSS variables (--store-*) on :root, and components only ever consume utilities (bg-bg, text-primary). For reselling at scale, that same theme.config.ts reads NEXT_PUBLIC_STORE_* and NEXT_PUBLIC_COLOR_* env vars with fallbacks, so each new store is the same codebase with different Vercel Environment Variables. The only per-client artifact is the logo file in /public.",
          es: "Next.js 15 (App Router) con TypeScript, Tailwind v4 con tema 100% CSS-first (sin tailwind.config: los colores viven en @theme inline en globals.css) y Supabase cubriendo Auth, Postgres y Storage. La personalización multicliente no se hace por fork. Un único archivo (src/config/theme.config.ts) define nombre, WhatsApp, logo y paleta, que <ThemeInjector> convierte en CSS variables (--store-*) en el :root, y los componentes solo consumen utilidades (bg-bg, text-primary). Para reventa en serie, el mismo theme.config.ts lee variables NEXT_PUBLIC_STORE_* y NEXT_PUBLIC_COLOR_* con fallback: cada tienda nueva es el mismo código con Environment Variables distintas en Vercel. El único artefacto por cliente es el archivo del logo en /public.",
        },
        {
          pt: "O estoque vai além de um campo único: products.stock é sempre o total, mas duas tabelas extras (units, inventory) habilitam um modo multi-loja física, com estoque por unidade. Um trigger no Postgres soma o inventory a cada mudança e recalcula o total automaticamente, então o resto da aplicação (carrinho, badge de estoque, JSON-LD) nunca precisa saber se a loja tem uma ou dez unidades. Ativar ou desativar esse modo semeia ou limpa o inventário preservando o total, com uma guarda contra corrida que checa se a unidade recém-criada é de fato a única, pra dois admins não duplicarem o estoque criando a 'primeira' loja ao mesmo tempo.",
          en: "Inventory goes beyond a single field: products.stock is always the total, but two extra tables (units, inventory) enable a multi-physical-store mode with per-unit stock. A Postgres trigger sums the inventory rows on every change and recalculates the total automatically, so the rest of the app (cart, stock badge, JSON-LD) never needs to know whether the store has one location or ten. Toggling that mode seeds or clears the inventory while preserving the total, with a race guard that checks the newly created unit is genuinely the only one, so two admins can't double the stock by creating the 'first' unit at the same time.",
          es: "El inventario va más allá de un campo único: products.stock es siempre el total, pero dos tablas extra (units, inventory) habilitan un modo multitienda física, con inventario por sucursal. Un trigger en Postgres suma el inventory en cada cambio y recalcula el total automáticamente, así que el resto de la aplicación (carrito, badge de inventario, JSON-LD) nunca necesita saber si la tienda tiene una o diez sucursales. Activar o desactivar ese modo siembra o limpia el inventario preservando el total, con una guarda contra condiciones de carrera que verifica que la sucursal recién creada sea de hecho la única, para que dos admins no dupliquen el inventario creando la 'primera' tienda al mismo tiempo.",
        },
        {
          pt: "Não há checkout com gateway: o carrinho vive 100% no client (Zustand com persist em localStorage) e o fechamento é sempre por WhatsApp. Um método syncWithServer reconcilia o carrinho salvo com o estado fresco do banco a cada visita. Ele remove item que ficou inativo ou zerou estoque, clampa a quantidade ao estoque disponível e sinaliza lastSyncChanged pra UI avisar o cliente. Todo link wa.me passa por normalizeWhatsapp(), que aplica a regra do nono dígito da Anatel e o DDI 55, e por waUrl(), nunca montado à mão. O componente <WhatsappCta> decide sozinho o número certo: vai direto se a loja tem 0 ou 1 unidade, ou abre um seletor modal quando há 2 ou mais lojas atendendo, cada uma com o próprio WhatsApp.",
          en: "There's no payment-gateway checkout: the cart lives 100% client-side (Zustand with localStorage persistence) and always closes on WhatsApp. A syncWithServer method reconciles the saved cart with fresh database state on every visit. It drops items that went inactive or out of stock, clamps quantity to available stock, and flags lastSyncChanged so the UI can warn the customer. Every wa.me link goes through normalizeWhatsapp(), which applies Brazil's Anatel 9th-digit rule plus the 55 country code, and through waUrl(), never built by hand. The <WhatsappCta> component alone decides the right number: it goes straight through with 0 or 1 store unit, or opens a picker modal when 2 or more units are attending, each with its own WhatsApp.",
          es: "No hay checkout con pasarela: el carrito vive 100% en el cliente (Zustand con persist en localStorage) y el cierre es siempre por WhatsApp. Un método syncWithServer reconcilia el carrito guardado con el estado fresco de la base de datos en cada visita. Elimina ítems que quedaron inactivos o sin inventario, limita la cantidad al inventario disponible y marca lastSyncChanged para que la UI avise al cliente. Todo link wa.me pasa por normalizeWhatsapp(), que aplica la regla del noveno dígito de Anatel y el código de país 55, y por waUrl(), nunca armado a mano. El componente <WhatsappCta> decide solo el número correcto: va directo si la tienda tiene 0 o 1 sucursal, o abre un selector modal cuando hay 2 o más tiendas atendiendo, cada una con su propio WhatsApp.",
        },
        {
          pt: "A postura de segurança leva a sério que este é um white-label que vira produto de terceiros. RLS habilitada em toda tabela do schema público, sem exceção, com uma allow-list de admins numa tabela sem nenhuma policy, acessível só via função SECURITY DEFINER is_admin(). A service_role não é usada em lugar nenhum: as mutações do admin rodam com a sessão do dono, tendo o RLS como defesa final. O rate limit de login persiste no Postgres, então sobrevive a cold start serverless, e nunca grava o IP em claro: salva um SHA-256(salt + IP), por exigência de LGPD. Até o JSON-LD do produto escapa '<' como \\u003c antes de serializar, pra um texto vindo do banco com '</script>' não injetar HTML na página.",
          en: "The security posture takes seriously that this white-label becomes a third party's product. RLS is enabled on every table in the public schema, no exceptions, with an admin allow-list in a table with zero policies, reachable only through the SECURITY DEFINER function is_admin(). The service_role key is used nowhere: admin mutations run on the owner's session, with RLS as the final line of defense. Login rate limiting persists in Postgres, so it survives serverless cold starts, and never stores the raw IP: it saves a SHA-256(salt + IP) hash for LGPD compliance. Even the product JSON-LD escapes '<' as \\u003c before serializing, so database text containing '</script>' can't inject HTML into the page.",
          es: "La postura de seguridad toma en serio que este es un white-label que se convierte en producto de terceros. RLS habilitado en toda tabla del schema público, sin excepción, con una allow-list de admins en una tabla sin ninguna policy, accesible solo vía la función SECURITY DEFINER is_admin(). La service_role no se usa en ningún lado: las mutaciones del admin corren con la sesión del dueño, con el RLS como defensa final. El rate limit de login persiste en Postgres, así que sobrevive al cold start serverless, y nunca guarda la IP en claro: almacena un SHA-256(salt + IP), por exigencia de la LGPD. Hasta el JSON-LD del producto escapa '<' como \\u003c antes de serializar, para que un texto venido de la base con '</script>' no inyecte HTML en la página.",
        },
      ],
      highlights: [
        {
          label: { pt: "White-label por config", en: "White-label by config", es: "White-label por config" },
          detail: { pt: "Um arquivo (theme.config.ts) e variáveis de ambiente definem marca, cor e WhatsApp. Cada cliente é o mesmo código com env vars diferentes na Vercel.", en: "One file (theme.config.ts) plus environment variables define brand, color and WhatsApp. Each client is the same codebase with different Vercel env vars.", es: "Un archivo (theme.config.ts) y variables de entorno definen marca, color y WhatsApp. Cada cliente es el mismo código con env vars distintas en Vercel." },
        },
        {
          label: { pt: "Estoque por unidade", en: "Per-store inventory", es: "Inventario por sucursal" },
          detail: { pt: "Trigger no Postgres soma o inventory de cada loja física e recalcula products.stock automaticamente. O app nunca sabe se há 1 ou 10 lojas.", en: "A Postgres trigger sums each physical store's inventory and recalculates products.stock automatically. The app never needs to know if there's 1 store or 10.", es: "Un trigger en Postgres suma el inventory de cada tienda física y recalcula products.stock automáticamente. La app nunca sabe si hay 1 o 10 tiendas." },
        },
        {
          label: { pt: "Checkout 100% WhatsApp", en: "100% WhatsApp checkout", es: "Checkout 100% WhatsApp" },
          detail: { pt: "Sem gateway: número normalizado (regra do 9º dígito), carrinho reconciliado com o estoque real e seletor de loja quando há 2+ unidades atendendo.", en: "No payment gateway: phone normalized (9th-digit rule), cart reconciled against real stock, and a store picker when 2+ units are attending.", es: "Sin pasarela: número normalizado (regla del 9.º dígito), carrito reconciliado con el inventario real y selector de tienda cuando hay 2+ sucursales atendiendo." },
        },
        {
          label: { pt: "RLS em toda tabela", en: "RLS on every table", es: "RLS en toda tabla" },
          detail: { pt: "Nenhum uso de service_role; allow-list de admins via função SECURITY DEFINER e IP de login hasheado (SHA-256) para LGPD.", en: "No use of service_role anywhere; admin allow-list via a SECURITY DEFINER function, and login IPs hashed (SHA-256) for LGPD compliance.", es: "Ningún uso de service_role; allow-list de admins vía función SECURITY DEFINER e IP de login con hash (SHA-256) para la LGPD." },
        },
      ],
      gallery: [
        { src: "/shots/loja-iphone/home.webp", alt: { pt: "Home da loja com hero animado e catálogo de destaques", en: "Store home with animated hero and featured catalog", es: "Home de la tienda con hero animado y catálogo de destacados" } },
        { src: "/shots/loja-iphone/catalogo.webp", alt: { pt: "Seção de catálogo com estoque, condição e parcelamento por produto", en: "Catalog section with per-product stock, condition and installments", es: "Sección de catálogo con inventario, condición y cuotas por producto" } },
        { src: "/shots/loja-iphone/lojas.webp", alt: { pt: "Seção de lojas físicas com endereço, horário e WhatsApp por unidade", en: "Physical stores section with address, hours and WhatsApp per unit", es: "Sección de tiendas físicas con dirección, horario y WhatsApp por sucursal" } },
      ],
    },
  },
  {
    slug: "loja-de-iphone",
    category: "sistema-saas",
    title: "Loja de iPhone Premium",
    tagline: { pt: "Vitrine Apple-style · vídeo do unboxing controlado pelo scroll", en: "Apple-style storefront · scroll-driven unboxing video", es: "Vitrina estilo Apple · video del unboxing controlado por el scroll" },
    problem: { pt: "Revendedor de iPhone costuma ter só o Instagram como vitrine, ou um template genérico que não passa a sensação de loja premium — e não converte visita em lead qualificado.", en: "iPhone resellers usually have only Instagram as a storefront, or a generic template that doesn't feel premium — and doesn't convert visits into qualified leads.", es: "El revendedor de iPhone suele tener solo Instagram como vitrina, o un template genérico que no transmite la sensación de tienda premium — y no convierte visitas en leads calificados." },
    result: { pt: "Loja de demonstração comercial no estilo Apple Store: hero com vídeo real do unboxing dirigido pelo scroll (a caixa abre conforme o visitante rola), catálogo com parcelamento e ficha de bateria por aparelho, e checkout de lead que monta sozinho a mensagem do WhatsApp — com campo condicional pra quem quer repassar o iPhone antigo. Identidade (nome, produtos, fotos, vídeo) troca num único arquivo de config, então a mesma base vira a loja de qualquer cliente.", en: "Commercial demo store in an Apple Store style: hero with a real unboxing video driven by scroll (the box opens as the visitor scrolls), a catalog with installment pricing and per-device battery health, and a lead checkout that builds its own WhatsApp message — with a conditional field for trading in an old iPhone. Identity (name, products, photos, video) swaps through a single config file, so the same base becomes any client's store.", es: "Tienda de demostración comercial al estilo Apple Store: hero con video real del unboxing dirigido por el scroll (la caja se abre conforme el visitante se desplaza), catálogo con cuotas y ficha de batería por equipo, y checkout de lead que arma solo el mensaje de WhatsApp — con campo condicional para quien quiere entregar el iPhone anterior como parte de pago. La identidad (nombre, productos, fotos, video) se cambia en un único archivo de config, así que la misma base se convierte en la tienda de cualquier cliente." },
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Playwright"],
    metric: { pt: "Vídeo real controlado pelo scroll", en: "Real video driven by scroll", es: "Video real controlado por el scroll" },
    status: { pt: "Projeto autoral · no ar", en: "Personal project · live", es: "Proyecto propio · en línea" },
    live: "https://loja-de-iphone-demo.vercel.app",
    repos: [{ label: "Código", url: `${GH}/loja-de-iphone` }],
    featured: true,
    homeFeatured: true,
    // Carro-chefe (trocado do TERRAL por pedido do Rick, 12/08): é o
    // projeto mais recente e o vídeo real do unboxing controlado por
    // scroll é um gancho tão forte quanto o do TERRAL.
    flagship: true,
    image: "/shots/loja-de-iphone.webp",
    imageStatic: true,
    caseStudy: {
      narrative: [
        {
          pt: "O hero não usa autoplay no desktop: um rAF lê a posição do scroll e persegue o currentTime do vídeo com um amortecimento (lerp), então rolar a página é literalmente abrir a caixa. O arquivo é reencodado com GOP 1 — todo frame vira keyframe — sem o que o seek engasga em produção mesmo rodando liso em localhost. No mobile o mesmo vídeo roda em autoplay puro em loop: aparelho real não decodifica frame de vídeo pausado sem dar play(), então dirigir por scroll deixaria o hero em branco no celular — o pin de altura dupla também só existe no desktop.",
          en: "The hero doesn't autoplay on desktop: a rAF loop reads scroll position and chases the video's currentTime with damping (lerp), so scrolling the page literally opens the box. The file is re-encoded with GOP 1 — every frame becomes a keyframe — without which seeking stutters in production even when it runs smoothly on localhost. On mobile the same video runs on plain autoplay loop instead: a real device won't decode a frame of a paused video without calling play(), so driving it by scroll would leave the hero blank on the phone — the double-height scroll pin only exists on desktop too.",
          es: "El hero no usa autoplay en desktop: un rAF lee la posición del scroll y persigue el currentTime del video con un amortiguamiento (lerp), así que desplazar la página es literalmente abrir la caja. El archivo se reencodea con GOP 1 — cada frame se vuelve keyframe — sin lo cual el seek se traba en producción aunque corra fluido en localhost. En el celular el mismo video corre en autoplay puro en loop: un equipo real no decodifica un frame de video pausado sin llamar a play(), así que dirigirlo por scroll dejaría el hero en blanco en el celular — el pin de altura doble también existe solo en desktop.",
        },
        {
          pt: "Carrinho e checkout são só frontend (localStorage), sem gateway: o botão final monta a mensagem do WhatsApp com produtos, subtotal e os dados do lead, revelando com uma animação de altura o campo de repasse (modelo + saúde da bateria) só quando o checkbox é marcado. Verificação visual roda com Playwright direto contra a URL de produção — scrub do hero em 5 posições, desktop e mobile — porque o mesmo scrub que passa liso local pode quebrar servido pela CDN.",
          en: "Cart and checkout are frontend-only (localStorage), no payment gateway: the final button builds the WhatsApp message with products, subtotal and lead details, revealing the trade-in field (model + battery health) with a height animation only when the checkbox is checked. Visual verification runs with Playwright straight against the production URL — the hero scrub at 5 positions, desktop and mobile — because a scrub that runs smoothly locally can still break once served from the CDN.",
          es: "Carrito y checkout son solo frontend (localStorage), sin pasarela: el botón final arma el mensaje de WhatsApp con productos, subtotal y los datos del lead, revelando con una animación de altura el campo de entrega del equipo anterior (modelo + salud de la batería) solo cuando se marca el checkbox. La verificación visual corre con Playwright directo contra la URL de producción — scrub del hero en 5 posiciones, desktop y celular — porque el mismo scrub que pasa fluido en local puede romperse servido por la CDN.",
        },
      ],
    },
  },
  {
    slug: "kavita-drones",
    category: "landing-essencial",
    title: "Kavita Drones",
    tagline: { pt: "Landing de alta conversão · cliente real, no ar", en: "High-conversion landing · real client, live", es: "Landing de alta conversión · cliente real, en línea" },
    problem: { pt: "Uma revenda de drones agrícolas precisava apresentar produtos e captar orçamento sem depender de rede social.", en: "An agricultural-drone reseller needed to showcase products and capture quotes without relying on social media.", es: "Una distribuidora de drones agrícolas necesitaba presentar productos y captar cotizaciones sin depender de redes sociales." },
    result: { pt: "Landing mobile-first, rápida, com catálogo + orçamento dinâmico enviado direto no WhatsApp. Entregue e em produção.", en: "Fast, mobile-first landing with catalog + dynamic quote sent straight to WhatsApp. Delivered and live.", es: "Landing mobile-first, rápida, con catálogo + cotización dinámica enviada directo por WhatsApp. Entregada y en producción." },
    stack: ["HTML", "CSS", "JavaScript", "Vercel"],
    metric: { pt: "Cliente real · em produção", en: "Real client · in production", es: "Cliente real · en producción" },
    metricProof: true,
    clientWork: true,
    clientName: "Kavita Agro",
    live: "https://kavita.com.br",
    repos: [{ label: "Código", url: `${GH}/kavita-drones-landing` }],
    featured: true,
    // Print do site no ar, no mesmo enquadramento do Kavita Institucional: os
    // dois cards do bloco de entregas ficam lado a lado e precisam ter a mesma
    // linguagem. Antes este aqui tinha vídeo do app em uso e o outro um print,
    // o que fazia os dois parecerem coisas de naturezas diferentes.
    image: "/shots/kavita-drones.webp",
    caseStudy: {
      narrative: [
        {
          pt: "Zero framework, de propósito: HTML5 semântico, CSS puro e JavaScript vanilla, sem build step. Abre direto o index.html no navegador. São ~7.200 linhas divididas em 3 arquivos (script.js com 1.735 linhas, styles.css com 4.239), decisão documentada no próprio README como \"landing autocontida\", separada do sistema principal da Kavita. A hospedagem hoje é Cloudflare Workers via wrangler.jsonc servindo os arquivos como static assets, com um vercel.json residual só para redirecionar permanentemente www.kavita.com.br para kavita.com.br. É o rastro de uma migração de provedor feita sem quebrar o domínio antigo.",
          en: "Zero framework, on purpose: semantic HTML5, plain CSS and vanilla JavaScript, with no build step. You just open index.html in the browser. It's about 7,200 lines split across 3 files (script.js at 1,735 lines, styles.css at 4,239), a decision the README itself documents as a \"self-contained landing\", kept separate from Kavita's core system. Hosting today is Cloudflare Workers via wrangler.jsonc serving the files as static assets, with a leftover vercel.json that only permanently redirects www.kavita.com.br to kavita.com.br. It's the trace of a provider migration done without breaking the old domain.",
          es: "Cero framework, a propósito: HTML5 semántico, CSS puro y JavaScript vanilla, sin build step. Se abre directo el index.html en el navegador. Son ~7.200 líneas divididas en 3 archivos (script.js con 1.735 líneas, styles.css con 4.239), decisión documentada en el propio README como \"landing autocontenida\", separada del sistema principal de Kavita. El hosting hoy es Cloudflare Workers vía wrangler.jsonc sirviendo los archivos como static assets, con un vercel.json residual solo para redirigir permanentemente www.kavita.com.br a kavita.com.br. Es el rastro de una migración de proveedor hecha sin romper el dominio anterior.",
        },
        {
          pt: "O catálogo de equipamentos (26 itens em 5 categorias: baterias, carregadores e energia, misturadores, motobombas e outros acessórios) vive num array ACCESSORIES em script.js, mas é tratado como dado governado, não como conteúdo solto. Cada item carrega um campo status, que pode ser confirmado, pendente-imagem, pendente-especificacao ou pendente-compatibilidade, e a regra do projeto, documentada em docs, é explícita: \"nada é inventado\". Specs sem fonte confirmada (manual DJI oficial ou página técnica da Agrobox) ficam marcadas como pendentes em vez de preenchidas com um chute. Os filtros de categoria e de compatibilidade com os 3 drones (T25P/T70P/T100) são combinados em AND, então um item só aparece se bater nos dois critérios ao mesmo tempo.",
          en: "The equipment catalog (26 items across 5 categories: batteries, chargers and power, tank mixers, sprayer pumps and other accessories) lives in an ACCESSORIES array in script.js, but it's treated as governed data, not loose content. Every item carries a status field, which can be confirmado, pendente-imagem, pendente-especificacao or pendente-compatibilidade, and the project's rule, documented in its docs, is explicit: \"nothing is invented\". Specs without a confirmed source (an official DJI manual or an Agrobox technical page) stay flagged as pending instead of getting filled in with a guess. Category and drone-compatibility filters (T25P/T70P/T100) combine with AND logic, so an item only shows up when it matches both criteria at once.",
          es: "El catálogo de equipos (26 ítems en 5 categorías: baterías, cargadores y energía, mezcladores, motobombas y otros accesorios) vive en un array ACCESSORIES en script.js, pero se trata como dato gobernado, no como contenido suelto. Cada ítem lleva un campo status, que puede ser confirmado, pendente-imagem, pendente-especificacao o pendente-compatibilidade, y la regla del proyecto, documentada en docs, es explícita: \"nada se inventa\". Las specs sin fuente confirmada (manual DJI oficial o página técnica de Agrobox) quedan marcadas como pendientes en vez de rellenadas con una suposición. Los filtros de categoría y de compatibilidad con los 3 drones (T25P/T70P/T100) se combinan en AND, así que un ítem solo aparece si cumple los dos criterios al mismo tiempo.",
        },
        {
          pt: "O orçamento funciona como um mini-carrinho sem loja. O visitante adiciona drones, equipamentos e serviços a um budget que persiste em localStorage entre sessões (com fallback silencioso se o navegador bloquear o storage) e vê um contador de itens em tempo real. No envio do formulário de lead, o site monta uma mensagem estruturada, separada em blocos \"Drones\", \"Equipamentos e acessórios\" e \"Serviços\", e redireciona via wa.me. O número de destino muda por unidade: um objeto REPRESENTATIVES mapeia 4 filiais (Mateus/sede, Itaperuna-RJ, Manhuaçu-MG, Cachoeiro de Itapemirim-ES) para 4 WhatsApp diferentes, com fallback pro número padrão se o visitante não escolher nenhuma.",
          en: "The quote builder works like a mini-cart with no store behind it. Visitors add drones, equipment and services to a budget that persists in localStorage across sessions (with a silent fallback if the browser blocks storage) and see a live item counter. On lead-form submit, the site assembles a structured message, split into \"Drones\", \"Equipment and accessories\" and \"Services\" blocks, then redirects via wa.me. The destination number changes per unit: a REPRESENTATIVES object maps 4 branches (Mateus/HQ, Itaperuna-RJ, Manhuaçu-MG, Cachoeiro de Itapemirim-ES) to 4 different WhatsApp numbers, falling back to a default if the visitor picks none.",
          es: "La cotización funciona como un minicarrito sin tienda. El visitante agrega drones, equipos y servicios a un budget que persiste en localStorage entre sesiones (con fallback silencioso si el navegador bloquea el storage) y ve un contador de ítems en tiempo real. Al enviar el formulario de lead, el sitio arma un mensaje estructurado, separado en bloques \"Drones\", \"Equipos y accesorios\" y \"Servicios\", y redirige vía wa.me. El número de destino cambia por sucursal: un objeto REPRESENTATIVES mapea 4 filiales (Mateus/sede, Itaperuna-RJ, Manhuaçu-MG, Cachoeiro de Itapemirim-ES) a 4 WhatsApp distintos, con fallback al número por defecto si el visitante no elige ninguna.",
        },
        {
          pt: "Vários detalhes de performance e acessibilidade que normalmente vêm de um framework foram feitos à mão. O hero usa preload com fetchpriority=\"high\" pra imagem crítica e preconnect pras Google Fonts. O vídeo de fundo do hero pausa via IntersectionObserver quando sai da viewport, economizando CPU e bateria, e nem chega a tocar se prefers-reduced-motion estiver ativo. Os contadores animados (números da DJI) usam requestAnimationFrame com easing easeOutCubic escrito na mão, calculado a partir do próprio texto do HTML, então funcionam como progressive enhancement puro: sem JS, o número final já está certo. E o tema claro/escuro respeita a preferência do sistema (matchMedia) na primeira visita e depois persiste a escolha do usuário em localStorage.",
          en: "Several performance and accessibility details that usually come from a framework were hand-built. The hero uses preload with fetchpriority=\"high\" for the critical image and preconnect for Google Fonts. The hero background video pauses via IntersectionObserver when it leaves the viewport, saving CPU and battery, and won't even play if prefers-reduced-motion is on. The animated counters (DJI stat numbers) use requestAnimationFrame with a hand-written easeOutCubic easing, computed straight from the HTML's own text, so they work as pure progressive enhancement: with no JS, the final number is already correct. And the light/dark theme respects the system preference (matchMedia) on first visit, then persists the user's choice in localStorage.",
          es: "Varios detalles de performance y accesibilidad que normalmente vienen de un framework se hicieron a mano. El hero usa preload con fetchpriority=\"high\" para la imagen crítica y preconnect para Google Fonts. El video de fondo del hero se pausa vía IntersectionObserver cuando sale del viewport, ahorrando CPU y batería, y ni siquiera se reproduce si prefers-reduced-motion está activo. Los contadores animados (cifras de DJI) usan requestAnimationFrame con easing easeOutCubic escrito a mano, calculado a partir del propio texto del HTML, así que funcionan como progressive enhancement puro: sin JS, el número final ya está correcto. Y el tema claro/oscuro respeta la preferencia del sistema (matchMedia) en la primera visita y después persiste la elección del usuario en localStorage.",
        },
      ],
      highlights: [
        {
          label: { pt: "Catálogo como dado governado", en: "Catalog as governed data", es: "Catálogo como dato gobernado" },
          detail: { pt: "26 itens com status confirmado ou pendente por campo. Nenhuma especificação é inventada.", en: "26 items with per-field confirmed or pending status. No specification is ever invented.", es: "26 ítems con status confirmado o pendiente por campo. Ninguna especificación se inventa." },
        },
        {
          label: { pt: "Orçamento multi-item persistente", en: "Persistent multi-item quote", es: "Cotización multi-ítem persistente" },
          detail: { pt: "Carrinho de drones + equipamentos + serviços em localStorage, virando uma mensagem estruturada no WhatsApp.", en: "Drones + equipment + services cart in localStorage, turned into a structured WhatsApp message.", es: "Carrito de drones + equipos + servicios en localStorage, convertido en un mensaje estructurado de WhatsApp." },
        },
        {
          label: { pt: "Roteamento por unidade regional", en: "Regional unit routing", es: "Enrutamiento por sucursal regional" },
          detail: { pt: "4 filiais (MG/ES/RJ) mapeadas para 4 números de WhatsApp diferentes, com fallback padrão.", en: "4 branches (MG/ES/RJ states) mapped to 4 different WhatsApp numbers, with a default fallback.", es: "4 filiales (MG/ES/RJ) mapeadas a 4 números de WhatsApp distintos, con fallback por defecto." },
        },
        {
          label: { pt: "Zero framework, performance à mão", en: "Zero framework, hand-built performance", es: "Cero framework, performance a mano" },
          detail: { pt: "Vanilla JS com IntersectionObserver, fetchpriority e prefers-reduced-motion, sem nenhum build step.", en: "Vanilla JS with IntersectionObserver, fetchpriority and prefers-reduced-motion, with no build step at all.", es: "Vanilla JS con IntersectionObserver, fetchpriority y prefers-reduced-motion, sin ningún build step." },
        },
      ],
      gallery: [
        { src: "/shots/kavita-drones/hero.webp", alt: { pt: "Hero da Kavita Drones com CTA de orçamento pelo WhatsApp", en: "Kavita Drones hero with WhatsApp quote CTA", es: "Hero de Kavita Drones con CTA de cotización por WhatsApp" } },
        { src: "/shots/kavita-drones/drones.webp", alt: { pt: "Comparativo dos 3 modelos DJI Agras (T25P, T70P, T100)", en: "Comparison of the 3 DJI Agras models (T25P, T70P, T100)", es: "Comparativo de los 3 modelos DJI Agras (T25P, T70P, T100)" } },
        { src: "/shots/kavita-drones/equipamentos.webp", alt: { pt: "Catálogo de equipamentos com filtros por categoria e compatibilidade", en: "Equipment catalog with category and compatibility filters", es: "Catálogo de equipos con filtros por categoría y compatibilidad" } },
      ],
    },
  },
  {
    slug: "kavita-institucional",
    category: "institucional-premium",
    title: "Kavita Institucional",
    tagline: { pt: "Site institucional cinematográfico · cliente real, no ar", en: "Cinematic company site · real client, live", es: "Sitio institucional cinematográfico · cliente real, en línea" },
    problem: { pt: "A Kavita Agro já tinha a landing de drones, mas a empresa é muito maior que isso: loja de insumos, sementes, peças, assistência técnica e uma fábrica de ração própria. Não existia nada que contasse quem a empresa é para quem chega pela primeira vez.", en: "Kavita Agro already had the drone landing page, but the company is much bigger than that: farm supplies, seeds, parts, technical assistance and its own feed factory. Nothing existed to tell a first-time visitor who the company actually is.", es: "Kavita Agro ya tenía la landing de drones, pero la empresa es mucho más grande que eso: tienda de insumos, semillas, repuestos, asistencia técnica y una fábrica de alimento balanceado propia. No existía nada que contara quién es la empresa a quien llega por primera vez." },
    result: { pt: "Site institucional inteiro construído em volta de uma jornada em vídeo que o visitante conduz com o scroll, saindo do café e do gado até o centro tecnológico. Segundo projeto para o mesmo cliente, entregue e aprovado.", en: "A full company site built around a video journey the visitor drives with the scroll, going from coffee and cattle all the way to the tech hub. Second project for the same client, delivered and approved.", es: "Sitio institucional entero construido alrededor de un recorrido en video que el visitante conduce con el scroll, saliendo del café y del ganado hasta el centro tecnológico. Segundo proyecto para el mismo cliente, entregado y aprobado." },
    stack: ["Next.js 16", "React 19", "GSAP", "Lenis", "Framer Motion", "Tailwind"],
    metric: { pt: "Cliente real · segundo projeto", en: "Real client · second project", es: "Cliente real · segundo proyecto" },
    metricProof: true,
    clientWork: true,
    clientName: "Kavita Agro",
    live: "https://kavita-institucional.vercel.app",
    repos: [{ label: "Código", url: `${GH}/kavita-institucional` }],
    featured: true,
    // Print do site no ar. Sem `imageStatic`: aquele modo é para print de
    // celular (retrato) e deixa um vazio embaixo com uma captura larga. O modo
    // padrão preenche a moldura com a mesma imagem borrada e, como o print não
    // é mais alto que a janela, ele simplesmente não rola.
    image: "/shots/kavita-institucional.webp",
    caseStudy: {
      narrative: [
        {
          pt: "A peça central do site é uma jornada onde o scroll não rola a página, ele move o tempo de um vídeo. São 850vh de altura de rolagem mapeados sobre uma única cena contínua, sem cortes, que atravessa café, gado, milho, drone em operação, o amanhecer e o centro tecnológico. O progresso de 0 a 1 vira o currentTime do vídeo, e as legendas de cada trecho entram e saem em cima dele conforme o instante. O efeito é o visitante conduzir o filme no próprio ritmo, em vez de assistir a um player.",
          en: "The centerpiece is a journey where scrolling doesn't move the page, it moves a video's time. 850vh of scroll height is mapped onto a single continuous shot, no cuts, going through coffee, cattle, corn, a drone at work, sunrise and the tech hub. Progress from 0 to 1 becomes the video's currentTime, and each segment's captions fade in and out on top of it according to the moment. The visitor drives the film at their own pace instead of watching a player.",
          es: "La pieza central del sitio es un recorrido donde el scroll no desplaza la página, mueve el tiempo de un video. Son 850vh de altura de desplazamiento mapeados sobre una única escena continua, sin cortes, que atraviesa café, ganado, maíz, dron en operación, el amanecer y el centro tecnológico. El progreso de 0 a 1 se convierte en el currentTime del video, y los subtítulos de cada tramo entran y salen encima según el instante. El efecto es que el visitante conduce la película a su propio ritmo, en vez de mirar un player.",
        },
        {
          pt: "Todo o texto do site vive num arquivo único, e nada nele foi escrito por suposição. O cabeçalho do content.ts registra que telefone, WhatsApp, endereço, e-mail e Instagram vieram de um briefing preenchido pela própria Kavita, e os dados cadastrais estão lá com CNPJ e data de abertura. A filial Kavita Rações aparece separada, com o CNPJ dela, o ano em que abriu e o endereço próprio na rodovia, porque é uma unidade distinta da loja matriz e tratar as duas como a mesma coisa seria informação errada no site de um cliente.",
          en: "All the site's copy lives in a single file, and none of it was written by assumption. The header of content.ts records that phone, WhatsApp, address, email and Instagram came from a briefing filled in by Kavita themselves, and the registration data is there with the company number and founding date. The Kavita Rações branch appears separately, with its own company number, opening year and its own highway address, because it's a distinct unit from the main store and treating them as one thing would put wrong information on a client's site.",
          es: "Todo el texto del sitio vive en un archivo único, y nada en él fue escrito por suposición. El encabezado del content.ts registra que teléfono, WhatsApp, dirección, e-mail e Instagram vinieron de un briefing completado por la propia Kavita, y los datos de registro están ahí con CNPJ y fecha de apertura. La filial Kavita Rações aparece separada, con su propio CNPJ, el año en que abrió y su dirección propia en la carretera, porque es una unidad distinta de la tienda matriz y tratar a las dos como lo mismo sería información errónea en el sitio de un cliente.",
        },
        {
          pt: "Em volta da jornada o site é organizado em cinco paradas: Quem Somos, Ecossistema, Estrutura, Diferenciais e Onde Estamos. A estrutura da loja é mostrada com fotos reais em parallax (fachada, loja, estoque, assistência, equipe) em vez de banco de imagens, e o ecossistema separa as seis frentes da empresa em cartões próprios. A base recebeu uma auditoria em cinco fases, com passagens dedicadas a acessibilidade, performance, menu mobile e extração de componentes repetidos.",
          en: "Around the journey the site is organised into five stops: Who We Are, Ecosystem, Structure, Differentials and Where We Are. The store's structure is shown with real parallax photos (storefront, shop floor, stockroom, service desk, team) instead of stock imagery, and the ecosystem splits the company's six fronts into their own cards. The codebase went through a five-phase audit, with dedicated passes for accessibility, performance, the mobile menu and extracting repeated components.",
          es: "Alrededor del recorrido el sitio se organiza en cinco paradas: Quiénes Somos, Ecosistema, Estructura, Diferenciales y Dónde Estamos. La estructura de la tienda se muestra con fotos reales en parallax (fachada, tienda, depósito, asistencia, equipo) en vez de banco de imágenes, y el ecosistema separa los seis frentes de la empresa en tarjetas propias. La base recibió una auditoría en cinco fases, con pasadas dedicadas a accesibilidad, performance, menú móvil y extracción de componentes repetidos.",
        },
      ],
      highlights: [
        {
          label: { pt: "Scroll controla o vídeo", en: "Scroll drives the video", es: "El scroll controla el video" },
          detail: { pt: "850vh de rolagem mapeados sobre uma cena contínua sem cortes. O visitante conduz o filme no próprio ritmo.", en: "850vh of scroll mapped onto one continuous uncut shot. The visitor drives the film at their own pace.", es: "850vh de desplazamiento mapeados sobre una escena continua sin cortes. El visitante conduce la película a su propio ritmo." },
        },
        {
          label: { pt: "Conteúdo vindo de briefing", en: "Copy sourced from a briefing", es: "Contenido venido del briefing" },
          detail: { pt: "Contato, endereço e dados cadastrais confirmados pelo cliente e registrados na fonte. Nada preenchido por suposição.", en: "Contact, address and registration data confirmed by the client and recorded at the source. Nothing filled in by assumption.", es: "Contacto, dirección y datos de registro confirmados por el cliente y registrados en la fuente. Nada completado por suposición." },
        },
        {
          label: { pt: "Duas empresas, dois cadastros", en: "Two companies, two records", es: "Dos empresas, dos registros" },
          detail: { pt: "A fábrica de ração é filial com CNPJ e endereço próprios, tratada como unidade separada da loja matriz.", en: "The feed factory is a branch with its own company number and address, treated as a unit separate from the main store.", es: "La fábrica de alimento balanceado es una filial con CNPJ y dirección propios, tratada como unidad separada de la tienda matriz." },
        },
        {
          label: { pt: "Fotos reais, não banco de imagens", en: "Real photos, not stock", es: "Fotos reales, no banco de imágenes" },
          detail: { pt: "Fachada, loja, estoque, assistência e equipe fotografados no local, exibidos em parallax.", en: "Storefront, shop floor, stockroom, service desk and team shot on location, shown in parallax.", es: "Fachada, tienda, depósito, asistencia y equipo fotografiados en el lugar, exhibidos en parallax." },
        },
      ],
    },
  },
];
