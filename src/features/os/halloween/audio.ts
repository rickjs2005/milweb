"use client";

import { useSyncExternalStore } from "react";
import { mulberry32 } from "./art/trees";

/**
 * Som da casa assombrada — terror atmosférico com construção de tensão, não um tom constante.
 *
 * TRILHA (laço de 90 s, `scheduleLoop`): um dark ambient que evolui — respira entre a calma e o clímax e
 * tem um buraco de silêncio perto dos 61–67 s, onde só um rangido sobrevive.
 *   · drone grave com harmônicos em 110–230 Hz (soa em caixa de celular; não depende de subgrave);
 *   · um cluster de cordas dissonantes (A3, Bb3, Eb4, E4) com crescendos de arco, vibrato e deriva de afinação;
 *   · vento REAL em duas vozes (gravação CC0 em laço sem emenda) + rumor sintetizado;
 *   · eventos esparsos, também REAIS: rangidos de madeira e metal, um uivo de lobo distante, trovão grave e
 *     batimento cardíaco na subida da tensão; pancadas de madeira sintetizadas.
 * Não há risada de bruxa, sussurro nem coro: nada disso foi gravado/licenciado, então não é anunciado.
 *
 * REAÇÕES (`react*`): fantasma que se afasta (textura espectral curta), aranha/teia (estalo seco e fio
 * tenso), castelo (rangido + asas + acorde dissonante + batimentos, com a trilha cedendo), abóbora
 * (pulso curto e orgânico). Posição estéreo coerente com a origem visual; limite de vozes e recargas;
 * ducking leve da trilha durante os efeitos principais.
 *
 * REGRAS: silencioso por padrão; o AudioContext só nasce DENTRO do clique no botão; os arquivos só são
 * baixados depois disso; "ligado" só vale com o contexto rodando; instância única; aba oculta suspende;
 * desligar/sair fecha tudo; volume inicial 12 % com compressor de segurança (sem picos nem estalos).
 * Fontes e licenças dos arquivos: docs/halloween-credits.md.
 */
export type AudioStatus = "off" | "starting" | "on" | "blocked";
export type AudioSnapshot = { status: AudioStatus; volume: number; /** havia som ligado na última visita (só uma dica: nada toca sem gesto) */ resume: boolean };

const KEY = "milweb-halloween:audio";
export const DEFAULT_VOLUME = 0.12;
const LOOP = 90;
const BASE = "/halloween/audio/";
const FILES = { wind: "wind-loop", wolfA: "wolf-a", wolfB: "wolf-b", creakDoor: "creak-door", creakCasket: "creak-casket", creakMetalA: "creak-metal-a", creakMetalB: "creak-metal-b", creakChair: "creak-chair", heart: "heartbeat", thunder: "thunder" } as const;
type SampleKey = keyof typeof FILES;
type Samples = Partial<Record<SampleKey, AudioBuffer>>;

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
    /* armazenamento indisponível: a preferência só vale nesta sessão */
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
 * Utilidades de síntese
 * ---------------------------------------------------------------------------------------------- */
type Ctx = BaseAudioContext;
type Graph = {
  ctx: Ctx;
  master: GainNode;
  duck: GainNode;
  sfx: GainNode;
  /** barramento das REAÇÕES (fantasma, aranha, castelo, abóbora): mais forte que os eventos da trilha e nunca duckado */
  react: GainNode;
  rev: GainNode;
  noise: AudioBuffer;
  white: AudioBuffer;
  samples: Samples;
  sources: AudioScheduledSourceNode[];
  bed: Bed;
  /** reações em andamento (instante de fim, em ms): no máximo 3 ao mesmo tempo */
  act: number[];
  analyser: AnalyserNode | null;
  lastHover: number;
  lastFx: number;
};
type Bed = { music: GainNode; strings: GainNode; noteGains: GainNode[]; noteOscs: OscillatorNode[]; det: number[]; drone: GainNode; droneLp: BiquadFilterNode; wind: GainNode; sampleWind: GainNode | null };

const rnd = (r: () => number, a: number, b: number) => a + r() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function noiseLoop(ctx: Ctx, seconds = 8, fade = 0.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const n = Math.floor(seconds * rate);
  const x = Math.floor(fade * rate);
  const raw = new Float32Array(n + x);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  const r = mulberry32(12345);
  for (let i = 0; i < raw.length; i++) {
    const w = r() * 2 - 1;
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

/** Ruído branco com amplitude cheia (2 s): matéria-prima dos efeitos (a trilha usa o rosa, bem mais fraco). */
function whiteBurst(ctx: Ctx): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
  const d = buf.getChannelData(0);
  const r = mulberry32(99);
  for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * 0.9;
  return buf;
}

/** Reverberação de câmara escura: 3,4 s, pré-atraso curto e cauda que escurece com o tempo. */
function reverbImpulse(ctx: Ctx, seconds = 3.4): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const pre = Math.floor(ctx.sampleRate * 0.02);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const r = mulberry32(777);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let y = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / (len - pre);
      const a = 0.9 - 0.82 * t; // filtro de um polo: a cauda perde os agudos
      y += a * ((r() * 2 - 1) * Math.pow(1 - t, 2.5) - y);
      d[i] = y;
    }
  }
  return buf;
}

