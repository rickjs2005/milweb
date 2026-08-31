/**
 * Máscara de terra do globo — contornos MUITO simplificados dos continentes
 * em (longitude, latitude), rasterizados num canvas equirretangular pequeno
 * (256×128 ≈ 1,4° por pixel) que vira textura do shader.
 *
 * Por que polígonos e não uma imagem: 4 KB de código contra ~40 KB de PNG, sem
 * request, sem decode, sem CDN — e o desenho fica editável. A resolução alvo é
 * a do PONTILHADO do globo (~2,5° por ponto), então detalhe abaixo de ~250 km
 * não sobreviveria de qualquer forma; ilhas menores que isso ficaram de fora
 * de propósito. É um mapa EDITORIAL — legível como Terra, nunca uma base
 * cartográfica.
 *
 * Convenção: y = 0 do canvas é a latitude +90 (v = (90 − lat) / 180),
 * x = 0 é a longitude −180. Terra = branco, água = preto.
 */
type Ring = readonly (readonly [number, number])[];

/** Contornos preenchidos (terra). */
const LAND: Ring[] = [
  // AMÉRICA DO SUL — o contorno mais cuidado do conjunto (a ponta do Nordeste,
  // o delta do Amazonas e o cone sul são o que torna o globo reconhecível daqui)
  [
    [-81, -4], [-79, 2], [-77, 8], [-71, 12], [-61, 10], [-52, 5], [-50, 0], [-44, -2],
    [-38, -5], [-35, -8], [-38, -13], [-40, -20], [-44, -23], [-48, -25], [-53, -34],
    [-58, -38], [-62, -40], [-65, -45], [-68, -52], [-75, -52], [-73, -45], [-71, -30],
    [-70, -18], [-76, -14], [-81, -6],
  ],
  // AMÉRICA DO NORTE + AMÉRICA CENTRAL (Baía de Hudson entra como recorte abaixo)
  [
    [-168, 66], [-166, 60], [-158, 57], [-152, 59], [-146, 60], [-136, 58], [-130, 53],
    [-124, 48], [-124, 40], [-120, 34], [-117, 32], [-114, 29], [-112, 25], [-106, 23],
    [-100, 17], [-95, 16], [-92, 15], [-88, 16], [-83, 9], [-79, 9], [-84, 14], [-88, 21],
    [-91, 19], [-95, 19], [-97, 22], [-97, 26], [-94, 29], [-89, 29], [-84, 30], [-81, 25],
    [-81, 31], [-76, 35], [-74, 40], [-70, 43], [-66, 45], [-60, 46], [-55, 50], [-57, 54],
    [-64, 58], [-66, 62], [-78, 63], [-78, 70], [-85, 70], [-95, 68], [-105, 68], [-115, 70],
    [-125, 70], [-133, 69], [-141, 70], [-156, 71], [-166, 68],
  ],
  // GROENLÂNDIA
  [[-45, 60], [-52, 64], [-55, 68], [-58, 72], [-60, 76], [-55, 80], [-40, 82], [-25, 80], [-20, 75], [-22, 70], [-30, 68], [-38, 65], [-43, 60]],
  // ÁFRICA
  [
    [-17, 15], [-17, 21], [-13, 28], [-10, 31], [-6, 35], [0, 36], [10, 37], [11, 33],
    [16, 31], [22, 32], [28, 31], [33, 31], [35, 28], [38, 22], [40, 15], [43, 11],
    [51, 12], [51, 5], [43, 0], [41, -5], [40, -11], [35, -18], [33, -26], [27, -34],
    [20, -35], [18, -33], [13, -23], [12, -16], [9, -1], [3, 6], [-4, 5], [-8, 4], [-13, 8],
  ],
  // EURÁSIA (Europa + Ásia num anel só; mares interiores entram como recorte).
  // Percurso sem retorno sobre si mesmo: Ibéria → norte da Europa → Sibéria →
  // leste asiático → sudeste → Índia → Golfo Pérsico → Arábia → costa NORTE do
  // Mediterrâneo. Qualquer "volta atrás" aqui fecha o Mediterrâneo por winding.
  [
    [-9, 37], [-9, 43], [-2, 44], [-1, 46], [-4, 48], [2, 51], [4, 52], [8, 54], [8, 57],
    [10, 57], [13, 55], [19, 55], [21, 57], [24, 59], [27, 60], [22, 60], [19, 63], [17, 66],
    [21, 66], [24, 66], [23, 70], [28, 71], [33, 70], [40, 66], [44, 68], [52, 69], [60, 70],
    [68, 73], [74, 73], [80, 73], [86, 76], [95, 78], [105, 77], [113, 74], [125, 73],
    [135, 72], [145, 72], [155, 70], [163, 70], [170, 69], [180, 65], [178, 62], [170, 60],
    [163, 58], [157, 52], [152, 50], [142, 54], [137, 55], [141, 52], [143, 48], [135, 44],
    [131, 43], [128, 40], [126, 37], [122, 39], [118, 39], [121, 37], [123, 35], [120, 33],
    [122, 30], [118, 25], [110, 21], [108, 18], [106, 10], [103, 1], [100, 6], [98, 8],
    [94, 16], [90, 22], [86, 22], [82, 17], [80, 13], [77, 8], [73, 15], [70, 21], [68, 24],
    [62, 25], [57, 26], [52, 27], [48, 30], [51, 25], [54, 24], [56, 25], [59, 22], [55, 17],
    [50, 13], [45, 13], [43, 17], [39, 21], [35, 28], [34, 31], [36, 36], [31, 36], [27, 37],
    [23, 38], [20, 40], [18, 41], [16, 38], [13, 38], [15, 41], [12, 42], [10, 44], [6, 43],
    [3, 43], [0, 40], [-3, 37],
  ],
  // ILHAS BRITÂNICAS / IRLANDA / ISLÂNDIA
  [[-6, 50], [-2, 51], [1, 52], [-1, 55], [-3, 58], [-5, 57], [-6, 54], [-5, 52]],
  [[-10, 52], [-6, 52], [-6, 55], [-10, 54]],
  [[-24, 65], [-14, 66], [-14, 64], [-22, 63]],
  // MADAGASCAR
  [[43, -12], [50, -15], [50, -25], [45, -25], [43, -20]],
  // JAPÃO
  [[130, 31], [132, 34], [136, 35], [140, 36], [141, 41], [145, 44], [142, 45], [140, 40], [137, 37], [133, 34], [130, 33]],
  // SUDESTE ASIÁTICO — Sumatra, Java, Bornéu, Celebes, Nova Guiné, Filipinas
  [[95, 6], [99, 3], [104, -2], [106, -6], [102, -5], [97, 2]],
  [[105, -6], [114, -8], [114, -7], [105, -5]],
  [[109, 2], [117, 4], [119, -1], [116, -4], [110, -3], [108, 0]],
  [[119, 1], [125, 1], [125, -5], [121, -5], [119, -2]],
  [[131, -1], [141, -3], [147, -6], [150, -10], [144, -9], [137, -8], [131, -4]],
  [[120, 18], [124, 18], [126, 10], [123, 6], [120, 12]],
  // AUSTRÁLIA / NOVA ZELÂNDIA / TASMÂNIA
  [
    [113, -22], [114, -26], [115, -34], [118, -35], [124, -34], [129, -32], [134, -33],
    [137, -35], [140, -38], [146, -39], [150, -37], [153, -30], [153, -25], [149, -21],
    [145, -15], [142, -11], [137, -12], [132, -11], [129, -15], [125, -14], [122, -17], [117, -21],
  ],
  [[145, -41], [148, -41], [148, -43], [145, -43]],
  [[166, -46], [171, -44], [174, -41], [178, -38], [176, -36], [173, -35], [172, -40], [168, -44]],
  // ANTÁRTIDA — costa aproximada (a península chega a −63°); o resto do polo é preenchido
  [
    [-180, -78], [-160, -77], [-140, -74], [-120, -73], [-100, -73], [-80, -72], [-70, -70],
    [-60, -63], [-57, -63], [-62, -72], [-45, -77], [-30, -71], [-10, -70], [10, -70],
    [30, -68], [50, -66], [70, -67], [90, -66], [110, -66], [130, -66], [150, -70],
    [165, -77], [180, -78], [180, -90], [-180, -90],
  ],
];

