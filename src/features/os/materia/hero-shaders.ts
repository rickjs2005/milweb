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
uniform float uReveal;   // a abertura vira a janela (0 = a dobra em repouso … 1 = o retângulo da janela)
uniform vec4 uWinQ;      // essa janela em unidades da dobra (esquerda, baixo, direita, alto)
uniform float uFoldBottom; // onde fica a borda de baixo da abertura em repouso (fora da tela)
uniform vec4 uCoverRect; // onde a capa fica dentro da janela (px do buffer: x0, y0, x1, y1), como object-fit: cover
uniform vec3 uChrome;    // a cor da barra da janela (a faixa da abertura que a capa não cobre)
uniform sampler2D uCover, uWord, uShadow, uCardTex;
uniform float uCoverK, uCoverAr, uWordK, uShadowK, uCardAr;
uniform vec4 uCard;      // a ficha que as mãos apresentam: centro (px do buffer) e meia largura / meia altura
uniform vec4 uCardM;     // giro (rad), quanto está de frente (0 de lado … 1), presença, raio do canto (px)

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
  float rev = uReveal;
  float open1 = uOpen * (1.0 - rev); // o que é da dobra em repouso some quando ela vira a janela

  // ── a página: a pressão dos dedos amassa a superfície em volta da ponta
  vec3 page = col;
  if (r < 1.7) {
    float press = exp(-r / 0.3) * open1;
    // pregas: vales estreitos entre cristas largas, de tamanhos diferentes
    float w1 = sin(ang * 5.0 + 0.7), w2 = sin(ang * 9.0 + 2.1), w3 = sin(ang * 17.0 - 0.6);
    float wr = (w1 * abs(w1)) * 0.5 + (w2 * abs(w2)) * 0.32 + w3 * 0.18;
    float crease = wr * press * smoothstep(0.006, 0.08, r);
    // a folha sobe até a ponta: um lado pega a luz, o outro fica na sombra
    float tent = exp(-r / 0.5) * open1 * dot(normalize(q0 + 1e-4), vec2(-0.55, 0.83));
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
  page *= 1.0 - mix(0.3, 0.1, light) * lipL * open1;
  // e o fio da folha pega a luz que vem de dentro
  float rimL = exp(-pow((xl - q0.x) / 0.007, 2.0)) * step(q0.y, 0.0) * smoothstep(0.0, 0.06, d) * open1;
  page += mix(accent * 1.3 + vec3(0.2), vec3(0.04), light) * rimL;
  // no escuro a fenda acende a página em volta: é o carmesim que desenha a abertura sobre o grafite
  page += (1.0 - light) * accent * 0.2 * exp(-max(xl - q0.x, 0.0) / 0.1) * step(q0.y, 0.0) * smoothstep(0.0, 0.08, d) * open1;

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

  // ── a abertura: a profundidade escura, a capa de um projeto de verdade e a faixa de luz.
  // Quando o visitante abre Projetos ela vira a janela: o topo sobe da ponta até o alto da janela, os lados se
  // endireitam e a borda de baixo sobe de fora da tela — cada quina viaja em linha reta até o canto dela.
  float yTop = uWinQ.w * rev;
  float dd = max(yTop - q0.y, 0.0);
  float oxl = mix(foldL(dd), uWinQ.x, rev);
  float oxr = mix(foldR(dd), uWinQ.z, rev);
  float oyb = mix(uFoldBottom, uWinQ.y, rev);
  float sdO = max(max(oxl - q0.x, q0.x - oxr), max(q0.y - yTop, oyb - q0.y));
  float inO = smoothstep(aa, -aa, sdO);
  // a superfície esticando: o fio da borda acende enquanto as mãos a seguram
  outc += (accent * 0.9 + vec3(0.35)) * exp(-pow(sdO / 0.008, 2.0)) * rev * (1.0 - smoothstep(0.92, 1.0, rev)) * (1.0 - inO);
  if (inO > 0.001) {
    float depth = clamp(-sdO, 0.0, 1.0);
    vec3 cav = mix(vec3(0.012, 0.014, 0.022), deep * 0.2, 0.3);
    // a capa fica no fundo: não acompanha a ponta (paralaxe); na janela, preenche o corpo dela
    vec2 cs = vec2(1.56, 1.56 / max(uCoverAr, 0.1));
    vec2 cuv = (q - vec2(0.235, -0.4) + uGrab * 0.12) / cs + 0.5;
    vec2 rs = max(uCoverRect.zw - uCoverRect.xy, vec2(1.0));
    vec2 fit = rs.x / rs.y > uCoverAr ? vec2(rs.x, rs.x / uCoverAr) : vec2(rs.y * uCoverAr, rs.y);
    cuv = mix(cuv, (px - 0.5 * (uCoverRect.xy + uCoverRect.zw)) / fit + 0.5, rev);
    float inC = step(0.0, cuv.x) * step(cuv.x, 1.0) * step(0.0, cuv.y) * step(cuv.y, 1.0);
    // na home, só a parte de cima da capa (a primeira dobra do site), que some na profundidade antes de acabar
    vec2 suv = vec2(cuv.x, 1.0 - (1.0 - cuv.y) * mix(0.8, 1.0, rev));
    vec3 cover = texture2D(uCover, clamp(suv, 0.0, 1.0)).rgb;
    float seen = uCoverK * inC * mix(mix(mix(0.86, 0.8, light), 1.0, uHover) * smoothstep(0.0, 0.22, cuv.y), 1.0, rev);
    cav = mix(cav, cover, seen);
    // a folha faz sombra para dentro: perto das bordas a cavidade é quase preta
    float shade = smoothstep(0.0, mix(0.34, 0.2, uHover), depth);
    cav *= mix(mix(mix(0.3, 0.22, light), 1.0, shade), 1.0, rev);
    // a faixa de luz: nasce sob os dedos e atravessa a abertura
    float bs = q0.y + 0.13 + 0.16 * q0.x;
    float reach = smoothstep(0.0, 0.1, depth) * (1.0 - rev);
    float core = exp(-pow(bs / 0.012, 2.0)) * reach;
    float glow = exp(-pow(bs / 0.11, 2.0)) * reach;
    cav += accent * (core * mix(2.2, 1.5, light) + glow * mix(0.85, 0.5, light)) + vec3(core * 0.6);
    // e a borda livre da aba brilha por dentro
    cav += accent * exp(-max(xr - q0.x, 0.0) / 0.03) * 0.5 * (1.0 - rev) * step(q0.y, 0.0);
    // a faixa que a capa não cobre é a barra da janela
    float bar = (1.0 - step(uCoverRect.x, px.x) * step(px.x, uCoverRect.z) * step(uCoverRect.y, px.y) * step(px.y, uCoverRect.w)) * smoothstep(0.7, 1.0, rev);
    cav = mix(cav, uChrome, bar);
    outc = mix(outc, cav, inO);
  }
  return mix(col, outc, uHero * aboveFloor(px.y));
}

