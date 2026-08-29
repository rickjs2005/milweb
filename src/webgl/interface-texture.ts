/**
 * A "interface" que a escultura refrata: um canvas 2D em coordenadas de
 * tela com a estrutura real da página — colunas do grid, régua e as linhas
 * de texto que estão atrás do vidro, nos mesmos retângulos do DOM.
 *
 * Orçamento: este desenho já custou 4 s numa CPU 4× lenta (medir cada nó
 * com getComputedStyle intercalado com getBoundingClientRect = layout
 * thrashing, mais fillText com fonte variável). Agora:
 *   · 1024 px no maior lado (a textura só é vista refratada);
 *   · no máximo 12 nós, LIDOS em bloco (todos os rects, depois todos os
 *     estilos) — nenhuma leitura depois de escrever;
 *   · estilo de fonte resolvido UMA vez por grupo, não por nó;
 *   · o texto vai numa segunda tarefa (`draw` → `drawText`), então nunca
 *     existe uma tarefa longa única.
 * Redesenha só em resize (debounce) e na troca de tema.
 */
export type InterfaceTexture = { canvas: HTMLCanvasElement; draw: () => void; drawText: () => void };

const MAX = 1024;
const MAX_NODES = 12;
const SELECTOR = "[data-line], [data-layer=code] span, [data-stage], [data-ship] li";

export function createInterfaceTexture(): InterfaceTexture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true })!;
  let k = 1;
  let ink = "rgb(17 17 17)";

  const draw = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    k = Math.min(1, MAX / Math.max(vw, vh));
    canvas.width = Math.max(2, Math.round(vw * k));
    canvas.height = Math.max(2, Math.round(vh * k));
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const rgb = (v: string) => `rgb(${cs.getPropertyValue(v).trim() || "17 17 17"})`;
    const paper = rgb("--paper");
    ink = rgb("--ink");
    const neutral = rgb("--neutral");
    const margin = parseFloat(cs.getPropertyValue("--margin")) || 32;
    const gutter = parseFloat(cs.getPropertyValue("--gutter")) || 16;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, vw, vh);
    // grid 12 colunas
    ctx.strokeStyle = neutral;
    ctx.lineWidth = 1;
    const colW = (vw - margin * 2 - gutter * 11) / 12;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const x = Math.round(margin + i * (colW + gutter) - (i === 12 ? gutter : 0)) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, vh);
    }
    ctx.stroke();
    // régua do topo
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(margin, 64.5);
    ctx.lineTo(vw - margin, 64.5);
    ctx.stroke();
  };

  /** Segunda tarefa: o texto que está atrás do vidro. */
  const drawText = () => {
    const vh = window.innerHeight;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).slice(0, MAX_NODES);
    if (!nodes.length) return;
    // 1) LEITURA em bloco — nada de escrever no meio
    const rects = nodes.map((el) => el.getBoundingClientRect());
    const style = getComputedStyle(nodes[0]);
    const family = style.fontFamily;
    // 2) ESCRITA
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = ink;
    ctx.textBaseline = "alphabetic";
    nodes.forEach((el, i) => {
      const r = rects[i];
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh) return;
      const text = el.textContent?.trim();
      if (!text) return;
      // tamanho derivado da caixa (sem consultar o estilo de cada nó)
      const size = Math.max(9, Math.min(r.height * 0.78, 180));
      ctx.font = `900 ${size}px ${family}`;
      ctx.fillText(text, r.left, r.top + r.height * 0.78);
    });
  };

  draw();
  return { canvas, draw, drawText };
}
