"use client";

import { useEffect, useRef, useState } from "react";
import { useOs, useOsStore } from "../os-shell";
import { Bat, Candle, Graveyard, Mound, Spider, Stars, Web, Witch, ZombieBody, ZombieHand } from "./art/layers";
import { Castle } from "./art/castle";
import { CloudBand } from "./art/clouds";
import { Ghost } from "./art/ghost";
import { Vampire } from "./art/vampire";
import { reactCastle, reactGhost, reactSpider } from "./audio";
import { createInteractions, type Controller } from "./interaction";
import { probeGpu } from "@/lib/quality";
import "./scene.css";

/**
 * A casa assombrada: camadas independentes, cada uma com a sua profundidade, atrás da interface.
 *
 *   céu e estrelas → lua e halo → nuvens → bruxa → castelo → cemitério e árvores → personagens (vampiro,
 *   fantasmas, zumbi, morcegos) → primeiro plano (névoa, velas, abóboras) → teias e aranhas
 *   → ESCURIDÃO (camada que a lanterna fura) → LANTERNA (a versão iluminada do castelo e do cemitério,
 *   olhos escondidos e névoa, só dentro do foco) → véu de legibilidade → dica.
 *
 * Toda a animação ambiente é CSS (transform/opacity, camadas no compositor). A reação ao visitante é o
 * sistema coordenado de interaction.ts (um listener de ponteiro, `gsap.quickTo`, nada de React por quadro).
 * Cada criatura que reage tem um invólucro próprio (`.hw-gr`, `.hw-dr`): a animação ambiente fica no elemento
 * de fora e a reação no de dentro — dois sistemas nunca escrevem o mesmo `transform`.
 * O texto, os apps e os controles ficam FORA desta árvore e nunca se movem. A cena é decorativa: aria-hidden,
 * pointer-events: none (a zona de toque do celular é a única parte que escuta, e não bloqueia rolagem).
 *
 * Movimento reduzido (sistema ou Ajustes, mesmo mudando na sessão): composição estável, criaturas só com
 * brilho. Aba oculta: animações pausam (`html[data-os-hidden]`). Janela aberta: a lanterna e as reações
 * diminuem para o conteúdo ter prioridade.
 */
const EYES = [
  { x: 5, y: 66, c: "#ffd34a" }, { x: 17, y: 82, c: "#ff3a3a" }, { x: 29, y: 74, c: "#7dff7a" }, { x: 41, y: 88, c: "#ffd34a" },
  { x: 55, y: 79, c: "#ff3a3a" }, { x: 68, y: 86, c: "#ffd34a" }, { x: 81, y: 72, c: "#7dff7a" }, { x: 92, y: 84, c: "#ff3a3a" },
  { x: 47, y: 60, c: "#ffd34a" }, { x: 76, y: 58, c: "#ff3a3a" },
];

/** Olhos do vampiro: íris vermelhas e pupilas como elementos HTML (só transform), por cima do SVG — o SVG com filtros nunca é repintado. */
function VampireEyes() {
  return (
    <span className="hw-veyes">
      <i className="hw-veye hw-veye--l"><b className="hw-vp" /></i>
      <i className="hw-veye hw-veye--r"><b className="hw-vp" /></i>
    </span>
  );
}
/** Pupilas pálidas dos fantasmas, pelo mesmo motivo. */
function GhostEyes() {
  return (
    <span className="hw-geyes">
      <i><b className="hw-gp" /></i>
      <i><b className="hw-gp" /></i>
    </span>
  );
}

