"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SceneCanvas = dynamic(() => import("./hero-scene-canvas"), { ssr: false });

/**
 * Gate da cena 3D do hero: só monta em desktop com ponteiro fino e sem
 * reduced-motion (mesma política do Lenis/esteiras 3D do site). O bundle
 * three/R3F (~150KB gz) é dynamic ssr:false — mobile nunca baixa nada.
 */
export function HeroScene() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const ok =
      window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches &&
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
    <div aria-hidden className="absolute inset-0 z-[1]">
      <SceneCanvas />
    </div>
  );
}
