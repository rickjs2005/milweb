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
  high: { tier: "high", dpr: 1.5, steps: 72, webgl: true, physics: true },
  medium: { tier: "medium", dpr: 1.25, steps: 44, webgl: true, physics: true },
  low: { tier: "low", dpr: 1, steps: 0, webgl: false, physics: false },
  reduced: { tier: "reduced", dpr: 1, steps: 0, webgl: false, physics: false },
};

let cached: QualityProfile | null = null;

/** Script inline (antes da hidratação) — mesma heurística, sem WebGL probe. */
export const QUALITY_SCRIPT =
  "(function(){try{var h=document.documentElement,n=navigator,m=matchMedia;var q='high';" +
  "if(m('(prefers-reduced-motion: reduce)').matches)q='reduced';" +
  "else{var c=n.hardwareConcurrency||4,d=n.deviceMemory||4,s=n.connection&&n.connection.saveData,coarse=m('(pointer: coarse)').matches;" +
  "if(s||c<=2||d<=2)q='low';else if(coarse||c<=4||d<=4||innerWidth<900)q='medium';}" +
  "h.setAttribute('data-quality',q);}catch(e){}})();";

function probeWebGL(): { ok: boolean; renderer: string } {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, renderer: "" };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { ok: true, renderer };
  } catch {
    return { ok: false, renderer: "" };
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
  } else {
    const gl = probeWebGL();
    if (!gl.ok) {
      tier = "low";
      reason = "sem WebGL";
    } else if (/swiftshader|llvmpipe|software/i.test(gl.renderer)) {
      tier = "low";
      reason = "WebGL por software";
    } else if (!fine || cores <= 4 || mem <= 4 || window.innerWidth < 900) {
      tier = "medium";
      reason = !fine ? "ponteiro grosso" : `cpu ${cores} / mem ${mem} / ${window.innerWidth}px`;
    } else {
      tier = "high";
      reason = gl.renderer || "gpu";
    }
  }
  cached = { ...PROFILES[tier], fine, reason };
  document.documentElement.setAttribute("data-quality", tier);
  return cached;
}

/** Só para testes: força um perfil. */
export function overrideQuality(tier: Quality) {
  cached = { ...PROFILES[tier], fine: true, reason: "override" };
  document.documentElement.setAttribute("data-quality", tier);
}
