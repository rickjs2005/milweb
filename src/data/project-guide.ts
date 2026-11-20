import type { Locale } from "@/i18n/config";
import { FAQ } from "@/lib/content";

const copy = {
  pt: {
    goal: "O que seu cliente deve conseguir fazer?",
    featured: "Do portfólio", reference: "Projeto de referência", case: "Ver o projeto",
    proposal: "Pedir proposta por escrito", back: "Voltar ao guia", faq: "Dúvidas sobre o projeto",
    ask: "Escreva sua pergunta", search: "Consultar", related: "Resposta do guia",
    noAnswer: "Essa dúvida depende do seu projeto. Você pode incluí-la no pedido para o Rick responder por escrito.",
    forward: "Incluir minha pergunta no pedido", service: "Ver o serviço completo",
    priceQ: "Quanto custa?", priceA: "O valor depende das páginas, do conteúdo e das integrações. O orçamento é gratuito: descreva o que precisa e o Rick envia uma proposta com escopo, preço e prazo para você aprovar por escrito. O pagamento costuma ser dividido entre entrada e entrega.",
    scopeQ: "O que está incluído?", processQ: "Como funciona?", choose: "Escolha um objetivo acima para ver as etapas e entregas do serviço. O escopo final é combinado na proposta.",
    timeQ: "Quanto tempo leva?", timeA: "O cronograma depende das funcionalidades e do material disponível. Se você tem uma data de lançamento, inclua no pedido para o Rick confirmar a viabilidade.",
    callQ: "Preciso fazer uma reunião?", callA: "Você pode combinar o projeto inteiro por e-mail ou WhatsApp, desde as primeiras perguntas até a aprovação da proposta.",
    hireQ: "Como contrato o Rick?", hireA: "Envie o pedido deste guia por e-mail ou WhatsApp. O Rick responde por escrito com escopo, preço e prazo. Você aprova a proposta e o trabalho começa. O pagamento costuma ser dividido entre entrada e entrega.",
    review: "Seu pedido de proposta", reviewIntro: "Acrescente os detalhes que já souber e envie pelo canal que preferir.",
    situation: "O que você já tem?", optional: "Opcional", budget: "Orçamento e moeda", when: "Data desejada",
    notes: "O que você quer construir?", placeholder: "O que sua empresa faz? O que o site precisa resolver?",
    preview: "Mensagem para o Rick", subject: "Pedido de proposta • MilWeb",
    greeting: "Olá, Rick! Gostaria de receber uma proposta por escrito.", goalField: "Objetivo", refField: "Referência",
    details: "Detalhes", closing: "Pode me enviar o escopo, o valor e o prazo por aqui?",
    email: "Abrir e-mail", whatsapp: "Abrir WhatsApp", copy: "Copiar mensagem", copied: "Mensagem copiada.",
    manual: "Selecione o texto da mensagem e copie.", sendHint: "Revise a mensagem e confirme o envio no aplicativo que abrir.",
  },
  en: {
    goal: "What should your customers be able to do?",
    featured: "From the portfolio", reference: "Project reference", case: "View the project",
    proposal: "Get a written proposal", back: "Back to the guide", faq: "Questions about the project",
    ask: "Type your question", search: "Ask", related: "From the project guide",
    noAnswer: "This depends on your project. Include the question in your request and Rick can answer it in writing.",
    forward: "Include my question in the request", service: "See service details",
    priceQ: "How much does it cost?", priceA: "Pricing depends on the pages, content and integrations you need. The quote is free: describe your project and Rick will send you the scope, price and timeline to approve in writing. Payment is usually split between a deposit and delivery.",
    scopeQ: "What’s included?", processQ: "How does it work?", choose: "Choose a goal above to see the steps and deliverables for that service. The written proposal confirms the final scope.",
    timeQ: "How long does it take?", timeA: "The timeline depends on the features and the content you already have. If you have a launch date in mind, include it so Rick can confirm what fits.",
    callQ: "Do we need a call?", callA: "You can handle the whole project by email or WhatsApp, from the first questions through proposal approval.",
    hireQ: "How do I hire Rick?", hireA: "Send your request from this guide by email or WhatsApp. Rick replies in writing with the scope, price and timeline. Once you approve the proposal, the work starts. Payment is usually split between a deposit and delivery.",
    review: "Your proposal request", reviewIntro: "Add any details you already know, then choose where to send your request.",
    situation: "What do you have today?", optional: "Optional", budget: "Budget and currency", when: "Target launch date",
    notes: "What would you like to build?", placeholder: "What does your business do? What should the site help you achieve?",
    preview: "Your message to Rick", subject: "Project enquiry • MilWeb",
    greeting: "Hi Rick! I’d like a written proposal.", goalField: "Goal", refField: "Reference",
    details: "Details", closing: "Could you send me the scope, price and timeline here?",
    email: "Open email", whatsapp: "Open WhatsApp", copy: "Copy message", copied: "Message copied.",
    manual: "Select the message text and copy it.", sendHint: "Review your message and confirm delivery in the app that opens.",
  },
  es: {
    goal: "¿Qué deberían poder hacer tus clientes?",
    featured: "Del portafolio", reference: "Proyecto de referencia", case: "Ver el proyecto",
    proposal: "Pedir propuesta por escrito", back: "Volver a la guía", faq: "Preguntas sobre el proyecto",
    ask: "Escribe tu pregunta", search: "Consultar", related: "Respuesta de la guía",
    noAnswer: "Esta pregunta depende de tu proyecto. Puedes incluirla en la solicitud para que Rick te responda por escrito.",
    forward: "Incluir mi pregunta en la solicitud", service: "Ver detalles del servicio",
    priceQ: "¿Cuánto cuesta?", priceA: "El precio depende de las páginas, el contenido y las integraciones. La cotización es gratuita: describe tu proyecto y Rick te enviará el alcance, el precio y el plazo para que apruebes la propuesta por escrito. El pago suele dividirse entre anticipo y entrega.",
    scopeQ: "¿Qué incluye?", processQ: "¿Cómo funciona?", choose: "Elige un objetivo arriba para ver las etapas y entregables del servicio. La propuesta escrita confirma el alcance final.",
    timeQ: "¿Cuánto tarda?", timeA: "El plazo depende de las funciones y del material disponible. Si tienes una fecha de lanzamiento, inclúyela para que Rick confirme si es viable.",
    callQ: "¿Hace falta una llamada?", callA: "Puedes gestionar todo el proyecto por correo o WhatsApp, desde las primeras preguntas hasta la aprobación de la propuesta.",
    hireQ: "¿Cómo contrato a Rick?", hireA: "Envía la solicitud de esta guía por correo o WhatsApp. Rick responde por escrito con el alcance, el precio y el plazo. Cuando apruebas la propuesta, empieza el trabajo. El pago suele dividirse entre anticipo y entrega.",
    review: "Tu solicitud de propuesta", reviewIntro: "Añade los detalles que ya tengas y elige por dónde enviar la solicitud.",
    situation: "¿Qué tienes hoy?", optional: "Opcional", budget: "Presupuesto y moneda", when: "Fecha deseada",
    notes: "¿Qué te gustaría crear?", placeholder: "¿A qué se dedica tu empresa? ¿Qué debería resolver el sitio?",
    preview: "Tu mensaje para Rick", subject: "Solicitud de propuesta • MilWeb",
    greeting: "¡Hola, Rick! Me gustaría recibir una propuesta por escrito.", goalField: "Objetivo", refField: "Referencia",
    details: "Detalles", closing: "¿Puedes enviarme el alcance, el precio y el plazo por aquí?",
    email: "Abrir correo", whatsapp: "Abrir WhatsApp", copy: "Copiar mensaje", copied: "Mensaje copiado.",
    manual: "Selecciona el texto del mensaje y cópialo.", sendHint: "Revisa el mensaje y confirma el envío en la aplicación que se abra.",
  },
};

