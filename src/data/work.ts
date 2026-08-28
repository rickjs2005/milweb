import type { Localized } from "@/lib/content";

/**
 * Os quatro trabalhos da Home (ACT 03). Cada um ocupa uma viewport inteira.
 * `title` são as duas linhas do display; `image` é um frame 1440×900 do
 * projeto — o mesmo usado nas transições em mosaico.
 */
export type SelectedWork = {
  n: string;
  slug: string;
  name: string;
  title: { pt: [string, string]; en: [string, string]; es: [string, string] };
  kind: Localized;
  image: string;
};

export const SELECTED_WORK: SelectedWork[] = [
  {
    n: "01",
    slug: "kavita-drones",
    name: "KAVITA",
    title: { pt: ["AGRICULTURA", "REIMAGINADA."], en: ["AGRICULTURE", "REIMAGINED."], es: ["AGRICULTURA", "REIMAGINADA."] },
    kind: { pt: "Cliente · no ar", en: "Client · live", es: "Cliente · en línea" },
    image: "/shots/kavita-drones/hero.webp",
  },
  {
    n: "02",
    slug: "terral",
    name: "TERRAL",
    title: { pt: ["DO GRÃO", "À XÍCARA."], en: ["FROM BEAN", "TO CUP."], es: ["DEL GRANO", "A LA TAZA."] },
    kind: { pt: "Scrollytelling editorial", en: "Editorial scrollytelling", es: "Scrollytelling editorial" },
    image: "/shots/terral/sol.webp",
  },
  {
    n: "03",
    slug: "atelier-vertex",
    name: "ATELIER VERTEX",
    title: { pt: ["CONSTRUÍDO", "NO SCROLL."], en: ["BUILT BY", "SCROLL."], es: ["CONSTRUIDO", "EN EL SCROLL."] },
    kind: { pt: "Vídeo real 100% scroll-driven", en: "Real footage, 100% scroll-driven", es: "Video real 100% scroll-driven" },
    image: "/shots/atelier-vertex/entregue.webp",
  },
  {
    n: "04",
    slug: "aurex-timepieces",
    name: "AUREX",
    title: { pt: ["O TEMPO,", "DESMONTADO."], en: ["TIME,", "DISASSEMBLED."], es: ["EL TIEMPO,", "DESARMADO."] },
    kind: { pt: "Relógio 3D procedural · R3F", en: "Procedural 3D watch · R3F", es: "Reloj 3D procedural · R3F" },
    image: "/shots/aurex-timepieces.webp",
  },
];
