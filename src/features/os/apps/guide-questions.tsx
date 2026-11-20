"use client";

import { useEffect, useId, useState } from "react";
import type { ProjectGuideData } from "@/data/project-guide";
import type { OsService } from "../types";
import styles from "./project-guide.module.css";

type Answer = { q: string; a: string; terms?: string };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const ignored = new Set("a an and are at be by can do does how i in is it my of on or the this to we what will with would you your como da de do dos e em eu me meu minha no o os para pela por pra preciso que sao se seu site um uma voces al con cual de del el en es la las lo los mi necesito para puedo que se tu un una website project projeto proyecto".split(" "));
const call = /\b(calls?|meeting\w*|zoom|reuniao|reunioes|ligacao|chamada\w*|videochamada\w*|llamada\w*|videollamada\w*|reunion\w*|videoconferenc\w*)\b/;
const steps = /\b(process\w*|steps|etapas|passos|como funciona|how does it work|pasos|proceso\w*)\b/;
const hire = /\b(hire|hiring|get started|getting started|next steps?|work with you|como (eu |te |a gente )?contrat\w*|quero contratar|para contratar|proximos passos|proximo passo|como (te |lo )?contrat\w*|quiero contratar\w*|proximos pasos|siguientes? pasos?)\b/;
// "By email" only means "no call needed" when the question is about dealing with Rick.
const channel = /\b((by|via|over|through|using) (e ?mail|whatsapp|text|chat|messages?)|in writing|(por|pelo|via) (e ?mail|whatsapp|zap|escrito|mensagem|mensagens|chat)|(por|via|mediante) (correo|mensajes?))\b/;
const dealing = /\b(everything|whole|project|proposal|scope|contract|approv\w*|talk|communicat\w*|discuss|handle|negotiat\w*|sign|hire|tudo|projeto|proposta|escopo|contrato|aprov\w*|conversar|falar|combinar|resolver|negociar|fechar|assinar|contratar|tratar|todo|proyecto|propuesta|alcance|aprob\w*|aprueb\w*|hablar|coordinar|gestionar|cerrar|firmar)\b/;
// What the visitor's own customers can do, a third-party tool or incoming requests: that is scope.
// These go to Rick, because a keyword match would read as a commercial promise.
const scoped = /\b(integr\w*|sync\w*|synchroni\w*|sincroniz\w*|connect\w*|conect\w*|apis?|crm|erp\w*|webhooks?|plug ?ins?|imports?|importing|importar|exports?|exporting|exportar|compatib\w*|requests?|solicitud\w*|pedidos? de (orcamento|reserva)\w*|accepts?|accepting|aceita\w*|acepta\w*|cards?|cartao|cartoes|tarjetas?|pix|paypal|stripe|people|pessoas|personas|customers?|clients?|buyers?|visitors?|guests?|travell?ers?|users?|dealers?|shoppers?|bookings?|reservations?|clientes?|compradores?|visitantes?|hospedes?|viajantes?|usuarios?|revendedores?|reservas?|huespedes?|viajeros?|distribuidores?)\b/;
const concepts = [
  /\b(pric\w*|cost\w*|how much|rates?|budget\w*|quotes?|quanto custa|custa|custam|custo|custos|custaria|custar|quanto (fica|sai|ficaria|sairia|seria)|valor|valores|preco\w*|orcamento\w*|precio\w*|cuesta|cuestan|cuanto (sale|vale|seria)|cotiza\w*|presupuesto\w*)\b/,
  /\b(deadline\w*|timeline\w*|how long|how fast|how soon|launch date|turnaround|prazo\w*|quanto tempo|demora\w*|plazo\w*|cuanto tard\w*|cuanto tiempo)\b/,
  call,
  /\b(deliverables?|include\w*|entregave\w*|inclu\w*|entregable\w*)\b/,
  steps,
  hire,
  /\b(host\w*|domain\w*|dominio\w*|hosped\w*|alojamiento)\b/,
  /\b(maintenan\w*|support\w*|after launch|suporte|manutenc\w*|depois do lancamento|soporte|mantenimiento|despues del lanzamiento)\b/,
  /\b(copywriting|copy|textos?|redaccion)\b/,
  /\b(ads|advertis\w*|anuncios?|trafego pago|publicidad)\b/,
  /\b(updat\w*|edit\w*|atualiz\w*|cadastr\w*|cadastro|actualiz\w*|manage products|cargo los productos)\b/,
  /\b(payment\w*|recebo o dinheiro|receive the money|recebo pagamento\w*|pagamento\w*|pago\w*|recibo el dinero)\b/,
  /\b(monthly|fees?|mensalidade\w*|taxa\w*|mensualidad|comision\w*)\b/,
  /\b(code|codigo|ownership|propriedade|propiedad)\b/,
  /\b(tech|technolog\w*|tecnolog\w*|stack)\b/,
  /\b(revis\w*|ajustes?|changes)\b/,
  /\b(deposit|installments?|payment|pay|upfront|entrada|parcelamento|pagamento|pagar|anticipo|pago)\b/,
];

