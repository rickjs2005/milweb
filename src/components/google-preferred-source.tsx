"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { track } from "@vercel/analytics";
import type { Locale } from "@/i18n/config";
import { PREFERRED_SOURCE_DEEP_LINK, PREFERRED_SOURCE_LANG, loadPreferredSource, preferredSourceReady } from "@/lib/preferred-source";

/**
 * O botão "adicionar a MilWeb às fontes preferidas" — MilWeb primeiro, Google
 * como função. É um <a> para o deep link oficial (funciona sem JS e quando o
 * SDK está bloqueado); com JS, o clique prefere o fluxo do SDK e só cai no
 * link se o SDK não responder. Estados: idle → loading → idle | error. Em
 * erro, o próximo clique segue o link (o "tentar de novo" é o próprio Google).
 *
 * O popup do Google precisa nascer dentro do gesto do usuário: por isso o SDK
 * é pré-aquecido na montagem e, se já respondeu, `addPreferredSource()` é
 * chamado de forma síncrona no clique.
 */
type Strings = { cta: string; loading: string; retry: string; aria: string };
type State = "idle" | "loading" | "error";

export function GooglePreferredSource({ locale, placement, theme = "light", s }: { locale: Locale; placement: string; theme?: "light" | "dark"; s: Strings }) {
  const [state, setState] = useState<State>("idle");
  // o SDK não respondeu ao pré-aquecimento (bloqueado/fora do ar): o clique vai
  // direto ao deep link, sem trocar o rótulo — indisponibilidade não é erro do usuário
  const unavailable = useRef(false);
  const options = { theme, lang: PREFERRED_SOURCE_LANG[locale] };

  // pré-aquece: o SDK entrega a API antes do clique (sem nenhum efeito visível)
  useEffect(() => {
    let alive = true;
    loadPreferredSource(options).catch(() => {
      if (alive) unavailable.current = true;
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, theme]);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const direct = state === "error" || (unavailable.current && !preferredSourceReady());
    track("preferred_source_click", { source: "google", placement, language: locale, mode: direct ? "deeplink" : "sdk" });
    if (direct) return; // segue o <a>: deep link oficial
    const ready = preferredSourceReady();
    if (ready) {
      e.preventDefault();
      ready.addPreferredSource();
      return;
    }
    e.preventDefault();
    setState("loading");
    loadPreferredSource(options)
      .then((api) => {
        api.addPreferredSource();
        setState("idle");
      })
      .catch(() => {
        setState("error");
        window.open(PREFERRED_SOURCE_DEEP_LINK, "_blank", "noopener,noreferrer");
      });
  };

  const label = state === "loading" ? s.loading : state === "error" ? s.retry : s.cta;
  return (
    <a
      href={PREFERRED_SOURCE_DEEP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={s.aria}
      aria-busy={state === "loading"}
      data-state={state}
      data-cta="preferred-source"
      className="act-cta inline-flex items-center gap-1.5 whitespace-nowrap text-ink"
      data-inspect="GOOGLE / PREFERRED SOURCE"
    >
      <span aria-hidden="true" className="act-cta-br">
        [
      </span>
      {state === "idle" ? (
        <span aria-hidden="true" className="opacity-60">
          +
        </span>
      ) : null}
      <span className="act-cta-txt">{label}</span>
      {state === "loading" ? null : (
        <span aria-hidden="true" className="act-cta-arrow">
          ↗
        </span>
      )}
      <span aria-hidden="true" className="act-cta-br">
        ]
      </span>
    </a>
  );
}