// A ficha que as mãos apresentam: a do perfil, o briefing do orçamento, a capa do projeto recomendado. Um cartão
// com sombra, que gira com o punho (de lado → de frente) e cresce até virar a janela.
vec3 cardLayer(vec2 px, vec3 col, float light) {
  if (uCardM.z < 0.002) return col;
  vec2 cp = px - uCard.xy;
  float cr = cos(uCardM.x), sr = sin(uCardM.x);
  cp = vec2(cr * cp.x + sr * cp.y, -sr * cp.x + cr * cp.y);
  float face = max(uCardM.y, 0.05);
  vec2 hs = uCard.zw * vec2(face, 1.0);
  vec2 sd2 = abs(cp + vec2(-0.05, 0.07) * uFoldK * face) - hs;
  float shadow = 1.0 - smoothstep(-0.02 * uFoldK, 0.1 * uFoldK, length(max(sd2, 0.0)) + min(max(sd2.x, sd2.y), 0.0));
  col *= 1.0 - mix(0.5, 0.26, light) * shadow * uCardM.z;
  vec2 cd = abs(cp) - hs + uCardM.w;
  float sdC = length(max(cd, 0.0)) + min(max(cd.x, cd.y), 0.0) - uCardM.w;
  float inCard = smoothstep(1.2, -1.2, sdC);
  vec2 tuv = cp / (2.0 * hs);
  float ar = uCard.z / max(uCard.w, 1.0);
  tuv *= ar > uCardAr ? vec2(1.0, uCardAr / ar) : vec2(ar / uCardAr, 1.0);
  vec3 tex = texture2D(uCardTex, clamp(tuv + 0.5, 0.0, 1.0)).rgb * mix(0.5, 1.0, uCardM.y);
  tex += vec3(0.5) * exp(-pow(sdC / 2.2, 2.0)) * 0.5;
  return mix(col, tex, inCard * uCardM.z);
}
`;

export const FIGURE_VERT = /* glsl */ `
attribute vec3 aPosB; // a outra forma da mão (nas demais partes, igual a position)
attribute vec4 aNA;   // normal (xyz) e oclusão
attribute vec4 aNB;   // idem, da outra forma
attribute vec4 aMeta; // caminho da luz (0 dedos … 1 cabeça), dissolução, semente
attribute vec4 aSkin; // osso A, osso B, peso de A (0..255)
uniform vec4 uBone[24]; // 8 ossos × 3 linhas (rig.ts)
uniform float uBoneOff, uShape, uFigScale;
uniform vec3 uFigOffset;
varying vec3 vN, vP, vRest, vView;
varying vec4 vMeta;
varying float vAo;