function env(g: GainNode, t: number, peak: number, attack: number, hold: number, release: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.setValueAtTime(Math.max(0.0002, peak), t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
}

/** Entrega um nó à saída: pan estéreo, envio de reverb e orçamento de vozes (nunca mais de 7 ao mesmo tempo). */
function out(g: Graph, node: AudioNode, o: { pan?: number; send?: number; to?: AudioNode; endsAt?: number } = {}) {
  const ctx = g.ctx;
  let tail: AudioNode = node;
  if (o.pan !== undefined && o.pan !== 0) {
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(o.pan, -0.9, 0.9);
    tail.connect(p);
    tail = p;
  }
  tail.connect(o.to ?? g.sfx);
  if (o.send) {
    const s = ctx.createGain();
    s.gain.value = o.send;
    tail.connect(s).connect(g.rev);
  }
}

/** Abaixa a trilha por um instante (os efeitos principais respiram por cima dela). */
function duckMusic(g: Graph, t: number, depth: number, hold: number, release: number) {
  const p = g.duck.gain;
  p.cancelScheduledValues(t);
  p.setValueAtTime(p.value, t);
  p.setTargetAtTime(depth, t, 0.08);
  p.setTargetAtTime(1, t + hold, release / 3);
}

function sample(g: Graph, key: SampleKey, t: number, o: { gain: number; react?: boolean; pan?: number; send?: number; rate?: number; lp?: number; hp?: number; offset?: number; dur?: number; loop?: boolean; fade?: number }) {
  const buf = g.samples[key];
  if (!buf) return null;
  const ctx = g.ctx;
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.playbackRate.value = o.rate ?? 1;
  s.loop = !!o.loop;
  let tail: AudioNode = s;
  if (o.lp) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lp;
    tail.connect(f);
    tail = f;
  }
  if (o.hp) {
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = o.hp;
    tail.connect(f);
    tail = f;
  }
  const gn = ctx.createGain();
  const len = o.dur ?? Math.max(0.1, (buf.duration - (o.offset ?? 0)) / (o.rate ?? 1));
  const fade = Math.min(o.fade ?? 0.15, len / 3);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.linearRampToValueAtTime(o.gain, t + fade);
  gn.gain.setValueAtTime(o.gain, t + Math.max(fade, len - fade));
  gn.gain.linearRampToValueAtTime(0.0001, t + len);
  tail.connect(gn);
  out(g, gn, { pan: o.pan, send: o.send, to: o.react ? g.react : undefined });
  s.start(t, o.offset ?? 0);
  s.stop(t + len + 0.05);
  return s;
}

/* ---------------------------------------------------------------------------------------------- *
 * Grafo e trilha
 * ---------------------------------------------------------------------------------------------- */
function lfo(ctx: Ctx, sources: AudioScheduledSourceNode[], freq: number, depth: number, target: AudioParam) {
  const o = ctx.createOscillator();
  o.frequency.value = freq;
  const gn = ctx.createGain();
  gn.gain.value = depth;
  o.connect(gn).connect(target);
  o.start();
  sources.push(o);
}

const STRING_NOTES = [220.0, 233.08, 311.13, 329.63, 110.0]; // A3, Bb3, Eb4, E4 (cluster) + A2

