/**
 * Shaders da cena da home: a Matéria é uma escultura de mármore num ateliê.
 *
 *   STUDIO_LIB   o que a prata reflete (as moléculas da conversa e os grãos)
 *   ATELIER      o fundo: a parede de carvão (ou de gesso) com a luz lateral e a sombra que a figura projeta —
 *                entra no shader do ambiente (shaders.ts › BACKDROP_FRAG)
 *   FIGURE_*     a pedra: as esculturas (corpo, panejamento, adereços, bloco) e os braços articulados. Luz
 *                principal rasante com a sombra e a oclusão que vêm do arquivo, veios, marcas de ponteiro onde a
 *                pedra ainda é bruta, e a frente de formação — a figura nasce de baixo para cima
 *   GRAIN_*      os grãos da transformação: saem da superfície que se desfaz e assentam na que se forma
 *   SILVER_*     os grãos de prata do repouso: sobem contra a gravidade e completam o trecho que falta no punho
 *   PASSAGE_*    a abertura por onde a página do destino aparece: a borda erguida, a espessura e a sombra
 */
export const STUDIO_LIB = /* glsl */ `
vec3 studio(vec3 r, float light) {
  float az = atan(r.x, r.z);
  float el = r.y;
  float sky = clamp(0.5 + 0.5 * el, 0.0, 1.0);
  float base = mix(0.018, 0.05, light) + mix(0.12, 0.2, light) * sky * sky;
  float top = smoothstep(0.24, 0.5, el) * smoothstep(0.98, 0.76, el) * smoothstep(2.3, 1.3, abs(az + 0.7));
  float front = exp(-pow((az - 0.3) / 0.8, 2.0) - pow((el - 0.02) / 0.5, 2.0));
  float wall = exp(-pow((az + 1.85) / 0.62, 2.0)) * smoothstep(-0.8, -0.15, el) * smoothstep(0.8, 0.25, el);
  float strip = exp(-pow((az - 0.82) / 0.11, 2.0)) * smoothstep(1.0, 0.5, abs(el));
  float kick = exp(-pow((az + 2.25) / 0.3, 2.0)) * smoothstep(0.95, 0.35, abs(el + 0.05));
  float page = clamp(-r.z - 0.2, 0.0, 1.0);
  float v = base + top * mix(0.8, 0.64, light) + front * mix(0.2, 0.34, light) + wall * mix(0.3, 0.5, light) + strip * mix(1.3, 0.8, light) + kick * mix(0.95, 0.0, light) + page * mix(0.03, 0.14, light);
  return vec3(v) * vec3(0.97, 1.0, 1.05);
}
`;

/** A direção da luz principal (a mesma da sombra calculada no Blender: assets/materia/sculpt/stage.py › KEY). */
export const KEY_LIGHT = [-0.62, 0.56, 0.55] as const;