vec3 skin(float bone, vec3 p, float w) {
  int k = int(bone + 0.5) * 3;
  return vec3(dot(uBone[k].xyz, p) + uBone[k].w * w, dot(uBone[k + 1].xyz, p) + uBone[k + 1].w * w, dot(uBone[k + 2].xyz, p) + uBone[k + 2].w * w);
}

void main() {
  vec3 rest = mix(position, aPosB, uShape);
  vec4 na = mix(aNA, aNB, uShape);
  // os ossos do braço (2, 3, 4) valem para os dois: o segundo usa os três seguintes
  float a = aSkin.x + step(1.5, aSkin.x) * uBoneOff;
  float b = aSkin.y + step(1.5, aSkin.y) * uBoneOff;
  float w = aSkin.z / 255.0;
  vec3 p = mix(skin(b, rest, 1.0), skin(a, rest, 1.0), w);
  vec3 n = normalize(mix(skin(b, na.xyz, 0.0), skin(a, na.xyz, 0.0), w));
  vec4 mv = modelViewMatrix * vec4(p * uFigScale + uFigOffset, 1.0);
  vN = normalMatrix * n;
  vAo = na.w;
  vMeta = aMeta;
  vP = p;
  vRest = rest;
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FIGURE_CUT = /* glsl */ `
uniform float uKeep; // até que ponto do caminho da luz a figura fica quando a faixa passa (os braços, na conversa)
float hash3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// O que sobra da superfície: as bordas de ruptura (fixas) e a faixa que percorre o braço na conversa.
// Devolve a distância até a frente da faixa.
float figureCut(vec3 p, vec4 meta, float sweep) {
  float ahead = meta.x - sweep;
  if (meta.y < 0.012 && ahead > 0.1) return ahead; // inteira: nem calcula o ruído
  float grain = noise3(p * 8.0) * 0.5 + noise3(p * 21.0) * 0.32 + noise3(p * 55.0) * 0.18;
  if (meta.y * (0.5 + 1.0 * grain) > 0.6) discard;
  ahead += 0.07 * (grain - 0.5);
  if (ahead < 0.0 && meta.x > uKeep + 0.08 * (grain - 0.5)) discard;
  return ahead;
}
`;

export const FIGURE_FRAG = /* glsl */ `
uniform float uLight, uSweep;
uniform vec3 uAccent, uKey, uFade, uGlowAt;
uniform vec2 uFloorPx;
varying vec3 vN, vP, vRest, vView;
varying vec4 vMeta;
varying float vAo;
${STUDIO_LIB}
${FIGURE_CUT}
void main() {
  float ahead = figureCut(vRest, vMeta, uSweep);
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
  vec2 dn = vP.xy - uGlowAt.xy;
  float near = exp(-dot(dn, dn) / 0.5) * uGlowAt.z;
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
varying vec3 vN, vP, vRest, vView;
varying vec4 vMeta;
varying float vAo;
${FIGURE_CUT}
void main() {
  figureCut(vRest, vMeta, uSweep);
  // só as mãos fazem sombra na página; some antes do punho, onde a malha delas termina
  gl_FragColor = vec4(smoothstep(0.16, 0.09, vMeta.x));
}
`;