function buildGraph(ctx: Ctx, volume: number, withAnalyser: boolean): Graph {
  // O compressor vem ANTES do volume mestre: ele age sobre o nível interno da mixagem (os picos dos efeitos
  // seguem destacados mesmo com o volume em 12 %). Depois do volume, um limitador suave (tanh) garante que
  // nada passe de ~0,67 (-3,5 dBFS) em qualquer posição do controle: sem clipping, sem estalos.
  const master = ctx.createGain();
  master.gain.value = volume;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -7;
  comp.knee.value = 12;
  comp.ratio.value = 5;
  comp.attack.value = 0.004;
  comp.release.value = 0.22;
  const soft = ctx.createWaveShaper();
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) curve[i] = 0.88 * Math.tanh((i / (curve.length - 1)) * 2 - 1);
  soft.curve = curve;
  comp.connect(master);
  master.connect(soft);
  let analyser: AnalyserNode | null = null;
  if (withAnalyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    soft.connect(analyser).connect(ctx.destination);
  } else soft.connect(ctx.destination);

  const mix = ctx.createGain();
  mix.connect(comp);
  const duck = ctx.createGain();
  duck.connect(mix);
  const sfx = ctx.createGain();
  sfx.connect(mix);
  const react = ctx.createGain();
  react.gain.value = 2.4;
  react.connect(mix);
  const rev = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.buffer = reverbImpulse(ctx);
  rev.connect(conv).connect(mix);

  const sources: AudioScheduledSourceNode[] = [];
  const music = ctx.createGain(); // buraco de silêncio da trilha
  music.connect(duck);
  const sendMusic = ctx.createGain();
  sendMusic.gain.value = 0.35;
  music.connect(sendMusic).connect(rev);

  // drone grave + corpo médio (110–230 Hz carrega em caixa de celular)
  const droneLp = ctx.createBiquadFilter();
  droneLp.type = "lowpass";
  droneLp.frequency.value = 380;
  droneLp.Q.value = 0.8;
  const drone = ctx.createGain();
  drone.gain.value = 0.0001;
  droneLp.connect(drone).connect(music);
  for (const [f, type, det, lv] of [[55, "sawtooth", 0, 0.08], [58.27, "sawtooth", 5, 0.07], [82.41, "sawtooth", -4, 0.2], [87.31, "sawtooth", 6, 0.18], [110, "triangle", -4, 0.5], [116.54, "triangle", 6, 0.44], [164.8, "sawtooth", 3, 0.34], [174.6, "sawtooth", -5, 0.3], [220, "triangle", 4, 0.24], [233.08, "triangle", -3, 0.2]] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = det;
    const l = ctx.createGain();
    l.gain.value = lv;
    o.connect(l).connect(droneLp);
    o.start();
    sources.push(o);
  }
  lfo(ctx, sources, 0.11, 0.06, drone.gain);

  // cluster de cordas dissonantes com vibrato de arco
  const strings = ctx.createGain();
  strings.gain.value = 0.0001;
  const slp = ctx.createBiquadFilter();
  slp.type = "lowpass";
  slp.frequency.value = 1500;
  slp.Q.value = 0.5;
  strings.connect(slp).connect(music);
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.3;
  const vibG = ctx.createGain();
  vibG.gain.value = 7;
  vib.connect(vibG);
  vib.start();
  sources.push(vib);
  const noteGains: GainNode[] = [];
  const noteOscs: OscillatorNode[] = [];
  for (const f of STRING_NOTES) {
    const gn = ctx.createGain();
    gn.gain.value = 0.0001;
    for (const det of [-9, 8]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = det;
      vibG.connect(o.detune);
      o.connect(gn);
      o.start();
      sources.push(o);
      noteOscs.push(o);
    }
    gn.connect(strings);
    noteGains.push(gn);
  }

  // vento: rumor sintetizado (sempre) — o vento gravado entra quando os arquivos chegam
  const noise = noiseLoop(ctx);
  const wind = ctx.createGain();
  wind.gain.value = 0.0001;
  wind.connect(music);
  for (const [rate, type, f, q, lv] of [[0.6, "lowpass", 180, 0.7, 0.32], [1.3, "bandpass", 1250, 4, 0.07]] as const) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    s.playbackRate.value = rate;
    const fl = ctx.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = q;
    const lg = ctx.createGain();
    lg.gain.value = lv;
    s.connect(fl).connect(lg).connect(wind);
    s.start(0, (rate * 3.3) % 7);
    sources.push(s);
    if (type === "bandpass") lfo(ctx, sources, 0.11, 420, fl.frequency);
  }

  return { ctx, master, duck, sfx, react, rev, noise, white: whiteBurst(ctx), samples: {}, sources, bed: { music, strings, noteGains, noteOscs, det: noteOscs.map((o) => o.detune.value), drone, droneLp, wind, sampleWind: null }, act: [], analyser, lastHover: 0, lastFx: 0 };
}

/** O vento gravado (CC0), em laço sem emenda e em duas vozes, entra por cima do rumor sintetizado. */
function attachWind(g: Graph, t: number) {
  const buf = g.samples.wind;
  if (!buf || g.bed.sampleWind) return;
  const ctx = g.ctx;
  const bus = ctx.createGain();
  bus.gain.value = 0.0001;
  bus.connect(g.bed.music);
  g.bed.sampleWind = bus;
  for (const [rate, pan, f, type, lv, offs] of [[1, -0.45, 520, "bandpass", 1.0, 0], [0.88, 0.5, 900, "lowpass", 0.7, 11]] as const) {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.playbackRate.value = rate;
    const fl = ctx.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = type === "bandpass" ? 0.6 : 0.7;
    const lg = ctx.createGain();
    lg.gain.value = lv;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    s.connect(fl).connect(lg).connect(p).connect(bus);
    s.start(t, offs);
    g.sources.push(s);
  }
}

