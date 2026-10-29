/**
 * Vampiro: rosto alongado com maçãs e sombras de arcada, olhos fundos de íris vermelha (as pupilas são um grupo
 * próprio, olhos HTML `.hw-vp` por cima, movidos pela cena em direção ao ponteiro), presas, gola alta em asas com forro carmim,
 * babado branco com broche, casaca estreita e uma capa de dobras largas com a barra rasgada e textura de pano.
 * Luz: contraluz laranja da lua do lado esquerdo, frio arroxeado do lado direito.
 */
const HEM = (() => {
  // barra rasgada: pontas de alturas irregulares
  const pts = [0, 14, 30, 48, 66, 82, 100, 118, 140, 160, 180, 200, 222, 244, 266, 286, 300];
  const ys = [500, 520, 506, 524, 508, 520, 504, 522, 510, 524, 506, 520, 508, 522, 504, 518, 500];
  return pts.map((x, i) => `L${x} ${ys[i]}`).join("");
})();

export function Vampire() {
  return (
    <svg viewBox="0 0 300 530" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hw-v-cape" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#33204a" />
          <stop offset=".35" stopColor="#150c22" />
          <stop offset=".75" stopColor="#0a0511" />
          <stop offset="1" stopColor="#2a1c40" />
        </linearGradient>
        <linearGradient id="hw-v-lining" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c0203a" />
          <stop offset=".6" stopColor="#6a0c20" />
          <stop offset="1" stopColor="#2a0510" />
        </linearGradient>
        <radialGradient id="hw-v-skin" cx=".38" cy=".3" r=".85">
          <stop offset="0" stopColor="#f2e6df" />
          <stop offset=".55" stopColor="#cdb9b3" />
          <stop offset="1" stopColor="#7e6a7c" />
        </radialGradient>
        <linearGradient id="hw-v-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb25a" stopOpacity=".95" />
          <stop offset="1" stopColor="#ff7a2a" stopOpacity=".15" />
        </linearGradient>
        <filter id="hw-v-cloth" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".6 .09" numOctaves="3" seed="12" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.4 -.55" />
        </filter>
        <filter id="hw-v-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <clipPath id="hw-v-capeclip">
          <path d={`M150 86C98 92 46 150 24 262C10 352 8 440 0 500${HEM}L300 500C292 440 290 352 276 262C254 150 202 92 150 86Z`} />
        </clipPath>
      </defs>

      <g className="hw-cape">
        <path d={`M150 86C98 92 46 150 24 262C10 352 8 440 0 500${HEM}L300 500C292 440 290 352 276 262C254 150 202 92 150 86Z`} fill="url(#hw-v-cape)" />
        {/* forro carmim visível na abertura */}
        <path d="M150 120C124 168 100 270 90 510H152Z" fill="url(#hw-v-lining)" />
        <path d="M150 120C176 168 200 270 210 510H148Z" fill="url(#hw-v-lining)" opacity=".92" />
        {/* dobras largas da capa */}
        <g clipPath="url(#hw-v-capeclip)" fill="none" strokeLinecap="round">
          <path d="M70 150C48 250 40 380 36 520" stroke="#000" strokeOpacity=".5" strokeWidth="12" />
          <path d="M54 160C34 260 26 390 22 520" stroke="#6a4a96" strokeOpacity=".28" strokeWidth="3" />
          <path d="M232 150C254 250 262 380 266 520" stroke="#000" strokeOpacity=".5" strokeWidth="12" />
          <path d="M246 160C268 260 276 390 280 520" stroke="#6a4a96" strokeOpacity=".2" strokeWidth="3" />
          <path d="M104 220C92 320 88 420 86 520" stroke="#000" strokeOpacity=".35" strokeWidth="8" />
          <path d="M198 220C210 320 214 420 216 520" stroke="#000" strokeOpacity=".35" strokeWidth="8" />
          <rect width="300" height="530" fill="#000" opacity=".5" filter="url(#hw-v-cloth)" style={{ mixBlendMode: "multiply" }} />
        </g>
        {/* contraluz laranja na borda esquerda da capa */}
        <path d="M150 86C98 92 46 150 24 262C10 352 8 440 0 500" fill="none" stroke="url(#hw-v-rim)" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* casaca e babado */}
      <path d="M104 132L196 132L210 330L204 520H96L90 330Z" fill="#0b0612" />
      <path d="M104 132L132 148L150 252L118 220Z" fill="#150c20" stroke="#2a1c40" strokeWidth="1" />
      <path d="M196 132L168 148L150 252L182 220Z" fill="#150c20" stroke="#2a1c40" strokeWidth="1" />
      <path d="M132 146L168 146L150 252Z" fill="#ece5e3" />
      <g fill="#fff" stroke="#bcb0b0" strokeWidth=".8">
        <path d="M134 152q8 8 16 0q8 8 16 0q-4 18-16 24q-12-6-16-24z" />
        <path d="M138 178q6 7 12 0q6 7 12 0q-4 14-12 18q-8-4-12-18z" />
      </g>
      <circle cx="150" cy="170" r="5.5" fill="#c4122b" />
      <circle cx="148" cy="168" r="2" fill="#ff8a98" />

      {/* gola alta em asas */}
      <path d="M108 140L86 38L132 96Z" fill="#1c0e28" stroke="#c0203a" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M192 140L214 38L168 96Z" fill="#1c0e28" stroke="#c0203a" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M96 70L112 118M204 70L188 118" stroke="#000" strokeOpacity=".5" strokeWidth="3" />
      <path d="M86 38L108 140" stroke="url(#hw-v-rim)" strokeWidth="2" fill="none" />

      {/* pescoço e cabeça */}
      <path d="M134 128L166 128L162 150L138 150Z" fill="#a89096" />
      <path d="M150 50C178 50 194 74 192 102C190 124 176 142 150 156C124 142 110 124 108 102C106 74 122 50 150 50Z" fill="url(#hw-v-skin)" />
      {/* sombras: maçãs, arcada, olheiras */}
      <g fill="#5a4258" opacity=".55">
        <path d="M118 110C122 124 134 138 146 146C132 142 118 130 112 112Z" />
        <path d="M182 110C178 124 166 138 154 146C168 142 182 130 188 112Z" />
        <ellipse cx="136" cy="102" rx="12" ry="8" />
        <ellipse cx="164" cy="102" rx="12" ry="8" />
      </g>
      <path d="M118 90C128 84 140 86 144 92M182 90C172 84 160 86 156 92" stroke="#2a1a2a" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* cabelo penteado para trás, bico de viúva */}
      <path d="M108 96C100 54 122 32 150 32C178 32 200 54 192 96C186 76 174 66 158 60L150 76L142 60C126 66 114 76 108 96Z" fill="#060309" />
      <path d="M120 44C132 38 150 36 160 38" stroke="#3a2a52" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* orelhas pontudas */}
      <path d="M108 100L90 80L106 118Z" fill="#b8a3a8" />
      <path d="M192 100L210 80L194 118Z" fill="#b8a3a8" />
      {/* olhos: íris vermelhas com brilho e pupilas móveis */}
      {/* órbitas escuras: a íris vermelha e as pupilas são elementos HTML por cima (scene.tsx › VampireEyes), para o
          SVG com filtros nunca ser repintado quando os olhos se mexem */}
      <ellipse cx="136" cy="102" rx="10.5" ry="6.4" fill="#2a0a14" opacity=".75" />
      <ellipse cx="164" cy="102" rx="10.5" ry="6.4" fill="#2a0a14" opacity=".75" />
      {/* nariz, boca e presas */}
      <path d="M150 104L146 124Q150 128 154 124" stroke="#6a5560" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M134 138Q150 146 168 136" stroke="#5a1a28" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M140 141L142 152L145 142ZM156 142L159 152L161 140Z" fill="#fffdf6" stroke="#cbbfbf" strokeWidth=".5" />
      <path d="M142 152Q150 158 158 152" stroke="#6a5560" strokeOpacity=".5" strokeWidth="1.4" fill="none" />
      {/* contraluz laranja no perfil esquerdo */}
      <path d="M150 50C122 50 106 74 108 102C110 124 124 142 150 156" fill="none" stroke="url(#hw-v-rim)" strokeWidth="2.4" strokeLinecap="round" />

      {/* mãos longas segurando a capa */}
      <g fill="#a99a9a" stroke="#4a3a48" strokeWidth=".9" strokeLinejoin="round" opacity=".92">
        <path d="M76 318C64 322 58 334 62 346L84 356L102 340L98 322Z" />
        <path d="M62 346L48 372L54 376L70 354M70 352L60 384L66 386L78 358M80 356L76 388L82 388L88 358M90 354L94 384L100 382L98 352" />
        <path d="M224 318C236 322 242 334 238 346L216 356L198 340L202 322Z" />
        <path d="M238 346L252 372L246 376L230 354M230 352L240 384L234 386L222 358M220 356L224 388L218 388L212 358M210 354L206 384L200 382L202 352" />
      </g>
      <g fill="#1a0a14">
        <path d="M48 372L46 378L54 376ZM60 384L58 392L66 386ZM76 388L76 396L82 388ZM94 384L96 392L100 382Z" />
        <path d="M252 372L254 378L246 376ZM240 384L242 392L234 386ZM224 388L224 396L218 388ZM206 384L204 392L200 382Z" />
      </g>
    </svg>
  );
}
