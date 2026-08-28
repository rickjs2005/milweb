import type { Localized } from "./content";

/**
 * PÁGINAS DE SERVIÇO (SEO) — cada slug vira uma URL dedicada otimizada pro
 * termo comercial ("criação de sites", "catálogo whatsapp", "landing page"),
 * com FAQ próprio (FAQPage), Schema Service e CTA de WhatsApp contextual.
 */
export type Service = {
  slug: string;
  /** rótulo curto (cards/links internos) */
  label: Localized;
  metaTitle: Localized;
  metaDescription: Localized;
  eyebrow: Localized;
  title: Localized;
  titleHighlight: Localized;
  sub: Localized;
  benefits: { icon: string; title: Localized; desc: Localized }[];
  steps: { title: Localized; desc: Localized }[];
  faq: { q: Localized; a: Localized }[];
  ctaWhats: Localized;
};

export const SERVICES: Service[] = [
  {
    slug: "criacao-de-sites",
    label: { pt: "Criação de sites", en: "Website development", es: "Creación de sitios web" },
    metaTitle: {
      pt: "Criação de Sites Profissionais: rápidos e otimizados pro Google",
      en: "Professional Website Development: fast and Google-optimized",
      es: "Creación de Sitios Web Profesionales: rápidos y optimizados para Google",
    },
    metaDescription: {
      pt: "Criação de sites sob medida: design próprio, performance Lighthouse 100, SEO técnico e suporte pós-entrega. Orçamento gratuito pelo WhatsApp.",
      en: "Custom professional website development: unique design, Lighthouse 100 performance, full technical SEO and post-launch support. Free quote via WhatsApp.",
      es: "Creación de sitios a medida: diseño propio, performance Lighthouse 100, SEO técnico y soporte posentrega. Cotización gratuita por WhatsApp.",
    },
    eyebrow: { pt: "Criação de sites", en: "Website development", es: "Creación de sitios web" },
    title: { pt: "Sites profissionais que", en: "Professional websites that", es: "Sitios profesionales que" },
    titleHighlight: { pt: "vendem de verdade", en: "actually sell", es: "venden de verdad" },
    sub: {
      pt: "Do institucional ao e-commerce: site rápido, bonito e otimizado pro Google, construído sob medida. Sem template, sem construtor genérico.",
      en: "From corporate to e-commerce: a fast, polished, Google-optimized website built from scratch. No templates, no generic builders.",
      es: "Del institucional al e-commerce: sitio rápido, bonito y optimizado para Google, construido a medida. Sin plantillas, sin constructores genéricos.",
    },
    benefits: [
      { icon: "Palette", title: { pt: "Design sob medida", en: "Tailor-made design", es: "Diseño a medida" }, desc: { pt: "Identidade própria pra sua marca, nada de tema pronto igual ao do concorrente.", en: "A unique identity for your brand, not an off-the-shelf theme that looks like your competitor's.", es: "Identidad propia para tu marca, nada de temas listos iguales a los de la competencia." } },
      { icon: "Gauge", title: { pt: "Performance nota 100", en: "Perfect 100 performance", es: "Performance nota 100" }, desc: { pt: "Carregamento instantâneo, aprovado nas métricas que o Google usa pra ranquear.", en: "Instant loading, passing the exact metrics Google uses to rank.", es: "Carga instantánea, aprobada en las métricas que Google usa para posicionar." } },
      { icon: "Search", title: { pt: "SEO técnico incluso", en: "Technical SEO included", es: "SEO técnico incluido" }, desc: { pt: "Estrutura, dados semânticos, sitemap e metadados prontos pra indexar desde o dia 1.", en: "Structure, semantic data, sitemap and metadata ready to index from day one.", es: "Estructura, datos semánticos, sitemap y metadatos listos para indexar desde el día 1." } },
      { icon: "Smartphone", title: { pt: "Perfeito no celular", en: "Perfect on mobile", es: "Perfecto en el celular" }, desc: { pt: "Mobile-first: a maioria dos seus clientes chega pelo celular, e o site nasce pra isso.", en: "Mobile-first: most of your customers arrive on a phone, and the site is born for it.", es: "Mobile-first: la mayoría de tus clientes llega desde el celular, y el sitio nace para eso." } },
      { icon: "Globe", title: { pt: "Domínio e hospedagem", en: "Domain and hosting", es: "Dominio y hosting" }, desc: { pt: "Configuro domínio próprio, HTTPS e infraestrutura global. Você não se preocupa com nada técnico.", en: "I set up your domain, HTTPS and global infrastructure. Zero technical worries for you.", es: "Configuro dominio propio, HTTPS e infraestructura global. No te preocupas por nada técnico." } },
      { icon: "LifeBuoy", title: { pt: "Suporte pós-entrega", en: "Post-launch support", es: "Soporte posentrega" }, desc: { pt: "Ajustes e correções depois do lançamento, por escrito no contrato.", en: "Tweaks and fixes after launch, guaranteed in writing.", es: "Ajustes y correcciones después del lanzamiento, por escrito en el contrato." } },
    ],
    steps: [
      { title: { pt: "Briefing", en: "Briefing", es: "Briefing" }, desc: { pt: "Entendo seu negócio, seus clientes e o objetivo do site.", en: "I understand your business, your customers and the site's goal.", es: "Entiendo tu negocio, tus clientes y el objetivo del sitio." } },
      { title: { pt: "Design", en: "Design", es: "Diseño" }, desc: { pt: "Proposta visual sob medida pra sua aprovação.", en: "A tailor-made visual proposal for your approval.", es: "Propuesta visual a medida para tu aprobación." } },
      { title: { pt: "Desenvolvimento", en: "Development", es: "Desarrollo" }, desc: { pt: "Código limpo com a mesma stack de produtos que você admira.", en: "Clean code with the same stack as products you admire.", es: "Código limpio con el mismo stack de los productos que admiras." } },
      { title: { pt: "SEO + lançamento", en: "SEO + launch", es: "SEO + lanzamiento" }, desc: { pt: "No ar com domínio, HTTPS, analytics e Google configurados.", en: "Live with domain, HTTPS, analytics and Google configured.", es: "En línea con dominio, HTTPS, analytics y Google configurados." } },
    ],
    faq: [
      { q: { pt: "Quanto tempo leva pra ficar pronto?", en: "How long does it take?", es: "¿Cuánto tiempo tarda?" }, a: { pt: "Depende do escopo: uma landing page sai em poucos dias; um site institucional completo, em 2 a 4 semanas. No briefing eu te passo o prazo exato por escrito.", en: "It depends on scope: a landing page ships in a few days; a full corporate site in 2–4 weeks. At the briefing I give you the exact deadline in writing.", es: "Depende del alcance: una landing page sale en pocos días; un sitio institucional completo, en 2 a 4 semanas. En el briefing te doy el plazo exacto por escrito." } },
      { q: { pt: "Preciso já ter domínio e hospedagem?", en: "Do I need a domain and hosting already?", es: "¿Necesito tener ya dominio y hosting?" }, a: { pt: "Não. Eu cuido do registro do domínio, da hospedagem e do HTTPS. Tudo fica no seu nome, como deve ser.", en: "No. I handle domain registration, hosting and HTTPS. Everything stays under your name, as it should.", es: "No. Yo me encargo del registro del dominio, del hosting y del HTTPS. Todo queda a tu nombre, como debe ser." } },
      { q: { pt: "Vou conseguir atualizar o site sozinho?", en: "Will I be able to update the site myself?", es: "¿Podré actualizar el sitio yo mismo?" }, a: { pt: "Sim, se o projeto pedir: incluo painel administrativo pra você editar textos, fotos e produtos sem depender de ninguém.", en: "Yes, if the project calls for it: I include an admin panel so you can edit copy, photos and products without depending on anyone.", es: "Sí, si el proyecto lo pide: incluyo un panel administrativo para que edites textos, fotos y productos sin depender de nadie." } },
      { q: { pt: "E depois do lançamento?", en: "What about after launch?", es: "¿Y después del lanzamiento?" }, a: { pt: "Suporte gratuito pra ajustes e correções, previsto em contrato, e evolução contínua se você quiser crescer o site junto com o negócio.", en: "Free support for tweaks and fixes, guaranteed by contract, plus continuous evolution if you want the site to grow with the business.", es: "Soporte gratuito para ajustes y correcciones, previsto en el contrato, y evolución continua si quieres que el sitio crezca junto con el negocio." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para criação de um site profissional.",
      en: "Hi Rick! I'd like a quote for a professional website.",
      es: "¡Hola Rick! Quiero una cotización para la creación de un sitio profesional.",
    },
  },
  {
    slug: "catalogo-whatsapp",
    label: { pt: "Catálogo para WhatsApp", en: "WhatsApp catalog", es: "Catálogo para WhatsApp" },
    metaTitle: {
      pt: "Catálogo Online para WhatsApp: pedidos direto no seu número",
      en: "Online WhatsApp Catalog: orders straight to your number",
      es: "Catálogo Online para WhatsApp: pedidos directo a tu número",
    },
    metaDescription: {
      pt: "Catálogo online com carrinho: o cliente escolhe os produtos e o pedido chega pronto no seu WhatsApp. Sem taxa por venda, sem marketplace. Orçamento gratuito.",
      en: "Professional online catalog with cart: customers pick products and the order lands ready in your WhatsApp. No sales fees, no marketplace. Free quote.",
      es: "Catálogo online con carrito: el cliente elige los productos y el pedido llega listo a tu WhatsApp. Sin comisión por venta, sin marketplace. Cotización gratuita.",
    },
    eyebrow: { pt: "Catálogo para WhatsApp", en: "WhatsApp catalog", es: "Catálogo para WhatsApp" },
    title: { pt: "Seu catálogo online com pedidos", en: "Your online catalog with orders", es: "Tu catálogo online con pedidos" },
    titleHighlight: { pt: "direto no WhatsApp", en: "straight to WhatsApp", es: "directo en WhatsApp" },
    sub: {
      pt: "Vitrine profissional dos seus produtos: o cliente monta o carrinho no site e a mensagem chega pronta no seu WhatsApp. Sem taxa por venda, sem depender de marketplace.",
      en: "A professional showcase for your products: the customer builds a cart on your site and the message lands ready in your WhatsApp. No sales fees, no marketplace dependency.",
      es: "Vitrina profesional de tus productos: el cliente arma el carrito en el sitio y el mensaje llega listo a tu WhatsApp. Sin comisión por venta, sin depender de marketplaces.",
    },
    benefits: [
      { icon: "ShoppingCart", title: { pt: "Carrinho vira mensagem pronta", en: "Cart becomes a ready message", es: "El carrito se convierte en mensaje" }, desc: { pt: "O cliente escolhe produtos, tamanho e quantidade, e o pedido cai formatado no seu WhatsApp.", en: "The customer picks products, size and quantity, and the order arrives formatted in your WhatsApp.", es: "El cliente elige productos, talla y cantidad, y el pedido cae formateado en tu WhatsApp." } },
      { icon: "BadgePercent", title: { pt: "Zero taxa por venda", en: "Zero sales fees", es: "Cero comisión por venta" }, desc: { pt: "Diferente de marketplace e apps de venda: o canal é seu e ninguém morde sua margem.", en: "Unlike marketplaces and sales apps: the channel is yours and nobody bites your margin.", es: "A diferencia de marketplaces y apps de venta: el canal es tuyo y nadie muerde tu margen." } },
      { icon: "Search", title: { pt: "Aparece no Google", en: "Shows up on Google", es: "Aparece en Google" }, desc: { pt: "Cada produto vira uma página indexável, com clientes te achando sem você postar.", en: "Every product becomes an indexable page, so customers find you without a single post.", es: "Cada producto se vuelve una página indexable, con clientes encontrándote sin que publiques." } },
      { icon: "ImageUp", title: { pt: "Fácil de atualizar", en: "Easy to update", es: "Fácil de actualizar" }, desc: { pt: "Painel simples pra trocar fotos, preços e estoque na hora, do celular.", en: "A simple panel to swap photos, prices and stock instantly, from your phone.", es: "Panel simple para cambiar fotos, precios e inventario al momento, desde el celular." } },
      { icon: "Smartphone", title: { pt: "Experiência de app", en: "App-like experience", es: "Experiencia de app" }, desc: { pt: "Rápido e fluido no celular, que é onde seus clientes realmente compram.", en: "Fast and fluid on mobile, which is where your customers actually buy.", es: "Rápido y fluido en el celular, que es donde tus clientes realmente compran." } },
      { icon: "Link2", title: { pt: "Um link pra tudo", en: "One link for everything", es: "Un link para todo" }, desc: { pt: "Bio do Instagram, status do WhatsApp, QR code no balcão: um link, todos os produtos.", en: "Instagram bio, WhatsApp status, QR code at the counter: one link, every product.", es: "Bio de Instagram, estado de WhatsApp, código QR en el mostrador: un link, todos los productos." } },
    ],
    steps: [
      { title: { pt: "Briefing", en: "Briefing", es: "Briefing" }, desc: { pt: "Levantamos produtos, categorias e como você quer receber os pedidos.", en: "We map products, categories and how you want to receive orders.", es: "Relevamos productos, categorías y cómo quieres recibir los pedidos." } },
      { title: { pt: "Vitrine", en: "Showcase", es: "Vitrina" }, desc: { pt: "Design da vitrine com a cara da sua marca.", en: "Showcase design with your brand's look.", es: "Diseño de la vitrina con la identidad de tu marca." } },
      { title: { pt: "Carrinho + WhatsApp", en: "Cart + WhatsApp", es: "Carrito + WhatsApp" }, desc: { pt: "Fluxo de pedido integrado ao seu número.", en: "Order flow integrated with your number.", es: "Flujo de pedido integrado a tu número." } },
      { title: { pt: "Lançamento", en: "Launch", es: "Lanzamiento" }, desc: { pt: "No ar com domínio próprio e produtos cadastrados.", en: "Live with your own domain and products loaded.", es: "En línea con dominio propio y productos cargados." } },
    ],
    faq: [
      { q: { pt: "Como eu recebo os pedidos?", en: "How do I receive orders?", es: "¿Cómo recibo los pedidos?" }, a: { pt: "O cliente monta o carrinho no site e, ao finalizar, abre o seu WhatsApp com a mensagem do pedido pronta: itens, quantidades e total. Você só confirma e combina pagamento/entrega.", en: "The customer builds the cart on the site and, at checkout, their WhatsApp opens with the order message ready: items, quantities and total. You just confirm and arrange payment/delivery.", es: "El cliente arma el carrito en el sitio y, al finalizar, se abre tu WhatsApp con el mensaje del pedido listo: ítems, cantidades y total. Solo confirmas y acuerdas pago/entrega." } },
      { q: { pt: "Tem mensalidade ou taxa por venda?", en: "Are there monthly or per-sale fees?", es: "¿Hay mensualidad o comisión por venta?" }, a: { pt: "Não cobro taxa por venda. O custo fixo é só domínio e hospedagem (baixíssimo), bem diferente de marketplace, que morde cada pedido.", en: "I charge no per-sale fee. The only fixed cost is domain and hosting (very low), unlike marketplaces, which take a cut of every order.", es: "No cobro comisión por venta. El costo fijo es solo dominio y hosting (muy bajo), muy distinto de un marketplace, que muerde cada pedido." } },
      { q: { pt: "Eu mesmo atualizo os produtos?", en: "Can I update products myself?", es: "¿Actualizo los productos yo mismo?" }, a: { pt: "Sim: entrego com painel simples pra adicionar produto, trocar foto, preço e estoque, direto do celular.", en: "Yes: it ships with a simple panel to add products and change photos, prices and stock, right from your phone.", es: "Sí: lo entrego con un panel simple para agregar productos, cambiar foto, precio e inventario, directo desde el celular." } },
      { q: { pt: "Funciona pra qualquer tipo de negócio?", en: "Does it work for any business?", es: "¿Funciona para cualquier tipo de negocio?" }, a: { pt: "Roupas, joias, comida, cosméticos, pet shop, autopeças… se você vende pelo WhatsApp hoje, o catálogo organiza e multiplica esse canal.", en: "Clothing, jewelry, food, cosmetics, pet shops, auto parts… if you sell via WhatsApp today, a catalog organizes and multiplies that channel.", es: "Ropa, joyas, comida, cosméticos, pet shop, autopartes… si hoy vendes por WhatsApp, el catálogo organiza y multiplica ese canal." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para um catálogo online com pedidos no WhatsApp.",
      en: "Hi Rick! I'd like a quote for an online catalog with WhatsApp orders.",
      es: "¡Hola Rick! Quiero una cotización para un catálogo online con pedidos por WhatsApp.",
    },
  },
  {
    slug: "landing-pages",
    label: { pt: "Landing pages", en: "Landing pages", es: "Landing pages" },
    metaTitle: {
      pt: "Landing Pages de Alta Conversão: prontas pra tráfego pago",
      en: "High-Conversion Landing Pages: ready for paid traffic",
      es: "Landing Pages de Alta Conversión: listas para tráfico pago",
    },
    metaDescription: {
      pt: "Landing pages feitas pra converter: copy orientada a venda, carregamento instantâneo, integração com WhatsApp e pixel/analytics prontos pra anúncios.",
      en: "Fast, persuasive landing pages built to convert: sales-driven copy, instant loading, WhatsApp integration and pixel/analytics ready for ads.",
      es: "Landing pages hechas para convertir: copy orientado a la venta, carga instantánea, integración con WhatsApp y pixel/analytics listos para anuncios.",
    },
    eyebrow: { pt: "Landing pages", en: "Landing pages", es: "Landing pages" },
    title: { pt: "Landing pages que transformam", en: "Landing pages that turn", es: "Landing pages que convierten" },
    titleHighlight: { pt: "cliques em clientes", en: "clicks into customers", es: "clics en clientes" },
    sub: {
      pt: "Uma página, um objetivo: converter. Ideal pra tráfego pago, lançamentos e captação de leads. Rápida, persuasiva e com cada clique medido.",
      en: "One page, one goal: convert. Ideal for paid traffic, launches and lead capture. Fast, persuasive and with every click measured.",
      es: "Una página, un objetivo: convertir. Ideal para tráfico pago, lanzamientos y captación de leads. Rápida, persuasiva y con cada clic medido.",
    },
    benefits: [
      { icon: "Target", title: { pt: "Foco total em conversão", en: "Total conversion focus", es: "Foco total en conversión" }, desc: { pt: "Estrutura de venda: promessa, prova, oferta e chamada, sem distração.", en: "A sales structure: promise, proof, offer and call to action, with zero distraction.", es: "Estructura de venta: promesa, prueba, oferta y llamado a la acción, sin distracciones." } },
      { icon: "Zap", title: { pt: "Carregamento instantâneo", en: "Instant loading", es: "Carga instantánea" }, desc: { pt: "Cada segundo de espera derruba conversão. Aqui a página abre antes do clique terminar.", en: "Every second of waiting kills conversion. Here the page opens before the click ends.", es: "Cada segundo de espera derrumba la conversión. Aquí la página abre antes de que termine el clic." } },
      { icon: "MessageCircle", title: { pt: "Conversão pro WhatsApp", en: "Converts to WhatsApp", es: "Conversión a WhatsApp" }, desc: { pt: "Botões e formulários caindo direto no seu WhatsApp com contexto do anúncio.", en: "Buttons and forms landing straight in your WhatsApp with the ad's context.", es: "Botones y formularios que caen directo en tu WhatsApp con el contexto del anuncio." } },
      { icon: "LineChart", title: { pt: "Pronta pra anúncios", en: "Ad-ready", es: "Lista para anuncios" }, desc: { pt: "Pixel, analytics e eventos de conversão configurados pra Meta e Google Ads.", en: "Pixel, analytics and conversion events configured for Meta and Google Ads.", es: "Pixel, analytics y eventos de conversión configurados para Meta y Google Ads." } },
      { icon: "FlaskConical", title: { pt: "Feita pra testar", en: "Built to test", es: "Hecha para probar" }, desc: { pt: "Estrutura preparada pra variações de título e oferta, pra você otimizar com dados e não com achismo.", en: "Structured for headline and offer variations, so you optimize with data instead of guesswork.", es: "Estructura preparada para variaciones de título y oferta, para que optimices con datos y no con intuición." } },
      { icon: "Search", title: { pt: "SEO on-page", en: "On-page SEO", es: "SEO on-page" }, desc: { pt: "Além do tráfego pago, a página nasce pronta pra ranquear no orgânico.", en: "Beyond paid traffic, the page is born ready to rank organically.", es: "Además del tráfico pago, la página nace lista para posicionar en orgánico." } },
    ],
    steps: [
      { title: { pt: "Oferta", en: "Offer", es: "Oferta" }, desc: { pt: "Definimos promessa, público e objetivo da página.", en: "We define the promise, audience and page goal.", es: "Definimos promesa, público y objetivo de la página." } },
      { title: { pt: "Copy + design", en: "Copy + design", es: "Copy + diseño" }, desc: { pt: "Texto persuasivo e visual que sustenta a promessa.", en: "Persuasive copy and a visual that backs the promise.", es: "Texto persuasivo y visual que sostiene la promesa." } },
      { title: { pt: "Construção", en: "Build", es: "Construcción" }, desc: { pt: "Página no ar em dias, com rastreamento configurado.", en: "Page live in days, tracking configured.", es: "Página en línea en días, con seguimiento configurado." } },
      { title: { pt: "Otimização", en: "Optimization", es: "Optimización" }, desc: { pt: "Acompanho os números e sugiro melhorias de conversão.", en: "I follow the numbers and suggest conversion improvements.", es: "Sigo los números y sugiero mejoras de conversión." } },
    ],
    faq: [
      { q: { pt: "Serve pra rodar anúncios?", en: "Does it work for ads?", es: "¿Sirve para correr anuncios?" }, a: { pt: "É exatamente pra isso: entrego com pixel da Meta, Google Analytics e eventos de conversão configurados. Sua campanha começa medindo certo desde o primeiro clique.", en: "That's exactly what it's for: it ships with Meta pixel, Google Analytics and conversion events configured. Your campaign measures right from the first click.", es: "Es exactamente para eso: la entrego con pixel de Meta, Google Analytics y eventos de conversión configurados. Tu campaña empieza midiendo bien desde el primer clic." } },
      { q: { pt: "Em quanto tempo fica pronta?", en: "How fast is it ready?", es: "¿En cuánto tiempo está lista?" }, a: { pt: "Landing pages são projetos rápidos: normalmente entre 5 e 10 dias, do briefing ao ar.", en: "Landing pages are fast projects: usually 5–10 days from briefing to live.", es: "Las landing pages son proyectos rápidos: normalmente entre 5 y 10 días, del briefing a estar en línea." } },
      { q: { pt: "Vocês escrevem o texto?", en: "Do you write the copy?", es: "¿Ustedes escriben el texto?" }, a: { pt: "Sim, a copy faz parte da entrega. Você me passa o produto e as objeções dos clientes; eu transformo em argumento de venda.", en: "Yes, copy is part of the delivery. You give me the product and your customers' objections; I turn them into a sales argument.", es: "Sí, el copy es parte de la entrega. Me pasas el producto y las objeciones de los clientes; yo los convierto en argumento de venta." } },
      { q: { pt: "O que eu preciso te enviar?", en: "What do I need to send you?", es: "¿Qué necesito enviarte?" }, a: { pt: "O básico: o que você vende, pra quem, diferenciais e fotos/logo se tiver. O resto eu levanto no briefing.", en: "The basics: what you sell, to whom, your differentials and photos/logo if you have them. I gather the rest at the briefing.", es: "Lo básico: qué vendes, a quién, diferenciales y fotos/logo si los tienes. El resto lo relevo en el briefing." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para uma landing page de alta conversão.",
      en: "Hi Rick! I'd like a quote for a high-conversion landing page.",
      es: "¡Hola Rick! Quiero una cotización para una landing page de alta conversión.",
    },
  },
  {
    slug: "loja-virtual",
    label: { pt: "Loja virtual", en: "Online store", es: "Tienda online" },
    metaTitle: {
      pt: "Loja Virtual Sob Medida: venda online sem taxa por pedido",
      en: "Custom Online Store: sell online without per-order fees",
      es: "Tienda Online a Medida: vende en internet sin comisión por pedido",
    },
    metaDescription: {
      pt: "Loja virtual sob medida: Pix e cartão integrados, gestão de pedidos e estoque, produtos indexados no Google e zero taxa por venda. Orçamento gratuito.",
      en: "A complete custom online store: integrated payments, order and stock management, Google-indexed products and zero per-sale fees. Free quote via WhatsApp.",
      es: "Tienda online a medida: Pix y tarjeta integrados, gestión de pedidos e inventario, productos indexados en Google y cero comisión por venta. Cotización gratuita.",
    },
    eyebrow: { pt: "Loja virtual", en: "Online store", es: "Tienda online" },
    title: { pt: "Sua loja online vendendo", en: "Your online store selling", es: "Tu tienda online vendiendo" },
    titleHighlight: { pt: "24 horas por dia", en: "24 hours a day", es: "24 horas al día" },
    sub: {
      pt: "E-commerce completo com a cara da sua marca: pagamento integrado, gestão de pedidos e estoque. Sem mensalidade de plataforma, sem taxa mordendo cada venda.",
      en: "A complete e-commerce with your brand's identity: integrated payments, order and stock management. No platform subscription, no fee biting every sale.",
      es: "E-commerce completo con la identidad de tu marca: pago integrado, gestión de pedidos e inventario. Sin mensualidad de plataforma, sin comisión mordiendo cada venta.",
    },
    benefits: [
      { icon: "CreditCard", title: { pt: "Pix e cartão integrados", en: "Integrated payments", es: "Pix y tarjeta integrados" }, desc: { pt: "Checkout com Pix, cartão e boleto caindo direto na sua conta, sem intermediário seu.", en: "Checkout with the payment methods your customers use, settling straight to your account.", es: "Checkout con Pix, tarjeta y boleto cayendo directo en tu cuenta, sin intermediarios." } },
      { icon: "BadgePercent", title: { pt: "Zero taxa por venda", en: "Zero per-sale fees", es: "Cero comisión por venta" }, desc: { pt: "Plataformas prontas cobram mensalidade + % por pedido. Aqui a loja é sua, e a margem também.", en: "Ready-made platforms charge subscriptions + a cut per order. Here the store is yours, and so is the margin.", es: "Las plataformas listas cobran mensualidad + % por pedido. Aquí la tienda es tuya, y el margen también." } },
      { icon: "Package", title: { pt: "Pedidos e estoque na mão", en: "Orders and stock in hand", es: "Pedidos e inventario en tu mano" }, desc: { pt: "Painel pra acompanhar pedidos, baixar estoque e organizar entregas sem planilha.", en: "A panel to track orders, update stock and organize deliveries without spreadsheets.", es: "Panel para seguir pedidos, descontar inventario y organizar entregas sin planillas." } },
      { icon: "Search", title: { pt: "Produtos no Google", en: "Products on Google", es: "Productos en Google" }, desc: { pt: "Cada produto vira página indexável com dados estruturados, o que significa tráfego grátis todo mês.", en: "Every product becomes an indexable page with structured data, which means free traffic every month.", es: "Cada producto se vuelve una página indexable con datos estructurados, lo que significa tráfico gratis todos los meses." } },
      { icon: "Zap", title: { pt: "Rápida como um app", en: "Fast like an app", es: "Rápida como una app" }, desc: { pt: "Loja lenta perde carrinho: aqui as páginas abrem instantaneamente, no 4G do seu cliente.", en: "Slow stores lose carts: here pages open instantly, even on your customer's mobile data.", es: "Una tienda lenta pierde carritos: aquí las páginas abren al instante, en el 4G de tu cliente." } },
      { icon: "LifeBuoy", title: { pt: "Suporte pós-lançamento", en: "Post-launch support", es: "Soporte posentrega" }, desc: { pt: "Ajustes e acompanhamento depois do ar, previstos em contrato.", en: "Tweaks and follow-up after launch, guaranteed by contract.", es: "Ajustes y acompañamiento después del lanzamiento, previstos en el contrato." } },
    ],
    steps: [
      { title: { pt: "Briefing", en: "Briefing", es: "Briefing" }, desc: { pt: "Produtos, categorias, formas de pagamento e logística de entrega.", en: "Products, categories, payment methods and delivery logistics.", es: "Productos, categorías, formas de pago y logística de entrega." } },
      { title: { pt: "Design da loja", en: "Store design", es: "Diseño de la tienda" }, desc: { pt: "Vitrine, página de produto e checkout com a identidade da marca.", en: "Showcase, product page and checkout with your brand identity.", es: "Vitrina, página de producto y checkout con la identidad de la marca." } },
      { title: { pt: "Pagamentos + frete", en: "Payments + shipping", es: "Pagos + envío" }, desc: { pt: "Integração de pagamento e cálculo de frete testados de ponta a ponta.", en: "Payment integration and shipping calculation, tested end to end.", es: "Integración de pago y cálculo de envío probados de punta a punta." } },
      { title: { pt: "Lançamento", en: "Launch", es: "Lanzamiento" }, desc: { pt: "No ar com domínio, produtos cadastrados e você treinado no painel.", en: "Live with your domain, products loaded and you trained on the panel.", es: "En línea con dominio, productos cargados y tú capacitado en el panel." } },
    ],
    faq: [
      { q: { pt: "Qual a diferença pra Shopify/Nuvemshop?", en: "How is it different from Shopify?", es: "¿Cuál es la diferencia con Shopify/Nuvemshop?" }, a: { pt: "Plataformas prontas cobram mensalidade pra sempre e limitam o design ao tema. Uma loja sob medida é sua: sem aluguel, com a cara exata da marca e liberdade total pra crescer. O custo fixo é só hospedagem.", en: "Ready-made platforms charge forever and limit design to themes. A custom store is yours: no rent, your brand's exact look and total freedom to grow. The only fixed cost is hosting.", es: "Las plataformas listas cobran mensualidad para siempre y limitan el diseño al tema. Una tienda a medida es tuya: sin alquiler, con la identidad exacta de la marca y libertad total para crecer. El costo fijo es solo el hosting." } },
      { q: { pt: "Como recebo o dinheiro das vendas?", en: "How do I receive the money?", es: "¿Cómo recibo el dinero de las ventas?" }, a: { pt: "Integro um gateway de pagamento (Pix, cartão, boleto) na SUA conta. O dinheiro cai direto pra você, sem passar por mim.", en: "I integrate a payment gateway into YOUR account. The money settles straight to you, never through me.", es: "Integro una pasarela de pago (Pix, tarjeta, boleto) en TU cuenta. El dinero cae directo para ti, sin pasar por mí." } },
      { q: { pt: "Já vendo em marketplace. Vale a pena?", en: "I already sell on a marketplace. Is it worth it?", es: "Ya vendo en un marketplace. ¿Vale la pena?" }, a: { pt: "Vale, como canal próprio em paralelo. No marketplace o cliente é deles (e a taxa também); na sua loja você constrói base própria, remarketing e recompra sem comissão.", en: "Yes, as your own parallel channel. On a marketplace the customer is theirs (and so is the fee); in your store you build your own base, remarketing and repeat purchases with no commission.", es: "Vale, como canal propio en paralelo. En el marketplace el cliente es de ellos (y la comisión también); en tu tienda construyes base propia, remarketing y recompra sin comisión." } },
      { q: { pt: "Eu mesmo cadastro os produtos?", en: "Can I manage products myself?", es: "¿Cargo los productos yo mismo?" }, a: { pt: "Sim: painel simples pra adicionar produtos, fotos, preços, variações e estoque, do computador ou do celular.", en: "Yes: a simple panel to add products, photos, prices, variants and stock, from desktop or phone.", es: "Sí: panel simple para agregar productos, fotos, precios, variantes e inventario, desde la computadora o el celular." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para uma loja virtual sob medida.",
      en: "Hi Rick! I'd like a quote for a custom online store.",
      es: "¡Hola Rick! Quiero una cotización para una tienda online a medida.",
    },
  },
  {
    slug: "sistemas-sob-medida",
    label: { pt: "Sistemas sob medida", en: "Custom systems", es: "Sistemas a medida" },
    metaTitle: {
      pt: "Sistemas Web Sob Medida e SaaS: automatize a operação do seu negócio",
      en: "Custom Web Systems & SaaS: automate your business operations",
      es: "Sistemas Web a Medida y SaaS: automatiza la operación de tu negocio",
    },
    metaDescription: {
      pt: "Sistemas web sob medida: automatize processos, organize dados e tenha relatórios em tempo real. Do controle interno ao SaaS completo. Orçamento gratuito.",
      en: "Custom web system development: automate processes, organize data and get real-time reports. From internal tools to a full SaaS. Free quote.",
      es: "Sistemas web a medida: automatiza procesos, organiza datos y ten reportes en tiempo real. Del control interno al SaaS completo. Cotización gratuita.",
    },
    eyebrow: { pt: "Sistemas sob medida", en: "Custom systems", es: "Sistemas a medida" },
    title: { pt: "O sistema que a sua operação", en: "The system your operation", es: "El sistema que tu operación" },
    titleHighlight: { pt: "pedia há anos", en: "has needed for years", es: "pedía desde hace años" },
    sub: {
      pt: "Chega de planilha quebrada e processo manual: um sistema web feito pro SEU fluxo (pedidos, clientes, financeiro, relatórios) e acessível de qualquer lugar.",
      en: "No more broken spreadsheets and manual processes: a web system built for YOUR workflow (orders, customers, finances, reports) and accessible from anywhere.",
      es: "Basta de planillas rotas y procesos manuales: un sistema web hecho para TU flujo (pedidos, clientes, finanzas, reportes) y accesible desde cualquier lugar.",
    },
    benefits: [
      { icon: "Workflow", title: { pt: "Seu processo, automatizado", en: "Your process, automated", es: "Tu proceso, automatizado" }, desc: { pt: "O sistema segue o jeito que o SEU negócio funciona, não o contrário.", en: "The system follows how YOUR business works, not the other way around.", es: "El sistema sigue la forma en que funciona TU negocio, no al revés." } },
      { icon: "Database", title: { pt: "Dados organizados", en: "Organized data", es: "Datos organizados" }, desc: { pt: "Clientes, pedidos e histórico num lugar só, com busca instantânea. Adeus planilhas espalhadas.", en: "Customers, orders and history in one place with instant search. Goodbye scattered spreadsheets.", es: "Clientes, pedidos e historial en un solo lugar, con búsqueda instantánea. Adiós a las planillas dispersas." } },
      { icon: "LineChart", title: { pt: "Relatórios em tempo real", en: "Real-time reports", es: "Reportes en tiempo real" }, desc: { pt: "Dashboards com os números que importam pra decidir, sem esperar fechamento do mês.", en: "Dashboards with the numbers that matter, with no waiting for month-end closing.", es: "Dashboards con los números que importan para decidir, sin esperar el cierre del mes." } },
      { icon: "ShieldCheck", title: { pt: "Acessos e permissões", en: "Access and permissions", es: "Accesos y permisos" }, desc: { pt: "Cada pessoa da equipe vê só o que deve, com registro de quem fez o quê.", en: "Each team member sees only what they should, with a log of who did what.", es: "Cada persona del equipo ve solo lo que debe, con registro de quién hizo qué." } },
      { icon: "Smartphone", title: { pt: "Funciona em qualquer tela", en: "Works on any screen", es: "Funciona en cualquier pantalla" }, desc: { pt: "Do balcão ao campo: computador, tablet e celular, sem instalar nada.", en: "From the counter to the field: desktop, tablet and phone, nothing to install.", es: "Del mostrador al campo: computadora, tablet y celular, sin instalar nada." } },
      { icon: "LifeBuoy", title: { pt: "Evolui com o negócio", en: "Grows with the business", es: "Evoluciona con el negocio" }, desc: { pt: "Começa pelo essencial e ganha módulos conforme a operação cresce.", en: "Starts with the essentials and gains modules as the operation grows.", es: "Empieza por lo esencial y suma módulos conforme la operación crece." } },
    ],
    steps: [
      { title: { pt: "Descoberta", en: "Discovery", es: "Descubrimiento" }, desc: { pt: "Mapeio seu fluxo real: onde dói, onde se perde tempo e dinheiro.", en: "I map your real workflow: where it hurts, where time and money leak.", es: "Mapeo tu flujo real: dónde duele, dónde se pierde tiempo y dinero." } },
      { title: { pt: "Protótipo", en: "Prototype", es: "Prototipo" }, desc: { pt: "Você navega nas telas e aprova antes de qualquer linha de código.", en: "You navigate the screens and approve before any line of code.", es: "Navegas las pantallas y apruebas antes de cualquier línea de código." } },
      { title: { pt: "Sprints", en: "Sprints", es: "Sprints" }, desc: { pt: "Entregas quinzenais funcionando, pra você acompanhar o progresso de verdade.", en: "Working deliveries every two weeks, so you follow real progress.", es: "Entregas quincenales funcionando, para que sigas el avance de verdad." } },
      { title: { pt: "Implantação", en: "Rollout", es: "Implementación" }, desc: { pt: "Migração dos dados, treinamento da equipe e suporte de perto no início.", en: "Data migration, team training and close support at the start.", es: "Migración de datos, capacitación del equipo y soporte cercano al inicio." } },
    ],
    faq: [
      { q: { pt: "Não é mais barato usar um sistema pronto?", en: "Isn't off-the-shelf software cheaper?", es: "¿No es más barato usar un sistema listo?" }, a: { pt: "No começo, sim. Mas você paga mensalidade pra sempre por algo que atende 70% do seu fluxo e te obriga a contornar os outros 30% na planilha. O sob medida custa mais uma vez e atende 100%, sem aluguel.", en: "Initially, yes. But you pay a subscription forever for something that covers 70% of your workflow and forces spreadsheets for the other 30%. Custom costs once and covers 100%, with no rent.", es: "Al principio, sí. Pero pagas mensualidad para siempre por algo que cubre el 70% de tu flujo y te obliga a resolver el otro 30% en una planilla. El a medida cuesta una sola vez y cubre el 100%, sin alquiler." } },
      { q: { pt: "Quanto tempo leva?", en: "How long does it take?", es: "¿Cuánto tiempo tarda?" }, a: { pt: "A primeira versão útil (MVP) normalmente sai entre 4 e 8 semanas, dependendo do escopo. Você começa a usar cedo e o sistema evolui em sprints.", en: "The first useful version (MVP) usually ships in 4–8 weeks depending on scope. You start using it early and it evolves in sprints.", es: "La primera versión útil (MVP) normalmente sale entre 4 y 8 semanas, según el alcance. Empiezas a usarlo temprano y el sistema evoluciona en sprints." } },
      { q: { pt: "Integra com o que eu já uso?", en: "Does it integrate with what I already use?", es: "¿Se integra con lo que ya uso?" }, a: { pt: "Sim: WhatsApp, planilhas, emissão de nota, meios de pagamento, ERPs. Levanto as integrações no briefing e o sistema conversa com o que já existe.", en: "Yes: WhatsApp, spreadsheets, invoicing, payment providers, ERPs. I map integrations at the briefing and the system talks to what already exists.", es: "Sí: WhatsApp, planillas, facturación electrónica, medios de pago, ERPs. Relevo las integraciones en el briefing y el sistema conversa con lo que ya existe." } },
      { q: { pt: "O código é meu?", en: "Do I own the code?", es: "¿El código es mío?" }, a: { pt: "Sim, código e dados são seus, por contrato. Sem aprisionamento: qualquer dev consegue dar manutenção no futuro.", en: "Yes, code and data are yours, by contract. No lock-in: any developer can maintain it in the future.", es: "Sí, el código y los datos son tuyos, por contrato. Sin ataduras: cualquier dev puede darle mantenimiento en el futuro." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para um sistema sob medida para meu negócio.",
      en: "Hi Rick! I'd like a quote for a custom system for my business.",
      es: "¡Hola Rick! Quiero una cotización para un sistema a medida para mi negocio.",
    },
  },
];