/** Densidade da trilha ao longo do laço: calma → tensão → clímax → silêncio → calma (começa e termina em 0,22). */
const DENS: [number, number][] = [[0, 0.22], [12, 0.3], [28, 0.55], [44, 0.82], [56, 0.95], [60, 1], [70, 0.45], [82, 0.28], [90, 0.22]];
const densAt = (t: number) => {
  for (let i = 1; i < DENS.length; i++) if (t <= DENS[i][0]) return DENS[i - 1][1] + ((t - DENS[i - 1][0]) / (DENS[i][0] - DENS[i - 1][0])) * (DENS[i][1] - DENS[i - 1][1]);
  return DENS[0][1];
};
function ramp(p: AudioParam, t0: number, pts: [number, number][]) {
  p.cancelScheduledValues(t0);
  p.setValueAtTime(Math.max(0.0001, pts[0][1]), t0 + pts[0][0]);
  for (let i = 1; i < pts.length; i++) p.linearRampToValueAtTime(Math.max(0.0001, pts[i][1]), t0 + pts[i][0]);
}

/** Agenda um laço inteiro (90 s) a partir de `t0`: automação da trilha e eventos pontuais. Só o que cai depois de `from`. */
function scheduleLoop(g: Graph, t0: number, r: () => number, from = 0, samplesOnly = false) {
  const b = g.bed;
  const sampleAt = (key: SampleKey, rel: number, o: Parameters<typeof sample>[3]) => {
    if (t0 + rel > from) sample(g, key, t0 + rel, o);
  };
  if (!samplesOnly) {
    const pts = (f: (d: number) => number): [number, number][] => Array.from({ length: 19 }, (_, i) => [i * 5, f(densAt(i * 5))]);
    ramp(b.strings.gain, t0, pts((d) => 0.05 + 1.6 * Math.pow(d, 2)));
    ramp(b.drone.gain, t0, pts((d) => 0.06 + 0.24 * d * d));
    ramp(b.droneLp.frequency, t0, pts((d) => 260 + 520 * d));
    ramp(b.wind.gain, t0, pts((d) => 0.1 + 0.5 * d));
    if (b.sampleWind) ramp(b.sampleWind.gain, t0, pts((d) => 0.08 + 0.75 * d));
    // o buraco de silêncio da trilha: cai perto dos 61 s e volta devagar (um rangido sobrevive nele)
    ramp(b.music.gain, t0, [[0, 1], [23.5, 1], [24.6, 0.18], [27, 0.18], [28.6, 1], [29.5, 1], [31, 0.5], [32.5, 1], [60.6, 1], [61.4, 0.06], [66.4, 0.06], [69, 1], [85, 1], [86.2, 0.22], [88, 0.22], [90, 1]]);
    // crescendos de arco: cada nota tem 1–2 enxurradas por laço, em faixas diferentes
    b.noteGains.forEach((gn, i) => {
      const slots = [4 + i * 3, 34 + i * 2, 64 + i * 3];
      gn.gain.cancelScheduledValues(t0);
      gn.gain.setValueAtTime(0.0001, t0);
      for (const s of slots) {
        if (r() < 0.55) continue;
        const a = rnd(r, 3.5, 6),
          rel = rnd(r, 5, 8),
          peak = rnd(r, 0.55, 1) * (i === 4 ? 0.7 : 1) * 0.75;
        gn.gain.setValueAtTime(0.0001, t0 + s);
        gn.gain.linearRampToValueAtTime(peak, t0 + s + a);
        gn.gain.linearRampToValueAtTime(0.0001, t0 + s + a + rel);
      }
    });
    // deriva de afinação (microtons): a dissonância nunca assenta
    b.noteOscs.forEach((o, i) => {
      o.detune.cancelScheduledValues(t0);
      o.detune.setValueAtTime(b.det[i], t0); // continua de onde o laço anterior parou: sem degrau de afinação
      let last = b.det[i];
      for (let s = 15; s <= LOOP; s += 15) o.detune.linearRampToValueAtTime((last = rnd(r, -26, 26)), t0 + s);
      b.det[i] = last;
    });
    // pancadas de madeira (síntese): a casa se acomodando
    for (let k = 0; k < 5; k++) {
      const rel = rnd(r, 6, 86);
      if (rel > 60.5 && rel < 69) continue;
      const when = t0 + rel;
      if (when <= from) continue;
      const pan = rnd(r, -0.7, 0.7);
      const f = rnd(r, 70, 130);
      const o = g.ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f * 1.6, when);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, when + 0.3);
      const gn = g.ctx.createGain();
      env(gn, when, 0.6, 0.004, 0.02, 0.32);
      const ns = g.ctx.createBufferSource();
      ns.buffer = g.white;
      const nf = g.ctx.createBiquadFilter();
      nf.type = "lowpass";
      nf.frequency.value = 700;
      const ng = g.ctx.createGain();
      env(ng, when, 0.4, 0.002, 0.005, 0.09);
      o.connect(gn);
      ns.connect(nf).connect(ng);
      out(g, gn, { pan, send: 0.45 });
      out(g, ng, { pan, send: 0.3 });
      o.start(when);
      o.stop(when + 0.5);
      ns.start(when, rnd(r, 0, 6));
      ns.stop(when + 0.15);
    }
  }
  // eventos gravados — só quando os arquivos já chegaram
  const creaks: SampleKey[] = ["creakDoor", "creakCasket", "creakMetalA", "creakMetalB", "creakChair"];
  [11, 25, 47, 63, 80].forEach((rel, i) => {
    const key = i === 3 ? "creakDoor" : creaks[Math.floor(r() * creaks.length)];
    sampleAt(key, rel + rnd(r, -2, 2), { gain: i === 3 ? 0.95 : rnd(r, 0.5, 0.75), pan: rnd(r, -0.75, 0.75), send: i === 3 ? 0.7 : 0.4, rate: rnd(r, 0.86, 1.04), lp: 3800 });
  });
  const wolf: SampleKey = r() < 0.5 ? "wolfA" : "wolfB";
  sampleAt(wolf, 38 + rnd(r, 0, 6), { gain: 0.75, pan: r() < 0.5 ? -0.6 : 0.6, send: 0.7, rate: 0.93, lp: 1700, hp: 120, fade: 2 });
  if (r() < 0.6) {
    sampleAt("thunder", 55 + rnd(r, 0, 3), { gain: 0.7, pan: rnd(r, -0.3, 0.3), send: 0.5, rate: 0.82, lp: 2400, hp: 40, fade: 0.4 });
    if (t0 + 55 > from) duckMusic(g, t0 + 55, 0.5, 2.4, 3.2);
  }
  // batimento na subida da tensão (devagar, abafado)
  const hb = g.samples.heart;
  if (hb && t0 + 52 > from) {
    sample(g, "heart", t0 + 52, { gain: 0.55, rate: 0.56, lp: 260, dur: 10, fade: 3.5, send: 0.2, loop: true });
  }
  // sino distante e asas de morcego (síntese)
  if (t0 + 20 > from) {
    for (const [fr, k] of [[196, 0], [392.7, 1], [523.25, 2]] as const) {
      const o = g.ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = fr;
      const gn = g.ctx.createGain();
      env(gn, t0 + 20, 0.075 / (1 + k * 0.8), 0.01, 0.02, 4.4 - k * 0.8);
      const lp = g.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      o.connect(lp).connect(gn);
      out(g, gn, { pan: 0.5, send: 0.9 });
      o.start(t0 + 20);
      o.stop(t0 + 25);
    }
  }
  if (t0 + 73 > from) wings(g, t0 + 73, -0.8, 0.8, 0.1);
}

