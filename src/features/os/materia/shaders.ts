/**
 * Shaders da Matéria. Cores saem prontas para a tela (sRGB): nenhum material passa por tone mapping.
 *
 * Moléculas: um ponto por molécula, desenhado como uma microesfera de metal. A normal da superfície
 * (do gerador) manda no reflexo — é ela que faz o conjunto ler como prata contínua — e a normal da
 * microesfera dá o grão. O ambiente refletido é analítico: céu baixo, uma faixa estreita de luz e um
 * recorte por trás. Opaco, com teste de profundidade: sem ordenar nada.
 */
export const MOLECULE_VERT = /* glsl */ `
attribute vec3 aNormal;
attribute vec3 aBrain;
attribute vec3 aBrainN;
attribute vec4 aMeta; // semente, dissolução, borda de sulco, região (0..1)
uniform float uTime, uPx, uCamZ, uSize, uYaw, uMorph, uListen, uSpeak, uCalm, uAlign, uSlit, uScale, uIntro, uFold, uFloor;
uniform float uPortal, uPortalYaw, uSeaY;
uniform vec2 uPull, uPullLag, uPortalC, uPortalR;
uniform vec3 uOffset;
varying vec3 vN;
varying float vShade, vSulcus, vGlow, vGhost, vE, vSea, vRim;

vec3 ry(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rx(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }

void main() {
  float seed = aMeta.x;
  float dis = aMeta.y;
  float late = step(0.5, fract(seed * 7.31));

  // Metamorfose: cada molécula tem a sua hora — o alto da cabeça parte primeiro, os ombros por último.
  float h = clamp((position.y + 1.44) / 2.0, 0.0, 1.0);
  float delay = 0.42 * (1.0 - h) + 0.18 * fract(seed * 3.7);
  float u = clamp(uMorph * 1.6 - delay, 0.0, 1.0);
  float e = u * u * (3.0 - 2.0 * u);
  float mid = sin(3.14159265 * u);

  // Busto: a cabeça segue o gesto; metade das moléculas repete o trajeto com atraso (dois perfis no tempo).
  vec2 pull = mix(uPull, uPullLag, late);
  float headW = smoothstep(-1.05, -0.38, position.y) * (1.0 - e);
  vec3 pivot = vec3(0.0, -0.5, -0.08);
  vec3 pb = rx(ry(position - pivot, pull.x * headW), pull.y * headW) + pivot;
  vec3 nb = rx(ry(aNormal, pull.x * headW), pull.y * headW);

  // Cérebro: escuta (onda que converge) e resposta (pulso pelos sulcos, de dentro para fora).
  vec3 rd = aBrain - vec3(0.0, 0.06, 0.0);
  float r = length(rd);
  rd /= max(r, 1e-4);
  float wIn = sin(r * 17.0 + uTime * 5.2);
  float wOut = 0.5 + 0.5 * sin(r * 13.0 - uTime * 6.4);
  vec3 pc = aBrain + rd * (0.02 * uListen * wIn + 0.014 * uSpeak * wOut * (1.0 - aMeta.z) - 0.05 * uListen);

  vec3 p = mix(pb, pc, e);
  vec3 n = normalize(mix(nb, aBrainN, e));
  // No caminho: a testa recua; a mandíbula e o pescoço sobem em espiral.
  float brow = smoothstep(0.0, 0.3, position.y) * smoothstep(0.0, 0.3, position.z);
  float jaw = smoothstep(0.0, -0.5, position.y);
  p.z -= brow * mid * 0.55;
  float ang = jaw * mid * (1.6 + 2.2 * seed);
  float ca = cos(ang), sa = sin(ang);
  p.xz = vec2(ca * p.x - sa * p.z, sa * p.x + ca * p.z) * (1.0 + jaw * mid * 0.4);
  // Perfil: a matéria se alinha em linhas, como texto composto.
  p.y = mix(p.y, (floor(p.y * 44.0) + 0.5) / 44.0, uAlign * (1.0 - e));

  // O recorte: primeiro a cabeça vira de perfil, depois a matéria se abre (só no busto).
  float turn = smoothstep(0.0, 0.55, uPortal) * (1.0 - e);
  float gap = smoothstep(0.42, 1.0, uPortal) * (1.0 - e);
  float sway = (1.0 - uCalm) * (1.0 - uFold) * (1.0 - turn);
  // o cérebro se mostra de lado e um pouco de cima: é assim que os hemisférios e os sulcos se leem
  float yaw = mix(mix(uYaw, uPortalYaw, turn), -1.02, e) + sin(uTime * 0.21) * 0.045 * sway + e * sin(uTime * 0.17) * 0.14 * (1.0 - uCalm);
  p = rx(ry(p, yaw), 0.42 * e);
  n = rx(ry(n, yaw), 0.42 * e);
  // Dissolução: fragmentos finos se soltam para trás e somem; outros tomam o lugar.
  float flow = fract(seed * 5.0 + uTime * 0.035 * (1.0 - 0.7 * uCalm));
  float gone = dis * dis * (1.0 - e);
  p += vec3(0.62, 0.08 + 0.1 * sin(seed * 31.0), -0.3) * gone * (0.18 + 0.95 * flow);
  p.y += sin(uTime * 0.55) * 0.012 * sway;
  // Entrada: as moléculas chegam de fora e assentam.
  float arrive = clamp(uIntro * 1.5 - 0.5 * fract(seed * 9.1), 0.0, 1.0);
  arrive = 1.0 - pow(1.0 - arrive, 3.0);
  p += normalize(p + vec3(0.001)) * (1.0 - arrive) * (0.5 + seed);

  // Ver através do rosto. Tudo é medido como se vê na tela (projeção sobre o plano da figura), para o recorte
  // coincidir com o elemento que a interface desenha por cima: centro uPortalC e raios uPortalR, em unidades.
  float rim = 0.0;
  if (uPortal > 0.001) {
    float isArc = step(1.5, aMeta.w * 255.0);
    // O arco da nuca desliza para a frente e vira a moldura do recorte: a ponta que entra na cabeça chega primeiro.
    float along = clamp((position.y + 1.0) / 1.5, 0.0, 1.0);
    float slide = clamp(uPortal * 2.1 - 0.9 * (1.0 - along) - 0.2, 0.0, 1.0);
    slide = slide * slide * (3.0 - 2.0 * slide) * isArc * (1.0 - e);
    float th = mix(-2.3, 3.6, along) + 0.12 * sin(uTime * 0.5 + seed * 6.2832);
    float lane = 1.07 + 0.07 * (fract(seed * 17.3) - 0.5);
    vec3 frame = vec3(uPortalC + uPortalR * lane * vec2(cos(th), sin(th)), 0.5 + 0.06 * (fract(seed * 29.7) - 0.5));
    p = mix(p, frame, slide);
    n = normalize(mix(n, vec3(cos(th) * 0.55, sin(th) * 0.55, 0.62), slide));
    // As demais moléculas que estariam dentro do recorte escorrem para a borda: o vão atravessa a cabeça inteira.
    float f = uCamZ / (uCamZ - uScale * p.z);
    vec2 q = ((uOffset.xy + uScale * p.xy) * f - uOffset.xy) / uScale;
    vec2 d = (q - uPortalC) / uPortalR;
    float r = length(d);
    if (r < gap && isArc < 0.5) {
      vec2 dir = r > 1e-4 ? d / r : vec2(cos(seed * 6.2832), sin(seed * 6.2832));
      vec2 q2 = uPortalC + dir * uPortalR * gap * (1.0 + 0.045 * fract(seed * 11.0));
      p.xy = ((q2 * uScale + uOffset.xy) / f - uOffset.xy) / uScale;
      n = normalize(vec3(dir * 0.62, 0.78));
      rim = gap;
    }
    rim = max(rim, slide * 0.7);
  }
  vRim = rim;

  vec4 mv = modelViewMatrix * vec4(p * uScale + uOffset, 1.0);
  vN = normalize(normalMatrix * n);
  gl_Position = projectionMatrix * mv;
  // altura na tela em relação à linha do mar (unidades da figura): abaixo dela a prata fica debaixo d'água
  vSea = ((mv.y * uCamZ / -mv.z) - uOffset.y) / uScale - uSeaY;

  float facing = smoothstep(-0.4, 0.15, vN.z);
  float slit = uSlit < 0.0 ? 0.0 : exp(-pow((p.x - mix(-0.8, 0.8, uSlit)) / 0.05, 2.0));
  vSulcus = aMeta.z * e;
  vE = e;
  vGhost = late * uFold * (1.0 - e);
  vGlow = slit * 1.5 + e * (uListen * max(wIn, 0.0) * 0.3 + uSpeak * pow(wOut, 6.0) * (0.2 + aMeta.z) * 1.1);
  // telefone: o busto se apaga antes da grade de aplicativos (uFloor, em unidades abaixo do centro da cabeça)
  vShade = (0.1 + 0.9 * facing) * arrive * (1.0 - 0.65 * gone * flow) * mix(smoothstep(uFloor, uFloor - 0.34, -p.y), 1.0, e);
  float size = uSize * (0.72 + 0.56 * fract(seed * 13.7)) * mix(1.0, 0.5, gone) * (0.45 + 0.55 * facing) * mix(1.0, 0.86, e);
  gl_PointSize = max(1.0, size * uScale * uPx * uCamZ / -mv.z);
}
`;