function findAnswer(question: string, options: Answer[]) {
  const query = normalize(question);
  if (!query) return null;
  const exact = options.find((option) => normalize(option.q) === query);
  if (exact) return exact;
  if (scoped.test(query)) return null;
  const writing = channel.test(query) && dealing.test(query);
  let topics = concepts.filter((pattern) => pattern.test(query) || (pattern === call && writing));
  // "Next steps" asks how to hire, not how the build is staged.
  if (topics.includes(hire)) topics = topics.filter((pattern) => pattern !== steps);
  const words = [...new Set(query.split(" ").filter((word) => word.length > 2 && !ignored.has(word)))];
  const ranked = options.map((option) => {
    const title = normalize(option.q + " " + (option.terms ?? ""));
    const titleWords = new Set(title.split(" "));
    const commonWords = words.filter((word) => titleWords.has(word)).length;
    const commonTopics = topics.filter((pattern) => pattern.test(title)).length;
    const directTopic = topics.some((pattern) => pattern.test(option.terms ?? ""));
    return { option, score: commonWords + commonTopics * 3 + (directTopic ? 0.5 : 0) };
  }).sort((a, b) => b.score - a.score);
  // An ambiguous match is a question for Rick. Search never generates a commercial promise.
  return ranked[0].score >= 2 && ranked[0].score !== ranked[1]?.score ? ranked[0].option : null;
}

export function GuideQuestions({ copy, generalFaq, service, onForward, onPending }: {
  copy: ProjectGuideData["copy"];
  generalFaq: ProjectGuideData["faq"];
  service?: OsService;
  onForward: (question: string) => void;
  /** The question the guide could not answer, so the main proposal button can carry it too. */
  onPending: (question: string) => void;
}) {
  const id = useId();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const published = service?.faq ?? [];
  const timing = published.find((entry) => entry.timing);
  const common: Answer[] = [
    { q: copy.priceQ, a: copy.priceA, terms: "price cost" },
    { q: copy.timeQ, a: timing?.a ?? copy.timeA, terms: "timeline deadline" },
    { q: copy.callQ, a: copy.callA, terms: "meeting call" },
    { q: copy.scopeQ, a: service?.includes.join(" · ") ?? copy.choose, terms: "deliverables" },
    { q: copy.processQ, a: service?.steps.join(" → ") ?? copy.choose, terms: "process" },
    { q: copy.hireQ, a: copy.hireA, terms: "hire" },
  ];
  const answers: Answer[] = [...common, ...published.filter((entry) => !entry.timing), ...generalFaq]
    .filter((entry, i, all) => all.findIndex((other) => normalize(other.q) === normalize(entry.q)) === i);
  const sections = service ? [{ label: service.label, faq: published, href: service.href }, { label: "MilWeb", faq: generalFaq, href: null }]
    : [{ label: "MilWeb", faq: generalFaq, href: null }];
  const result = query ? findAnswer(query, answers) : null;
  const unanswered = query && !result ? query : "";

  useEffect(() => {
    onPending(unanswered);
    return () => onPending("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the parent passes a fresh callback on every render
  }, [unanswered]);

  function ask(question: string) {
    setInput(question);
    setQuery(question.trim());
  }

  return (
    <section className={styles.questions} aria-labelledby={id + "-heading"}>
      <h3 id={id + "-heading"} className={styles.heading}>{copy.faq}</h3>
      <form className={styles.ask} onSubmit={(event) => { event.preventDefault(); ask(input); }}>
        <label className="sr-only" htmlFor={id}>{copy.ask}</label>
        <input id={id} maxLength={240} value={input} placeholder={copy.ask}
          onChange={(event) => { setInput(event.target.value); setQuery(""); }} />
        <button type="submit" disabled={!input.trim()} className={styles.smallButton}>{copy.search}</button>
      </form>
      <div className={styles.shortcuts}>
        {common.slice(0, 3).map(({ q }) => (
          <button key={q} type="button" onClick={() => ask(q)}>{q}</button>
        ))}
      </div>
      <div aria-live="polite" aria-atomic="true">
        {query && (
          <div className={styles.answer}>
            {result ? (
              <>
                <p className={styles.caption}>{copy.related}</p>
                <p className={styles.answerTitle}>{result.q}</p>
                <p>{result.a}</p>
              </>
            ) : <p>{copy.noAnswer}</p>}
            <button type="button" className={styles.textLink} onClick={() => onForward(query)}>{copy.forward}</button>
          </div>
        )}
      </div>
      {sections.map((section) => (
        <details key={section.label} className={styles.faqList}>
          <summary>{section.label} · FAQ</summary>
          {section.faq.map(({ q, a }) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
          {section.href && <a href={section.href} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{copy.service}</a>}
        </details>
      ))}
    </section>
  );
}