/** Asas de morcego: rajadas curtas de ruído agudo cruzando o estéreo. */
function wings(g: Graph, t: number, panFrom: number, panTo: number, level: number, react = false) {
  const n = 10;
  for (let i = 0; i < n; i++) {
    const when = t + i * 0.085 + (i % 3) * 0.015;
    const s = g.ctx.createBufferSource();
    s.buffer = g.white;
    s.playbackRate.value = 1;
    const f = g.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2600 + (i % 4) * 330;
    f.Q.value = 3;
    const gn = g.ctx.createGain();
    env(gn, when, level, 0.012, 0.01, 0.05);
    s.connect(f).connect(gn);
    out(g, gn, { pan: panFrom + ((panTo - panFrom) * i) / (n - 1), send: 0.22, to: react ? g.react : undefined });
    s.start(when, (i * 0.37) % 6);
    s.stop(when + 0.12);
  }
}

const outR = (g: Graph, node: AudioNode, o: { pan?: number; send?: number } = {}) => out(g, node, { ...o, to: g.react });

/* ---------------------------------------------------------------------------------------------- *
 * Reações (cada uma recebe o grafo e o instante, então também rendem offline)
 * ---------------------------------------------------------------------------------------------- */
function fxGhost(g: Graph, t: number, pan: number) {
  duckMusic(g, t, 0.4, 0.7, 1.2);
  const ctx = g.ctx;
  // textura espectral: ruído que varre de agudo a grave, com tremolo; mais um tom que cai
  const s = ctx.createBufferSource();
  s.buffer = g.white;
  s.playbackRate.value = 1;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 5;
  bp.frequency.setValueAtTime(1500, t);
  bp.frequency.exponentialRampToValueAtTime(360, t + 0.9);
  const gn = ctx.createGain();
  env(gn, t, 0.9, 0.08, 0.15, 0.7);
  const trem = ctx.createOscillator();
  trem.frequency.value = 13;
  const tg = ctx.createGain();
  tg.gain.value = 0.07;
  trem.connect(tg).connect(gn.gain);
  s.connect(bp).connect(gn);
  outR(g, gn, { pan, send: 0.7 });
  s.start(t, 1.3);
  s.stop(t + 1.1);
  trem.start(t);
  trem.stop(t + 1.1);
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(690, t);
  o.frequency.exponentialRampToValueAtTime(310, t + 0.6);
  const og = ctx.createGain();
  env(og, t, 0.3, 0.06, 0.1, 0.5);
  o.connect(og);
  outR(g, og, { pan, send: 0.8 });
  o.start(t);
  o.stop(t + 0.8);
}

