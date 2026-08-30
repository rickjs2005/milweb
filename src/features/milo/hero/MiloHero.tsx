"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getQuality, probeGpu } from "@/lib/quality";
import { onIdle } from "@/animations/idle";
import type { MiloQuality } from "@/components/milo/milo.types";
import { useMiloHeroStore } from "./hero-store";

const MiloHeroCanvas = dynamic(() => import("./MiloHeroCanvas").then((m) => m.MiloHeroCanvas), { ssr: false });

/**
 * Controlador de montagem do Milo no Hero — a mesma política do Compiler:
 * o HTML entrega o <MiloHeroFallback/> (SVG, dentro do BuildHero); o canvas
 * só monta depois da PRIMEIRA INTERAÇÃO real, com documento visível, Hero
 * perto da viewport, ponteiro fino ≥ 720 px, sem reduced-motion e com GPU
 * aprovada pelo probe. Três/R3F chegam por import dinâmico. Se o frame
 * medido depois do aquecimento estourar o orçamento, desmonta e volta ao SVG.
 * Nunca há dois canvases: o Compiler não é montado nesta variante.
 */
export function MiloHero() {
  const [tier, setTier] = useState<MiloQuality | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine || window.innerWidth < 720) return;
    const q = getQuality();
    if (!q.webgl) return;

    let armed = false;
    let cancelIdle: () => void = () => {};
    const EVENTS = ["pointermove", "wheel", "touchstart", "keydown", "scroll"] as const;
    const disarm = () => EVENTS.forEach((e) => window.removeEventListener(e, arm));
    const heroNear = () => {
      const hero = document.getElementById("top");
      if (!hero) return false;
      const r = hero.getBoundingClientRect();
      return r.bottom > -window.innerHeight && r.top < window.innerHeight * 2;
    };
    const boot = () => {
      if (document.visibilityState !== "visible" || !heroNear()) {
        // tenta de novo na próxima interação
        armed = false;
        EVENTS.forEach((e) => window.addEventListener(e, arm, { passive: true }));
        return;
      }
      const gq = probeGpu();
      if (!gq.webgl) return;
      setTier(gq.tier === "high" ? "high" : "medium");
    };
    function arm() {
      if (armed) return;
      armed = true;
      disarm();
      cancelIdle = onIdle(boot, 400);
    }
    EVENTS.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    return () => {
      disarm();
      cancelIdle();
    };
  }, [failed]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.milo;
      useMiloHeroStore.getState().setReady(false);
    };
  }, []);

  if (!tier) return null;
  return (
    <MiloHeroCanvas
      quality={tier}
      onReady={() => {
        document.documentElement.dataset.milo = "on";
        useMiloHeroStore.getState().setReady(true);
      }}
      onFail={() => {
        document.documentElement.dataset.milo = "off";
        setTier(null);
        setFailed(true);
      }}
    />
  );
}
