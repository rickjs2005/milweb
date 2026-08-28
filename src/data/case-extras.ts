import type { Localized } from "@/lib/content";

/**
 * Capítulos 02 IDEA e 03 EXPERIENCE dos cases selecionados. Os demais
 * projetos caem no fallback (tagline + highlights) em sections/case.
 */
export type CaseExtra = { idea: Localized; experience: Localized };

export const CASE_EXTRAS: Record<string, CaseExtra> = {
  "kavita-drones": {
    idea: {
      pt: "Tratar uma landing de revenda como um instrumento de campo, não como um folheto. O visitante monta o próprio orçamento — drones, baterias, bombas, serviços — e a página o entrega pronto no WhatsApp da filial certa. Nada é inventado: cada especificação carrega a origem ou fica marcada como pendente.",
      en: "Treat a reseller landing page as a field instrument, not a brochure. The visitor builds their own quote — drones, batteries, pumps, services — and the page delivers it, ready, to the right branch's WhatsApp. Nothing is invented: every spec carries its source or is flagged as pending.",
    },
    experience: {
      pt: "Zero framework e zero espera: o hero abre com a imagem crítica pré-carregada, o vídeo de fundo pausa fora da viewport, os contadores nascem do próprio HTML. O catálogo filtra por categoria e por compatibilidade com o drone. O orçamento persiste entre visitas e vira uma mensagem estruturada com um toque.",
      en: "Zero framework, zero waiting: the hero opens with its critical image preloaded, the background video pauses off-screen, counters are born from the HTML itself. The catalog filters by category and drone compatibility. The quote persists across visits and becomes a structured message with one tap.",
    },
  },
  terral: {
    idea: {
      pt: "Contar o café como se conta uma viagem: cinco capítulos — Caparaó, Terreiro, Tambor, Moenda, Xícara — em que a tipografia gigante faz o papel da imagem e o vídeo real faz o papel do argumento. A tese do site é a paciência, e o site a cobra literalmente: um botão só se revela para quem segura seis segundos.",
      en: "Tell coffee the way you tell a journey: five chapters — Caparaó, drying yard, drum, grind, cup — where giant typography does the image's job and real footage does the argument's. The site's thesis is patience, and the site literally demands it: one button only reveals itself to whoever holds for six seconds.",
    },
    experience: {
      pt: "Cada capítulo divide a tela entre imagem viva e título editorial, com grãos em parallax costurando as transições. Os títulos são personagens: XÍCARA entra em camadas, VERTENTE abre a vitrine de blends com origem, altitude, nota SCA e pedido direto no WhatsApp. O rodapé fecha com um letreiro TERRAL de ponta a ponta.",
      en: "Each chapter splits the screen between living imagery and an editorial title, with beans floating in parallax to stitch the transitions. Titles are characters: XÍCARA arrives in layers, VERTENTE opens the blend showcase with origin, altitude, SCA score and direct WhatsApp ordering. The footer closes with an edge-to-edge TERRAL letterpress.",
    },
  },
  "atelier-vertex": {
    idea: {
      pt: "Um escritório de arquitetura vende execução, não fotos. Então o site é um filme real de obra cujo tempo pertence ao scroll: rolar constrói o prédio, voltar desconstrói. No meio do caminho o vídeo escurece e vira uma mesa de luz onde a planta se desenha com cotas reais.",
      en: "An architecture firm sells execution, not photos. So the site is a real construction film whose time belongs to the scroll: scrolling down builds the building, scrolling up tears it down. Midway, the video dims into a light table where the floor plan draws itself with real dimensions.",
    },
    experience: {
      pt: "Sem autoplay e sem cortes secos: pular de cena é um dolly de tempo com damping. A cena Prancha desenha paredes, mobiliário e carimbo sobre o vídeo escurecido. Depois do filme o site vira o arquivo do estúdio — obras, processo, contato — com trilho de progresso e cursor próprio.",
      en: "No autoplay and no hard cuts: jumping scenes is a damped time dolly. The Blueprint scene draws walls, furniture and a drafting stamp over the dimmed video. After the film the site becomes the studio's archive — works, process, contact — with a progress rail and a custom cursor.",
    },
  },
  "aurex-timepieces": {
    idea: {
      pt: "Foto de relógio parada não justifica preço; mecânica sim. O AX-01 é um calibre 100% procedural que se desmonta peça por peça conforme o scroll — caixa, bezel, coroa, mostrador, trem de engrenagens, espiral, escape, rotor, tourbillon — e remonta no caminho inverso exato.",
      en: "A still watch photo doesn't justify a price; mechanics do. The AX-01 is a 100% procedural calibre that disassembles piece by piece on scroll — case, bezel, crown, dial, gear train, hairspring, escapement, rotor, tourbillon — and reassembles along the exact reverse path.",
    },
    experience: {
      pt: "Um filme em quinze cenas, um configurador que troca materiais em tempo real e uma galeria 360° por arrasto. Tudo em React Three Fiber, com DPR adaptativo e cenas que dormem fora da viewport — sofisticação sem destruir o frame rate.",
      en: "A fifteen-scene film, a configurator that swaps materials in real time and a drag-to-rotate 360° gallery. All in React Three Fiber, with adaptive DPR and scenes that sleep off-screen — sophistication without wrecking the frame rate.",
    },
  },
};

export const CASE_CHAPTERS: { n: string; label: Localized }[] = [
  { n: "01", label: { pt: "Desafio", en: "Challenge" } },
  { n: "02", label: { pt: "Ideia", en: "Idea" } },
  { n: "03", label: { pt: "Experiência", en: "Experience" } },
  { n: "04", label: { pt: "Engenharia", en: "Engineering" } },
  { n: "05", label: { pt: "Resultado", en: "Result" } },
  { n: "06", label: { pt: "Telas selecionadas", en: "Selected screens" } },
];

export const CASE_UI = {
  visit: { pt: "Visitar o site", en: "Visit site" } as Localized,
  code: { pt: "Código", en: "Code" } as Localized,
  next: { pt: "Próximo", en: "Next" } as Localized,
  allWork: { pt: "Todos os trabalhos", en: "All work" } as Localized,
  builtWith: { pt: "Construído com", en: "Built with" } as Localized,
  client: { pt: "Cliente", en: "Client" } as Localized,
  studio: { pt: "Projeto autoral", en: "Studio project" } as Localized,
  similar: { pt: "Quero algo parecido", en: "I want something like this" } as Localized,
  archiveTitle: ["ALL", "WORK."],
  archiveSub: { pt: "projetos — clientes e autorais, 2024–2026", en: "projects — client and studio work, 2024–2026" } as Localized,
  clientWork: { pt: "Trabalhos para clientes", en: "Client work" } as Localized,
  studioWork: { pt: "Projetos autorais", en: "Studio work" } as Localized,
};
