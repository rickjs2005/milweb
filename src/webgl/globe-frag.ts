/**
 * O GLOBO — um único quad de tela inteira; a esfera é analítica (interseção
 * com o disco unitário), sem malha, sem three.js. Roda no MESMO renderer
 * WebGL 1 do resto do site (src/webgl/renderer.ts).
 *
 * A forma é contínua entre DUAS leituras da mesma figura:
 *
 *   uMorph = 0   o "O" tipográfico — anel opaco, largura de haste da Archivo,
 *                elipse na proporção real do glifo (uAspect vem do DOM)
 *   uMorph = 1   a esfera — a haste afinou até virar a silhueta de 1 px e o
 *                vazio interno do "O" virou volume (sombreado, meridianos,
 *                continentes)
 *
 * Não há troca de figura em nenhum ponto: o raio externo é o MESMO contorno
 * do começo ao fim, só o miolo muda de significado.
 *
 * Paleta: tinta sobre papel. Sem azul, sem bloom, sem specular. O único
 * acento é o marcador do Brasil em Signal Green, e só no fim.
 */
export const GLOBE_FRAG = `
precision highp float;
varying vec2 vUv;

uniform vec2  uRes;      // canvas em px de device
uniform vec2  uCenter;   // centro do globo em px (y para baixo)
uniform float uRadius;   // raio vertical em px
uniform float uAspect;   // raio horizontal / vertical (1 = círculo)
uniform float uStroke;   // espessura da haste, fração do raio
uniform float uMorph;    // 0 letra → 1 esfera
uniform float uDepth;    // sombreado do volume
uniform float uLand;     // continentes
uniform float uMesh;     // meridianos e paralelos
uniform float uSpin;
uniform float uTilt;
uniform float uFade;     // opacidade global
uniform float uInk;      // 1 = modo dev (paleta invertida)
uniform float uMark;     // marcador Brasil
uniform sampler2D uTex;  // máscara de terra equirretangular

#define PI 3.141592653589793

float over(float a, float b) { return a + b * (1.0 - a); }

void main() {
  vec2 frag = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);
  vec2 d = (frag - uCenter) / uRadius;
  d.x /= max(uAspect, 0.001);
  float r2 = dot(d, d);

  // Descarte barato: 95 % dos pixels da tela saem aqui. É o que mantém um
  // quad de tela inteira honesto para um objeto pequeno.
  if (r2 > 1.35 || uFade <= 0.001) { gl_FragColor = vec4(0.0); return; }

  float r = sqrt(r2);
  float px = 1.0 / uRadius;                 // 1 px em unidades de raio
  vec3 ink = mix(vec3(0.067), vec3(0.949, 0.941, 0.918), uInk);
  vec3 signal = vec3(0.718, 1.0, 0.216);

  // ---- forma ---------------------------------------------------------
  // a haste do "O" afina até a silhueta; o miolo abre e vira volume
  float open = smoothstep(0.0, 0.62, uMorph);
  float inner = mix(1.0 - uStroke, 1.0 - 1.6 * px, open);
  float ringA = smoothstep(px, -px, r - 1.0) * smoothstep(-px, px, r - inner);

  float a = 0.0;
  vec3 col = ink;

  // ---- volume --------------------------------------------------------
  float z = sqrt(max(0.0, 1.0 - r2));
  float face = smoothstep(0.0, 0.16, z);    // suaviza o limbo
  if (r < inner + px * 2.0 && uDepth > 0.001) {
    vec3 n = vec3(d.x, -d.y, z);

    // sombreado: um terminador macio, luz alta à esquerda. É a única
    // "iluminação" — nada de specular, o globo é impresso, não renderizado.
    vec3 L = normalize(vec3(-0.45, 0.42, 0.79));
    float lam = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);
    float shade = (1.0 - lam) * 0.17 * uDepth;
    // vinheta interna junto ao limbo: dá a curvatura sem contorno duro
    shade = over(shade, pow(1.0 - z, 5.0) * 0.30 * uDepth);
    a = over(a, shade);

    // rotação: inclinação do eixo e giro lento
    float ct = cos(uTilt), st = sin(uTilt);
    vec3 m = vec3(n.x, n.y * ct + n.z * st, -n.y * st + n.z * ct);
    float cs = cos(uSpin), ss = sin(uSpin);
    vec3 g = vec3(m.x * cs - m.z * ss, m.y, m.x * ss + m.z * cs);
    float lat = asin(clamp(g.y, -1.0, 1.0));
    float lon = atan(g.z, g.x);

    // meridianos e paralelos — a "grid" da MilWeb enrolada numa esfera
    if (uMesh > 0.001) {
      float w = 2.2 * px;
      float latG = PI / 12.0;
      float lonG = PI / 12.0;
      float dLat = abs(fract(lat / latG + 0.5) - 0.5) * latG;
      float dLon = abs(fract(lon / lonG + 0.5) - 0.5) * lonG * max(cos(lat), 0.06);
      float mesh = max(smoothstep(w, 0.0, dLat), smoothstep(w, 0.0, dLon));
      a = over(a, mesh * 0.16 * uMesh * face * face);
      // equador com um pouco mais de peso: é uma régua, não um fio qualquer
      a = over(a, smoothstep(w * 1.3, 0.0, abs(lat)) * 0.20 * uMesh * face);
    }

    // continentes em matriz de pontos, distribuída por área (colunas por
    // linha caem com cos(lat)) — o mapa é lido no CENTRO de cada célula, então
    // a costa aparece como ponto menor, não como serrilhado
    if (uLand > 0.001) {
      float rows = 46.0;
      float latStep = PI / rows;
      float row = floor((lat + PI * 0.5) / latStep);
      float latC = (row + 0.5) * latStep - PI * 0.5;
      float cols = max(4.0, floor(2.0 * rows * cos(latC)));
      float lonStep = 2.0 * PI / cols;
      float col = floor((lon + PI) / lonStep);
      float lonC = (col + 0.5) * lonStep - PI;
      vec2 cell = vec2((lon - lonC) / lonStep, (lat - latC) / latStep);
      float dd = length(cell);
      vec2 uv = vec2((lonC + PI) / (2.0 * PI), (PI * 0.5 - latC) / PI);
      float land = texture2D(uTex, uv).r;
      float grow = smoothstep(0.12, 0.62, land) * uLand;
      float dot0 = smoothstep(0.38 * grow, 0.16 * grow, dd);
      a = over(a, dot0 * (0.34 + 0.30 * (1.0 - z)) * face);
    }

    // marcador: o ponto de origem. Aparece só quando o globo já está formado.
    if (uMark > 0.001) {
      float latB = ${(-15.8 * Math.PI) / 180};
      float lonB = ${(-47.9 * Math.PI) / 180};
      float cosD = sin(lat) * sin(latB) + cos(lat) * cos(latB) * cos(lon - lonB);
      float ang = acos(clamp(cosD, -1.0, 1.0));
      float core = smoothstep(0.030, 0.018, ang);
      float ring = smoothstep(0.006, 0.0, abs(ang - 0.085));
      float mk = max(core, ring * 0.8) * uMark * face;
      float aNew = over(a, mk);
      col = mix(col, signal, mk / max(aNew, 0.001));
      a = aNew;
    }
  }

  // A silhueta perde um pouco de tinta conforme vira contorno de esfera: em
  // tinta cheia, o fio de 1 px lê como adesivo recortado sobre o papel.
  a = over(a, ringA * mix(1.0, 0.72, open));
  a *= uFade;
  if (a <= 0.002) { gl_FragColor = vec4(0.0); return; }
  gl_FragColor = vec4(col * a, a);
}
`;