export const MOLECULE_FRAG = /* glsl */ `
uniform vec3 uMetal, uKey, uRim, uAccent, uShade, uFade;
uniform float uLight, uBead, uTintK, uStripAz, uSea;
uniform sampler2D uTint;
varying vec3 vN;
varying float vShade, vSulcus, vGlow, vGhost, vE, vSea, vRim;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  vec3 n = normalize(vN + vec3(c.x, -c.y, sqrt(1.0 - r2)) * uBead);
  vec3 rr = reflect(vec3(0.0, 0.0, -1.0), n);
  float az = atan(rr.x, rr.z);
  float el = rr.y;

  // O que o metal reflete: céu baixo, a faixa estreita de luz (testa → nariz → clavícula) e o recorte por trás.
  float sky = pow(clamp(0.5 + 0.5 * el, 0.0, 1.0), 2.0);
  float strip = exp(-pow((az - uStripAz) / 0.085, 2.0)) * smoothstep(-0.98, -0.5, el) * smoothstep(1.0, 0.7, el);
  // caixa de luz larga, à frente e acima: é ela que dá o degradê de prata
  float wash = exp(-pow((az + 0.55) / 0.8, 2.0) - pow((el - 0.3) / 0.7, 2.0));
  float rim = exp(-pow((az - 2.25) / 0.3, 2.0)) + 0.5 * exp(-pow((az + 2.7) / 0.25, 2.0));
  float fres = pow(1.0 - max(n.z, 0.0), 3.0);

  // o cérebro olha para cima: ganha mais céu no reflexo para continuar prata
  float body = mix(0.03 + 0.3 * sky + 0.95 * wash, 0.26 + 0.5 * sky + 0.4 * wash, uLight) + vE * (0.16 + 0.5 * sky);
  vec3 col = mix(uShade, uMetal, min(body, 1.25)) + uKey * strip * mix(1.7, 1.0, uLight) + uRim * rim * mix(1.1, 0.7, uLight);
  // Tema claro: a borda de cada molécula deixa passar o fundo, como vidro.
  col = mix(col, uFade, uLight * fres * 0.6);

  // Reflexo da capa de um projeto na prata.
  vec3 cover = texture2D(uTint, vec2(0.5) + n.xy * vec2(0.47, 0.47)).rgb;
  col = mix(col, cover * (0.3 + 1.25 * (sky + strip + 0.3 * wash)), uTintK * 0.9);

  // rente a um sulco a prata escurece para a sombra do tema: a dobra ganha volume
  col = mix(col, uShade, 0.6 * vSulcus * vSulcus);
  // O perfil atrasado: mais frio e mais fraco — o mesmo rosto, em outro instante.
  col = mix(col, (col * 0.62 + uAccent * 0.1) , vGhost * 0.75);
  col += (uAccent * 0.85 + uKey * 0.3) * vGlow;
  // A borda do recorte pega a luz que vem de dentro.
  col += uKey * vRim * (0.22 + 0.5 * pow(max(n.z, 0.0), 6.0));
  // Debaixo da linha do mar a prata esfria e ganha o verde da água.
  float under = uSea * smoothstep(0.02, -0.3, vSea);
  col = mix(col, col * vec3(0.5, 0.88, 0.95) + vec3(0.0, 0.06, 0.08), under * 0.62);
  // O que se vê pelos sulcos é o lado de dentro do cérebro: no tema claro ele vira sombra azulada, não o branco do fundo.
  gl_FragColor = vec4(mix(mix(uFade, uShade, 0.82 * vE), col, vShade), 1.0);
}
`;

