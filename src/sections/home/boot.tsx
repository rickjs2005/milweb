import { BootController } from "./boot-controller";

/**
 * ACT 01 — BOOT. Server-rendered: o overlay já vem no HTML com as
 * animações em CSS, então aparece no primeiro paint (é o LCP da Home no
 * mobile) sem esperar hidratação. O <script> inline remove o overlay antes
 * do paint quando a sessão já bootou ou com reduced-motion; o
 * BootController (client) rege a sequência longa, o skip e a escultura.
 *
 * Sequência visual (CSS, ver globals.css → .boot-*): tela quase vazia →
 * sinais discretos → estrutura/design/motion/interação carregando (barras)
 * → fragmentos → saída em clip-path. Se o JS nunca chegar, o overlay sai
 * sozinho em --boot-exit (2,6 s). Clique/tecla pulam.
 */
// `history.scrollRestoration = 'manual'` primeiro que tudo: o padrão do browser
// ('auto') reaplica o scrollY salvo quando a aba é fechada e reaberta (Ctrl+Shift+T
// no Edge/Chrome restaura sessionStorage junto) — o Lenis (import assíncrono,
// components/scroll-provider.tsx) inicializa DEPOIS, achando que a página está em
// 0; a posição nativa já pulou pra Y>0 enquanto a interna do Lenis fica presa em 0,
// e o wheel passa a mover uma coisa que não corresponde a nada visível (sintoma
// relatado: "fecho a aba, entro de novo, trava"). Sem isso pra disputar, a página
// sempre começa em 0 de verdade.
const SKIP_SCRIPT =
  "(function(){try{if('scrollRestoration' in history)history.scrollRestoration='manual';var h=document.documentElement;if(sessionStorage.getItem('mw:booted')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){h.classList.add('booted');}else{h.classList.add('booting');}}catch(e){}})();";

export function Boot({ mark, tagline, origin, lines, skip, compile }: { mark: string; tagline: string; origin: string; lines: readonly string[]; skip: string; compile: string }) {
  return (
    <>
      <div id="mw-boot" className="boot fixed inset-0 z-boot flex flex-col justify-between bg-ink px-margin py-8 text-paper" role="status" aria-label={mark}>
        <div className="flex items-center justify-between t-mono text-paper/60">
          <span className="boot-signal" style={{ animationDelay: "0.2s" }}>
            {mark}
          </span>
          <button type="button" data-boot-skip className="link-rule boot-signal" style={{ animationDelay: "0.35s" }}>
            {skip} →
          </button>
        </div>

        <div className="t-mono">
          <p className="boot-id t-display t-display-sm text-paper" style={{ animationDelay: "0.55s" }}>
            {mark}
          </p>
          <p className="boot-id mt-4 text-paper" style={{ animationDelay: "0.65s" }}>
            {tagline}
          </p>
          <p className="boot-id text-paper/60" style={{ animationDelay: "0.72s" }}>
            {origin}
          </p>
        </div>

        <div className="t-mono text-paper/70" aria-hidden="true">
          <ol>
            {lines.map((l, i) => (
              <li key={l} className="boot-line flex h-5 items-center gap-4 md:h-6" style={{ animationDelay: `${0.75 + i * 0.26}s` }}>
                <span className="w-40 shrink-0 truncate md:w-56">
                  <span className="text-signal">&gt;</span> {l}
                </span>
                <span className="boot-bar relative h-px w-24 bg-paper/20 md:w-40">
                  <span className="boot-bar-fill absolute inset-y-0 left-0 bg-signal" style={{ animationDelay: `${0.85 + i * 0.26}s` }} />
                </span>
              </li>
            ))}
            <li className="boot-line mt-3 flex h-5 items-center text-paper md:h-6" style={{ animationDelay: "1.85s" }}>
              <span className="text-signal">&gt;</span> {compile}
              <span className="boot-cursor ml-2 inline-block h-[1em] w-[0.6em] translate-y-[0.15em] bg-signal" />
            </li>
          </ol>
          {/* fragmentos: linhas e planos que saem de cena rumo ao hero */}
          <svg className="boot-fragments pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
            {[
              [120, 700, 520, 620],
              [980, 120, 1320, 260],
              [300, 200, 380, 560],
              [860, 760, 1240, 700],
              [640, 80, 700, 300],
              [1100, 480, 1400, 430],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} className="boot-frag" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i % 2 ? 1 : 2} style={{ animationDelay: `${1.45 + i * 0.08}s` }} />
            ))}
            <rect className="boot-frag" x="960" y="330" width="260" height="150" strokeWidth="1" style={{ animationDelay: "1.7s" }} />
            <rect className="boot-frag" x="1030" y="390" width="120" height="70" strokeWidth="1" style={{ animationDelay: "1.85s" }} />
          </svg>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <BootController />
    </>
  );
}
