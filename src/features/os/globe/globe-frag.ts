/**
 * O GLOBO DO MILWEB OS — fragment shader (WebGL 1, quad único).
 *
 * Esfera analítica (interseção com o disco), sem malha. Derivado do globo
 * do Hero (webgl/globe-frag.ts), mas sem morph de letra, arcos ou pontos
 * viajantes: aqui a Terra é um corpo de grafite com continentes cheios,
 * relevo sutil nas costas (gradiente da máscara perturbando a normal),
 * luz lateral macia, um brilho acetinado largo e um ponto lima no Brasil.
 *
 * Uniforms:
 *   uRes, uCenter, uRadius  geometria em px de device
 *   uSpin, uTilt            orientação (rad)
 *   uTime                   segundos (pulso do marcador)
 *   uFade                   opacidade global
 *   uLive                   1 = animado (pulso) · 0 = pose estática (imagem)
 *   uTexel                  1 / tamanho da máscara (gradiente do relevo)
 *   uTex                    máscara de terra equirretangular (webgl/earth-mask)
 */
import { OS_GLOBE } from "./globe.config";

const RAD = Math.PI / 180;
const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : n.toFixed(6));
const A = [Math.cos(OS_GLOBE.home.lat * RAD) * Math.cos(OS_GLOBE.home.lon * RAD), Math.sin(OS_GLOBE.home.lat * RAD), Math.cos(OS_GLOBE.home.lat * RAD) * Math.sin(OS_GLOBE.home.lon * RAD)];

export const OS_GLOBE_FRAG = `
precision highp float;
varying vec2 vUv;

uniform vec2  uRes;
uniform vec2  uCenter;
uniform float uRadius;
uniform float uSpin;
uniform float uTilt;
uniform float uTime;
uniform float uFade;
uniform float uLive;
uniform vec2  uTexel;
uniform sampler2D uTex;

#define PI 3.141592653589793

/* view → globo: inclina o eixo e gira */
vec3 rot(vec3 v, float ct, float st, float cs, float ss) {
  vec3 m = vec3(v.x, v.y * ct + v.z * st, -v.y * st + v.z * ct);
  return vec3(m.x * cs - m.z * ss, m.y, m.x * ss + m.z * cs);
}
float land(vec2 uv) { return texture2D(uTex, uv).r; }

void main() {
  vec2 frag = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);
  vec2 d = (frag - uCenter) / uRadius;
  float r2 = dot(d, d);
  // Descarte barato fora da esfera e da sombra de contato.
  if (r2 > 1.19 || uFade <= 0.001) { gl_FragColor = vec4(0.0); return; }

  float r = sqrt(r2);
  float px = 1.0 / uRadius;
  float z = sqrt(max(0.0, 1.0 - min(r2, 1.0)));
  vec3 n = vec3(d.x, -d.y, z);

  float ct = cos(uTilt), st = sin(uTilt), cs = cos(uSpin), ss = sin(uSpin);
  vec3 g = rot(n, ct, st, cs, ss);
  float lat = asin(clamp(g.y, -1.0, 1.0));
  float lon = atan(g.z, g.x);
  vec2 uv = vec2((lon + PI) / (2.0 * PI), (PI * 0.5 - lat) / PI);

  // ---- terra e relevo ------------------------------------------------
  float h0 = land(uv);
  float hx = land(uv + vec2(uTexel.x, 0.0)) - land(uv - vec2(uTexel.x, 0.0));
  float hy = land(uv + vec2(0.0, uTexel.y)) - land(uv - vec2(0.0, uTexel.y));
  float ground = smoothstep(0.38, 0.62, h0);
  // tangentes no espaço do globo (leste / norte); no polo o leste é arbitrário
  vec3 east = vec3(-g.z, 0.0, g.x);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(g, east);
  // a normal se inclina contra o gradiente de altura (uv.y cresce para o sul)
  vec3 gn = normalize(g - 0.55 * (east * hx - north * hy));

  // ---- luz (no espaço do globo, para casar com a normal perturbada) ----
  vec3 L = normalize(vec3(-0.62, 0.50, 0.60));
  vec3 Lg = rot(L, ct, st, cs, ss);
  vec3 Vg = rot(vec3(0.0, 0.0, 1.0), ct, st, cs, ss);
  float diff = max(0.0, dot(gn, Lg));
  float wrap = pow(diff, 0.85);
  vec3 Hg = normalize(Lg + Vg);
  float spec = pow(max(0.0, dot(gn, Hg)), 20.0) * mix(0.11, 0.05, ground);

  vec3 ocean = vec3(0.086, 0.100, 0.116);
  vec3 earth = vec3(0.230, 0.250, 0.242);
  vec3 albedo = mix(ocean, earth, ground);
  vec3 col = albedo * (0.20 + 1.05 * wrap) + spec;

  // ---- limbo: fresnel claro do lado da luz, mais fundo do lado da sombra -
  float fres = pow(1.0 - z, 3.0);
  vec2 dir = r > 1e-3 ? d / r : vec2(0.0);
  float side = clamp(dot(dir, normalize(vec2(L.x, -L.y))) * 0.5 + 0.5, 0.0, 1.0);
  col += fres * mix(vec3(0.01), vec3(0.20, 0.22, 0.21), side);
  col *= 1.0 - fres * 0.30 * (1.0 - side);

  // ---- graticule: régua muito discreta, só onde há luz -----------------
  float step15 = PI / 12.0;
  float w = 1.3 * px;
  float dLat = abs(fract(lat / step15 + 0.5) - 0.5) * step15;
  float dLon = abs(fract(lon / step15 + 0.5) - 0.5) * step15 * max(cos(lat), 0.08);
  float mesh = max(smoothstep(w, 0.0, dLat), smoothstep(w, 0.0, dLon));
  float eq = smoothstep(w * 1.5, 0.0, abs(lat));
  col += (mesh * 0.028 + eq * 0.028) * (0.35 + 0.65 * wrap) * z;

  // ---- marcador: a origem (Brasil), ponto lima com anel fino e um pulso lento
  vec3 A = vec3(${f(A[0])}, ${f(A[1])}, ${f(A[2])});
  float ang = acos(clamp(dot(g, A), -1.0, 1.0));
  float core = smoothstep(0.019, 0.011, ang);
  float ring = smoothstep(1.3 * px, 0.0, abs(ang - 0.042));
  float ph = fract(uTime / 3.8);
  float pulse = smoothstep(1.6 * px, 0.0, abs(ang - (0.05 + ph * 0.10))) * (1.0 - ph) * (1.0 - ph) * 0.5 * uLive;
  float mk = max(core, max(ring * 0.7, pulse)) * smoothstep(0.0, 0.22, z);
  col = mix(col, vec3(0.718, 1.0, 0.216), mk);

  // ---- cobertura ------------------------------------------------------
  float body = smoothstep(px, -px, r - 1.0);
  // sombra de contato: halo escuro curto fora da esfera, sem brilho
  float halo = (1.0 - smoothstep(1.0, 1.09, r)) * step(1.0, r) * 0.38;
  col = mix(vec3(0.0), col, body);
  float a = max(body, halo) * uFade;
  if (a <= 0.002) { gl_FragColor = vec4(0.0); return; }
  gl_FragColor = vec4(col * a, a);
}
`;