/** Mares interiores — recortados depois do preenchimento. */
const WATER: Ring[] = [
  [[-95, 60], [-78, 60], [-77, 63], [-82, 65], [-88, 65], [-95, 63]], // Baía de Hudson
  [[-92, 48], [-84, 49], [-76, 44], [-83, 41], [-89, 45]], // Grandes Lagos
  [[28, 41], [41, 41], [41, 45], [31, 46], [28, 44]], // Mar Negro
  [[47, 37], [54, 38], [53, 46], [47, 46]], // Mar Cáspio
];

/** Coordenadas do marcador (Brasil — a origem do estúdio). */
export const HOME_COORD = { lon: -47.9, lat: -15.8 } as const;

export const EARTH_MASK_SIZE = { w: 256, h: 128 } as const;

/** Rasteriza a máscara equirretangular. Terra = branco, água = preto. */
export function createEarthMask(): HTMLCanvasElement {
  const { w, h } = EARTH_MASK_SIZE;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const X = (lon: number) => ((lon + 180) / 360) * w;
  const Y = (lat: number) => ((90 - lat) / 180) * h;
  const path = (ring: Ring) => {
    g.beginPath();
    ring.forEach(([lon, lat], i) => (i ? g.lineTo(X(lon), Y(lat)) : g.moveTo(X(lon), Y(lat))));
    g.closePath();
  };

  g.fillStyle = "#000";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#fff";
  for (const ring of LAND) {
    path(ring);
    g.fill();
  }
  g.fillStyle = "#000";
  for (const ring of WATER) {
    path(ring);
    g.fill();
  }
  return c;
}