/**
 * O ambiente: um plano de tela inteira. Base, halo atrás da figura, névoa lenta, a FAIXA DE LUZ que
 * atravessa o fundo, se curva atrás da cabeça e reaparece deslocada quando o tempo dobra, a fenda que
 * abre a conversa, vinheta e pontilhado. Na troca de tema os dois ambientes são calculados e a frente
 * do novo avança em círculo a partir do controle.
 */
export const BACKDROP_VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const BACKDROP_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBaseA, uDeepA, uHazeA, uAccentA;
uniform vec3 uBaseB, uDeepB, uHazeB, uAccentB;
uniform float uLightA, uLightB;
uniform float uP;      // progresso da troca de tema
uniform vec2 uOrigin;  // origem da frente (px, y de baixo)
uniform vec3 uHead;    // centro da figura (px, y de baixo) e px por unidade
uniform float uBend;   // dobra do tempo: diferença entre os dois perfis
uniform float uBand;   // presença da faixa
uniform float uSlit;   // fenda (−1 = ausente; 0..1 = varredura)
uniform float uSea;    // a faixa de luz vira a superfície do mar (0..1)
uniform float uSeaY;   // altura da linha do mar, em unidades acima do centro da figura
uniform float uGrain;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float th(float x) { float e = exp(2.0 * clamp(x, -8.0, 8.0)); return (e - 1.0) / (e + 1.0); }