const NOISE3 = /* glsl */ `
float hash3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;

/** O mármore: cor, veios e a luz do ateliê. Devolve cor de tela. `shadow` e `ao` vêm do arquivo (1 = luz plena). */
const MARBLE = /* glsl */ `
uniform float uLight;
uniform vec3 uKeyDir;
vec3 hash33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
vec3 marble(vec3 rest, float warp, vec3 n, vec3 v, float ao, float shadow, float rough) {
  // veios finos, que atravessam a peça em diagonal, e manchas largas de tom (warp: ruído por vértice)
  float line = rest.x * 0.9 + rest.y * 1.6 + rest.z * 0.7;
  float vein = pow(1.0 - abs(sin(line * 2.4 + warp * 5.2)), 9.0) * (0.4 + 0.6 * warp);
  vec3 albedo = mix(vec3(0.95, 0.925, 0.88), vec3(0.86, 0.845, 0.82), 0.5 + 0.5 * sin(line * 0.7 + warp * 3.0));
  albedo = mix(albedo, vec3(0.6, 0.6, 0.63), vein * 0.34);
  // pedra bruta: mais escura e fosca, lavrada em facetas (os golpes do ponteiro) e com grão fino
  if (rough > 0.02) {
    vec3 q1 = vec3(dot(rest, vec3(0.8, 0.36, -0.48)), dot(rest, vec3(-0.6, 0.48, -0.64)), dot(rest, vec3(0.0, 0.8, 0.6))) * 3.7 + warp * 2.6;
    vec3 q2 = vec3(dot(rest, vec3(0.36, 0.8, 0.48)), dot(rest, vec3(0.48, -0.6, 0.64)), dot(rest, vec3(0.8, 0.0, -0.6))) * 8.9 - warp * 3.1;
    vec3 f1 = fract(q1) - 0.5, f2 = fract(q2) - 0.5;
    // dentro de cada faceta a normal é uma só; perto da aresta ela cede (a quina do golpe)
    float e1 = 1.0 - smoothstep(0.3, 0.5, max(abs(f1.x), max(abs(f1.y), abs(f1.z))));
    vec3 facet = (hash33(floor(q1)) - 0.5) * (0.5 + 0.5 * e1) * 0.8 + (hash33(floor(q2)) - 0.5) * 0.42;
    n = normalize(n + facet * rough);
    albedo *= 1.0 - 0.1 * (1.0 - e1) * rough;
    albedo *= mix(1.0, 0.8, rough);
  }
  float nl = dot(n, uKeyDir);
  float wrap = clamp((nl + 0.22) / 1.22, 0.0, 1.0);
  float lit = wrap * mix(1.0, shadow, 0.88);
  // a luz que atravessa a pedra: a borda da sombra fica morna, não preta
  float sss = (1.0 - lit) * smoothstep(-0.55, 0.3, nl) * 0.16;
  vec3 keyCol = mix(vec3(1.0, 0.955, 0.89), vec3(1.0, 0.985, 0.96), uLight);
  vec3 fillCol = mix(vec3(0.3, 0.34, 0.42), vec3(0.62, 0.68, 0.78), uLight);
  float amb = mix(0.045, 0.34, uLight);
  float fill = (0.5 + 0.5 * dot(n, vec3(0.776, -0.166, 0.609))) * mix(0.1, 0.3, uLight);
  float occ = mix(0.42, 1.0, ao) * ao;
  vec3 col = albedo * (keyCol * (lit * mix(1.18, 0.82, uLight) + sss * vec3(1.0, 0.72, 0.5)) + fillCol * fill * occ + vec3(amb) * occ);
  // brilho baixo de pedra polida e o recorte por trás, que solta a silhueta do carvão
  vec3 h = normalize(uKeyDir + v);
  col += keyCol * pow(max(dot(n, h), 0.0), 34.0) * 0.16 * (1.0 - rough) * mix(1.0, shadow, 0.9);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float rim = fres * smoothstep(-0.1, 0.6, dot(n, vec3(0.795, 0.348, -0.497)));
  col += mix(vec3(0.5, 0.56, 0.68) * 0.5, vec3(0.0), uLight) * rim * occ;
  // no gesso, a borda escurece um pouco: é a sombra que desenha o volume
  col *= 1.0 - uLight * 0.2 * fres;
  return pow(clamp(col, 0.0, 1.0), vec3(0.4545));
}
`;

export const FIGURE_VERT = /* glsl */ `
attribute vec3 aPosB; // a outra forma da mão (nas demais partes, igual a position)
attribute vec4 aNA;   // normal (xyz) e oclusão
attribute vec4 aNB;   // idem, da outra forma
attribute vec4 aMeta; // escultura: região, ordem de formação, sombra, pedra bruta · braço: caminho (0 dedos … 0,5 ombro)
attribute vec4 aSkin; // osso A, osso B, peso de A (0..255), semente
uniform vec4 uBone[39]; // 13 ossos × 3 linhas (rig.ts)
uniform float uBoneOff, uShape;
uniform vec4 uFigT;   // onde a figura fica na cena: deslocamento (xyz) e escala
varying vec3 vN, vP, vRest, vView;
varying vec4 vMeta;
varying float vAo, vSeed, vWarp;
${NOISE3}

vec3 skin(float bone, vec3 p, float w) {
  int k = int(bone + 0.5) * 3;
  return vec3(dot(uBone[k].xyz, p) + uBone[k].w * w, dot(uBone[k + 1].xyz, p) + uBone[k + 1].w * w, dot(uBone[k + 2].xyz, p) + uBone[k + 2].w * w);
}

