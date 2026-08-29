/**
 * Qualidade adaptativa — decidida UMA vez por sessão a partir do hardware e
 * das preferências, exposta em `<html data-quality>` (CSS) e via getQuality()
 * (JS). Os níveis são contratos, não sugestões:
 *
 *   high    · escultura completa, refração, partículas, transições completas (DPR ≤ 1.5)
 *   medium  · menos passos de raymarch, sem efeitos de tela inteira (DPR 1–1.25)
 *   low     · sem WebGL contínuo: escultura em SVG, animações DOM curtas (DPR 1)
 *   reduced · prefers-reduced-motion: composições estáticas, crossfades, sem física
 *
 * Nada aqui roda no servidor: a primeira pintura usa o padrão (high) e o
 * script inline do layout ajusta o atributo antes da hidratação.
 */
export type Quality = "high" | "medium" | "low" | "reduced";

export type QualityProfile = {
  tier: Quality;
  /** devicePixelRatio máximo permitido para canvas. */
  dpr: number;
  /** Passos do raymarch da escultura. */
  steps: number;
  /** WebGL deve ser montado? (false → fallback SVG/CSS). */
  webgl: boolean;
  /** Física/partículas permitidas. */
  physics: boolean;
  /** Ponteiro fino (hover real). */
  fine: boolean;
  /** Motivo (debug / relatório). */
  reason: string;
};

const PROFILES: Record<Quality, Omit<QualityProfile, "reason" | "fine">> = {
  high: { tier: "high", dpr: 1.5, steps: 56, webgl: true, physics: true },
  medium: { tier: "medium", dpr: 1.15, steps: 34, webgl: true, physics: true },
  low: { tier: "low", dpr: 1, steps: 0, webgl: false, physics: false },
  reduced: { tier: "reduced", dpr: 1, steps: 0, webgl: false, physics: false },
};

let cached: QualityProfile | null = null;
let probed = false;

/** Script inline (antes da hidratação) — mesma heurística, sem WebGL probe. */
export const QUALITY_SCRIPT =
  "(function(){try{var h=document.documentElement,n=navigator,m=matchMedia;var q='high';" +
  "if(m('(prefers-reduced-motion: reduce)').matches)q='reduced';" +
  "else{var c=n.hardwareConcurrency||4,d=n.deviceMemory||4,s=n.connection&&n.connection.saveData,coarse=m('(pointer: coarse)').matches;" +
  "if(s||c<=2||d<=2)q='low';else if(coarse||c<=4||d<=4||innerWidth<900)q='medium';}" +
  "h.setAttribute('data-quality',q);}catch(e){}})();";

/**
 * Micro-benchmark de GPU: um shader CURTO (compila em milissegundos) com
 * trabalho aritmético real, desenhado num buffer de 128×128 e medido com
 * gl.finish. Numa GPU de verdade fica abaixo de 0,5 ms; num driver por
 * software (headless, VM, aparelho sem aceleração) passa de 10 ms.
 *
 * Isso roda ANTES de o shader pesado da escultura ser sequer importado —
 * é o que impede a compilação do raymarch de travar a thread principal em
 * máquinas sem aceleração (o custo que aparecia como long task de 2,4 s).
 */
const BENCH_FRAG = "precision mediump float;uniform float u;void main(){float s=0.;for(int i=0;i<48;i++){float f=float(i)+u;s+=sin(f*1.7)*cos(f*0.9)+fract(f*13.7);}gl_FragColor=vec4(vec3(fract(s)),1.);}";

function probeWebGL(): { ok: boolean; renderer: string; ms: number } {
  try {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const gl = c.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, renderer: "", ms: 0 };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    let ms = 0;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, BENCH_FRAG));
    gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = gl.getUniformLocation(prog, "u");
      gl.viewport(0, 0, 128, 128);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // aquece (compila o pipeline)
      gl.finish();
      const t0 = performance.now();
      for (let i = 0; i < 3; i++) {
        gl.uniform1f(u, i);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.finish();
      ms = (performance.now() - t0) / 3;
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { ok: true, renderer, ms };
  } catch {
    return { ok: false, renderer: "", ms: 0 };
  }
}

/** Lê (e memoriza) o perfil da sessão. Só no cliente. */
export function getQuality(): QualityProfile {
  if (cached) return cached;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory || 4;
  const saveData = !!nav.connection?.saveData;
  const slowNet = /2g/.test(nav.connection?.effectiveType ?? "");
  const forced = new URLSearchParams(location.search).get("quality");

  let tier: Quality;
  let reason: string;
  if (forced && forced in PROFILES) {
    tier = forced as Quality;
    reason = "forçado por ?quality=";
  } else if (reduce) {
    tier = "reduced";
    reason = "prefers-reduced-motion";
  } else if (saveData || slowNet || cores <= 2 || mem <= 2) {
    tier = "low";
    reason = saveData ? "saveData" : slowNet ? "rede 2g" : `cpu ${cores} / mem ${mem}`;
  } else if (!fine || cores <= 4 || mem <= 4 || window.innerWidth < 900) {
    tier = "medium";
    reason = !fine ? "ponteiro grosso" : `cpu ${cores} / mem ${mem} / ${window.innerWidth}px`;
  } else {
    tier = "high";
    reason = `cpu ${cores} / mem ${mem}`;
  }
  cached = { ...PROFILES[tier], fine, reason };
  document.documentElement.setAttribute("data-quality", tier);
  return cached;
}

/**
 * Teste de GPU — pago SÓ quando a escultura vai montar (primeira interação),
 * nunca no carregamento. Rebaixa o perfil quando não há aceleração real.
 * Devolve o perfil final.
 */
export function probeGpu(): QualityProfile {
  const q = getQuality();
  // ?quality= é palavra final (QA/depuração): nunca rebaixa.
  if (!q.webgl || probed || q.reason.startsWith("forçado")) return cached!;
  probed = true;
  const gl = probeWebGL();
  let tier: Quality | null = null;
  let reason = q.reason;
  if (!gl.ok) {
    tier = "low";
    reason = "sem WebGL";
  } else if (/swiftshader|llvmpipe|software|microsoft basic|virtualbox|mesa offscreen/i.test(gl.renderer)) {
    tier = "low";
    reason = "WebGL por software";
  } else if (gl.ms > 3) {
    tier = "low";
    reason = `gpu lenta (${gl.ms.toFixed(1)}ms no teste)`;
  } else if (gl.ms > 1 && q.tier === "high") {
    tier = "medium";
    reason = `gpu modesta (${gl.ms.toFixed(1)}ms)`;
  }
  if (tier) {
    cached = { ...PROFILES[tier], fine: q.fine, reason };
    document.documentElement.setAttribute("data-quality", tier);
  } else {
    cached = { ...cached!, reason: `${gl.renderer || "gpu"} · ${gl.ms.toFixed(2)}ms` };
  }
  return cached!;
}

/** Só para testes: força um perfil. */
export function overrideQuality(tier: Quality) {
  cached = { ...PROFILES[tier], fine: true, reason: "override" };
  document.documentElement.setAttribute("data-quality", tier);
}
