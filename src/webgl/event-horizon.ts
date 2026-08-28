/**
 * EVENT HORIZON — shader de buraco negro em WebGL cru (sem three.js).
 * Um quad, um fragment shader: campo de estrelas procedural deformado por
 * lente gravitacional + disco de acreção. Custa um draw call por frame.
 *
 * `mount` devolve controles: start/stop (rAF só quando visível) e
 * setPointer (a massa desloca levemente rumo ao cursor). DPR ≤ 1.5.
 */
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision highp float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform float k;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float stars(vec2 uv){
  vec2 g=floor(uv*90.);vec2 f=fract(uv*90.)-.5;
  float h=hash(g);float s=smoothstep(.06,0.,length(f-(vec2(hash(g+1.7),hash(g+3.1))-.5)*.8))*step(.94,h);
  return s*(0.6+0.4*sin(t*2.+h*40.));
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;
  vec2 c=m*.12;
  vec2 d=uv-c;float dist=length(d);
  float rs=0.13;
  // lente: dobra o espaço ao redor do horizonte
  float bend=rs*rs*1.9/max(dist*dist,1e-4);
  vec2 warped=uv-normalize(d)*bend*.5;
  float bg=stars(warped+vec2(t*.01,0.));
  // disco de acreção (anel fino, quente, girando)
  float ang=atan(d.y,d.x);
  float ring=smoothstep(.02,0.,abs(dist-rs*1.55)-.012)*(.55+.45*sin(ang*3.-t*1.6));
  float glow=exp(-pow((dist-rs*1.5)*9.,2.))*.35;
  float hole=smoothstep(rs,rs*1.02,dist);
  vec3 paper=vec3(.949,.941,.918);
  vec3 signal=vec3(.718,1.,.216);
  vec3 col=paper*bg*.9;
  col+=signal*(ring*k+glow*.6);
  col*=hole;
  gl_FragColor=vec4(col,1.);
}`;

export function mountEventHorizon(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "r");
  const uT = gl.getUniformLocation(prog, "t");
  const uM = gl.getUniformLocation(prog, "m");
  const uK = gl.getUniformLocation(prog, "k");

  let raf = 0;
  let px = 0;
  let py = 0;
  let mx = 0;
  let my = 0;
  let k = 1;
  const t0 = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  const frame = () => {
    resize();
    mx += (px - mx) * 0.06;
    my += (py - my) * 0.06;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.uniform2f(uM, mx, my);
    gl.uniform1f(uK, k);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  };
  return {
    start: () => {
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop: () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    /** -1..1 em cada eixo. */
    setPointer: (x: number, y: number) => {
      px = x;
      py = y;
    },
    setIntensity: (v: number) => {
      k = v;
    },
    destroy: () => {
      if (raf) cancelAnimationFrame(raf);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
