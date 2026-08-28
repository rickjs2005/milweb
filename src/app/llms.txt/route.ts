import { PROFILE, PROJECTS, SITE_URL } from "@/lib/content";
import { SERVICES } from "@/lib/services";
import { SITE_COPY } from "@/lib/inline-scripts";

/**
 * /llms.txt — índice do site em texto para agentes de IA (llmstxt.org).
 *
 * Existe porque um agente que cai na home recebe 300KB de HTML com cena 3D,
 * animação e payload de hidratação para extrair meia dúzia de fatos. Aqui os
 * mesmos fatos saem em markdown: o que a MilWeb faz, onde atende, quais
 * serviços tem, o que já entregou e como falar comigo.
 *
 * Montado a partir de content.ts/services.ts de propósito — se fosse um
 * arquivo estático em public/ ele envelheceria calado na primeira vez que um
 * serviço ou projeto mudasse, e passaria a descrever um site que não existe.
 */
export const dynamic = "force-static";

function line(label: string, url: string, desc: string) {
  return `- [${label}](${url}): ${desc}`;
}

export function GET() {
  const clientWork = PROJECTS.filter((p) => p.clientWork);
  const own = PROJECTS.filter((p) => !p.clientWork && !p.hideFromLists);

  const body = `# MilWeb

> ${SITE_COPY.pt.description}

MilWeb é o estúdio de ${PROFILE.name}, desenvolvedor freelancer full-stack
(${PROFILE.role.pt}). Atendimento: ${PROFILE.location.pt}. O contato e o
fechamento acontecem por WhatsApp; não há checkout nem preço de tabela — cada
projeto é orçado sob medida, de graça, antes de começar.

O site existe em português (raiz) e inglês (prefixo /en). Toda URL abaixo tem
equivalente em ${SITE_URL}/en.

## Serviços

${SERVICES.map((s) => line(s.label.pt, `${SITE_URL}/${s.slug}`, s.metaDescription.pt)).join("\n")}

## Páginas principais

${line("Home", `${SITE_URL}/`, SITE_COPY.pt.description)}
${line(
  "Diagnóstico",
  `${SITE_URL}/diagnostico`,
  "Funil em cinco atos: o risco de depender só de rede social (com calculadora de prejuízo), como a empresa aparece no Google, como o orçamento é calculado, o que vem dentro do projeto e o convite pra conversa.",
)}
${line("Projetos", `${SITE_URL}/work`, "Acervo completo: entregas para cliente e projetos autorais, cada um com página de case.")}
${line("Lab", `${SITE_URL}/lab`, "Vídeos e animações feitos inteiramente em código.")}

## Entregas para cliente

${clientWork.map((p) => line(p.title, `${SITE_URL}/work/${p.slug}`, `${p.tagline.pt} — ${p.result.pt}`)).join("\n")}

## Projetos autorais

${own.map((p) => line(p.title, `${SITE_URL}/work/${p.slug}`, `${p.tagline.pt} — ${p.result.pt}`)).join("\n")}

## Contato

- WhatsApp: +${PROFILE.whatsapp}
- E-mail: ${PROFILE.email}
- GitHub: ${PROFILE.github}
- LinkedIn: ${PROFILE.linkedin}
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
