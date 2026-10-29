"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/animations/gsap";
import { useOsStore } from "../os-shell";
import { Bat, Candle, Castle, CloudBand, Ghost, Graveyard, Mound, Spider, Stars, Vampire, Web, Witch, ZombieBody, ZombieHand } from "./art/layers";
import "./scene.css";

/**
 * O cenário de Halloween: camadas independentes, cada uma com a sua profundidade, atrás da interface.
 *
 *   céu e estrelas → lua e halo → nuvens → bruxa → castelo → cemitério e árvores → personagens (vampiro,
 *   fantasmas, zumbi, morcegos) → primeiro plano (névoa, velas, abóboras) → teias e aranhas → véu
 *
 * Toda a animação ambiente é CSS (transform/opacity, camadas próprias no compositor): nada de React por
 * quadro. A única coisa em JS é o paralaxe do mouse — GSAP quickTo, suave e limitado, com intensidade
 * crescente conforme a profundidade (`data-depth`), só no desktop e sem movimento reduzido. O texto, os
 * apps e os controles ficam FORA desta árvore e nunca se movem. A cena inteira é decorativa: aria-hidden,
 * pointer-events: none, nenhum elemento focável.
 *
 * Movimento reduzido (sistema ou Ajustes, inclusive mudando durante a sessão): composição estável — bruxa,
 * morcegos e zumbi parados em pontos fixos, sem paralaxe e sem eventos periódicos. Aba oculta: as
 * animações pausam (`html[data-os-hidden]`, ver clock.ts). Telefone: movimento ambiente leve, composição
 * enxuta (CSS `data-lite`), sem sensores.
 */
export function HalloweenScene() {
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);
  const rootRef = useRef<HTMLDivElement>(null);
  const [sysReduce, setSysReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setSysReduce(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const reduced = motion === "reduce" || sysReduce;
  const lite = shell === "mobile";

  // Paralaxe: cada camada anda no sentido oposto ao do ponteiro, tanto mais quanto mais perto (data-depth).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || lite) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    const AMP = 11;
    const movers = layers.map((el) => ({
      x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
      d: Number(el.dataset.depth) || 0,
    }));
    const move = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      for (const m of movers) {
        m.x(-nx * AMP * m.d);
        m.y(-ny * AMP * 0.5 * m.d);
      }
    };
    const rest = () => movers.forEach((m) => (m.x(0), m.y(0)));
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", rest);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", rest);
      gsap.killTweensOf(layers);
      gsap.set(layers, { clearProps: "transform" });
    };
  }, [reduced, lite]);

  return (
    <div ref={rootRef} className="hw-scene" data-reduced={reduced ? "1" : "0"} data-lite={lite ? "1" : "0"} aria-hidden="true" data-no-inspect>
      <div className="hw-l" data-depth="0.2">
        <div className="hw-sky" />
        <Stars />
      </div>
      <div className="hw-l" data-depth="0.5">
        <div className="hw-moon-halo" />
        <div className="hw-moon" />
      </div>
      <div className="hw-l" data-depth="0.9">
        <div className="hw-cloud hw-cloud--1"><CloudBand id="a" /></div>
        <div className="hw-cloud hw-cloud--2"><CloudBand id="b" /></div>
        <div className="hw-cloud hw-cloud--3"><CloudBand id="c" /></div>
      </div>
      <div className="hw-l" data-depth="1.1">
        <div className="hw-witch"><Witch /></div>
      </div>
      <div className="hw-l" data-depth="1.3">
        <div className="hw-castle"><Castle /></div>
      </div>
      <div className="hw-l" data-depth="1.9">
        <div className="hw-grave"><Graveyard /></div>
      </div>
      <div className="hw-l" data-depth="2.7">
        <div className="hw-vampire"><Vampire /></div>
        <div className="hw-ghost hw-ghost--a"><Ghost id="a" /></div>
        <div className="hw-ghost hw-ghost--b"><Ghost id="b" /></div>
        <div className="hw-ghost hw-ghost--c"><Ghost id="c" /></div>
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
      <div className="hw-drop hw-drop--1"><span className="hw-thread" /><div className="hw-spider"><Spider /></div></div>
      <div className="hw-drop hw-drop--2"><span className="hw-thread" /><div className="hw-spider"><Spider /></div></div>
      <div className="hw-veil" />
    </div>
  );
}
