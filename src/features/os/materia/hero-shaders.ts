/**
 * Shaders da cena da home: a figura de mercúrio que segura uma dobra da própria tela.
 *
 *   STUDIO_LIB   o que o metal reflete (a figura e a aba da dobra usam o mesmo estúdio)
 *   FOLD_LIB     a geometria da dobra, em unidades a partir da ponta (q = (px − ponta) / k, y para cima)
 *   FOLD_SCENE   a página, as rugas da pressão dos dedos, a abertura (capa do projeto e a faixa de luz),
 *                a aba de metal polido com o reflexo invertido do lema e a sombra da mão — entra no
 *                shader do ambiente (shaders.ts › BACKDROP_FRAG)
 *   FIGURE_*     a malha contínua (rosto, braço, mão): cromo, luz da fenda por baixo, a faixa que percorre
 *                o braço quando a conversa abre, e a dissolução nas bordas de ruptura
 */
export const STUDIO_LIB = /* glsl */ `
vec3 studio(vec3 r, float light) {
  float az = atan(r.x, r.z);
  float el = r.y;
  float sky = clamp(0.5 + 0.5 * el, 0.0, 1.0);
  float base = mix(0.018, 0.05, light) + mix(0.12, 0.2, light) * sky * sky;
  // faixa larga de luz, por cima e à frente: testa, nariz, maçã do rosto, nós dos dedos
  float top = smoothstep(0.24, 0.5, el) * smoothstep(0.98, 0.76, el) * smoothstep(2.3, 1.3, abs(az + 0.7));
  // caixa de luz frontal, larga e suave: dá corpo ao que olha para a câmera (maçã do rosto, dorso da mão, antebraço)
  float front = exp(-pow((az - 0.3) / 0.8, 2.0) - pow((el - 0.02) / 0.5, 2.0));
  // parede de luz à esquerda (o rebate da página): tira o perfil da sombra
  float wall = exp(-pow((az + 1.85) / 0.62, 2.0)) * smoothstep(-0.8, -0.15, el) * smoothstep(0.8, 0.25, el);
  // reflexo comprido e vertical (os membros) e o recorte por trás, que solta a silhueta do fundo escuro
  float strip = exp(-pow((az - 0.82) / 0.11, 2.0)) * smoothstep(1.0, 0.5, abs(el));
  float kick = exp(-pow((az + 2.25) / 0.3, 2.0)) * smoothstep(0.95, 0.35, abs(el + 0.05));
  float page = clamp(-r.z - 0.2, 0.0, 1.0);
  float v = base + top * mix(0.8, 0.64, light) + front * mix(0.2, 0.34, light) + wall * mix(0.3, 0.5, light) + strip * mix(1.3, 0.8, light) + kick * mix(0.95, 0.0, light) + page * mix(0.03, 0.14, light);
  return vec3(v) * vec3(0.97, 1.0, 1.05);
}
`;

export const FOLD_LIB = /* glsl */ `
uniform vec2 uGrab;   // quanto a ponta saiu do repouso (unidades)
uniform float uOpen;  // 0 = a tela assentada … 1 = a dobra aberta
uniform vec2 uFloorPx; // telefone: a cena se apaga antes da grade de apps (px do buffer: onde some, onde já está inteira)
float aboveFloor(float y) { return smoothstep(uFloorPx.x, uFloorPx.y, y); }
// borda da página (à esquerda da abertura), borda livre da aba (à direita) e o vinco onde a aba volta à página
float foldL(float d) { return -uOpen * 0.22 * pow(d, 0.62) * (1.0 + 0.3 * d); }
float foldR(float d) { return uOpen * (0.82 * d + 0.4 * d * d); }
float foldRi(float x) { float o = max(uOpen, 1e-3); return (-0.82 + sqrt(0.6724 + 1.6 * max(x, 0.0) / o)) / 0.8; }
float foldU(float x) { return -uOpen * (0.03 * x + 0.1 * x * x); }
// quanto um ponto da tela acompanha a ponta
float foldW(vec2 q) { return exp(-dot(q, q) / 0.9); }
`;

