"use client";

import { useEffect, useState } from "react";
import { useOs } from "./os-shell";
import { BOOTED_KEY } from "./theme";

/**
 * Tela de carregamento do MilWeb OS — discreta, na identidade do tema em
 * vigor (carvão e vermelho no Obito, gelo e azul no Gojo — os mesmos tokens
 * do resto do sistema): a marca MILWEB® centralizada com um ponto de acento,
 * um indicador fino INDETERMINADO (não existe progresso mensurável, então
 * nenhuma porcentagem é inventada), "Preparando seu ambiente" e o rodapé.
 *
 * Vai no HTML do servidor, por cima da área de trabalho, para cobrir o
 * intervalo real entre a primeira pintura e a home pronta. "Pronta" aqui é
 * medida, não cronometrada: as fontes do site (`document.fonts.ready`), a
 * imagem do olho do tema em vigor (a única mídia essencial da home) e a
 * hidratação do shell. Nada de assets secundários nem de serviços externos;
 * nenhuma duração mínima — se a home estiver pronta, a tela sai na hora.
 * Rede de segurança: 2,5 s depois de o script rodar ela sai de qualquer
 * jeito (recurso com erro, fonte que não chega); e, sem JavaScript nenhum,
 * uma animação CSS a apaga aos 6 s — a interface nunca fica bloqueada. A
 * camada não captura o ponteiro.
 *
 * Mostra uma vez por sessão: o script inline marca `data-os-booted` (CSS
 * esconde antes da pintura) quando o sessionStorage diz que o OS já abriu;
 * navegações internas não a remontam (o shell vive no layout). Com movimento
 * reduzido (sistema ou Ajustes) não há transição: a tela simplesmente sai.
 * `role="status"`: o leitor de tela lê a frase uma vez; o conteúdo da home
 * continua no DOM, acessível, atrás dela.
 */
type Phase = "boot" | "leave" | "done";

const LIMIT_MS = 2500;
const LEAVE_MS = 360;

export function OsBoot() {
  const { payload, store } = useOs();
  const s = payload.s;
  const [phase, setPhase] = useState<Phase>("boot");

  useEffect(() => {
    if (document.documentElement.dataset.osBooted) {
      setPhase("done");
      return;
    }
    let alive = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || store.getState().prefs.motion === "reduce";

    const fonts: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
    const still = (async () => {
      const el = document.querySelector(".os-eye__still");
      const m = el && getComputedStyle(el).backgroundImage.match(/url\("?([^")]+)"?\)/);
      if (!m) return;
      const img = new Image();
      img.src = m[1];
      await img.decode();
    })();
    const hydrated = new Promise<void>((res) => {
      if (store.getState().hydrated) res();
      else {
        const unsub = store.subscribe((st) => {
          if (st.hydrated) {
            unsub();
            res();
          }
        });
      }
    });
    // Qualquer falha (fonte bloqueada, imagem 404) conta como "pronto o bastante": o erro nunca segura a tela.
    const ready = Promise.all([fonts.catch(() => undefined), still.catch(() => undefined), hydrated]).then(() => undefined);
    const limit = new Promise<void>((res) => window.setTimeout(res, LIMIT_MS));
    let leaveTimer = 0;
    Promise.race([ready, limit]).then(() => {
      if (!alive) return;
      try {
        sessionStorage.setItem(BOOTED_KEY, "1");
      } catch {}
      document.documentElement.dataset.osBooted = "1";
      if (reduce) setPhase("done");
      else {
        setPhase("leave");
        leaveTimer = window.setTimeout(() => alive && setPhase("done"), LEAVE_MS);
      }
    });
    return () => {
      alive = false;
      window.clearTimeout(leaveTimer);
    };
  }, [store]);

  if (phase === "done") return null;
  return (
    <div className="os-boot" data-phase={phase} role="status" aria-live="polite" data-no-inspect>
      <div className="os-boot__mark">
        <span className="os-boot__logo">{payload.brand.mark}</span>
        <span className="os-boot__dot" aria-hidden="true" />
      </div>
      <div className="os-boot__bar" aria-hidden="true">
        <span />
      </div>
      <p className="os-boot__text t-mono">{s.boot.preparing}</p>
      <p className="os-boot__foot t-mono">
        <span>{s.boot.studio}</span>
        <span aria-hidden="true"> · </span>
        <span>{s.sign.origin}</span>
      </p>
    </div>
  );
}
