"use client";

import { useSyncExternalStore } from "react";

/**
 * Som do Halloween — sintetizado em tempo real com Web Audio. Zero arquivos de áudio, zero rede,
 * nenhum crédito de terceiros: vento (ruído filtrado em três camadas), um drone grave e, de tempos em
 * tempos, um evento discreto (trovão distante, lamento fantasmagórico, morcegos, coruja, rangido, sino).
 *
 * Regras:
 *  · SILENCIOSO por padrão. O AudioContext só nasce dentro do clique no botão (`startHalloweenAudio`),
 *    nunca no carregamento nem num clique qualquer num aplicativo. Preferência salva não liga nada sozinha.
 *  · O estado "ligado" só vale depois que o contexto está de fato rodando; se falhar, fica "blocked" e o
 *    botão continua oferecendo a ativação.
 *  · UMA instância (módulo): ativar duas vezes, re-renderizar ou navegar não cria outro contexto nem loops.
 *  · Aba oculta: suspende o contexto e para de agendar eventos; ao voltar, retoma se o navegador deixar,
 *    senão volta ao estado "blocked" (o botão pede um novo gesto).
 *  · Desativar corta a saída na hora (rampa de 20 ms), cancela os timers e fecha o contexto.
 *  · Volume mestre começa em 12 %, com um compressor de segurança antes da saída (sem picos nem sustos).
 *  · Efeitos de interface (abóboras dos aplicativos): no máximo um a cada 900 ms, só com o som ligado.
 */
export type AudioStatus = "off" | "starting" | "on" | "blocked";
export type AudioSnapshot = { status: AudioStatus; volume: number; /** havia som ligado na última visita (só uma dica: nada toca sem gesto) */ resume: boolean };

const KEY = "milweb-halloween:audio";
export const DEFAULT_VOLUME = 0.12;

type Saved = { on: boolean; volume: number };

function readSaved(): Saved {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
    const p = raw ? (JSON.parse(raw) as Partial<Saved>) : null;
    const v = typeof p?.volume === "number" && p.volume >= 0 && p.volume <= 1 ? p.volume : DEFAULT_VOLUME;
    return { on: p?.on === true, volume: v };
  } catch {
    return { on: false, volume: DEFAULT_VOLUME };
  }
}

function writeSaved(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* armazenamento indisponível (modo privado, bloqueado): a preferência só vale nesta sessão */
  }
}

const SERVER_SNAP: AudioSnapshot = { status: "off", volume: DEFAULT_VOLUME, resume: false };
let snap: AudioSnapshot = SERVER_SNAP;
let loaded = false;
const subs = new Set<() => void>();

function emit(next: Partial<AudioSnapshot>) {
  snap = { ...snap, ...next };
  subs.forEach((f) => f());
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const s = readSaved();
  snap = { status: "off", volume: s.volume, resume: s.on };
}

/* ---------------------------------------------------------------------------------------------- *
 * Motor
 * ---------------------------------------------------------------------------------------------- */
type Engine = {
  ctx: AudioContext;
  master: GainNode;
  fx: GainNode;
  rev: GainNode;
  noise: AudioBuffer;
  analyser: AnalyserNode;
  sources: AudioScheduledSourceNode[];
  eventTimer: ReturnType<typeof setTimeout> | null;
  lastEvent: string;
  lastFx: number;
  lastChime: number;
};

let eng: Engine | null = null;
let starting: Promise<boolean> | null = null;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Ruído rosa em laço, com as pontas fundidas em potência igual para a emenda não estalar. */
function noiseLoop(ctx: AudioContext, seconds = 8, fade = 0.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const n = Math.floor(seconds * rate);
  const x = Math.floor(fade * rate);
  const raw = new Float32Array(n + x);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < raw.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  const buf = ctx.createBuffer(1, n, rate);
  const out = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    if (i < x) {
      const t = i / x;
      out[i] = raw[i] * Math.sin((t * Math.PI) / 2) + raw[n + i] * Math.cos((t * Math.PI) / 2);
    } else out[i] = raw[i];
  }
  return buf;
}

/** Reverberação sintética (cauda de ruído que decai) para os eventos soarem distantes. */
function reverbImpulse(ctx: AudioContext, seconds = 2.6): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

function lfo(e: Engine, freq: number, depth: number, target: AudioParam) {
  const o = e.ctx.createOscillator();
  o.frequency.value = freq;
  const g = e.ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(target);
  e.sources.push(o);
  o.start();
}

