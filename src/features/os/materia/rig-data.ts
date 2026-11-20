// GERADO por assets/materia/build_figure.py — não editar à mão.
// Medidas do esqueleto da figura (unidades da cena: a ponta da dobra em repouso é a origem, a cabeça mede ~1).
export const RIG = {
  /** Comprimento do braço e do antebraço; a mão começa no punho, em x = L1 + L2 do espaço de repouso. */
  L1: 1.3, L2: 1.3,
  /** Ombros (a = o braço que segura a ponta; b = o outro, escondido atrás do pescoço) e o pivô da cabeça. */
  shoulderA: [2.7800, 0.5000, -0.0500], shoulderB: [1.7200, 0.1200, -0.7000],
  neck: [1.6402, 0.3508, 0.0081],
  /** Onde a pinça fecha na home e a orientação da mão ali (dedos, dorso, lado do polegar — três vetores). */
  pinch: [0.0000, 0.0000, 0.9500], homeHand: [-0.6800, 0.5872, 0.4390, 0.6991, 0.6998, 0.1468, 0.2210, -0.4067, 0.8864],
  /** Pontos de contato da mão, a partir do punho, nos eixos dela: a pinça, a palma (apoiar) e a ponta dos dedos. */
  contact: { pinch: [0.6149, -0.4722, 0.1705], palm: [0.3380, -0.1105, 0.0260], tips: [0.9360, -0.0650, 0.0260] },
  /** As formas da mão, na ordem em que vêm no arquivo. */
  shapes: ["pinch", "open", "relax"],
} as const;