vec3 ambient(vec2 px, vec3 base, vec3 deep, vec3 haze, vec3 accent, float light) {
  float k = uHead.z;
  vec2 c = (px - uRes * 0.5) / max(uRes.x, uRes.y);
  vec3 col = mix(base, deep, smoothstep(0.15, 0.8, length(c * vec2(1.0, 1.25))));
  vec2 q = (px - uHead.xy) / k; // unidades do modelo, origem no centro da figura
  vec2 hq = q * vec2(0.72, 0.56) + vec2(0.0, 0.2);
  col = mix(col, mix(haze, vec3(1.0), light), exp(-dot(hq, hq) * 1.2) * mix(0.55, 0.8, light));
  float n = noise(px / (1.8 * k) + vec2(uTime * 0.012, -uTime * 0.008)) * 0.6 + noise(px / (0.7 * k) - vec2(uTime * 0.02, 0.0)) * 0.4;
  col += (haze - col) * (n - 0.45) * mix(0.3, 0.18, light);

  // A faixa: diagonal suave; atrás da cabeça ela se curva e sai do outro lado em outra altura.
  // Na prévia de mergulho ela deita, atravessa a tela inteira e vira a superfície do mar.
  vec2 dir = normalize(vec2(1.0, 0.2 * (1.0 - uSea)));
  float along = dot(q, dir);
  float across = dot(q, vec2(-dir.y, dir.x));
  float lens = exp(-dot(q, q) / 0.42);
  float ripple = uSea * 0.012 * sin(q.x * 5.0 + uTime * 0.9);
  float s = across - mix(0.06, uSeaY, uSea) - ripple - (1.0 - uSea) * (uBend * 0.34 * th(along * 2.6) + (0.05 + 0.5 * abs(uBend)) * lens * sign(uBend + 1e-4));
  float reach = mix(smoothstep(2.3, 0.6, -along) * smoothstep(3.4, 1.0, along) * uBand, 1.0, uSea);
  // Abaixo da linha, a água: turquesa perto da luz, quase preta no fundo, com reflexos que se movem.
  float fathom = smoothstep(0.0, 2.4, -s);
  vec3 water = mix(vec3(0.05, 0.42, 0.5), vec3(0.0, 0.035, 0.07), fathom);
  float caustic = pow(noise(q * vec2(5.0, 2.4) + vec2(uTime * 0.11, uTime * 0.07)), 3.0) * exp(s * 1.6);
  col = mix(col, water + vec3(0.25, 0.6, 0.6) * caustic * 0.5, uSea * smoothstep(0.0, -0.05, s) * mix(0.93, 0.8, light));
  vec3 beam = mix(accent, vec3(0.62, 0.95, 0.96), uSea);
  float core = exp(-pow(s / 0.022, 2.0)) * reach;
  float glow = exp(-pow(s / 0.16, 2.0)) * reach;
  col = mix(col + beam * (core * 0.42 + glow * 0.07) + vec3(core * 0.2), mix(col, beam, glow * 0.12 + core * 0.3) + vec3(core * 0.08), light * (1.0 - uSea));

  // A fenda que abre a conversa: um fio vertical de luz atravessando o rosto.
  if (uSlit >= 0.0) {
    float sx = q.x - mix(-0.8, 0.8, uSlit);
    float line = exp(-pow(sx / 0.012, 2.0)) * smoothstep(1.9, 0.3, abs(q.y + 0.2));
    col = mix(col + (accent * 0.7 + vec3(0.5)) * line, mix(col, accent, line * 0.75), light);
  }
  col *= 1.0 - mix(0.5, 0.08, light) * smoothstep(0.35, 0.95, length(c * vec2(1.0, 1.3)));
  return col;
}

void main() {
  vec2 px = gl_FragCoord.xy;
  vec3 col = ambient(px, uBaseA, uDeepA, uHazeA, uAccentA, uLightA);
  if (uP > 0.0) {
    vec3 next = ambient(px, uBaseB, uDeepB, uHazeB, uAccentB, uLightB);
    float far = length(max(uOrigin, uRes - uOrigin)) * 1.08;
    float d = length(px - uOrigin);
    float front = uP * far;
    float edge = 0.06 * far;
    float m = 1.0 - smoothstep(front - edge, front, d);
    col = mix(col, next, m);
    col += mix(uAccentB, vec3(1.0), 0.4) * exp(-pow((d - front) / (0.018 * far), 2.0)) * 0.5 * step(0.001, uP) * step(uP, 0.999);
  }
  col += (hash(px + fract(uTime) * 61.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
`;
