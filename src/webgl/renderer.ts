/**
 * Renderer WebGL compartilhado — UM canvas, UM contexto, UM loop.
 *
 * Tudo que a MilWeb desenha em GPU (escultura, Event Horizon, ruptura do
 * Break) passa por aqui como programas full-quad. O loop de rAF só existe
 * enquanto alguém pediu frames (`invalidate()` para um frame; `hold()` para
 * animação contínua) e a aba está visível. DPR vem do perfil de qualidade.
 * Perda de contexto é tratada: programas são recompilados no restore.
 */
export type UniformValue = number | [number, number] | [number, number, number] | [number, number, number, number];

export type Program = {
  id: string;
  prog: WebGLProgram;
  locs: Record<string, WebGLUniformLocation | null>;
  frag: string;
};

export type Renderer = ReturnType<typeof createRenderer>;

const VERT = "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}";

export function createRenderer(canvas: HTMLCanvasElement, opts: { dpr: number; alpha?: boolean }) {
  let gl = canvas.getContext("webgl", { antialias: false, alpha: opts.alpha ?? true, premultipliedAlpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }) as WebGLRenderingContext | null;
  if (!gl) return null;

  const programs = new Map<string, Program>();
  const sources = new Map<string, string>();
  const textures = new Map<string, WebGLTexture>();
  let quad: WebGLBuffer | null = null;
  let raf = 0;
  let dirty = true;
  let holds = 0;
  let lost = false;
  let destroyed = false;
  let dpr = opts.dpr;
  let onFrame: ((t: number, dt: number) => void) | null = null;
  let last = 0;
  let frameCount = 0;
  let slowFrames = 0;
  let onSlow: (() => void) | null = null;

  const compile = (type: number, src: string) => {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(s);
      gl!.deleteShader(s);
      throw new Error("shader: " + log);
    }
    return s;
  };

  const build = (id: string, frag: string): Program => {
    const g = gl!;
    const prog = g.createProgram()!;
    const vs = compile(g.VERTEX_SHADER, VERT);
    const fs = compile(g.FRAGMENT_SHADER, frag);
    g.attachShader(prog, vs);
    g.attachShader(prog, fs);
    g.linkProgram(prog);
    g.deleteShader(vs);
    g.deleteShader(fs);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error("link: " + g.getProgramInfoLog(prog));
    const locs: Program["locs"] = {};
    const n = g.getProgramParameter(prog, g.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = g.getActiveUniform(prog, i);
      if (info) locs[info.name.replace(/\[0\]$/, "")] = g.getUniformLocation(prog, info.name);
    }
    const p: Program = { id, prog, locs, frag };
    programs.set(id, p);
    return p;
  };

  const setup = () => {
    const g = gl!;
    quad = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, quad);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    g.disable(g.DEPTH_TEST);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
    for (const [id, frag] of sources) build(id, frag);
  };
  setup();

  const resize = () => {
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
      dirty = true;
    }
  };

  const loop = (t: number) => {
    raf = 0;
    if (destroyed || lost) return;
    if (document.hidden) return; // volta no visibilitychange
    const dt = last ? Math.min((t - last) / 1000, 0.1) : 0.016;
    last = t;
    if (dirty || holds > 0) {
      resize();
      onFrame?.(t / 1000, dt);
      dirty = false;
      // Degradação: frames > 34 ms de forma consistente sinalizam para baixar a qualidade.
      if (dt > 0.034) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      frameCount++;
      if (slowFrames > 40 && onSlow) {
        slowFrames = -1e9;
        onSlow();
      }
    }
    if (holds > 0 || dirty) raf = requestAnimationFrame(loop);
    else last = 0;
  };
  const kick = () => {
    if (!raf && !destroyed && !lost && !document.hidden) raf = requestAnimationFrame(loop);
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else {
      dirty = true;
      kick();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    programs.clear();
    textures.clear();
  };
  const onRestored = () => {
    gl = canvas.getContext("webgl", { antialias: false, alpha: opts.alpha ?? true, premultipliedAlpha: true }) as WebGLRenderingContext | null;
    if (!gl) return;
    lost = false;
    setup();
    dirty = true;
    kick();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const api = {
    get gl() {
      return gl!;
    },
    get lost() {
      return lost;
    },
    get frames() {
      return frameCount;
    },
    addProgram(id: string, frag: string) {
      sources.set(id, frag);
      if (!lost) build(id, frag);
    },
    /** Desenha um quad com o programa e os uniforms dados. */
    draw(id: string, uniforms: Record<string, UniformValue>, texture?: { name: string; tex: WebGLTexture; unit: number }[]) {
      const g = gl!;
      const p = programs.get(id);
      if (!p) return;
      g.useProgram(p.prog);
      g.bindBuffer(g.ARRAY_BUFFER, quad);
      const loc = g.getAttribLocation(p.prog, "p");
      g.enableVertexAttribArray(loc);
      g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      for (const k in uniforms) {
        const l = p.locs[k];
        if (l == null) continue;
        const v = uniforms[k];
        if (typeof v === "number") g.uniform1f(l, v);
        else if (v.length === 2) g.uniform2f(l, v[0], v[1]);
        else if (v.length === 3) g.uniform3f(l, v[0], v[1], v[2]);
        else g.uniform4f(l, v[0], v[1], v[2], v[3]);
      }
      texture?.forEach(({ name, tex, unit }) => {
        g.activeTexture(g.TEXTURE0 + unit);
        g.bindTexture(g.TEXTURE_2D, tex);
        const l = p.locs[name];
        if (l != null) g.uniform1i(l, unit);
      });
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    },
    /** Sobe/atualiza uma textura a partir de um canvas 2D (sem mipmaps: NPOT ok). */
    texture(id: string, source: HTMLCanvasElement | ImageBitmap) {
      const g = gl!;
      let tex = textures.get(id);
      if (!tex) {
        tex = g.createTexture()!;
        textures.set(id, tex);
        g.bindTexture(g.TEXTURE_2D, tex);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      } else g.bindTexture(g.TEXTURE_2D, tex);
      g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, source);
      dirty = true;
      return tex;
    },
    getTexture: (id: string) => textures.get(id) ?? null,
    clear() {
      const g = gl!;
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
    },
    /** Callback de frame (desenha tudo). */
    onFrame(cb: typeof onFrame) {
      onFrame = cb;
    },
    /** Callback quando o frame time degrada de forma consistente. */
    onSlow(cb: () => void) {
      onSlow = cb;
    },
    /** Um frame. */
    invalidate() {
      dirty = true;
      kick();
    },
    /** Frames contínuos enquanto houver holds (>0). Retorna release. */
    hold() {
      holds++;
      kick();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        holds = Math.max(0, holds - 1);
      };
    },
    setDpr(v: number) {
      dpr = v;
      resize();
      dirty = true;
      kick();
    },
    get dpr() {
      return dpr;
    },
    resize,
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      const g = gl;
      if (g && !lost) {
        programs.forEach((p) => g.deleteProgram(p.prog));
        textures.forEach((t) => g.deleteTexture(t));
        if (quad) g.deleteBuffer(quad);
        g.getExtension("WEBGL_lose_context")?.loseContext();
      }
      programs.clear();
      textures.clear();
    },
  };
  return api;
}
