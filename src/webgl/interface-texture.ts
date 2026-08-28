/**
 * A "interface" que a escultura refrata: um canvas 2D em coordenadas de
 * tela com a estrutura real da página — colunas do grid, régua, código do
 * hero e a headline nos mesmos retângulos do DOM. É o que o vidro escuro
 * mostra por dentro: a página, dobrada.
 *
 * Redesenhado só em resize / mudança de tema / mudança de headline —
 * nunca por frame.
 */
export type InterfaceTexture = { canvas: HTMLCanvasElement; draw: () => void };

const MAX = 1536;

export function createInterfaceTexture(): InterfaceTexture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true })!;

  const draw = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const k = Math.min(1, MAX / Math.max(vw, vh));
    canvas.width = Math.max(2, Math.round(vw * k));
    canvas.height = Math.max(2, Math.round(vh * k));
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const rgb = (v: string) => `rgb(${cs.getPropertyValue(v).trim() || "17 17 17"})`;
    const paper = rgb("--paper");
    const ink = rgb("--ink");
    const neutral = rgb("--neutral");
    const margin = parseFloat(cs.getPropertyValue("--margin")) || 32;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, vw, vh);
    // grid 12 colunas
    ctx.strokeStyle = neutral;
    ctx.lineWidth = 1;
    const gutter = parseFloat(cs.getPropertyValue("--gutter")) || 16;
    const colW = (vw - margin * 2 - gutter * 11) / 12;
    for (let i = 0; i <= 12; i++) {
      const x = margin + i * (colW + gutter) - (i === 12 ? gutter : 0);
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, vh);
      ctx.stroke();
    }
    // régua do topo
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(margin, 64.5);
    ctx.lineTo(vw - margin, 64.5);
    ctx.stroke();
    // texto real da página: headline + código + rótulos mono, nos retângulos do DOM
    ctx.fillStyle = ink;
    const nodes = document.querySelectorAll<HTMLElement>("[data-line], [data-layer=code] span, [data-stage], [data-ship] li, [data-ship]");
    nodes.forEach((el) => {
      const text = el.textContent?.trim();
      if (!text) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh) return;
      const st = getComputedStyle(el);
      const size = parseFloat(st.fontSize);
      ctx.font = `${st.fontStyle} ${st.fontWeight} ${size}px ${st.fontFamily}`;
      // fontStretch em porcentagem não é aceito pelo Canvas; mapeia para a palavra-chave mais próxima.
      const c = ctx as unknown as Record<string, string>;
      const pct = parseFloat(st.fontStretch);
      if ("fontStretch" in ctx) c.fontStretch = Number.isNaN(pct) ? "normal" : pct >= 150 ? "ultra-expanded" : pct >= 125 ? "extra-expanded" : pct >= 112 ? "expanded" : pct > 100 ? "semi-expanded" : pct === 100 ? "normal" : pct >= 87 ? "semi-condensed" : pct >= 75 ? "condensed" : "extra-condensed";
      if ("letterSpacing" in ctx) c.letterSpacing = st.letterSpacing;
      ctx.textBaseline = "alphabetic";
      const lh = parseFloat(st.lineHeight) || size * 1.1;
      const baseline = r.top + (r.height - lh) / 2 + lh * 0.8;
      ctx.fillText(text, r.left, baseline);
    });
  };
  draw();
  return { canvas, draw };
}