export const proposalLabel = (locale: Locale) => copy[locale].proposal;

const goals = [
  {
    id: "enquiries", service: "landing-pages", project: "kavita-drones",
    label: { pt: "Pedir orçamento", en: "Request a quote", es: "Pedir cotización" },
    idea: {
      pt: "No site da Kavita, o comprador escolhe os equipamentos e a revenda recebe a lista no WhatsApp. Podemos usar esse caminho para quem pede orçamento dos seus produtos ou serviços.",
      en: "On Kavita’s site, buyers choose equipment and the dealer gets their list on WhatsApp. Your visitors could request prices for specific products or services the same way.",
      es: "En el sitio de Kavita, el comprador elige equipos y el distribuidor recibe la lista por WhatsApp. Tus visitantes podrían pedir precios de productos o servicios de la misma forma.",
    },
  },
  {
    id: "bookings", service: "criacao-de-sites", project: "mabrouk-zanzibar",
    label: { pt: "Reservar passeios", en: "Book a tour", es: "Reservar tours" },
    idea: {
      pt: "O guia Mabrouk apresenta cada passeio e oferece um planejador que monta a mensagem de reserva. No seu site, o viajante poderia escolher a experiência, a data e o tamanho do grupo.",
      en: "Mabrouk shows each experience and gives travellers a planner to build their enquiry. On your site, guests could choose a tour, date and group size before writing to you.",
      es: "Mabrouk presenta cada experiencia y ofrece un planificador para preparar la consulta. En tu sitio, el viajero podría elegir el tour, la fecha y el número de personas antes de escribirte.",
    },
  },
  {
    id: "shop", service: "loja-virtual", project: "ecommerce-do-agro",
    label: { pt: "Comprar online", en: "Buy online", es: "Comprar en línea" },
    idea: {
      pt: "Explore como o pedido passa da vitrine para o pagamento e a gestão da entrega. Para a sua loja, o primeiro passo é definir o catálogo, os meios de pagamento e as regiões atendidas.",
      en: "See how an order moves from the storefront through payment to fulfilment. For your shop, we’d start with your catalog, payment methods and delivery area.",
      es: "Mira cómo un pedido pasa de la tienda al pago y a la gestión de la entrega. Para tu tienda, empezaríamos por el catálogo, los medios de pago y las zonas de envío.",
    },
  },
  {
    id: "catalog", service: "catalogo-whatsapp", project: "loja-iphone",
    label: { pt: "Comprar pelo WhatsApp", en: "Order on WhatsApp", es: "Pedir por WhatsApp" },
    idea: {
      pt: "Nesta vitrine, o comprador consulta as opções antes de conversar com a loja. Seu cliente poderia chegar ao WhatsApp com produto e quantidade já escolhidos.",
      en: "In this storefront, buyers explore their options before contacting the shop. Your customers could open WhatsApp with their product and quantity already filled in.",
      es: "En esta tienda, el comprador explora las opciones antes de escribir. Tus clientes podrían llegar a WhatsApp con el producto y la cantidad ya elegidos.",
    },
  },
  {
    id: "company", service: "criacao-de-sites", project: "kavita-institucional",
    label: { pt: "Conhecer a empresa", en: "Explore the company", es: "Conocer la empresa" },
    idea: {
      pt: "Veja como a Kavita apresenta a empresa e suas áreas de atuação. No seu site, cada serviço poderia reunir o que você entrega, uma referência de trabalho e um contato direto.",
      en: "See how Kavita introduces its business and areas of expertise. Each of your services could bring together what you deliver, an example of your work and a direct contact.",
      es: "Mira cómo Kavita presenta su empresa y sus áreas de trabajo. Cada uno de tus servicios podría reunir lo que entregas, un ejemplo y un contacto directo.",
    },
  },
  {
    id: "operations", service: "sistemas-sob-medida", project: "millead",
    label: { pt: "Gerenciar pedidos e clientes", en: "Manage orders and customers", es: "Gestionar pedidos y clientes" },
    idea: {
      pt: "O MilLead organiza a prospecção da própria MilWeb. Podemos partir de uma tarefa repetitiva da sua equipe e desenhar a tela que acompanha cada pedido ou cliente.",
      en: "MilLead helps MilWeb manage its own sales pipeline. We could start with a repetitive task on your team and design a screen to track each order or customer.",
      es: "MilLead organiza las oportunidades comerciales de MilWeb. Podríamos empezar por una tarea repetitiva de tu equipo y diseñar una pantalla para seguir cada pedido o cliente.",
    },
  },
];

// Resolve only the active language on the server, as for the rest of the OS.
export function buildProjectGuide(locale: Locale) {
  return {
    copy: copy[locale],
    faq: FAQ.map(({ q, a }) => ({ q: q[locale], a: a[locale] })),
    goals: goals.map(({ id, service, project, label, idea }) => ({ id, service, project, label: label[locale], idea: idea[locale] })),
  };
}

export type ProjectGuideData = ReturnType<typeof buildProjectGuide>;
