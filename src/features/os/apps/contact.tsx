"use client";

import { QuoteComposer } from "@/components/quote-composer";
import { useOs } from "../os-shell";

/** Contato — WhatsApp, e-mail e os canais já configurados; o compositor de mensagem é o mesmo da página. */
export function ContactApp() {
  const { payload } = useOs();
  const s = payload.s;
  const c = payload.contact;
  return (
    <div className="os-contact">
      <header className="os-app__header">
        <p className="t-mono os-app__eyebrow">{c.location.toUpperCase()}</p>
        <p className="os-contact__title t-display">
          {c.title.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </p>
        <p className="os-app__lead">{c.intro}</p>
      </header>

      <div className="os-contact__grid">
        <section aria-labelledby="os-contact-channels">
          <h3 id="os-contact-channels" className="t-mono os-app__label">
            {s.contact.channels.toUpperCase()}
          </h3>
          <ul className="os-contact__channels t-mono">
            <li>
              <a href={c.waHref} target="_blank" rel="noopener noreferrer" className="os-cta">
                {s.contact.whatsapp.toUpperCase()} ↗
              </a>
            </li>
            <li>
              <a href={`mailto:${c.email}`} className="link-rule normal-case">
                {c.email}
              </a>
            </li>
            <li>
              <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="link-rule">
                {s.contact.linkedin.toUpperCase()} ↗
              </a>
            </li>
            <li>
              <a href={c.github} target="_blank" rel="noopener noreferrer" className="link-rule">
                {s.contact.github.toUpperCase()} ↗
              </a>
            </li>
          </ul>
        </section>
        <section className="os-contact__composer" aria-label={c.quote.typeQuestion}>
          <QuoteComposer
            typeQuestion={c.quote.typeQuestion}
            statusQuestion={c.quote.statusQuestion}
            types={c.quote.types}
            statuses={c.quote.statuses}
            greeting={c.quote.greeting}
            closing={c.quote.closing}
            joiner={c.quote.joiner}
            fallback={c.quote.fallback}
            previewLabel={c.quote.previewLabel}
            send={c.quote.send}
            whatsapp={c.whatsapp}
          />
        </section>
      </div>
    </div>
  );
}
