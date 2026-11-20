import type { Locale } from "@/i18n/config";

/**
 * Voz da conversa, com a Web Speech API do próprio navegador (sem serviço pago).
 * O microfone só é pedido quando a pessoa escolhe falar; sem suporte ou sem permissão, a conversa
 * segue por texto. A resposta falada pode ser interrompida a qualquer momento (`hush`).
 */
const LANG: Record<Locale, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type Ctor = new () => Recognition;

const ctor = (): Ctor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const canListen = () => ctor() !== null;

export type Listener = { stop(): void };
export type ListenHandlers = { onInterim(text: string): void; onFinal(text: string): void; onDenied(): void; onSilence(): void; onEnd(): void };

export function listen(locale: Locale, h: ListenHandlers): Listener | null {
  const C = ctor();
  if (!C) return null;
  const rec = new C();
  rec.lang = LANG[locale];
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let final = "";
  let heard = false;
  let failed = false;
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    heard = true;
    h.onInterim((final + interim).trim());
  };
  rec.onerror = (e) => {
    failed = true;
    if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") h.onDenied();
    else if (e.error === "no-speech") h.onSilence();
  };
  rec.onend = () => {
    const text = final.trim();
    if (text) h.onFinal(text);
    else if (!failed && !heard) h.onSilence();
    h.onEnd();
  };
  try {
    rec.start();
  } catch {
    return null;
  }
  return {
    stop() {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* já parou */
      }
    },
  };
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, locale: Locale, onEnd: () => void): void {
  if (!canSpeak()) return onEnd();
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG[locale];
  const voice = synth.getVoices().find((v) => v.lang === LANG[locale]) ?? synth.getVoices().find((v) => v.lang.startsWith(locale));
  if (voice) u.voice = voice;
  u.rate = 1.03;
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    onEnd();
  };
  u.onend = end;
  u.onerror = end;
  synth.speak(u);
}

export function hush(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}
