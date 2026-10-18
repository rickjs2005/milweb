"use client";

import Image from "next/image";
import { useState } from "react";
import { ExperimentStage } from "@/features/lab/experiment-stage";
import { LabPlayer } from "@/components/lab-player";
import { useOs } from "../os-shell";

/**
 * Lab — os experimentos ao vivo (carregados só quando pedidos) e os filmes
 * (poster leve; o vídeo completo só entra depois de "Assistir"). Quando a
 * janela é minimizada ou sai de tela, o palco desmonta e o experimento pára.
 */
export function LabApp({ active }: { active: boolean }) {
  const { payload } = useOs();
  const s = payload.s;
  const lab = payload.lab;
  const ex = lab.experiments;
  const [playing, setPlaying] = useState<Record<string, boolean>>({});

  return (
    <div className="os-lab">
      <header className="os-app__header">
        <p className="t-mono os-app__eyebrow">{String(lab.clips.length).padStart(3, "0")} {s.lab.films.toUpperCase()} · {String(ex.items.length).padStart(3, "0")} {s.lab.experiments.toUpperCase()}</p>
        <p className="os-app__lead">{lab.intro}</p>
      </header>

      {active ? (
        <ExperimentStage eyebrow={ex.eyebrow} intro={ex.intro} close={ex.close} running={ex.running} unsupported={ex.unsupported} items={ex.items} stage={ex.stage} />
      ) : (
        <p className="t-mono os-lab__paused">{ex.eyebrow} — {ex.stage.idle}</p>
      )}

      <section className="os-app__section" aria-labelledby="os-lab-films">
        <h3 id="os-lab-films" className="t-mono os-app__label">
          {s.lab.films.toUpperCase()}
        </h3>
        <ol className="os-lab__films">
          {lab.clips.map((c, i) => {
            const on = !!playing[c.full] && active;
            return (
              <li key={c.full} className="os-lab__film">
                <div className="os-lab__media">
                  {on ? (
                    <LabPlayer src={c.full} poster={c.poster} label={c.title} hint={lab.watchHint} />
                  ) : (
                    <button type="button" className="os-lab__poster" onClick={() => setPlaying((p) => ({ ...p, [c.full]: true }))} aria-label={`${s.lab.watch} — ${c.title}`}>
                      <Image src={c.poster} alt="" fill sizes="(max-width: 719px) 92vw, 280px" className="os-lab__poster-img" />
                      <span className="os-lab__play t-mono">▶ {s.lab.watch}</span>
                    </button>
                  )}
                </div>
                <div className="os-lab__text">
                  <p className="t-mono os-lab__n">LAB / {String(i + 1).padStart(3, "0")}</p>
                  <h4 className="os-lab__title">{c.title}</h4>
                  <p className="os-lab__desc">{c.desc}</p>
                  <p className="t-mono os-lab__tags">
                    {lab.madeWith.toUpperCase()} — <span>{c.tags.join(" · ")}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="os-app__footer t-mono">
        <p className="os-lab__cta">{lab.ctaTitle}</p>
        <a href={lab.waHref} target="_blank" rel="noopener noreferrer" className="link-rule">
          [ {lab.whatsapp} ↗ ]
        </a>
      </footer>
    </div>
  );
}