function noiseSource(e: Engine, rate: number): AudioBufferSourceNode {
  const s = e.ctx.createBufferSource();
  s.buffer = e.noise;
  s.loop = true;
  s.playbackRate.value = rate;
  e.sources.push(s);
  return s;
}

/** Ambiente contínuo: vento em três camadas e um drone grave, tudo modulado devagar (sem fim, sem emenda). */
function buildAmbient(e: Engine, out: AudioNode) {
  const { ctx } = e;
  const bp = (f: number, q: number) => {
    const n = ctx.createBiquadFilter();
    n.type = "bandpass";
    n.frequency.value = f;
    n.Q.value = q;
    return n;
  };
  // corpo do vento
  {
    const s = noiseSource(e, 0.9);
    const f = bp(420, 0.7);
    const g = ctx.createGain();
    g.gain.value = 0.55;
    s.connect(f).connect(g).connect(out);
    lfo(e, 0.06, 180, f.frequency);
    lfo(e, 0.09, 0.22, g.gain);
    s.start(0, rand(0, 6));
  }
  // rumor grave
  {
    const s = noiseSource(e, 0.6);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 130;
    const g = ctx.createGain();
    g.gain.value = 0.9;
    s.connect(f).connect(g).connect(out);
    lfo(e, 0.04, 0.3, g.gain);
    s.start(0, rand(0, 6));
  }
  // assobio distante
  {
    const s = noiseSource(e, 1.3);
    const f = bp(1250, 4);
    const g = ctx.createGain();
    g.gain.value = 0.05;
    s.connect(f).connect(g).connect(out);
    lfo(e, 0.11, 420, f.frequency);
    lfo(e, 0.07, 0.04, g.gain);
    s.start(0, rand(0, 6));
  }
  // drone: duas notas graves levemente desafinadas, com tremolo lento
  {
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 55;
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = 82.41;
    o2.detune.value = 7;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 240;
    const g = ctx.createGain();
    g.gain.value = 0.2;
    o1.connect(f);
    o2.connect(f);
    f.connect(g).connect(out);
    lfo(e, 0.13, 0.08, g.gain);
    e.sources.push(o1, o2);
    o1.start();
    o2.start();
  }
}

/** Liga um nó à saída seca e ao envio de reverb (`send` = quanto vai para a cauda). */
function route(e: Engine, node: AudioNode, send: number) {
  node.connect(e.fx);
  if (send > 0) {
    const g = e.ctx.createGain();
    g.gain.value = send;
    node.connect(g).connect(e.rev);
  }
}

function envelope(g: GainNode, t: number, peak: number, attack: number, hold: number, release: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
}

