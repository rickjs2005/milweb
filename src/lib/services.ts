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
    label: { pt: "Criação de sites", en: "Website development" },
    metaTitle: {
      pt: "Criação de Sites Profissionais — rápidos e otimizados pro Google",
      en: "Professional Website Development — fast and Google-optimized",
    },
    metaDescription: {
      pt: "Criação de sites profissionais sob medida: design próprio, performance Lighthouse 100, SEO técnico completo e suporte pós-entrega. Orçamento gratuito pelo WhatsApp.",
      en: "Custom professional website development: unique design, Lighthouse 100 performance, full technical SEO and post-launch support. Free quote via WhatsApp.",
    },
    eyebrow: { pt: "Criação de sites", en: "Website development" },
    title: { pt: "Sites profissionais que", en: "Professional websites that" },
    titleHighlight: { pt: "vendem de verdade", en: "actually sell" },
    sub: {
      pt: "Do institucional ao e-commerce: site rápido, bonito e otimizado pro Google, construído sob medida — sem template, sem construtor genérico.",
      en: "From corporate to e-commerce: a fast, polished, Google-optimized website built from scratch — no templates, no generic builders.",
    },
    benefits: [
      { icon: "Palette", title: { pt: "Design sob medida", en: "Tailor-made design" }, desc: { pt: "Identidade própria pra sua marca — nada de tema pronto igual ao do concorrente.", en: "A unique identity for your brand — no off-the-shelf theme that looks like your competitor's." } },
      { icon: "Gauge", title: { pt: "Performance nota 100", en: "Perfect 100 performance" }, desc: { pt: "Carregamento instantâneo, aprovado nas métricas que o Google usa pra ranquear.", en: "Instant loading, passing the exact metrics Google uses to rank." } },
      { icon: "Search", title: { pt: "SEO técnico incluso", en: "Technical SEO included" }, desc: { pt: "Estrutura, dados semânticos, sitemap e metadados prontos pra indexar desde o dia 1.", en: "Structure, semantic data, sitemap and metadata ready to index from day one." } },
      { icon: "Smartphone", title: { pt: "Perfeito no celular", en: "Perfect on mobile" }, desc: { pt: "Mobile-first: a maioria dos seus clientes chega pelo celular — o site nasce pra isso.", en: "Mobile-first: most of your customers arrive on a phone — the site is born for it." } },
      { icon: "Globe", title: { pt: "Domínio e hospedagem", en: "Domain and hosting" }, desc: { pt: "Configuro domínio próprio, HTTPS e infraestrutura global — você não se preocupa com nada técnico.", en: "I set up your domain, HTTPS and global infrastructure — zero technical worries for you." } },
      { icon: "LifeBuoy", title: { pt: "Suporte pós-entrega", en: "Post-launch support" }, desc: { pt: "Ajustes e correções depois do lançamento, por escrito no contrato.", en: "Tweaks and fixes after launch, guaranteed in writing." } },
    ],
    steps: [
      { title: { pt: "Briefing", en: "Briefing" }, desc: { pt: "Entendo seu negócio, seus clientes e o objetivo do site.", en: "I understand your business, your customers and the site's goal." } },
      { title: { pt: "Design", en: "Design" }, desc: { pt: "Proposta visual sob medida pra sua aprovação.", en: "A tailor-made visual proposal for your approval." } },
      { title: { pt: "Desenvolvimento", en: "Development" }, desc: { pt: "Código limpo com a mesma stack de produtos que você admira.", en: "Clean code with the same stack as products you admire." } },
      { title: { pt: "SEO + lançamento", en: "SEO + launch" }, desc: { pt: "No ar com domínio, HTTPS, analytics e Google configurados.", en: "Live with domain, HTTPS, analytics and Google configured." } },
    ],
    faq: [
      { q: { pt: "Quanto tempo leva pra ficar pronto?", en: "How long does it take?" }, a: { pt: "Depende do escopo: uma landing page sai em poucos dias; um site institucional completo, em 2 a 4 semanas. No briefing eu te passo o prazo exato por escrito.", en: "It depends on scope: a landing page ships in a few days; a full corporate site in 2–4 weeks. At the briefing I give you the exact deadline in writing." } },
      { q: { pt: "Preciso já ter domínio e hospedagem?", en: "Do I need a domain and hosting already?" }, a: { pt: "Não. Eu cuido do registro do domínio, da hospedagem e do HTTPS — tudo fica no seu nome, como deve ser.", en: "No. I handle domain registration, hosting and HTTPS — everything stays under your name, as it should." } },
      { q: { pt: "Vou conseguir atualizar o site sozinho?", en: "Will I be able to update the site myself?" }, a: { pt: "Sim, se o projeto pedir: incluo painel administrativo pra você editar textos, fotos e produtos sem depender de ninguém.", en: "Yes, if the project calls for it: I include an admin panel so you can edit copy, photos and products without depending on anyone." } },
      { q: { pt: "E depois do lançamento?", en: "What about after launch?" }, a: { pt: "Suporte gratuito pra ajustes e correções, previsto em contrato — e evolução contínua se você quiser crescer o site junto com o negócio.", en: "Free support for tweaks and fixes, guaranteed by contract — plus continuous evolution if you want the site to grow with the business." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para criação de um site profissional.",
      en: "Hi Rick! I'd like a quote for a professional website.",
    },
  },
  {
    slug: "catalogo-whatsapp",
    label: { pt: "Catálogo para WhatsApp", en: "WhatsApp catalog" },
    metaTitle: {
      pt: "Catálogo Online para WhatsApp — pedidos direto no seu número",
      en: "Online WhatsApp Catalog — orders straight to your number",
    },
    metaDescription: {
      pt: "Catálogo online profissional com carrinho: o cliente escolhe os produtos e o pedido chega pronto no seu WhatsApp. Sem taxa por venda, sem marketplace. Orçamento gratuito.",
      en: "Professional online catalog with cart: customers pick products and the order lands ready in your WhatsApp. No sales fees, no marketplace. Free quote.",
    },
    eyebrow: { pt: "Catálogo para WhatsApp", en: "WhatsApp catalog" },
    title: { pt: "Seu catálogo online com pedidos", en: "Your online catalog with orders" },
    titleHighlight: { pt: "direto no WhatsApp", en: "straight to WhatsApp" },
    sub: {
      pt: "Vitrine profissional dos seus produtos: o cliente monta o carrinho no site e a mensagem chega pronta no seu WhatsApp — sem taxa por venda, sem depender de marketplace.",
      en: "A professional showcase for your products: the customer builds a cart on your site and the message lands ready in your WhatsApp — no sales fees, no marketplace dependency.",
    },
    benefits: [
      { icon: "ShoppingCart", title: { pt: "Carrinho → mensagem pronta", en: "Cart → ready message" }, desc: { pt: "O cliente escolhe produtos, tamanho e quantidade — e o pedido cai formatado no seu WhatsApp.", en: "The customer picks products, size and quantity — and the order arrives formatted in your WhatsApp." } },
      { icon: "BadgePercent", title: { pt: "Zero taxa por venda", en: "Zero sales fees" }, desc: { pt: "Diferente de marketplace e apps de venda: o canal é seu e ninguém morde sua margem.", en: "Unlike marketplaces and sales apps: the channel is yours and nobody bites your margin." } },
      { icon: "Search", title: { pt: "Aparece no Google", en: "Shows up on Google" }, desc: { pt: "Cada produto vira uma página indexável — clientes te achando sem você postar.", en: "Every product becomes an indexable page — customers finding you without a single post." } },
      { icon: "ImageUp", title: { pt: "Fácil de atualizar", en: "Easy to update" }, desc: { pt: "Painel simples pra trocar fotos, preços e estoque na hora, do celular.", en: "A simple panel to swap photos, prices and stock instantly, from your phone." } },
      { icon: "Smartphone", title: { pt: "Experiência de app", en: "App-like experience" }, desc: { pt: "Rápido e fluido no celular — onde seus clientes realmente compram.", en: "Fast and fluid on mobile — where your customers actually buy." } },
      { icon: "Link2", title: { pt: "Um link pra tudo", en: "One link for everything" }, desc: { pt: "Bio do Instagram, status do WhatsApp, QR code no balcão — um link, todos os produtos.", en: "Instagram bio, WhatsApp status, QR code at the counter — one link, every product." } },
    ],
    steps: [
      { title: { pt: "Briefing", en: "Briefing" }, desc: { pt: "Levantamos produtos, categorias e como você quer receber os pedidos.", en: "We map products, categories and how you want to receive orders." } },
      { title: { pt: "Vitrine", en: "Showcase" }, desc: { pt: "Design da vitrine com a cara da sua marca.", en: "Showcase design with your brand's look." } },
      { title: { pt: "Carrinho + WhatsApp", en: "Cart + WhatsApp" }, desc: { pt: "Fluxo de pedido integrado ao seu número.", en: "Order flow integrated with your number." } },
      { title: { pt: "Lançamento", en: "Launch" }, desc: { pt: "No ar com domínio próprio e produtos cadastrados.", en: "Live with your own domain and products loaded." } },
    ],
    faq: [
      { q: { pt: "Como eu recebo os pedidos?", en: "How do I receive orders?" }, a: { pt: "O cliente monta o carrinho no site e, ao finalizar, abre o seu WhatsApp com a mensagem do pedido pronta — itens, quantidades e total. Você só confirma e combina pagamento/entrega.", en: "The customer builds the cart on the site and, at checkout, their WhatsApp opens with the order message ready — items, quantities and total. You just confirm and arrange payment/delivery." } },
      { q: { pt: "Tem mensalidade ou taxa por venda?", en: "Are there monthly or per-sale fees?" }, a: { pt: "Não cobro taxa por venda. O custo fixo é só domínio e hospedagem (baixíssimo) — bem diferente de marketplace, que morde cada pedido.", en: "I charge no per-sale fee. The only fixed cost is domain and hosting (very low) — unlike marketplaces, which take a cut of every order." } },
      { q: { pt: "Eu mesmo atualizo os produtos?", en: "Can I update products myself?" }, a: { pt: "Sim: entrego com painel simples pra adicionar produto, trocar foto, preço e estoque — direto do celular.", en: "Yes: it ships with a simple panel to add products and change photos, prices and stock — right from your phone." } },
      { q: { pt: "Funciona pra qualquer tipo de negócio?", en: "Does it work for any business?" }, a: { pt: "Roupas, joias, comida, cosméticos, pet shop, autopeças… se você vende pelo WhatsApp hoje, o catálogo organiza e multiplica esse canal.", en: "Clothing, jewelry, food, cosmetics, pet shops, auto parts… if you sell via WhatsApp today, a catalog organizes and multiplies that channel." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para um catálogo online com pedidos no WhatsApp.",
      en: "Hi Rick! I'd like a quote for an online catalog with WhatsApp orders.",
    },
  },
  {
    slug: "landing-pages",
    label: { pt: "Landing pages", en: "Landing pages" },
    metaTitle: {
      pt: "Landing Pages de Alta Conversão — prontas pra tráfego pago",
      en: "High-Conversion Landing Pages — ready for paid traffic",
    },
    metaDescription: {
      pt: "Landing pages rápidas e persuasivas, feitas pra converter: copy orientada a venda, carregamento instantâneo, integração com WhatsApp e pixel/analytics prontos pra anúncios.",
      en: "Fast, persuasive landing pages built to convert: sales-driven copy, instant loading, WhatsApp integration and pixel/analytics ready for ads.",
    },
    eyebrow: { pt: "Landing pages", en: "Landing pages" },
    title: { pt: "Landing pages que transformam", en: "Landing pages that turn" },
    titleHighlight: { pt: "cliques em clientes", en: "clicks into customers" },
    sub: {
      pt: "Uma página, um objetivo: converter. Ideal pra tráfego pago, lançamentos e captação de leads — rápida, persuasiva e com cada clique medido.",
      en: "One page, one goal: convert. Ideal for paid traffic, launches and lead capture — fast, persuasive and with every click measured.",
    },
    benefits: [
      { icon: "Target", title: { pt: "Foco total em conversão", en: "Total conversion focus" }, desc: { pt: "Estrutura de venda: promessa, prova, oferta e chamada — sem distração.", en: "A sales structure: promise, proof, offer and call to action — zero distraction." } },
      { icon: "Zap", title: { pt: "Carregamento instantâneo", en: "Instant loading" }, desc: { pt: "Cada segundo de espera derruba conversão — aqui a página abre antes do clique terminar.", en: "Every second of waiting kills conversion — here the page opens before the click ends." } },
      { icon: "MessageCircle", title: { pt: "Conversão pro WhatsApp", en: "Converts to WhatsApp" }, desc: { pt: "Botões e formulários caindo direto no seu WhatsApp com contexto do anúncio.", en: "Buttons and forms landing straight in your WhatsApp with the ad's context." } },
      { icon: "LineChart", title: { pt: "Pronta pra anúncios", en: "Ad-ready" }, desc: { pt: "Pixel, analytics e eventos de conversão configurados pra Meta e Google Ads.", en: "Pixel, analytics and conversion events configured for Meta and Google Ads." } },
      { icon: "FlaskConical", title: { pt: "Feita pra testar", en: "Built to test" }, desc: { pt: "Estrutura preparada pra variações de título e oferta — otimize com dados, não achismo.", en: "Structured for headline and offer variations — optimize with data, not guesswork." } },
      { icon: "Search", title: { pt: "SEO on-page", en: "On-page SEO" }, desc: { pt: "Além do tráfego pago, a página nasce pronta pra ranquear no orgânico.", en: "Beyond paid traffic, the page is born ready to rank organically." } },
    ],
    steps: [
      { title: { pt: "Oferta", en: "Offer" }, desc: { pt: "Definimos promessa, público e objetivo da página.", en: "We define the promise, audience and page goal." } },
      { title: { pt: "Copy + design", en: "Copy + design" }, desc: { pt: "Texto persuasivo e visual que sustenta a promessa.", en: "Persuasive copy and a visual that backs the promise." } },
      { title: { pt: "Construção", en: "Build" }, desc: { pt: "Página no ar em dias, com rastreamento configurado.", en: "Page live in days, tracking configured." } },
      { title: { pt: "Otimização", en: "Optimization" }, desc: { pt: "Acompanho os números e sugiro melhorias de conversão.", en: "I follow the numbers and suggest conversion improvements." } },
    ],
    faq: [
      { q: { pt: "Serve pra rodar anúncios?", en: "Does it work for ads?" }, a: { pt: "É exatamente pra isso: entrego com pixel da Meta, Google Analytics e eventos de conversão configurados — sua campanha começa medindo certo desde o primeiro clique.", en: "That's exactly what it's for: it ships with Meta pixel, Google Analytics and conversion events configured — your campaign measures right from the first click." } },
      { q: { pt: "Em quanto tempo fica pronta?", en: "How fast is it ready?" }, a: { pt: "Landing pages são projetos rápidos: normalmente entre 5 e 10 dias, do briefing ao ar.", en: "Landing pages are fast projects: usually 5–10 days from briefing to live." } },
      { q: { pt: "Vocês escrevem o texto?", en: "Do you write the copy?" }, a: { pt: "Sim — a copy faz parte da entrega. Você me passa o produto e as objeções dos clientes; eu transformo em argumento de venda.", en: "Yes — copy is part of the delivery. You give me the product and your customers' objections; I turn them into a sales argument." } },
      { q: { pt: "O que eu preciso te enviar?", en: "What do I need to send you?" }, a: { pt: "O básico: o que você vende, pra quem, diferenciais e fotos/logo se tiver. O resto eu levanto no briefing.", en: "The basics: what you sell, to whom, your differentials and photos/logo if you have them. I gather the rest at the briefing." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para uma landing page de alta conversão.",
      en: "Hi Rick! I'd like a quote for a high-conversion landing page.",
    },
  },
];