export function HalloweenScene() {
  const { payload } = useOs();
  const h = payload.s.halloween;
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const busy = useOsStore((s) => s.focused !== null);
  const rootRef = useRef<HTMLDivElement>(null);
  const ctrl = useRef<Controller | null>(null);
  const [sysReduce, setSysReduce] = useState(false);
  const [fine, setFine] = useState(false);
  // Modo enxuto: aparelho sem GPU de verdade (software), lento ou econômico (lib/quality: tier "low"). Menos camadas,
  // sem paralaxe, sem as cópias iluminadas, sem animação dentro de SVG. O componente só existe no cliente.
  const [lean] = useState(() => {
    try {
      return probeGpu().tier === "low";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pf = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => {
      setSysReduce(rm.matches);
      setFine(pf.matches);
    };
    sync();
    rm.addEventListener("change", sync);
    pf.addEventListener("change", sync);
    return () => {
      rm.removeEventListener("change", sync);
      pf.removeEventListener("change", sync);
    };
  }, []);

  const reduced = motion === "reduce" || sysReduce;
  const lite = shell === "mobile";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const c = createInteractions(root, { fine: fine && !lite, reduced, lite, lean, reactions: { ghost: reactGhost, spider: reactSpider, castle: reactCastle } });
    ctrl.current = c;
    return () => {
      c.dispose();
      ctrl.current = null;
    };
  }, [fine, reduced, lite, lean]);

  useEffect(() => {
    ctrl.current?.setBusy(busy);
  }, [busy, fine, reduced, lite]);

  return (
    <div ref={rootRef} className="hw-scene" data-reduced={reduced ? "1" : "0"} data-lite={lite ? "1" : "0"} data-lean={lean ? "1" : "0"} data-busy={busy ? "1" : "0"} aria-hidden="true" data-no-inspect>
      <div className="hw-l" data-depth="0.2">
        <div className="hw-sky" />
        <Stars />
      </div>
      <div className="hw-l" data-depth="0.5">
        <div className="hw-moon-halo" />
        <div className="hw-moon" />
      </div>
      <div className="hw-l" data-depth="0.9">
        <div className="hw-cloud hw-cloud--1"><CloudBand id="a" seed={2} /></div>
        <div className="hw-cloud hw-cloud--2"><CloudBand id="b" seed={5} /></div>
        <div className="hw-cloud hw-cloud--3"><CloudBand id="c" seed={8} /></div>
      </div>
      <div className="hw-l" data-depth="1.1">
        <div className="hw-witch"><Witch /></div>
      </div>
      <div className="hw-l" data-depth="1.3">
        <div className="hw-castle"><Castle id="b" /></div>
      </div>
      <div className="hw-l" data-depth="1.9">
        <div className="hw-grave"><Graveyard id="b" /></div>
      </div>
      <div className="hw-l" data-depth="2.7">
        <div className="hw-vampire"><Vampire /><VampireEyes /></div>
        <div className="hw-ghost hw-ghost--a"><div className="hw-gr"><Ghost id="a" seed={3} /><GhostEyes /></div></div>
        <div className="hw-ghost hw-ghost--b"><div className="hw-gr"><Ghost id="b" seed={11} /><GhostEyes /></div></div>
        <div className="hw-ghost hw-ghost--c"><div className="hw-gr"><Ghost id="c" seed={19} /><GhostEyes /></div></div>
        <div className="hw-zombie">
          <div className="hw-zl hw-zl--hand"><ZombieHand /></div>
          <div className="hw-zl hw-zl--body"><ZombieBody /></div>
          <div className="hw-zl hw-zl--mound"><Mound /></div>
        </div>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={`hw-bat hw-bat--${n}`}>
            <div className="hw-bat-in"><Bat /></div>
          </div>
        ))}
      </div>
      <div className="hw-l" data-depth="3.8">
        <div className="hw-fog hw-fog--a" />
        <div className="hw-fog hw-fog--b" />
        <div className="hw-cluster hw-cluster--l">
          <span className="hw-pump hw-pump--1" />
          <span className="hw-pump hw-pump--2" />
          <div className="hw-cand hw-cand--1"><Candle id="1" /></div>
          <div className="hw-cand hw-cand--2"><Candle id="2" /></div>
          <div className="hw-cand hw-cand--3"><Candle id="3" /></div>
        </div>
        <div className="hw-cluster hw-cluster--r">
          <span className="hw-pump hw-pump--3" />
          <span className="hw-pump hw-pump--4" />
          <div className="hw-cand hw-cand--4"><Candle id="4" /></div>
          <div className="hw-cand hw-cand--5"><Candle id="5" /></div>
        </div>
      </div>
      <div className="hw-web hw-web--tr"><Web /></div>
      <div className="hw-web hw-web--tl"><Web /></div>
      <div className="hw-drop hw-drop--1"><div className="hw-dr"><span className="hw-thread" /><div className="hw-spider"><Spider /></div></div></div>
      <div className="hw-drop hw-drop--2"><div className="hw-dr"><span className="hw-thread" /><div className="hw-spider"><Spider /></div></div></div>

      {/* escuridão furada pela lanterna e a janela que revela os detalhes (só o cenário; a interface fica acima) */}
      <div className="hw-dark" />
      <div className="hw-lantern">
        <div className="hw-lantern__in">
          {!lean && (
            <>
              <div className="hw-l" data-depth="1.3">
                <div className="hw-castle"><Castle lit id="r" /></div>
              </div>
              <div className="hw-l" data-depth="1.9">
                <div className="hw-grave"><Graveyard lit id="r" /></div>
              </div>
            </>
          )}
          <div className="hw-l" data-depth="2.7">
            {EYES.map((e, i) => (
              <span key={i} className="hw-eyepair" style={{ left: `${e.x}%`, top: `${e.y}%`, ["--c" as string]: e.c, animationDelay: `${-(i * 1.7)}s` }}>
                <i />
                <i />
              </span>
            ))}
          </div>
          <div className="hw-l" data-depth="3.8">
            <div className="hw-rfog hw-rfog--a" />
            <div className="hw-rfog hw-rfog--b" />
          </div>
        </div>
      </div>
      {/* morcegos da descoberta do castelo: parados e ocultos até o evento */}
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <div key={n} className="hw-burst" style={{ display: "none" }}><Bat /></div>
      ))}
      <div className="hw-veil" />
      {/* Escudo do hit-test: o ponteiro que não cai na interface para aqui, sem varrer as dezenas de camadas da cena. */}
      <div className="hw-shield" />
      <div className="hw-hint"><span className="hw-hint__dot" />{lite ? h.hintTouch : h.hint}</div>
      {(!fine || lite) && <div className="hw-touchzone" />}
    </div>
  );
}