const EFFECTS: Record<string, (e: Engine) => void> = {
  /** trovão distante: ruído grave que desce, com dois rolamentos */
  thunder(e) {
    const { ctx } = e;
    const t = ctx.currentTime + 0.02;
    [0, 0.9, 2.0].forEach((delay, k) => {
      const s = ctx.createBufferSource();
      s.buffer = e.noise;
      s.playbackRate.value = 0.5;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(900 - k * 250, t + delay);
      f.frequency.exponentialRampToValueAtTime(70, t + delay + 3.2);
      const g = ctx.createGain();
      envelope(g, t + delay, 0.5 - k * 0.14, 0.35, 0.1, 3.2);
      s.connect(f).connect(g);
      route(e, g, 0.5);
      s.start(t + delay, rand(0, 5));
      s.stop(t + delay + 4);
    });
  },
  /** lamento fantasmagórico: um tom que sobe e desce com vibrato */
  wail(e) {
    const { ctx } = e;
    const t = ctx.currentTime + 0.02;
    const f0 = rand(290, 380);
    const mk = (type: OscillatorType, detune: number, level: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.detune.value = detune;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.linearRampToValueAtTime(f0 * 1.55, t + 1.5);
      o.frequency.linearRampToValueAtTime(f0 * 0.8, t + 3.2);
      const v = ctx.createOscillator();
      v.frequency.value = 5.2;
      const vg = ctx.createGain();
      vg.gain.value = 7;
      v.connect(vg).connect(o.frequency);
      const g = ctx.createGain();
      envelope(g, t, level, 0.9, 0.7, 1.9);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1500;
      o.connect(lp).connect(g);
      route(e, g, 0.95);
      o.start(t);
      v.start(t);
      o.stop(t + 3.6);
      v.stop(t + 3.6);
    };
    mk("sine", 0, 0.14);
    mk("triangle", 9, 0.06);
  },
  /** morcegos: rajadas curtas de ruído agudo cruzando o estéreo */
  bats(e) {
    const { ctx } = e;
    const t0 = ctx.currentTime + 0.02;
    const n = 8;
    for (let i = 0; i < n; i++) {
      const t = t0 + i * rand(0.07, 0.12);
      const s = ctx.createBufferSource();
      s.buffer = e.noise;
      s.playbackRate.value = 2.4;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = rand(2600, 3800);
      f.Q.value = 3;
      const g = ctx.createGain();
      envelope(g, t, 0.1, 0.012, 0.01, 0.045);
      const p = ctx.createStereoPanner();
      p.pan.value = -0.8 + (1.6 * i) / (n - 1);
      s.connect(f).connect(g).connect(p);
      route(e, p, 0.25);
      s.start(t, rand(0, 6));
      s.stop(t + 0.1);
    }
  },
  /** coruja: dois "hu" graves e suaves */
  owl(e) {
    const { ctx } = e;
    const t0 = ctx.currentTime + 0.02;
    [0, 0.75].forEach((d) => {
      const t = t0 + d;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(410, t);
      o.frequency.exponentialRampToValueAtTime(360, t + 0.5);
      const g = ctx.createGain();
      envelope(g, t, 0.11, 0.12, 0.12, 0.35);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      o.connect(lp).connect(g);
      route(e, g, 0.55);
      o.start(t);
      o.stop(t + 0.8);
    });
  },
  /** rangido de porta */
  creak(e) {
    const { ctx } = e;
    const t = ctx.currentTime + 0.02;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(88, t);
    o.frequency.linearRampToValueAtTime(142, t + 0.8);
    o.frequency.linearRampToValueAtTime(96, t + 1.6);
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 520;
    f.Q.value = 9;
    const g = ctx.createGain();
    envelope(g, t, 0.06, 0.25, 0.8, 0.6);
    o.connect(f).connect(g);
    route(e, g, 0.4);
    o.start(t);
    o.stop(t + 1.8);
  },
  /** sino distante */
  bell(e) {
    const { ctx } = e;
    const t = ctx.currentTime + 0.02;
    [196, 392.7, 523.25, 784].forEach((fr, k) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = fr;
      const g = ctx.createGain();
      envelope(g, t, 0.06 / (1 + k * 0.7), 0.01, 0.02, 4.2 - k * 0.6);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1500;
      o.connect(lp).connect(g);
      route(e, g, 0.85);
      o.start(t);
      o.stop(t + 4.6);
    });
  },
};

const POOL = Object.keys(EFFECTS);

function scheduleEvents(e: Engine, first = false) {
  if (e.eventTimer) clearTimeout(e.eventTimer);
  e.eventTimer = setTimeout(
    () => {
      if (eng !== e || e.ctx.state !== "running") return;
      let name = POOL[Math.floor(Math.random() * POOL.length)];
      if (name === e.lastEvent) name = POOL[(POOL.indexOf(name) + 1) % POOL.length];
      e.lastEvent = name;
      e.lastFx = performance.now();
      EFFECTS[name](e);
      scheduleEvents(e);
    },
    first ? rand(5000, 9000) : rand(16000, 36000),
  );
}

/** Pausa os eventos e suspende o contexto com a aba oculta; ao voltar, retoma só se o navegador deixar. */
async function onVisibility() {
  const e = eng;
  if (!e) return;
  if (document.hidden) {
    if (e.eventTimer) clearTimeout(e.eventTimer);
    e.eventTimer = null;
    if (e.ctx.state === "running") await e.ctx.suspend().catch(() => {});
    return;
  }
  if (snap.status !== "on") return;
  try {
    await e.ctx.resume();
  } catch {
    /* o navegador recusou: tratado abaixo */
  }
  if (eng !== e) return;
  if (e.ctx.state === "running") scheduleEvents(e);
  else emit({ status: "blocked" });
}

function release(e: Engine) {
  if (e.eventTimer) clearTimeout(e.eventTimer);
  e.eventTimer = null;
  document.removeEventListener("visibilitychange", onVisibility);
  const { ctx, master } = e;
  try {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02);
  } catch {
    /* contexto já fechado */
  }
  setTimeout(() => {
    e.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* já parado */
      }
      s.disconnect();
    });
    e.sources.length = 0;
    void ctx.close().catch(() => {});
  }, 60);
}

/**
 * Liga o som. Tem de ser chamado DENTRO do clique (o AudioContext nasce na pilha do gesto). Devolve
 * true só se o contexto estiver de fato rodando.
 */