void main() {
  vec3 rest = mix(position, aPosB, uShape);
  vec4 na = mix(aNA, aNB, uShape);
  // os ossos do braço no arquivo (2, 3, 4) viram os do braço A ou do B
  float a = aSkin.x + step(1.5, aSkin.x) * uBoneOff;
  float b = aSkin.y + step(1.5, aSkin.y) * uBoneOff;
  float w = aSkin.z / 255.0;
  vec3 p = mix(skin(b, rest, 1.0), skin(a, rest, 1.0), w);
  vec3 n = normalize(mix(skin(b, na.xyz, 0.0), skin(a, na.xyz, 0.0), w));
  vec4 mv = modelViewMatrix * vec4(p * uFigT.w + uFigT.xyz, 1.0);
  vN = normalMatrix * n;
  vAo = na.w;
  vMeta = aMeta;
  vSeed = aSkin.w / 255.0;
  vWarp = noise3(rest * 1.9);
  vP = p;
  vRest = rest;
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

/** O que existe da pedra agora. Devolve a distância até a frente de formação (para acendê-la). */
const FIGURE_CUT = /* glsl */ `
uniform float uVis;   // quanto da figura está formado (0 nada … 1 inteira)
uniform float uArm;   // 1 = braço (o caminho vai dos dedos ao ombro)
uniform vec3 uGap;    // braço: o trecho que falta, em x de repouso (de, até), e a presença dele
float figureCut(vec3 rest, vec4 meta, float seed) {
  if (uArm > 0.5) {
    // o trecho que falta entre o antebraço e o punho: a borda é de pedra quebrada
    float near = uGap.z > 0.0 ? min(abs(rest.x - uGap.x), abs(rest.x - uGap.y)) : 1.0;
    bool inside = uGap.z > 0.0 && rest.x > uGap.x - 0.05 && rest.x < uGap.y + 0.05;
    if (uVis > 0.999 && !inside) return 1.0; // inteiro e longe do trecho: nem calcula o ruído
    float grain = noise3(rest * 6.0) * 0.6 + noise3(rest * 19.0) * 0.4;
    // forma primeiro os dedos: a frente sobe da ponta até o ombro
    float ahead = uVis * 0.66 - meta.x - 0.06 * (grain - 0.5);
    if (ahead < 0.0) discard;
    if (inside) {
      float edge = 0.07 * (grain - 0.5);
      if (rest.x > uGap.x + edge && rest.x < uGap.y + edge) discard;
      ahead = min(ahead, near * 2.2 + (1.0 - uGap.z));
    }
    return ahead;
  }
  if (uVis > 0.999) return 1.0;
  float grain = noise3(rest * 6.0) * 0.6 + noise3(rest * 19.0) * 0.4;
  float ahead = uVis * 1.16 - 0.08 - meta.y - 0.1 * (grain - 0.5) - 0.05 * (seed - 0.5);
  if (ahead < 0.0) discard;
  return ahead;
}
`;

export const FIGURE_FRAG = /* glsl */ `
uniform vec2 uFloorPx;
uniform vec3 uFade, uKey;
uniform float uGlow; // a frente de formação acende (0 em repouso)
uniform float uSil;  // prova de silhueta: a pedra sai em preto
varying vec3 vN, vP, vRest, vView;
varying vec4 vMeta;
varying float vAo, vSeed, vWarp;
${NOISE3}
${FIGURE_CUT}
${MARBLE}
void main() {
  float ahead = figureCut(vRest, vMeta, vSeed);
  if (uSil > 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec3 n = normalize(vN);
  vec3 v = normalize(vView);
  float arm = step(0.5, uArm);
  vec3 col = marble(vRest, vWarp, n, v, clamp(vAo, 0.0, 1.0), mix(vMeta.z, 1.0, arm), mix(vMeta.w, 0.0, arm));
  // a frente de formação: uma linha de prata onde a pedra acabou de assentar
  float band = exp(-pow(ahead / 0.02, 2.0)) * uGlow;
  col += uKey * band * 0.9;
  gl_FragColor = vec4(mix(uFade, col, smoothstep(uFloorPx.x, uFloorPx.y, gl_FragCoord.y)), 1.0);
}
`;

/** A silhueta da figura, para a sombra projetada na parede do ateliê. */
export const FIGURE_SHADOW_FRAG = /* glsl */ `
varying vec3 vN, vP, vRest, vView;
varying vec4 vMeta;
varying float vAo, vSeed, vWarp;
${NOISE3}
${FIGURE_CUT}
void main() {
  figureCut(vRest, vMeta, vSeed);
  gl_FragColor = vec4(1.0);
}
`;

/**
 * Os grãos da transformação. Cada grão sabe onde estava na figura que se desfaz (`position`, ordem `aMeta.x`)
 * e onde vai assentar na que se forma (`aTo`, ordem `aMeta.w`): parte quando a frente de dissolução passa por
 * ele (de cima para baixo) e chega antes de a frente de formação alcançar o lugar dele (de baixo para cima).
 */
export const GRAIN_VERT = /* glsl */ `
attribute vec3 aTo;
attribute vec4 aNF;   // normal de origem (xyz) e região
attribute vec4 aNT;   // normal de destino
attribute vec4 aMeta; // ordem de origem, semente, luz, ordem de destino
uniform vec4 uFromT, uToT; // onde cada figura fica: deslocamento e escala
uniform float uShift;      // 0 = a figura de origem inteira … 1 = a de destino inteira
uniform float uPx, uCamZ, uSize, uTime;
uniform vec2 uFloorPx;
varying vec3 vN;
varying float vLight, vFly, vSeed;

void main() {
  float seed = aMeta.y;
  // parte quando a pedra de origem se desfaz ali; chega um pouco antes de a de destino se formar ali
  float leave = 0.5 * (1.0 - aMeta.x) + 0.06 * (seed - 0.5);
  float land = 0.44 + 0.5 * aMeta.w + 0.05 * (fract(seed * 7.3) - 0.5);
  float u = clamp((uShift - leave) / max(land - leave, 0.08), 0.0, 1.0);
  float e = u * u * (3.0 - 2.0 * u);
  vec3 a = position * uFromT.w + uFromT.xyz;
  vec3 b = aTo * uToT.w + uToT.xyz;
  vec3 p = mix(a, b, e);
  // o caminho: um arco que sobe (contra a gravidade) e se abre para quem olha, com um giro próprio
  float arc = sin(3.14159265 * u);
  float turn = 6.2832 * fract(seed * 13.7) + uTime * 0.6;
  float amp = (0.1 + 0.26 * fract(seed * 5.1)) * (0.5 + 0.5 * uToT.w);
  p += vec3(cos(turn) * 0.6, 0.55 + 0.45 * sin(turn * 0.7), 0.5 + 0.5 * sin(turn)) * arc * amp;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vN = normalize(normalMatrix * mix(aNF.xyz, aNT.xyz, e));
  vLight = aMeta.z;
  vFly = arc;
  vSeed = seed;
  float size = uSize * (0.55 + 1.5 * pow(fract(seed * 23.7), 3.0)) * mix(uFromT.w, uToT.w, e);
  gl_PointSize = max(1.0, size * uPx * uCamZ / -mv.z);
  // fora do voo o grão é a própria pedra: não se desenha
  if (u <= 0.001 || u >= 0.999 || uShift <= 0.0 || uShift >= 1.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;

export const GRAIN_FRAG = /* glsl */ `
uniform float uLight;
uniform vec3 uKeyDir, uFade;
uniform vec2 uFloorPx;
varying vec3 vN;
varying float vLight, vFly, vSeed;
${STUDIO_LIB}
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  vec3 bead = vec3(c.x, -c.y, sqrt(1.0 - r2));
  vec3 n = normalize(vN + bead * 0.9);
  // pó de mármore que, no ar, pega a luz como prata
  float lit = clamp((dot(n, uKeyDir) + 0.25) / 1.25, 0.0, 1.0);
  vec3 stone = vec3(0.93, 0.9, 0.86) * (mix(0.1, 0.42, uLight) + lit * mix(1.05, 0.7, uLight)) * (0.45 + 0.55 * vLight);
  vec3 silver = pow(clamp(studio(reflect(vec3(0.0, 0.0, -1.0), n), uLight), 0.0, 1.0), vec3(0.4545));
  float glint = step(0.72, fract(vSeed * 9.7)) * vFly;
  vec3 col = mix(pow(clamp(stone, 0.0, 1.0), vec3(0.4545)), silver * 1.25, glint);
  col = mix(col, col * 0.55, uLight * (1.0 - bead.z) * 0.6);
  gl_FragColor = vec4(mix(uFade, col, smoothstep(uFloorPx.x, uFloorPx.y, gl_FragCoord.y)), 1.0);
}
`;

/**
 * Os grãos de prata do repouso: uns moram no trecho que falta entre o antebraço e o punho (e o completam);
 * outros sobem devagar de baixo, contra a gravidade, até lá. `aSeed` são quatro números ao acaso por grão.
 */
export const SILVER_VERT = /* glsl */ `
attribute vec4 aSeed;
uniform vec4 uGapM[3]; // o osso do antebraço (3 linhas)
uniform vec4 uFigT;
uniform vec3 uGap;     // o trecho que falta (de, até) e a presença
uniform float uPx, uCamZ, uSize, uTime, uStir;
uniform vec2 uFloorPx;
varying vec3 vN;
varying float vK;