function fxSpider(g: Graph, t: number, pan: number) {
  const ctx = g.ctx;
  // estalo seco do fio
  const s = ctx.createBufferSource();
  s.buffer = g.white;
  s.playbackRate.value = 1;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3800;
  const gn = ctx.createGain();
  env(gn, t, 0.6, 0.002, 0.004, 0.03);
  s.connect(hp).connect(gn);
  outR(g, gn, { pan, send: 0.1 });
  s.start(t, 0.5);
  s.stop(t + 0.08);
  // tensão do fio: tom fino com pequena oscilação
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(1100, t + 0.02);
  o.frequency.linearRampToValueAtTime(1186, t + 0.35);
  const vib = ctx.createOscillator();
  vib.frequency.value = 22;
  const vg = ctx.createGain();
  vg.gain.value = 9;
  vib.connect(vg).connect(o.frequency);
  const og = ctx.createGain();
  env(og, t + 0.02, 0.3, 0.01, 0.05, 0.4);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;
  o.connect(lp).connect(og);
  outR(g, og, { pan, send: 0.25 });
  o.start(t + 0.02);
  vib.start(t + 0.02);
  o.stop(t + 0.55);
  vib.stop(t + 0.55);
  // um tique de madeira logo depois
  const k = ctx.createOscillator();
  k.type = "sine";
  k.frequency.setValueAtTime(320, t + 0.14);
  k.frequency.exponentialRampToValueAtTime(190, t + 0.2);
  const kg = ctx.createGain();
  env(kg, t + 0.14, 0.5, 0.002, 0.01, 0.07);
  k.connect(kg);
  outR(g, kg, { pan, send: 0.2 });
  k.start(t + 0.14);
  k.stop(t + 0.3);
}

function fxCastle(g: Graph, t: number, pan: number) {
  duckMusic(g, t, 0.16, 4.2, 2.6);
  // rangido real, na hora da primeira janela
  sample(g, "creakDoor", t, { react: true, gain: 1.9, pan, send: 0.6, rate: 0.9, lp: 3800 });
  if (!g.samples.creakDoor) {
    const o = g.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(88, t);
    o.frequency.linearRampToValueAtTime(142, t + 0.8);
    o.frequency.linearRampToValueAtTime(96, t + 1.6);
    const f = g.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 520;
    f.Q.value = 9;
    const gn = g.ctx.createGain();
    env(gn, t, 0.07, 0.25, 0.8, 0.6);
    o.connect(f).connect(gn);
    outR(g, gn, { pan, send: 0.5 });
    o.start(t);
    o.stop(t + 1.8);
  }
  // batimentos (dois golpes surdos)
  sample(g, "heart", t + 0.1, { react: true, gain: 1.5, pan: 0, send: 0.15, rate: 0.7, lp: 280, offset: 1, dur: 2.2, fade: 0.1 });
  // acorde dissonante que sobe devagar (segunda menor) logo antes dos morcegos
  for (const fr of [466.16, 493.88]) {
    const o = g.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = fr;
    const lp = g.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    const gn = g.ctx.createGain();
    env(gn, t + 0.9, 0.3, 1.3, 0.4, 2.2);
    o.connect(lp).connect(gn);
    outR(g, gn, { pan, send: 0.75 });
    o.start(t + 0.9);
    o.stop(t + 4.8);
  }
  // asas saindo da torre: do lado do castelo para fora
  wings(g, t + 1.35, clamp(pan, -0.8, 0.8), clamp(pan + (pan > 0 ? -1.1 : 1.1), -0.9, 0.9), 0.3, true);
}

