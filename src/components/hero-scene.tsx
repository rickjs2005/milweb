"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SceneCanvas = dynamic(() => import("./hero-scene-canvas"), { ssr: false });

/**
 * Gate da cena 3D do hero: só monta em desktop com ponteiro fino e sem
 * reduced-motion (mesma política do Lenis/esteiras 3D do site). O bundle
 * three/R3F (~150KB gz) é dynamic ssr:false — mobile nunca baixa nada.
 *
 * 1280 e não 1024: a coluna de texto tem 816px fixos, e a máscara que a
 * protege (.hero-scene-mask) deixaria só ~170px de cena em 1024 — 350KB de
 * three.js pra pintar uma tira. Abaixo de 1280 a atmosfera do hero-cinema
 * segura o hero sozinha, que é exatamente o que ela já faz no mobile.
 */
export function HeroScene() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const ok =
      window.matchMedia("(min-width: 1280px) and (hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ok) return;
    // Sem WebGL (GPU desativada/antiga, headless), o R3F loga erro e o
    // chunk three (~350KB) desceria à toa — testa antes de montar.
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (gl) setOn(true);
  }, []);

  if (!on) return null;
  return (
    <div aria-hidden className="hero-scene-mask absolute inset-0 z-[1]">
      <SceneCanvas />
    </div>
  );
}