vec3 bone(vec3 p) { return vec3(dot(uGapM[0].xyz, p) + uGapM[0].w, dot(uGapM[1].xyz, p) + uGapM[1].w, dot(uGapM[2].xyz, p) + uGapM[2].w); }

void main() {
  // o lugar de cada grão dentro do trecho: um cilindro do tamanho do antebraço, mais cheio no miolo
  float along = mix(uGap.x - 0.03, uGap.y + 0.03, aSeed.x);
  float ang = 6.2832 * aSeed.y + uTime * (0.25 + 0.5 * aSeed.w) * (0.4 + uStir);
  float rad = 0.115 * sqrt(aSeed.z) * (1.0 + 0.16 * sin(uTime * 0.9 + aSeed.w * 30.0));
  vec3 home = bone(vec3(along, rad * cos(ang), rad * sin(ang)));
  vec3 p = home * uFigT.w + uFigT.xyz;
  float k = 1.0;
  if (aSeed.w > 0.56) {
    // os que sobem: nascem embaixo, espalhados, e fazem o caminho em espiral até o trecho
    float t = fract(aSeed.x * 3.0 + uTime * (0.045 + 0.05 * aSeed.y) * (1.0 + uStir));
    float e = t * t * (3.0 - 2.0 * t);
    vec3 from = p + vec3((aSeed.y - 0.5) * 1.3, -2.6 - 1.4 * aSeed.z, (aSeed.z - 0.5) * 0.9) * uFigT.w;
    float sw = (1.0 - e) * 0.3 * uFigT.w;
    p = mix(from, p, e) + vec3(cos(t * 9.0 + aSeed.y * 6.2832), 0.0, sin(t * 9.0 + aSeed.y * 6.2832)) * sw;
    k = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.9, t);
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vN = normalize(vec3(cos(ang), sin(ang) * 0.6, 0.7));
  vK = k * uGap.z;
  gl_PointSize = max(1.0, uSize * (0.5 + 1.7 * pow(aSeed.z, 3.0)) * uFigT.w * uPx * uCamZ / -mv.z);
  if (vK < 0.01) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`;

export const SILVER_FRAG = /* glsl */ `
uniform float uLight;
uniform vec3 uFade;
uniform vec2 uFloorPx;
varying vec3 vN;
varying float vK;
${STUDIO_LIB}
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  vec3 n = normalize(vN * 0.5 + vec3(c.x, -c.y, sqrt(1.0 - r2)));
  // prata: o reflexo do ateliê e um brilho próprio — é ela que completa a pedra
  vec3 col = pow(clamp(studio(reflect(vec3(0.0, 0.0, -1.0), n), uLight) * 1.6 + 0.3 * pow(max(n.z, 0.0), 3.0), 0.0, 1.0), vec3(0.4545));
  col = mix(col, col * vec3(0.42, 0.48, 0.6), uLight * 0.6);
  gl_FragColor = vec4(mix(uFade, col, vK * smoothstep(uFloorPx.x, uFloorPx.y, gl_FragCoord.y)), 1.0);
}
`;

/**
 * Entra em BACKDROP_FRAG, depois de `hash`/`noise`: a parede do ateliê e a luz lateral. O motor desenha o ambiente
 * num alvo à parte só quando ele muda (engine.ts › bgRT); a sombra da escultura entra depois, em WALL_FRAG.
 */
export const ATELIER = /* glsl */ `
uniform float uHero;     // presença da escultura (0 na conversa)
uniform vec4 uFigBox;    // onde a figura está: centro (px do buffer) e meia altura (px); w livre
uniform vec2 uFloorPx;
float aboveFloor(float y) { return smoothstep(uFloorPx.x, uFloorPx.y, y); }