function fxPumpkin(g: Graph, t: number, pan: number, click: boolean) {
  const ctx = g.ctx;
  const f0 = click ? 247 : 196;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * 1.5, t + 0.12);
  const gn = ctx.createGain();
  env(gn, t, click ? 0.8 : 0.6, 0.008, 0.02, click ? 0.26 : 0.18);
  o.connect(gn);
  outR(g, gn, { pan, send: 0.28 });
  o.start(t);
  o.stop(t + 0.5);
  // sopro cintilante (parcial alta que sobe) e um respiro de ruído
  const sh = ctx.createOscillator();
  sh.type = "sine";
  sh.frequency.setValueAtTime(1320, t + 0.03);
  sh.frequency.exponentialRampToValueAtTime(1980, t + 0.2);
  const sg = ctx.createGain();
  env(sg, t + 0.03, 0.18, 0.01, 0.02, 0.2);
  sh.connect(sg);
  outR(g, sg, { pan, send: 0.5 });
  sh.start(t + 0.03);
  sh.stop(t + 0.4);
  const s = ctx.createBufferSource();
  s.buffer = g.white;
  s.playbackRate.value = 1;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1300;
  bp.Q.value = 1.5;
  const ng = ctx.createGain();
  env(ng, t, 0.35, 0.01, 0.02, 0.1);
  s.connect(bp).connect(ng);
  outR(g, ng, { pan, send: 0.1 });
  s.start(t, 2);
  s.stop(t + 0.2);
}

/* ---------------------------------------------------------------------------------------------- *
 * Motor ao vivo
 * ---------------------------------------------------------------------------------------------- */
type Engine = { ctx: AudioContext; g: Graph; timer: ReturnType<typeof setInterval>; nextLoop: number; rand: () => number };
let eng: Engine | null = null;
let starting: Promise<boolean> | null = null;
let sampleCache: Promise<Samples> | null = null;

async function loadSamples(ctx: Ctx): Promise<Samples> {
  if (!sampleCache) {
    sampleCache = Promise.all(
      (Object.keys(FILES) as SampleKey[]).map(async (k) => {
        try {
          const res = await fetch(`${BASE}${FILES[k]}.mp3`);
          if (!res.ok) return [k, undefined] as const;
          return [k, await ctx.decodeAudioData(await res.arrayBuffer())] as const;
        } catch {
          return [k, undefined] as const;
        }
      }),
    ).then((pairs) => Object.fromEntries(pairs.filter(([, v]) => v)) as Samples);
  }
  return sampleCache;
}

function tick() {
  const e = eng;
  if (!e || e.ctx.state !== "running") return;
  if (e.nextLoop - e.ctx.currentTime < 20) {
    scheduleLoop(e.g, e.nextLoop, e.rand);
    e.nextLoop += LOOP;
  }
}

async function onVisibility() {
  const e = eng;
  if (!e) return;
  if (document.hidden) {
    if (e.ctx.state === "running") await e.ctx.suspend().catch(() => {});
    return;
  }
  if (snap.status !== "on") return;
  try {
    await e.ctx.resume();
  } catch {
    /* recusado: tratado abaixo */
  }
  if (eng !== e) return;
  if (e.ctx.state !== "running") emit({ status: "blocked" });
}

function release(e: Engine) {
  clearInterval(e.timer);
  document.removeEventListener("visibilitychange", onVisibility);
  const { ctx, g } = e;
  try {
    g.master.gain.cancelScheduledValues(ctx.currentTime);
    g.master.gain.setValueAtTime(g.master.gain.value, ctx.currentTime);
    g.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02);
  } catch {
    /* contexto já fechado */
  }
  setTimeout(() => {
    g.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* já parado */
      }
      s.disconnect();
    });
    g.sources.length = 0;
    void ctx.close().catch(() => {});
  }, 60);
}

