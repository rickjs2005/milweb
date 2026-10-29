// Gera as abóboras da edição de Halloween (public/halloween/pumpkin-{a,b,c}.svg): corpo com gomos e volume,
// caule curvo com gavinha e um rosto esculpido por variante, com luz de vela por dentro. O centro do corpo
// fica livre: o CSS põe ali o medalhão escuro com o ícone do aplicativo (styles/halloween.css).
//   node scripts/halloween-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "halloween");
mkdirSync(OUT, { recursive: true });

/** Rostos: olhos e boca ficam acima e abaixo do medalhão (centro 120,118, raio 40). */
const FACES = {
  // a — bravo: olhos inclinados e sorriso de dentes irregulares
  a: {
    eyes: ["M30 76 L76 88 L48 110 Z", "M210 76 L164 88 L192 110 Z"],
    mouth: "M60 166 Q120 206 180 166 L170 176 L162 168 L152 179 L142 168 L132 179 L120 168 L108 179 L98 168 L88 179 L78 168 L70 176 Z",
    extra: "",
  },
  // b — sorriso largo com dois dentes quadrados e olhos redondos
  b: {
    eyes: ["M36 100 a16 21 0 1 0 32 0 a16 21 0 1 0 -32 0 Z", "M172 100 a16 21 0 1 0 32 0 a16 21 0 1 0 -32 0 Z"],
    mouth: "M56 164 L184 164 Q120 214 56 164 Z",
    extra: '<rect x="84" y="164" width="18" height="15" rx="2" fill="url(#body)"/><rect x="138" y="164" width="18" height="15" rx="2" fill="url(#body)"/>',
  },
  // c — travesso: olhos em arco e boca em zigue-zague fino
  c: {
    eyes: ["M34 106 Q54 68 76 106 Q54 92 34 106 Z", "M164 106 Q186 68 206 106 Q186 92 164 106 Z"],
    mouth: "M58 168 L72 180 L86 168 L100 182 L114 169 L128 182 L142 169 L156 181 L170 168 L184 176 Q120 206 58 176 Z",
    extra: "",
  },
};

function pumpkin(key, f) {
  const cut = [...f.eyes, f.mouth];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 216" width="240" height="216">
<defs>
<radialGradient id="body" cx=".5" cy=".36" r=".78"><stop offset="0" stop-color="#ffbe55"/><stop offset=".34" stop-color="#ff8c1e"/><stop offset=".7" stop-color="#e0560a"/><stop offset="1" stop-color="#8a2904"/></radialGradient>
<linearGradient id="rib" x1="0" x2="1"><stop offset="0" stop-color="#b43e08" stop-opacity=".95"/><stop offset=".3" stop-color="#ff9a30" stop-opacity=".55"/><stop offset=".55" stop-color="#ff8418" stop-opacity=".25"/><stop offset="1" stop-color="#a73706" stop-opacity=".95"/></linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0c00" stop-opacity="0"/><stop offset=".62" stop-color="#3a0c00" stop-opacity=".08"/><stop offset="1" stop-color="#2a0800" stop-opacity=".62"/></linearGradient>
<linearGradient id="stem" x1="0" x2="1"><stop offset="0" stop-color="#8a9a2e"/><stop offset=".5" stop-color="#586a1a"/><stop offset="1" stop-color="#2f3a0c"/></linearGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff7b8"/><stop offset=".5" stop-color="#ffc83a"/><stop offset="1" stop-color="#ff7410"/></radialGradient>
<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
<clipPath id="clip"><ellipse cx="120" cy="118" rx="107" ry="85"/></clipPath>
</defs>
<ellipse cx="120" cy="118" rx="107" ry="85" fill="url(#body)"/>
<g clip-path="url(#clip)">
<ellipse cx="32" cy="122" rx="34" ry="68" fill="url(#rib)" stroke="#6b2002" stroke-opacity=".55" stroke-width="2.5"/>
<ellipse cx="208" cy="122" rx="34" ry="68" fill="url(#rib)" stroke="#6b2002" stroke-opacity=".55" stroke-width="2.5"/>
<ellipse cx="68" cy="120" rx="45" ry="79" fill="url(#rib)" stroke="#6b2002" stroke-opacity=".6" stroke-width="2.5"/>
<ellipse cx="172" cy="120" rx="45" ry="79" fill="url(#rib)" stroke="#6b2002" stroke-opacity=".6" stroke-width="2.5"/>
<ellipse cx="120" cy="118" rx="52" ry="85" fill="url(#rib)" stroke="#6b2002" stroke-opacity=".5" stroke-width="2.5"/>
<rect x="0" y="0" width="240" height="216" fill="url(#shade)"/>
<g filter="url(#blur)" opacity=".85">${cut.map((d) => `<path d="${d}" fill="#ffd24a"/>`).join("")}</g>
</g>
<ellipse cx="120" cy="45" rx="24" ry="8" fill="#6e2402" fill-opacity=".6"/>
<ellipse cx="86" cy="62" rx="30" ry="11" transform="rotate(-24 86 62)" fill="#fff" fill-opacity=".2" filter="url(#soft)"/>
${cut.map((d) => `<path d="${d}" fill="#2a0a00"/>`).join("\n")}
${cut.map((d) => `<path d="${d}" fill="url(#glow)" transform="translate(120 118) scale(.93) translate(-120 -118)"/>`).join("\n")}
${f.extra}
<path d="M110 50 C106 30 114 14 132 7 C140 4 148 9 142 16 C134 19 130 30 132 50 Z" fill="url(#stem)"/>
<path d="M112 46 C110 32 116 20 126 13" stroke="#b5c452" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M140 13 c13 -7 26 1 22 13 c-3 9 -14 8 -13 1" stroke="#586a1a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
<ellipse cx="120" cy="204" rx="64" ry="6" fill="#ff8a1e" fill-opacity=".14"/>
</svg>
`;
}

for (const [key, face] of Object.entries(FACES)) {
  const file = join(OUT, `pumpkin-${key}.svg`);
  writeFileSync(file, pumpkin(key, face));
  console.log("escrito", file);
}