vec3 atelier(vec2 px, vec3 col, vec3 base, vec3 deep, float light) {
  float k = max(uFigBox.z, 1.0);
  vec2 q = (px - uFigBox.xy) / k; // em meias alturas da figura, a partir do centro dela
  // fora da luz a parede volta à cor do sistema: a cena não tem moldura
  float reach = exp(-pow(length(q * vec2(0.5, 0.56)), 2.6)) * smoothstep(2.05, 1.35, abs(q.x)) * smoothstep(1.24, 1.04, abs(q.y)) * uHero;
  if (reach < 0.003) return col;
  // a luz entra pela esquerda, do alto, e lava a parede atrás da figura; o resto fica no carvão
  vec2 lp = (q - vec2(-0.35, 0.3)) * vec2(0.62, 0.74);
  float pool = exp(-dot(lp, lp) * 0.9);
  float shaft = exp(-pow((q.y + 0.52 * q.x - 0.35) / 0.9, 2.0)) * smoothstep(1.6, -0.4, q.x);
  float tex = noise(px / (0.03 * k)) * 0.6 + noise(px / (0.3 * k)) * 0.4;
  vec3 wall = mix(vec3(0.075, 0.07, 0.066), vec3(0.905, 0.895, 0.875), light);
  vec3 lit = mix(vec3(0.2, 0.185, 0.165), vec3(0.985, 0.98, 0.965), light);
  vec3 room = mix(wall, lit, clamp(pool * 0.85 + shaft * 0.22, 0.0, 1.0));
  room *= 1.0 + (tex - 0.5) * mix(0.16, 0.035, light);
  // o chão: uma faixa mais clara sob a figura, que some para os lados
  float ground = smoothstep(-0.78, -0.98, q.y) * exp(-pow(q.x / 1.5, 2.0));
  room = mix(room, room * mix(1.5, 0.94, light), ground * 0.45);
  return mix(col, room, reach);
}
`;

/**
 * O ambiente guardado vai para a tela com a sombra que a escultura projeta na parede (a silhueta dela, em um quarto
 * da resolução): cai para a direita e para baixo, larga e macia. Só perto da figura — longe dela é uma leitura só.
 */
export const WALL_VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
export const WALL_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uBg, uShadow;
uniform vec2 uRes;
uniform vec4 uFigBox;
uniform vec2 uFloorPx;
uniform float uHero, uLight, uGrain, uTime;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec2 px = gl_FragCoord.xy;
  vec3 col = texture2D(uBg, px / uRes).rgb;
  float k = max(uFigBox.z, 1.0);
  vec2 q = (px - uFigBox.xy) / k;
  if (uHero > 0.01 && abs(q.x) < 1.9 && abs(q.y) < 1.2) {
    vec2 c = (px + vec2(-0.2, 0.11) * k) / uRes;
    vec2 b = vec2(0.07 * k) / uRes;
    float s = texture2D(uShadow, c).r * 0.28;
    s += (texture2D(uShadow, c + b * vec2(1.0, 0.25)).r + texture2D(uShadow, c + b * vec2(-0.85, 0.55)).r + texture2D(uShadow, c + b * vec2(0.3, -1.0)).r + texture2D(uShadow, c + b * vec2(-0.45, -0.8)).r) * 0.18;
    float fade = smoothstep(1.9, 1.5, abs(q.x)) * smoothstep(1.2, 1.0, abs(q.y)) * smoothstep(uFloorPx.x, uFloorPx.y, px.y) * uHero;
    col = mix(col, mix(col * 0.36, col * vec3(0.7, 0.72, 0.78), uLight), clamp(s, 0.0, 1.0) * mix(0.8, 0.72, uLight) * fade);
  }
  col += (hash(px + fract(uTime) * 61.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * A passagem: o contorno (em px do buffer) por onde a página do destino aparece. A interface recorta a janela
 * de verdade com o MESMO contorno (materia-scene.tsx); aqui fica o que é pedra — a borda erguida, com espessura
 * e dobras, a sombra em volta e o escuro de dentro onde a janela ainda não chegou.
 */
export const PASSAGE_VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const PASSAGE_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uPoly[16];
uniform int uPolyN;      // 0 = círculo (uCircle)
uniform vec3 uCircle;    // centro (px) e raio
uniform float uK;        // px do buffer por unidade da figura
uniform float uAmt;      // presença (0..1)
uniform float uFlap;     // altura da borda erguida, em unidades (0 = só a espessura)
uniform float uLight;
uniform vec3 uStone;     // a cor do material da borda (pedra escura, papel, mármore)
uniform vec3 uVoid;

float sd(vec2 p) {
  if (uPolyN == 0) return length(p - uCircle.xy) - uCircle.z;
  float d = dot(p - uPoly[0], p - uPoly[0]);
  float s = 1.0;
  vec2 pj = uPoly[0];
  for (int i = 0; i < 16; i++) { if (i == uPolyN - 1) pj = uPoly[i]; }
  for (int i = 0; i < 16; i++) {
    if (i >= uPolyN) break;
    vec2 pi = uPoly[i];
    vec2 e = pj - pi;
    vec2 w = p - pi;
    vec2 b = w - e * clamp(dot(w, e) / max(dot(e, e), 1e-6), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= pi.y, p.y < pj.y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s = -s;
    pj = pi;
  }
  return s * sqrt(d);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  float d = sd(px);
  float aa = 1.2;
  vec2 g = vec2(sd(px + vec2(2.0, 0.0)) - d, sd(px + vec2(0.0, 2.0)) - d);
  vec2 n = normalize(g + 1e-5);
  // a borda de cima é a que as mãos erguem: ali a pedra sobe como tecido; nos outros lados fica só a espessura
  float up = smoothstep(0.25, 0.9, n.y);
  float thick = (0.045 + uFlap * up) * uK;
  float t = d / max(thick, 1.0);
  vec3 col = vec3(0.0);
  float a = 0.0;
  if (d < 0.0) {
    // o escuro de dentro (onde a janela já chegou, ela cobre isto)
    float depth = clamp(-d / (0.5 * uK), 0.0, 1.0);
    col = uVoid * mix(0.45, 1.0, depth);
    a = 1.0;
  } else if (t < 1.0) {
    // a borda: um rolo de pedra com dobras, mais claro no fio e sombreado no alto
    float fold = 0.5 + 0.5 * sin(px.x / (0.16 * uK) + 2.2 * sin(px.x / (0.5 * uK)));
    float roll = sin(3.14159265 * pow(t, 0.7));
    vec3 c = uStone * (0.5 + 0.6 * roll) * mix(1.0, 0.72 + 0.4 * fold, up * smoothstep(0.1, 0.6, t));
    c += vec3(0.5) * exp(-pow(t / 0.07, 2.0)) * mix(0.8, 0.35, uLight);
    col = c;
    a = smoothstep(1.0, 1.0 - aa / max(thick, 1.0) - 0.12 * up, t);
  }
  // a sombra que a borda erguida projeta em volta
  float sh = exp(-max(d - thick * 0.6, 0.0) / (0.2 * uK)) * step(0.0, d) * mix(0.55, 0.3, uLight);
  col = mix(vec3(0.0), col, a);
  float alpha = max(a, sh * (1.0 - a));
  gl_FragColor = vec4(col * uAmt, alpha * uAmt);
}
`;