/** Liga o som. Tem de ser chamado DENTRO do clique. Devolve true só se o contexto estiver rodando. */
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
    let e = eng;
    if (!e) {
      const ctx = new Ctor(); // síncrono ao gesto
      const g = buildGraph(ctx, snap.volume, true);
      const rand = mulberry32((Date.now() & 0xffff) + 1);
      e = { ctx, g, timer: setInterval(tick, 2000), nextLoop: 0, rand };
      eng = e;
      document.addEventListener("visibilitychange", onVisibility);
    }
    try {
      await e.ctx.resume();
    } catch {
      /* cai no teste de estado */
    }
    if (eng !== e) return false;
    if (e.ctx.state !== "running") {
      emit({ status: "blocked" });
      return false;
    }
    emit({ status: "on", resume: true });
    writeSaved({ on: true, volume: snap.volume });
    if (!e.nextLoop) {
      const t0 = e.ctx.currentTime + 0.15;
      scheduleLoop(e.g, t0, e.rand);
      e.nextLoop = t0 + LOOP;
      // os arquivos só são baixados agora, depois da ativação; os eventos gravados entram assim que chegam
      void loadSamples(e.ctx).then((s) => {
        if (eng !== e) return;
        e.g.samples = s;
        const now = e.ctx.currentTime;
        attachWind(e.g, now);
        const startOfLoop = e.nextLoop - LOOP;
        scheduleLoop(e.g, startOfLoop, mulberry32(4242), now + 0.1, true);
        if (e.g.bed.sampleWind) ramp(e.g.bed.sampleWind.gain, startOfLoop, Array.from({ length: 19 }, (_, i) => [i * 5, 0.08 + 0.75 * densAt(i * 5)] as [number, number]));
      });
    }
    return true;
  })().finally(() => {
    starting = null;
  });
  return starting;
}

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
  const vol = clamp(v, 0, 1);
  if (eng) {
    const { ctx, g } = eng;
    g.master.gain.cancelScheduledValues(ctx.currentTime);
    g.master.gain.setTargetAtTime(vol, ctx.currentTime, 0.03);
  }
  emit({ volume: vol });
  writeSaved({ on: snap.status === "on" || snap.resume, volume: vol });
}

/** As reações só tocam com o som ligado, com recarga própria e com orçamento de vozes. */
function live(fx: (g: Graph, t: number) => void, seconds: number, minGap = 0, key: "lastHover" | "lastFx" = "lastFx") {
  const e = eng;
  if (!e || snap.status !== "on" || e.ctx.state !== "running") return;
  const g = e.g;
  const now = performance.now();
  g.act = g.act.filter((end) => end > now);
  if (now - g[key] < minGap || g.act.length >= 3) return; // recarga própria e no máximo 3 reações ao mesmo tempo
  g[key] = now;
  g.act.push(now + seconds * 1000);
  fx(g, e.ctx.currentTime + 0.02);
}
export function reactGhost(pan: number) {
  live((g, t) => fxGhost(g, t, pan), 1.4, 1500);
}
export function reactSpider(pan: number) {
  live((g, t) => fxSpider(g, t, pan), 0.8, 1500);
}
export function reactCastle(pan: number) {
  live((g, t) => fxCastle(g, t, pan), 5.5, 6000);
}
/** Abóbora: hover/foco com intenção (no máximo um a cada 700 ms) ou clique de ativação. */
export function reactPumpkin(pan: number, kind: "hover" | "click" = "hover") {
  live((g, t) => fxPumpkin(g, t, pan, kind === "click"), 0.5, kind === "hover" ? 700 : 0, "lastHover");
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

/* ---------------------------------------------------------------------------------------------- *
 * Renderização offline (só desenvolvimento): a MESMA trilha e as MESMAS reações, para medir e ouvir
 * ---------------------------------------------------------------------------------------------- */
async function renderOffline(seconds: number, cues: { t: number; name: "ghost" | "spider" | "castle" | "hover" | "click"; pan?: number }[] = [], volume = DEFAULT_VOLUME, seed = 7, sr = 44100) {
  const ctx = new OfflineAudioContext(2, Math.floor(seconds * sr), sr);
  const g = buildGraph(ctx, volume, false);
  g.samples = await loadSamples(ctx);
  attachWind(g, 0);
  const r = mulberry32(seed);
  for (let t0 = 0; t0 < seconds; t0 += LOOP) scheduleLoop(g, t0, r);
  for (const c of cues) {
    const pan = c.pan ?? 0;
    if (c.name === "ghost") fxGhost(g, c.t, pan);
    else if (c.name === "spider") fxSpider(g, c.t, pan);
    else if (c.name === "castle") fxCastle(g, c.t, pan);
    else fxPumpkin(g, c.t, pan, c.name === "click");
  }
  const buf = await ctx.startRendering();
  return { sampleRate: buf.sampleRate, left: buf.getChannelData(0), right: buf.getChannelData(1) };
}

// Inspeção para os testes de navegador (nível do sinal real na saída, estado do contexto, render offline). Só fora de produção.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __hwAudio?: unknown }).__hwAudio = {
    snapshot: () => snap,
    ctxState: () => eng?.ctx.state ?? null,
    contextCount: () => (eng ? 1 : 0),
    activeSources: () => eng?.g.sources.length ?? 0,
    voices: () => eng?.g.act.filter((end) => end > performance.now()).length ?? 0,
    rms: () => {
      const a = eng?.g.analyser;
      if (!a) return 0;
      const buf = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      return Math.sqrt(sum / buf.length);
    },
    render: renderOffline,
    react: { ghost: reactGhost, spider: reactSpider, castle: reactCastle, pumpkin: reactPumpkin },
  };
}
