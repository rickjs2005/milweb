import { BootController } from "./boot-controller";

/**
 * ACT 01 — BOOT. Server-rendered: o overlay já vem no HTML com as
 * animações em CSS, então aparece no primeiro paint (é o LCP da Home no
 * mobile) sem esperar hidratação. O <script> inline logo abaixo remove o
 * overlay antes do paint quando a sessão já bootou ou com reduced-motion.
 * O BootController (client) só cuida do scroll lock, do skip e da flag.
 *
 * Linha do tempo (CSS, ver globals.css → .boot-*): identidade sobe →
 * linhas de boot aparecem → cursor pisca → o overlay sobe em clip-path.
 * Total ≈ 1,9 s. Clique/tecla pulam.
 */
const SKIP_SCRIPT =
  "(function(){try{var b=document.getElementById('mw-boot');if(!b)return;if(sessionStorage.getItem('mw:booted')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){b.remove();}else{document.documentElement.classList.add('booting');}}catch(e){}})();";

export function Boot({ mark, tagline, origin, lines, skip }: { mark: string; tagline: string; origin: string; lines: string[]; skip: string }) {
  return (
    <>
      <div id="mw-boot" className="boot fixed inset-0 z-boot flex flex-col justify-between bg-ink px-margin py-8 text-paper" role="status" aria-label={mark}>
        <div className="flex items-center justify-between t-mono text-paper/60">
          <span>{mark}</span>
          <button type="button" data-boot-skip className="link-rule">
            {skip} →
          </button>
        </div>

        <div className="t-mono">
          <p className="boot-id t-display t-display-sm text-paper" style={{ animationDelay: "0.05s" }}>
            {mark}
          </p>
          <p className="boot-id mt-4 text-paper" style={{ animationDelay: "0.11s" }}>
            {tagline}
          </p>
          <p className="boot-id text-paper/60" style={{ animationDelay: "0.17s" }}>
            {origin}
          </p>
        </div>

        <ol className="t-mono text-paper/70" aria-hidden="true">
          {lines.map((l, i) => (
            <li key={l} className="boot-line" style={{ animationDelay: `${0.45 + i * 0.14}s` }}>
              <span className="text-signal">&gt;</span> {l}
            </li>
          ))}
          <li>
            <span className="boot-cursor inline-block h-[1em] w-[0.6em] translate-y-[0.15em] bg-signal" />
          </li>
        </ol>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <BootController />
    </>
  );
}