export function startHalloweenAudio(): Promise<boolean> {
  ensureLoaded();
  if (typeof window === "undefined") return Promise.resolve(false);
  if (eng && snap.status === "on" && eng.ctx.state === "running") return Promise.resolve(true);
  if (starting) return starting;

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    emit({ status: "blocked" });
    return Promise.resolve(false);
  }
  emit({ status: "starting" });

  starting = (async () => {
    // reaproveita o contexto existente (aba oculta, bloqueio anterior); senão cria um — síncrono ao gesto
    let e = eng;
    if (!e) {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = snap.volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 6;
      comp.attack.value = 0.005;
      comp.release.value = 0.25;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      master.connect(comp).connect(analyser).connect(ctx.destination);
      const fx = ctx.createGain();
      fx.connect(master);
      const rev = ctx.createGain();
      const conv = ctx.createConvolver();
      conv.buffer = reverbImpulse(ctx);
      rev.connect(conv).connect(fx);
      const bed = ctx.createGain();
      bed.connect(master);
      e = { ctx, master, fx, rev, noise: noiseLoop(ctx), analyser, sources: [], eventTimer: null, lastEvent: "", lastFx: 0, lastChime: 0 };
      buildAmbient(e, bed);
      eng = e;
      document.addEventListener("visibilitychange", onVisibility);
    }
    try {
      await e.ctx.resume();
    } catch {
      /* cai no teste de estado */
    }
    if (eng !== e) return false; // desativado enquanto ligava
    if (e.ctx.state !== "running") {
      emit({ status: "blocked" });
      return false;
    }
    emit({ status: "on", resume: true });
    writeSaved({ on: true, volume: snap.volume });
    scheduleEvents(e, true);
    return true;
  })().finally(() => {
    starting = null;
  });
  return starting;
}

/** Desliga: silencia ambiente e efeitos já, cancela os timers e fecha o contexto. */
export function stopHalloweenAudio(opts: { remember?: boolean } = {}) {
  const e = eng;
  eng = null;
  if (e) release(e);
  ensureLoaded();
  if (snap.status !== "off") emit({ status: "off", ...(opts.remember === false ? {} : { resume: false }) });
  if (opts.remember !== false) writeSaved({ on: false, volume: snap.volume });
}

/** Sai de cena (desmontagem, fim do evento): para tudo sem apagar a preferência do visitante. */
export function disposeHalloweenAudio() {
  stopHalloweenAudio({ remember: false });
}

export function setHalloweenVolume(v: number) {
  ensureLoaded();
  const vol = Math.min(1, Math.max(0, v));
  if (eng) {
    const { ctx, master } = eng;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(vol, ctx.currentTime, 0.03);
  }
  emit({ volume: vol });
  writeSaved({ on: snap.status === "on" || snap.resume, volume: vol });
}

/** Som curto da abóbora (hover/foco com intenção): no máximo um a cada 900 ms e nunca em cima de um evento. */
export function playPumpkinSound() {
  const e = eng;
  if (!e || snap.status !== "on" || e.ctx.state !== "running") return;
  const now = performance.now();
  if (now - e.lastChime < 900 || now - e.lastFx < 350) return;
  e.lastChime = now;
  const { ctx } = e;
  const t = ctx.currentTime + 0.01;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(640, t);
  o.frequency.exponentialRampToValueAtTime(410, t + 0.12);
  const g = ctx.createGain();
  envelope(g, t, 0.16, 0.006, 0.01, 0.16);
  o.connect(g);
  route(e, g, 0.2);
  o.start(t);
  o.stop(t + 0.22);
  // um estalo curto de brasa
  const s = ctx.createBufferSource();
  s.buffer = e.noise;
  s.playbackRate.value = 2;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1900;
  f.Q.value = 2;
  const ng = ctx.createGain();
  envelope(ng, t, 0.05, 0.004, 0.005, 0.04);
  s.connect(f).connect(ng);
  route(e, ng, 0);
  s.start(t, rand(0, 6));
  s.stop(t + 0.07);
}

function subscribe(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
function getSnapshot() {
  ensureLoaded();
  return snap;
}

export function useHalloweenAudio(): AudioSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAP);
}

// Inspeção para os testes de navegador (nível do sinal real na saída, estado do contexto). Só fora de produção.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __hwAudio?: unknown }).__hwAudio = {
    snapshot: () => snap,
    ctxState: () => eng?.ctx.state ?? null,
    contextCount: () => (eng ? 1 : 0),
    activeSources: () => eng?.sources.length ?? 0,
    rms: () => {
      if (!eng) return 0;
      const a = eng.analyser;
      const buf = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      return Math.sqrt(sum / buf.length);
    },
    effect: (name: string) => eng && EFFECTS[name]?.(eng),
    effects: () => POOL,
  };
}
