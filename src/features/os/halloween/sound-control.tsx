"use client";

import { useEffect } from "react";
import { useOs } from "../os-shell";
import { disposeHalloweenAudio, playPumpkinSound, setHalloweenVolume, startHalloweenAudio, stopHalloweenAudio, useHalloweenAudio } from "./audio";

/**
 * Controles do som do Halloween: o botão "Ativar som / Desativar som" e o volume. Moram junto dos
 * controles inferiores (dock do desktop; dock de redes do telefone) e só existem durante o evento.
 *
 * O botão é o ÚNICO jeito de ligar o som, e o clique cria o AudioContext (audio.ts). O estado mostra
 * "ligado" só depois que a reprodução realmente começou. O volume é um <input type="range">: teclado
 * (setas, Home/End), toque e leitor de tela de graça.
 */
function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 9.5v5h3.6L13 19V5L7.6 9.5H4z" fill="currentColor" fillOpacity=".18" />
      {on ? (
        <>
          <path d="M16.4 9a4.2 4.2 0 0 1 0 6" />
          <path d="M18.9 6.4a7.7 7.7 0 0 1 0 11.2" />
        </>
      ) : (
        <>
          <path d="M16.5 9.5l4.5 5" />
          <path d="M21 9.5l-4.5 5" />
        </>
      )}
    </svg>
  );
}

export function HalloweenVolume({ className }: { className?: string }) {
  const { payload } = useOs();
  const { volume } = useHalloweenAudio();
  const pct = Math.round(volume * 100);
  return (
    <input
      type="range"
      className={"hw-volume " + (className ?? "")}
      min={0}
      max={100}
      step={1}
      value={pct}
      aria-label={payload.s.halloween.volume}
      aria-valuetext={`${pct}%`}
      onChange={(e) => setHalloweenVolume(Number(e.target.value) / 100)}
      style={{ ["--v" as string]: `${pct}%` }}
      data-no-inspect
    />
  );
}

export function HalloweenSoundControl({ variant }: { variant: "dock" | "mdock" }) {
  const { payload } = useOs();
  const h = payload.s.halloween;
  const a = useHalloweenAudio();
  const on = a.status === "on";
  const label = on ? h.soundOff : h.soundOn;
  const onClick = () => {
    if (on) stopHalloweenAudio();
    else void startHalloweenAudio();
  };

  if (variant === "mdock") {
    return (
      <>
        <button type="button" className="os-mdock__item hw-sound-btn" data-on={on ? "1" : "0"} data-hint={a.resume && !on ? "1" : "0"} data-starting={a.status === "starting" ? "1" : "0"} aria-label={label} onClick={onClick}>
          <span className="os-mdock__icon" data-social="halloween" aria-hidden="true">
            <SpeakerIcon on={on} />
          </span>
          <span className="os-mdock__label">{h.soundShort}</span>
        </button>
      </>
    );
  }
  return (
    <div className="hw-sound" data-on={on ? "1" : "0"} data-no-inspect>
      <button type="button" className="os-dock__item hw-sound-btn" data-on={on ? "1" : "0"} data-hint={a.resume && !on ? "1" : "0"} data-starting={a.status === "starting" ? "1" : "0"} aria-label={label} onClick={onClick}>
        <span className="os-icon" aria-hidden="true" style={{ width: 40, height: 40 }}>
          <SpeakerIcon on={on} />
        </span>
        <span className="os-dock__label">{label}</span>
      </button>
      {on && <HalloweenVolume />}
    </div>
  );
}

/**
 * Montado UMA vez (na área de trabalho) enquanto o evento dura: cuida do ciclo de vida do áudio e do som
 * curto das abóboras. Ao sair — fim do evento, rota fora do OS, modo simples — o som para e o contexto
 * fecha. O som das abóboras só toca com o som ligado, só em hover/foco com intenção (nunca no clique) e no
 * máximo um a cada 900 ms.
 */
export function HalloweenAudioHost() {
  const { status } = useHalloweenAudio();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const sel = ".os-icons .os-icon-btn, .os-launcher__apps .os-launch";
    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = (e.target as Element | null)?.closest(sel);
      if (!el || el.contains(e.relatedTarget as Node | null)) return;
      cancel();
      timer = setTimeout(playPumpkinSound, 130);
    };
    const onOut = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest(sel);
      if (el && !el.contains(e.relatedTarget as Node | null)) cancel();
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest(sel) && t.matches(":focus-visible")) playPumpkinSound();
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onFocus);
    return () => {
      cancel();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onFocus);
      disposeHalloweenAudio();
    };
  }, []);
  // Telefone: o volume fica numa barra no espaço livre sob a frase (no desktop o controle é o da dock).
  return status === "on" ? (
    <div className="hw-volbar" data-no-inspect>
      <HalloweenVolume />
    </div>
  ) : null;
}
