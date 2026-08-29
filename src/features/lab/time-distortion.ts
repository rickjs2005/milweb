import type { Experiment } from "./types";

/**
 * TIME DISTORTION — a mesma composição em cinco faixas, cada uma vivendo
 * numa velocidade de tempo diferente (−0,6× a 3,2×). O cursor na
 * horizontal dobra o eixo: à esquerda o tempo desacelera até quase parar,
 * à direita dispara. Cada faixa mostra o próprio relógio, um contador e
 * uma barra — números reais do mesmo relógio, tempos diferentes.
 *
 * Um único rAF escreve tudo; sem leitura de layout no loop (as posições
 * são porcentagens). Pausa fora da viewport e com a aba oculta.
 */
const SPEEDS = [-0.6, 0.25, 1, 1.9, 3.2];

export const mount: Experiment = (host, opts) => {
  const stage = document.createElement("div");
  stage.className = "absolute inset-0 flex flex-col justify-center gap-3 overflow-hidden px-4 md:gap-5 md:px-8";
  host.appendChild(stage);

  const rows = SPEEDS.map((speed, i) => {
    const row = document.createElement("div");
    row.className = "grid grid-cols-[3.5rem_1fr_5rem] items-center gap-3 border-t border-paper/15 py-2 md:grid-cols-[5rem_1fr_7rem] md:gap-5 md:py-3";
    const label = document.createElement("span");
    label.className = "t-mono text-paper/50";
    label.textContent = `${speed.toFixed(2)}×`;
    const track = document.createElement("div");
    track.className = "relative h-6 overflow-hidden md:h-8";
    const bar = document.createElement("span");
    bar.className = "absolute inset-y-0 left-0 bg-signal/25";
    bar.style.width = "2px";
    const word = document.createElement("span");
    word.className = "t-display absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-paper will-change-transform";
    word.style.fontSize = "clamp(0.9rem, 2vw, 1.6rem)";
    word.style.fontWeight = "900";
    word.textContent = opts!.strings.timeWords[i];
    const clock = document.createElement("span");
    clock.className = "t-mono tnum text-right text-paper/80";
    track.append(bar, word);
    row.append(label, track, clock);
    stage.appendChild(row);
    return { speed, bar, word, clock, t: 0 };
  });

  let raf = 0;
  let last = 0;
  let running = false;
  let bend = 1;

  const frame = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    for (const r of rows) {
      r.t += dt * r.speed * bend;
      const p = ((r.t * 0.25) % 1 + 1) % 1;
      r.bar.style.width = `${(p * 100).toFixed(2)}%`;
      r.word.style.transform = `translate(${(p * 88).toFixed(2)}%, -50%)`;
      const secs = Math.abs(r.t);
      r.clock.textContent = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(Math.floor(secs % 60)).padStart(2, "0")}.${String(Math.floor((secs % 1) * 100)).padStart(2, "0")}`;
    }
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (running || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    // 0 (esquerda, tempo quase parado) → 2.2 (direita, tempo disparado)
    bend = 0.08 + ((e.clientX - r.left) / r.width) * 2.1;
  };
  const onLeave = () => {
    bend = 1;
  };
  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerleave", onLeave);
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.1 });
  io.observe(host);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVis);
  start();
  opts?.onReady?.();

  return {
    destroy() {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      stage.remove();
    },
  };
};
