"use client";

import { useState } from "react";

export type QuoteOption = { key: string; label: string; phrase: string };

/**
 * Compositor de mensagem para o WhatsApp. Não é formulário — nada é
 * enviado nem gravado: o visitante escolhe o que precisa e como está hoje,
 * vê o texto e clica. Escolher é opcional (sem clique sai `fallback`).
 * Recebe tudo resolvido por props para o content.ts não ir pro bundle.
 */
export function QuoteComposer({ typeQuestion, statusQuestion, types, statuses, greeting, closing, joiner, fallback, previewLabel, send, whatsapp, preselectedType }: {
  typeQuestion: string;
  statusQuestion: string;
  types: QuoteOption[];
  statuses: QuoteOption[];
  greeting: string;
  closing: string;
  joiner: string;
  fallback: string;
  previewLabel: string;
  send: string;
  whatsapp: string;
  preselectedType?: string;
}) {
  const [type, setType] = useState<string | undefined>(preselectedType);
  const [status, setStatus] = useState<string | undefined>();
  const parts = [types.find((o) => o.key === type)?.phrase, statuses.find((o) => o.key === status)?.phrase].filter(Boolean) as string[];
  const sentence = parts.join(joiner);
  const message = parts.length === 0 ? fallback : `${greeting} ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}. ${closing}`;
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  const toggle = (cur: string | undefined, key: string) => (cur === key ? undefined : key);

  const Chips = ({ legend, options, value, onPick }: { legend: string; options: QuoteOption[]; value?: string; onPick: (k: string) => void }) => (
    <div role="group" aria-label={legend} className="border-t border-ink pt-4" data-no-inspect>
      <p className="t-mono pb-4 text-ink-3">{legend}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {options.map((o) => {
          const on = value === o.key;
          return (
            <button key={o.key} type="button" aria-pressed={on} onClick={() => onPick(o.key)} className={"t-mono link-rule transition-colors duration-fast " + (on ? "signal-dot text-ink" : "text-ink-2 hover:text-ink")}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-10" data-inspect="QUOTE_COMPOSER">
      <Chips legend={typeQuestion.toUpperCase()} options={types} value={type} onPick={(k) => setType((c) => toggle(c, k))} />
      <Chips legend={statusQuestion.toUpperCase()} options={statuses} value={status} onPick={(k) => setStatus((c) => toggle(c, k))} />
      <div className="border-t border-ink pt-4">
        <p className="t-mono text-ink-3">{previewLabel.toUpperCase()}</p>
        <p className="t-lead mt-3 text-ink" aria-live="polite">
          “{message}”
        </p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="link-rule t-mono mt-8 inline-block text-ink" data-inspect="CTA / WHATSAPP">
          [ {send.toUpperCase()} ↗ ]
        </a>
      </div>
    </div>
  );
}