/** Entra em BACKDROP_FRAG, depois de `hash`/`noise` e de STUDIO_LIB + FOLD_LIB. */
export const FOLD_SCENE = /* glsl */ `
uniform vec2 uTip;       // a ponta da dobra em repouso (px do buffer, y de baixo)
uniform float uFoldK;    // px do buffer por unidade
uniform float uHero;     // presença da cena (0 na conversa)
uniform float uHover;    // o visitante está com a ponta: a capa aparece inteira
uniform vec2 uWave;      // onda ao soltar: (segundos desde que soltou, força)
uniform float uReveal;   // a abertura cresce até coincidir com a janela do case
uniform vec4 uWin;       // essa janela (px do buffer: x0, y0, x1, y1)
uniform sampler2D uCover, uWord, uShadow;
uniform float uCoverK, uCoverAr, uWordK, uShadowK;

float shadowAt(vec2 px, vec2 off, float blur) {
  vec2 c = (px + off) / uRes;
  vec2 b = vec2(blur) / uRes;
  float s = texture2D(uShadow, c).r * 0.2;
  s += (texture2D(uShadow, c + b * vec2(1.0, 0.25)).r + texture2D(uShadow, c + b * vec2(-0.85, 0.55)).r + texture2D(uShadow, c + b * vec2(0.3, -1.0)).r + texture2D(uShadow, c + b * vec2(-0.45, -0.8)).r) * 0.13;
  s += (texture2D(uShadow, c + b * vec2(2.0, -0.9)).r + texture2D(uShadow, c + b * vec2(-1.9, -0.4)).r + texture2D(uShadow, c + b * vec2(0.5, 2.0)).r + texture2D(uShadow, c + b * vec2(-1.0, -2.0)).r) * 0.07;
  return s * uShadowK;
}

vec3 foldScene(vec2 px, vec3 col, vec3 base, vec3 deep, vec3 accent, float light) {
  vec2 q = (px - uTip) / uFoldK;
  vec2 q0 = q - uGrab * foldW(q - uGrab * foldW(q));
  float aa = 1.4 / uFoldK;
  float d = max(-q0.y, 0.0);
  float xl = foldL(d);
  float xr = foldR(d);
  float r = length(q0);
  float ang = atan(q0.y, q0.x);

  // ── a página: a pressão dos dedos amassa a superfície em volta da ponta
  vec3 page = col;
  if (r < 1.7) {
    float press = exp(-r / 0.3) * uOpen;
    // pregas: vales estreitos entre cristas largas, de tamanhos diferentes
    float w1 = sin(ang * 5.0 + 0.7), w2 = sin(ang * 9.0 + 2.1), w3 = sin(ang * 17.0 - 0.6);
    float wr = (w1 * abs(w1)) * 0.5 + (w2 * abs(w2)) * 0.32 + w3 * 0.18;
    float crease = wr * press * smoothstep(0.006, 0.08, r);
    // a folha sobe até a ponta: um lado pega a luz, o outro fica na sombra
    float tent = exp(-r / 0.5) * uOpen * dot(normalize(q0 + 1e-4), vec2(-0.55, 0.83));
    // no claro a ruga é o vale escuro (o branco não tem para onde subir); no escuro, é a crista que pega a luz
    float fold1 = mix(1.3 * crease, (crease > 0.0 ? 0.04 : 0.36) * crease, light);
    page = col * (1.0 + fold1 + mix(0.3, 0.06, light) * tent) - mix(0.0, 0.04, light) * press;
    page += mix(vec3(0.04), vec3(0.0), light) * press;
    // no escuro a página é grafite: uma poça de luz atrás da mão, para a sombra dela ter onde cair
    vec2 pool = q - vec2(0.35, 0.12);
    page += (1.0 - light) * vec3(0.085, 0.088, 0.1) * exp(-dot(pool, pool) / 1.1) * uOpen;
    // a sombra da mão, projetada no plano de trás
    float sh = shadowAt(px, vec2(0.16, 0.07) * uFoldK, 0.07 * uFoldK);
    page = mix(page, mix(deep * 0.3, vec3(0.2, 0.25, 0.36), light), sh * mix(0.8, 0.5, light) * uHero);
  }
  // sombra de contato ao longo da borda da abertura (a folha tem espessura)
  float lipL = exp(-max(xl - q0.x, 0.0) / 0.035) * step(q0.y, 0.0) * smoothstep(0.0, 0.08, d);
  page *= 1.0 - mix(0.3, 0.1, light) * lipL * uOpen;
  // e o fio da folha pega a luz que vem de dentro
  float rimL = exp(-pow((xl - q0.x) / 0.007, 2.0)) * step(q0.y, 0.0) * smoothstep(0.0, 0.06, d) * uOpen;
  page += mix(accent * 1.3 + vec3(0.2), vec3(0.04), light) * rimL;
  // no escuro a fenda acende a página em volta: é o carmesim que desenha a abertura sobre o grafite
  page += (1.0 - light) * accent * 0.2 * exp(-max(xl - q0.x, 0.0) / 0.1) * step(q0.y, 0.0) * smoothstep(0.0, 0.08, d) * uOpen;

  // ── a fita: o arco da nuca desce por trás do ombro e vira a aba levantada
  vec2 rc = q - vec2(1.6, 0.26);
  float rr = length(rc);
  float ra = atan(rc.y, rc.x);
  float rw = 0.034 + 0.03 * smoothstep(1.3, -1.2, ra);
  float rs = (rr - 0.66) / rw;
  float ribbon = abs(rr - 0.66) > 0.08 ? 0.0 : smoothstep(1.0 + aa / rw, 1.0 - aa / rw, abs(rs)) * smoothstep(1.5, 1.15, ra) * smoothstep(-1.75, -1.3, ra) * uOpen;
  if (ribbon > 0.001) {
    vec3 rn = normalize(vec3(normalize(rc) * rs * 0.85, sqrt(max(1.0 - 0.7 * rs * rs, 0.05))));
    vec3 rcol = pow(clamp(studio(reflect(vec3(0.0, 0.0, -1.0), rn), light), 0.0, 1.0), vec3(0.4545));
    page = mix(page, rcol, ribbon);
  }

  // ── a aba: o avesso da página é metal polido, encurvado
  float yu = foldU(max(q0.x, 0.0));
  float dr = foldRi(q0.x);
  float v = clamp((yu - q0.y) / max(yu + dr, 1e-3), 0.0, 1.0);
  float sdF = max(max(q0.y - yu, xr - q0.x), -q0.x);
  float inF = smoothstep(aa, -aa, sdF) * (1.0 - uReveal);
  vec3 outc = page;
  if (inF > 0.001) {
    float u = length(q0);
    // a onda que percorre o metal quando a ponta é solta
    float wave = uWave.y * sin(u * 16.0 - uWave.x * 22.0) * exp(-uWave.x * 2.4) * smoothstep(0.0, 0.25, u);
    float phi = mix(-1.05, 0.95, pow(v, 0.85)) + 0.16 * sin(u * 2.4 + 0.6) + wave * 0.9 + uGrab.x * 0.5;
    vec2 across = normalize(vec2(-0.5, -1.0));
    vec3 n = normalize(vec3(across * sin(phi) + vec2(0.3, -0.1) * (0.4 - u * 0.12), cos(phi)));
    vec3 rf = reflect(vec3(0.0, 0.0, -1.0), n);
    vec3 metal = studio(rf, light);
    metal *= mix(1.05, 1.2, light);
    // os reflexos compridos que correm pela aba: uma faixa clara e outra escura
    float lane = v - 0.05 * sin(u * 2.6 + 0.4);
    metal += mix(0.32, 0.5, light) * exp(-pow((lane - 0.4) / 0.13, 2.0));
    metal *= 1.0 - mix(0.3, 0.34, light) * exp(-pow((lane - 0.7) / 0.07, 2.0));
    metal = pow(clamp(metal, 0.0, 1.0), vec3(0.4545));
    metal = mix(metal, vec3(0.9, 0.925, 0.96), light * 0.2);
    // o reflexo invertido do lema: desliza com o ângulo da folha
    vec2 wc = (q0 - vec2(1.06, -0.6) - uGrab * vec2(-0.55, 0.35) - vec2(wave * 0.05, 0.0));
    float ca = cos(3.42), sa = sin(3.42);
    wc = vec2(ca * wc.x - sa * wc.y, sa * wc.x + ca * wc.y);
    wc.y *= 1.0 + 0.5 * (v - 0.5);
    wc.x += 0.22 * wc.y * wc.y;
    vec2 wuv = wc / vec2(1.0, 0.25) + 0.5;
    if (uWordK > 0.0 && wuv.x > 0.0 && wuv.x < 1.0 && wuv.y > 0.0 && wuv.y < 1.0) {
      vec2 wb = vec2(0.006, 0.02);
      vec4 w = (texture2D(uWord, wuv) * 2.0 + texture2D(uWord, wuv + wb) + texture2D(uWord, wuv - wb) + texture2D(uWord, wuv + wb * vec2(1.0, -1.0)) + texture2D(uWord, wuv - wb * vec2(1.0, -1.0))) / 6.0;
      float soft = smoothstep(0.05, 0.3, v) * smoothstep(1.0, 0.8, v);
      metal = mix(metal, mix(vec3(0.93, 0.95, 0.98), vec3(0.07, 0.08, 0.11), light), w.r * 0.56 * soft * uWordK);
      metal = mix(metal, accent, w.b * 0.75 * soft * uWordK);
    }
    // sob o braço a aba escurece; na borda livre ela pega a luz que vem de dentro
    metal *= mix(0.42, 1.0, smoothstep(0.0, 0.3, v));
    if (r < 1.3) metal *= 1.0 - 0.5 * shadowAt(px, vec2(0.05, 0.08) * uFoldK, 0.05 * uFoldK) * uHero;
    float edge = exp(-(1.0 - v) / 0.035);
    metal += (accent * 0.9 + vec3(0.25)) * edge * mix(0.55, 0.45, light);
    outc = mix(outc, metal, inF);
  }

  // ── a abertura: a profundidade escura, a capa de um projeto de verdade e a faixa de luz
  float sdO = max(max(xl - q0.x, q0.x - xr), q0.y);
  if (uReveal > 0.0) {
    vec2 wc2 = 0.5 * (uWin.xy + uWin.zw);
    vec2 wd = abs(px - wc2) - 0.5 * (uWin.zw - uWin.xy);
    float sdW = (length(max(wd, 0.0)) + min(max(wd.x, wd.y), 0.0)) / uFoldK;
    sdO = mix(sdO, sdW, uReveal);
  }
  float inO = smoothstep(aa, -aa, sdO);
  if (inO > 0.001) {
    float depth = clamp(-sdO, 0.0, 1.0);
    vec3 cav = mix(vec3(0.012, 0.014, 0.022), deep * 0.2, 0.3);
    // a capa fica no fundo: não acompanha a ponta (paralaxe)
    vec2 cs = vec2(2.3, 2.3 / max(uCoverAr, 0.1));
    vec2 cuv = (q - vec2(0.28, -0.62) + uGrab * 0.12) / cs + 0.5;
    if (uReveal > 0.0) cuv = mix(cuv, (px - uWin.xy) / (uWin.zw - uWin.xy), uReveal);
    float inC = step(0.0, cuv.x) * step(cuv.x, 1.0) * step(0.0, cuv.y) * step(cuv.y, 1.0);
    // na home, só a parte de cima da capa (a primeira dobra do site), que some na profundidade antes de acabar
    vec2 suv = vec2(cuv.x, 1.0 - (1.0 - cuv.y) * mix(0.8, 1.0, uReveal));
    vec3 cover = texture2D(uCover, clamp(suv, 0.0, 1.0)).rgb;
    float seen = uCoverK * inC * mix(mix(mix(0.76, 0.55, light), mix(0.92, 0.78, light), uHover) * smoothstep(0.0, 0.3, cuv.y), 1.0, uReveal);
    cav = mix(cav, cover, seen);
    // a folha faz sombra para dentro: perto das bordas a cavidade é quase preta
    float shade = smoothstep(0.0, mix(0.34, 0.2, uHover), depth);
    cav *= mix(mix(mix(0.22, 0.12, light), 1.0, shade), 1.0, uReveal);
    // a faixa de luz: nasce sob os dedos e atravessa a abertura
    float bs = q0.y + 0.13 + 0.16 * q0.x;
    float reach = smoothstep(0.0, 0.1, depth) * (1.0 - uReveal);
    float core = exp(-pow(bs / 0.012, 2.0)) * reach;
    float glow = exp(-pow(bs / 0.11, 2.0)) * reach;
    cav += accent * (core * mix(2.2, 1.5, light) + glow * mix(0.85, 0.5, light)) + vec3(core * 0.6);
    // e a borda livre da aba brilha por dentro
    cav += accent * exp(-max(xr - q0.x, 0.0) / 0.03) * 0.5 * (1.0 - uReveal) * step(q0.y, 0.0);
    outc = mix(outc, cav, inO);
  }
  return mix(col, outc, uHero * aboveFloor(px.y));
}
`;

