"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Magnetic } from "./magnetic";

/**
 * Seletor de orçamento da seção de contato: duas fileiras de chips que
 * montam a mensagem do WhatsApp.
 *
 * Não é formulário — nada é enviado nem gravado. O visitante escolhe o que
 * precisa e como está hoje, vê o texto que vai mandar e clica. A ideia é
 * tirar do cliente a parte difícil, que é escrever a primeira mensagem: em
 * vez de "quero um orçamento", o Rick recebe "quero uma loja virtual, hoje
 * só tenho redes sociais".
 *
 * Escolher é OPCIONAL. Sem nenhum clique o botão leva `fallbackMessage`, a
 * mesma mensagem de antes deste componente existir — ninguém fica preso
 * atrás de uma escolha obrigatória.
 *
 * Recebe tudo pronto por props, de propósito: os textos vivem no content.ts
 * (256KB) e resolvê-los aqui dentro arrastaria o arquivo inteiro pro bundle
 * do browser. Quem resolve é o Server Component que renderiza este aqui —
 * mesmo padrão do ProjectsShowcase.
 */

export type QuoteOption = { key: string; label: string; phrase: string };

export function QuotePicker({
  typeQuestion,
  statusQuestion,
  types,
  statuses,
  greeting,
  closing,
  joiner,
  fallbackMessage,
  previewLabel,
  ctaLabel,
  whatsapp,
  /** Chip já marcado ao abrir (a página de cada serviço marca o dela). */
  preselectedType,
}: {
  typeQuestion: string;
  statusQuestion: string;
  types: QuoteOption[];
  statuses: QuoteOption[];
  greeting: string;
  closing: string;
  joiner: string;
  fallbackMessage: string;
  previewLabel: string;
  ctaLabel: string;
  whatsapp: string;
  preselectedType?: string;
}) {
  const [type, setType] = useState<string | undefined>(preselectedType);
  const [status, setStatus] = useState<string | undefined>();

  const typePhrase = types.find((o) => o.key === type)?.phrase;
  const statusPhrase = statuses.find((o) => o.key === status)?.phrase;

  // Duas frases viram uma só ("Quero X e hoje só tenho Y."); uma sozinha
  // fecha direto. Sem nenhuma, cai na mensagem de sempre.
  //
  // As frases são escritas em minúscula pra emendarem depois do "e"; quando
  // a de situação vem sozinha ela vira início de frase e precisa da
  // maiúscula ("Hoje só tenho redes sociais.", não "hoje só tenho...").
  const parts = [typePhrase, statusPhrase].filter(Boolean) as string[];
  const sentence = parts.join(joiner);
  const message = parts.length === 0
    ? fallbackMessage
    : `${greeting} ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}. ${closing}`;

  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

  /** Clicar no chip já marcado desmarca — dá pra voltar atrás sem recarregar. */
  const toggle = (current: string | undefined, key: string) => (current === key ? undefined : key);

  const chip = (selected: boolean) =>
    "rounded-full border px-4 py-2 text-sm font-medium transition-colors " +
    (selected
      ? "border-accent/60 bg-accent/15 text-accent"
      : "border-line/15 bg-surface-2/50 text-fg-muted hover:border-accent/40 hover:text-fg");

  return (
    <div className="relative mt-9">
      <fieldset className="border-0 p-0">
        <legend className="mb-3 w-full text-center text-sm font-medium text-fg-subtle">
          {typeQuestion}
        </legend>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {types.map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={type === o.key}
              onClick={() => setType((c) => toggle(c, o.key))}
              className={chip(type === o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6 border-0 p-0">
        <legend className="mb-3 w-full text-center text-sm font-medium text-fg-subtle">
          {statusQuestion}
        </legend>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {statuses.map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={status === o.key}
              onClick={() => setStatus((c) => toggle(c, o.key))}
              className={chip(status === o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Prévia do que vai ser enviado: ninguém clica num botão de WhatsApp
          sem saber o texto que vai sair no nome dele. aria-live avisa quem
          usa leitor de tela que a mensagem mudou. */}
      <p
        aria-live="polite"
        className="mx-auto mt-7 max-w-xl rounded-xl border border-line/10 bg-surface-2/40 px-4 py-3 text-sm italic text-fg-muted"
      >
        <span className="mr-1.5 font-mono text-[11px] uppercase not-italic tracking-wider text-fg-subtle">
          {previewLabel}:
        </span>
        {message}
      </p>

      <div className="mt-6 flex justify-center">
        <Magnetic strength={0.5} className="w-full sm:w-auto">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-soft sm:w-auto glow-accent"
          >
            <MessageCircle className="h-5 w-5" />
            {ctaLabel}
          </a>
        </Magnetic>
      </div>
    </div>
  );
}
