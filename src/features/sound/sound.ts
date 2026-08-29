/**
 * Sound design PROCEDURAL, desligado por padrão.
 *
 * Zero arquivos: cada som é sintetizado na hora (osciladores + ruído curto
 * + envelope), então nada é baixado antes — nem depois. O AudioContext só
 * nasce no gesto do usuário (o toggle), respeitando autoplay policies: sem
 * ativação explícita, `play()` é um no-op silencioso.
 *
 * Regras: volume baixo (master 0.12), nada contínuo, pausa quando a aba
 * fica invisível, preferência persistida em localStorage (mw:sound).
 */
export type SoundName = "boot" | "scan" | "paper" | "mech" | "horizon" | "break" | "rebuild" | "toggle";

const KEY = "mw:sound";

type Ctx = AudioContext & { mwMaster?: GainNode };

class Sound {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private _on = false;
  private listeners = new Set<() => void>();

  get on() {
    return this._on;
  }

  /** Lê a preferência salva (não cria contexto). */
  restore() {
    try {
      this._on = localStorage.getItem(KEY) === "1";
    } catch {}
    return this._on;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Liga/desliga. Só aqui o AudioContext é criado (precisa de gesto). */
  toggle() {
    this._on = !this._on;
    try {
      localStorage.setItem(KEY, this._on ? "1" : "0");
    } catch {}
    if (this._on) {
      this.ensure();
      this.play("toggle");
    } else {
      void this.ctx?.suspend();
    }
    this.listeners.forEach((l) => l());
    return this._on;
  }

  private ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC() as Ctx;
    const master = ctx.createGain();
    master.gain.value = 0.12;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this._on) void this.ctx.resume();
    });
    return ctx;
  }

  /** Ruído curto (filtrado) — a base de papel, quebra e varredura. */
  private noise(ctx: AudioContext, dur: number, type: BiquadFilterType, freq: number, q: number, gain: number, when = 0) {
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(this.master!);
    src.start(ctx.currentTime + when);
    src.stop(ctx.currentTime + when + dur);
  }

  /** Tom curto com envelope. */
  private tone(ctx: AudioContext, freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slide?: number) {
    const o = ctx.createOscillator();
    o.type = type;
    const t0 = ctx.currentTime + when;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master!);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  /** Toca um som nomeado. Sem ativação, não faz nada. */
  play(name: SoundName) {
    if (!this._on) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    switch (name) {
      case "boot": // inicialização digital: dois pulsos curtos
        this.tone(ctx, 880, 0.08, "square", 0.05);
        this.tone(ctx, 1320, 0.06, "square", 0.035, 0.1);
        break;
      case "scan": // pulso técnico do Kavita
        this.tone(ctx, 520, 0.05, "triangle", 0.05, 0, 900);
        break;
      case "paper": // papel do Terral
        this.noise(ctx, 0.22, "bandpass", 2400, 0.8, 0.5);
        break;
      case "mech": // mecânica delicada do Aurex
        this.tone(ctx, 1750, 0.03, "square", 0.03);
        this.noise(ctx, 0.05, "highpass", 3000, 1, 0.25, 0.02);
        break;
      case "horizon": // frequência grave do Event Horizon
        this.tone(ctx, 62, 1.6, "sine", 0.09, 0, 44);
        break;
      case "break": // deformação física
        this.noise(ctx, 0.5, "lowpass", 900, 0.7, 0.8);
        this.tone(ctx, 140, 0.5, "sawtooth", 0.06, 0, 40);
        break;
      case "rebuild": // reconstrução: escada curta subindo
        [440, 587, 784].forEach((f, i) => this.tone(ctx, f, 0.12, "triangle", 0.04, i * 0.09));
        break;
      case "toggle":
        this.tone(ctx, 660, 0.05, "sine", 0.05);
        break;
    }
  }
}

export const sound = new Sound();