export const FIGURE_VERT = /* glsl */ `
attribute vec4 aNA;   // normal (xyz) e oclusão
attribute vec4 aMeta; // caminho da luz (0 dedos … 1 cabeça), quanto segue a mão, dissolução, semente
uniform vec3 uFigOffset, uGrabF;
uniform float uFigScale;
varying vec3 vN, vP, vView;
varying vec4 vMeta;
varying float vAo;

void main() {
  vec3 p = position + uGrabF * aMeta.y;
  vec4 mv = modelViewMatrix * vec4(p * uFigScale + uFigOffset, 1.0);
  vN = normalMatrix * aNA.xyz;
  vAo = aNA.w;
  vMeta = aMeta;
  vP = position;
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FIGURE_CUT = /* glsl */ `
float hash3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// O que sobra da superfície: as bordas de ruptura (fixas) e a faixa que percorre o braço na conversa.
// Devolve a distância até a frente da faixa (> 0: ainda inteira).
float figureCut(vec3 p, vec4 meta, float sweep) {
  float ahead = meta.x - sweep;
  if (meta.z < 0.012 && ahead > 0.1) return ahead; // inteira: nem calcula o ruído
  float grain = noise3(p * 8.0) * 0.5 + noise3(p * 21.0) * 0.32 + noise3(p * 55.0) * 0.18;
  if (meta.z * (0.5 + 1.0 * grain) > 0.6) discard;
  ahead += 0.07 * (grain - 0.5);
  if (ahead < 0.0) discard;
  return ahead;
}
`;

export const FIGURE_FRAG = /* glsl */ `
uniform float uLight, uSweep;
uniform vec3 uAccent, uKey, uFade;
uniform vec2 uFloorPx;
varying vec3 vN, vP, vView;
varying vec4 vMeta;
varying float vAo;
${STUDIO_LIB}
${FIGURE_CUT}
void main() {
  float ahead = figureCut(vP, vMeta, uSweep);
  vec3 n = normalize(vN);
  vec3 v = normalize(vView);
  vec3 r = reflect(-v, n);
  vec3 col = studio(r, uLight);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  col *= 0.28 + 0.72 * vAo;
  // tema claro: a borda escurece e a silhueta se solta do branco; no escuro, é o recorte de luz que a desenha
  col *= 1.0 - mix(0.0, 0.72, uLight) * fres;
  col += (1.0 - uLight) * fres * 0.2 * vAo;
  // a luz da fenda vem de baixo: mais forte perto da ponta da dobra
  vec2 dn = vP.xy - vec2(0.12, -0.28);
  float near = exp(-dot(dn, dn) / 0.5);
  float under = pow(clamp(-r.y - 0.22, 0.0, 1.0), 1.4) * (0.1 + 1.9 * near);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.4545));
  col += uAccent * under * mix(0.95, 0.85, uLight);
  // a faixa de luz que percorre o braço e a borda de ruptura acesa
  float band = exp(-pow(ahead / 0.03, 2.0)) * step(-0.04, uSweep);
  col += (uKey * 0.8 + uAccent * 0.7) * band * 1.5;
  gl_FragColor = vec4(mix(uFade, col, smoothstep(uFloorPx.x, uFloorPx.y, gl_FragCoord.y)), 1.0);
}
`;

/** A silhueta da figura, para a sombra projetada na página. */
export const FIGURE_SHADOW_FRAG = /* glsl */ `
uniform float uSweep;
varying vec3 vN, vP, vView;
varying vec4 vMeta;
varying float vAo;
${FIGURE_CUT}
void main() {
  figureCut(vP, vMeta, uSweep);
  // só a mão faz sombra na página; some antes do punho, onde a malha dela termina
  gl_FragColor = vec4(smoothstep(0.195, 0.1, vMeta.x));
}
`;
