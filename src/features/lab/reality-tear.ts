import type { Experiment } from "./types";

/**
 * REALITY TEAR — a interface é uma superfície; o cursor a rasga.
 *
 * Duas camadas: embaixo, a "realidade de baixo" (tinta, código, sinal) em
 * DOM; em cima, um canvas 2D que PINTA a superfície de papel (grid + régua
 * + palavras). Arrastar apaga o canvas com `destination-out` em pinceladas
 * irregulares — o rasgo é real, não uma máscara pré-fabricada. Uma borda
 * de fibra é desenhada em volta do buraco para o papel parecer papel.
 *
 * Custo: um canvas 2D, sem rAF contínuo — só desenha no movimento do
 * ponteiro (e uma vez no mount). Toque funciona igual (Pointer Events).
 */
export const mount: Experiment = (host, opts) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.className = "absolute inset-0 h-full w-full cursor-crosshair touch-none";
  host.appendChild(canvas);

  const s = opts!.strings;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // ctx.font não resolve custom properties: pega as famílias já computadas.
  const cs = getComputedStyle(document.documentElement);
  const DISPLAY = cs.getPropertyValue("--font-display").trim() ? `${cs.getPropertyValue("--font-display").trim()}, system-ui, sans-serif` : "system-ui, sans-serif";
  const MONO = cs.getPropertyValue("--font-mono").trim() ? `${cs.getPropertyValue("--font-mono").trim()}, ui-monospace, monospace` : "ui-monospace, monospace";
  let w = 0;
  let h = 0;
  const holes: { x: number; y: number; r: number }[] = [];

  const paintSurface = () => {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // papel
    ctx.fillStyle = "#F2F0EA";
    ctx.fillRect(0, 0, w, h);
    // grid 12
    ctx.strokeStyle = "#DAD8D1";
    ctx.lineWidth = 1;
    const m = 24;
    const gut = 16;
    const colW = (w - m * 2 - gut * 11) / 12;
    for (let i = 0; i <= 12; i++) {
      const x = Math.round(m + i * (colW + gut)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // régua + rótulos
    ctx.strokeStyle = "#111111";
    ctx.beginPath();
    ctx.moveTo(m, 40.5);
    ctx.lineTo(w - m, 40.5);
    ctx.stroke();
    ctx.fillStyle = "#111111";
    ctx.font = `600 12px ${MONO}`;
    ctx.fillText(s.surfaceLabel, m, 32);
    ctx.textAlign = "right";
    ctx.fillText("REALITY TEAR", w - m, 32); // nome do experimento (nome próprio)
    ctx.textAlign = "left";
    const big = Math.min(w * 0.16, 150);
    ctx.font = `900 ${big}px ${DISPLAY}`;
    ctx.fillText(s.surface, m, h * 0.55);
    ctx.font = `900 ${big}px ${DISPLAY}`;
    ctx.fillStyle = "#5F5F5A";
    ctx.fillText(s.tension, m, h * 0.55 + big * 0.95);
    ctx.restore();
  };

  const cutHole = (x: number, y: number, r: number) => {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fibra: um anel escuro logo antes do corte
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(17,17,17,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 12) {
      const rr = r * (1.06 + Math.sin(a * 5 + x * 0.02) * 0.06);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr * 0.9;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    // o corte
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 12) {
      const rr = r * (1 + Math.sin(a * 4 + y * 0.03) * 0.14);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr * 0.9;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const resize = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    paintSurface();
    for (const hole of holes) cutHole(hole.x, hole.y, hole.r);
  };
  resize();

  let last = { x: 0, y: 0, on: false };
  const point = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const tear = (x: number, y: number) => {
    const radius = 34 + Math.random() * 14;
    holes.push({ x, y, r: radius });
    if (holes.length > 400) holes.shift();
    cutHole(x, y, radius);
  };
  const onDown = (e: PointerEvent) => {
    const p = point(e);
    last = { ...p, on: true };
    canvas.setPointerCapture(e.pointerId);
    tear(p.x, p.y);
  };
  const onMove = (e: PointerEvent) => {
    const p = point(e);
    // hover também rasga levemente (desktop); arrastar rasga forte
    if (!last.on) {
      if (e.pointerType === "mouse" && e.buttons === 0) return;
      return;
    }
    const steps = Math.max(1, Math.round(Math.hypot(p.x - last.x, p.y - last.y) / 12));
    for (let i = 1; i <= steps; i++) tear(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
    last = { ...p, on: true };
  };
  const onUp = () => {
    last.on = false;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  opts?.onReady?.();

  return {
    destroy() {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
      canvas.remove();
    },
  };
};
