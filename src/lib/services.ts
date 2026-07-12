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
  {
    slug: "loja-virtual",
    label: { pt: "Loja virtual", en: "Online store" },
    metaTitle: {
      pt: "Loja Virtual Sob Medida — venda online sem taxa por pedido",
      en: "Custom Online Store — sell online without per-order fees",
    },
    metaDescription: {
      pt: "Loja virtual completa e sob medida: Pix e cartão integrados, gestão de pedidos e estoque, produtos indexados no Google e zero taxa por venda. Orçamento gratuito pelo WhatsApp.",
      en: "A complete custom online store: integrated payments, order and stock management, Google-indexed products and zero per-sale fees. Free quote via WhatsApp.",
    },
    eyebrow: { pt: "Loja virtual", en: "Online store" },
    title: { pt: "Sua loja online vendendo", en: "Your online store selling" },
    titleHighlight: { pt: "24 horas por dia", en: "24 hours a day" },
    sub: {
      pt: "E-commerce completo com a cara da sua marca: pagamento integrado, gestão de pedidos e estoque — sem mensalidade de plataforma, sem taxa mordendo cada venda.",
      en: "A complete e-commerce with your brand's identity: integrated payments, order and stock management — no platform subscription, no fee biting every sale.",
    },
    benefits: [
      { icon: "CreditCard", title: { pt: "Pix e cartão integrados", en: "Integrated payments" }, desc: { pt: "Checkout com Pix, cartão e boleto caindo direto na sua conta — sem intermediário seu.", en: "Checkout with the payment methods your customers use, settling straight to your account." } },
      { icon: "BadgePercent", title: { pt: "Zero taxa por venda", en: "Zero per-sale fees" }, desc: { pt: "Plataformas prontas cobram mensalidade + % por pedido. Aqui a loja é sua, e a margem também.", en: "Ready-made platforms charge subscriptions + a cut per order. Here the store is yours — and so is the margin." } },
      { icon: "Package", title: { pt: "Pedidos e estoque na mão", en: "Orders and stock in hand" }, desc: { pt: "Painel pra acompanhar pedidos, baixar estoque e organizar entregas sem planilha.", en: "A panel to track orders, update stock and organize deliveries without spreadsheets." } },
      { icon: "Search", title: { pt: "Produtos no Google", en: "Products on Google" }, desc: { pt: "Cada produto vira página indexável com dados estruturados — tráfego grátis todo mês.", en: "Every product becomes an indexable page with structured data — free traffic every month." } },
      { icon: "Zap", title: { pt: "Rápida como um app", en: "Fast like an app" }, desc: { pt: "Loja lenta perde carrinho: aqui as páginas abrem instantaneamente, no 4G do seu cliente.", en: "Slow stores lose carts: here pages open instantly, even on your customer's mobile data." } },
      { icon: "LifeBuoy", title: { pt: "Suporte pós-lançamento", en: "Post-launch support" }, desc: { pt: "Ajustes e acompanhamento depois do ar, previstos em contrato.", en: "Tweaks and follow-up after launch, guaranteed by contract." } },
    ],
    steps: [
      { title: { pt: "Briefing", en: "Briefing" }, desc: { pt: "Produtos, categorias, formas de pagamento e logística de entrega.", en: "Products, categories, payment methods and delivery logistics." } },
      { title: { pt: "Design da loja", en: "Store design" }, desc: { pt: "Vitrine, página de produto e checkout com a identidade da marca.", en: "Showcase, product page and checkout with your brand identity." } },
      { title: { pt: "Pagamentos + frete", en: "Payments + shipping" }, desc: { pt: "Integração de pagamento e cálculo de frete testados de ponta a ponta.", en: "Payment integration and shipping calculation, tested end to end." } },
      { title: { pt: "Lançamento", en: "Launch" }, desc: { pt: "No ar com domínio, produtos cadastrados e você treinado no painel.", en: "Live with your domain, products loaded and you trained on the panel." } },
    ],
    faq: [
      { q: { pt: "Qual a diferença pra Shopify/Nuvemshop?", en: "How is it different from Shopify?" }, a: { pt: "Plataformas prontas cobram mensalidade pra sempre e limitam o design ao tema. Uma loja sob medida é sua: sem aluguel, com a cara exata da marca e liberdade total pra crescer — o custo fixo é só hospedagem.", en: "Ready-made platforms charge forever and limit design to themes. A custom store is yours: no rent, your brand's exact look and total freedom to grow — the only fixed cost is hosting." } },
      { q: { pt: "Como recebo o dinheiro das vendas?", en: "How do I receive the money?" }, a: { pt: "Integro um gateway de pagamento (Pix, cartão, boleto) na SUA conta — o dinheiro cai direto pra você, sem passar por mim.", en: "I integrate a payment gateway into YOUR account — the money settles straight to you, never through me." } },
      { q: { pt: "Já vendo em marketplace. Vale a pena?", en: "I already sell on a marketplace. Is it worth it?" }, a: { pt: "Vale — como canal próprio em paralelo. No marketplace o cliente é deles (e a taxa também); na sua loja você constrói base própria, remarketing e recompra sem comissão.", en: "Yes — as your own parallel channel. On a marketplace the customer is theirs (and so is the fee); in your store you build your own base, remarketing and repeat purchases with no commission." } },
      { q: { pt: "Eu mesmo cadastro os produtos?", en: "Can I manage products myself?" }, a: { pt: "Sim: painel simples pra adicionar produtos, fotos, preços, variações e estoque — do computador ou do celular.", en: "Yes: a simple panel to add products, photos, prices, variants and stock — from desktop or phone." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para uma loja virtual sob medida.",
      en: "Hi Rick! I'd like a quote for a custom online store.",
    },
  },
  {
    slug: "sistemas-sob-medida",
    label: { pt: "Sistemas sob medida", en: "Custom systems" },
    metaTitle: {
      pt: "Sistemas Web Sob Medida e SaaS — automatize a operação do seu negócio",
      en: "Custom Web Systems & SaaS — automate your business operations",
    },
    metaDescription: {
      pt: "Desenvolvimento de sistemas web sob medida: automatize processos, organize dados e tenha relatórios em tempo real. Do controle interno ao SaaS completo. Orçamento gratuito.",
      en: "Custom web system development: automate processes, organize data and get real-time reports. From internal tools to a full SaaS. Free quote.",
    },
    eyebrow: { pt: "Sistemas sob medida", en: "Custom systems" },
    title: { pt: "O sistema que a sua operação", en: "The system your operation" },
    titleHighlight: { pt: "pedia há anos", en: "has needed for years" },
    sub: {
      pt: "Chega de planilha quebrada e processo manual: um sistema web feito pro SEU fluxo — pedidos, clientes, financeiro, relatórios — acessível de qualquer lugar.",
      en: "No more broken spreadsheets and manual processes: a web system built for YOUR workflow — orders, customers, finances, reports — accessible from anywhere.",
    },
    benefits: [
      { icon: "Workflow", title: { pt: "Seu processo, automatizado", en: "Your process, automated" }, desc: { pt: "O sistema segue o jeito que o SEU negócio funciona — não o contrário.", en: "The system follows how YOUR business works — not the other way around." } },
      { icon: "Database", title: { pt: "Dados organizados", en: "Organized data" }, desc: { pt: "Clientes, pedidos e histórico num lugar só, com busca instantânea — adeus planilhas espalhadas.", en: "Customers, orders and history in one place with instant search — goodbye scattered spreadsheets." } },
      { icon: "LineChart", title: { pt: "Relatórios em tempo real", en: "Real-time reports" }, desc: { pt: "Dashboards com os números que importam pra decidir — sem esperar fechamento do mês.", en: "Dashboards with the numbers that matter — no waiting for month-end closing." } },
      { icon: "ShieldCheck", title: { pt: "Acessos e permissões", en: "Access and permissions" }, desc: { pt: "Cada pessoa da equipe vê só o que deve — com registro de quem fez o quê.", en: "Each team member sees only what they should — with a log of who did what." } },
      { icon: "Smartphone", title: { pt: "Funciona em qualquer tela", en: "Works on any screen" }, desc: { pt: "Do balcão ao campo: computador, tablet e celular, sem instalar nada.", en: "From the counter to the field: desktop, tablet and phone, nothing to install." } },
      { icon: "LifeBuoy", title: { pt: "Evolui com o negócio", en: "Grows with the business" }, desc: { pt: "Começa pelo essencial e ganha módulos conforme a operação cresce.", en: "Starts with the essentials and gains modules as the operation grows." } },
    ],
    steps: [
      { title: { pt: "Descoberta", en: "Discovery" }, desc: { pt: "Mapeio seu fluxo real: onde dói, onde se perde tempo e dinheiro.", en: "I map your real workflow: where it hurts, where time and money leak." } },
      { title: { pt: "Protótipo", en: "Prototype" }, desc: { pt: "Você navega nas telas e aprova antes de qualquer linha de código.", en: "You navigate the screens and approve before any line of code." } },
      { title: { pt: "Sprints", en: "Sprints" }, desc: { pt: "Entregas quinzenais funcionando — você acompanha o progresso de verdade.", en: "Working deliveries every two weeks — you follow real progress." } },
      { title: { pt: "Implantação", en: "Rollout" }, desc: { pt: "Migração dos dados, treinamento da equipe e suporte de perto no início.", en: "Data migration, team training and close support at the start." } },
    ],
    faq: [
      { q: { pt: "Não é mais barato usar um sistema pronto?", en: "Isn't off-the-shelf software cheaper?" }, a: { pt: "No começo, sim — mas você paga mensalidade pra sempre por algo que atende 70% do seu fluxo e te obriga a contornar os outros 30% na planilha. O sob medida custa mais uma vez e atende 100%, sem aluguel.", en: "Initially, yes — but you pay a subscription forever for something that covers 70% of your workflow and forces spreadsheets for the other 30%. Custom costs once and covers 100%, with no rent." } },
      { q: { pt: "Quanto tempo leva?", en: "How long does it take?" }, a: { pt: "A primeira versão útil (MVP) normalmente sai entre 4 e 8 semanas, dependendo do escopo. Você começa a usar cedo e o sistema evolui em sprints.", en: "The first useful version (MVP) usually ships in 4–8 weeks depending on scope. You start using it early and it evolves in sprints." } },
      { q: { pt: "Integra com o que eu já uso?", en: "Does it integrate with what I already use?" }, a: { pt: "Sim: WhatsApp, planilhas, emissão de nota, meios de pagamento, ERPs — levanto as integrações no briefing e o sistema conversa com o que já existe.", en: "Yes: WhatsApp, spreadsheets, invoicing, payment providers, ERPs — I map integrations at the briefing and the system talks to what already exists." } },
      { q: { pt: "O código é meu?", en: "Do I own the code?" }, a: { pt: "Sim — código e dados são seus, por contrato. Sem aprisionamento: qualquer dev consegue dar manutenção no futuro.", en: "Yes — code and data are yours, by contract. No lock-in: any developer can maintain it in the future." } },
    ],
    ctaWhats: {
      pt: "Olá Rick! Quero um orçamento para um sistema sob medida para meu negócio.",
      en: "Hi Rick! I'd like a quote for a custom system for my business.",
    },
  },
];
