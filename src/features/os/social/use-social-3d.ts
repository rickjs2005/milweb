"use client";

import { useEffect, type RefObject } from "react";
import { onIdle } from "@/animations/idle";
import { getQuality, probeGpu } from "@/lib/quality";
import { useDesktopWide } from "../launch";
import { useOs, useOsStore } from "../os-shell";
import { MOOD_OF, PALETTE } from "../scene/scene.config";
import type { Social3d } from "./social-3d";

/**
 * Liga as peças 3D aos atalhos sociais do desktop largo (o `<nav class="os-social">`).
 *
 * O HTML não muda: os quatro `<a>` com os ícones SVG saem do servidor como sempre, e é isso que vale
 * no modo simples, no tablet e no telefone (onde este grupo nem aparece), com movimento reduzido
 * no sistema, sem WebGL, com GPU por software ou enquanto o módulo carrega. O 3D entra depois, em
 * tempo ocioso e DEPOIS da apresentação do personagem (~5 s), para não disputar a GPU com ela nem com
 * os primeiros cliques, num pedaço próprio (three + SVGLoader); só então as placas SVG saem de cena.
 * "Reduzir movimento" nos Ajustes mantém as peças paradas: o estado aparece só na luz.
 */
/** Depois da apresentação do personagem (scene.config › INTRO.end = 4,6 s). */
const MOUNT_AFTER_MS = 5000;

export function useSocial3d(ref: RefObject<HTMLElement | null>) {
  const { store } = useOs();
  const wide = useDesktopWide();
  const shell = useOsStore((s) => s.shell);
  const motion = useOsStore((s) => s.prefs.motion);

  useEffect(() => {
    const nav = ref.current;
    if (!nav || !wide || shell !== "desktop") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!getQuality().webgl) return;
    let api: Social3d | null = null;
    let dead = false;
    const accentOf = () => PALETTE[MOOD_OF[store.getState().prefs.theme]].accent;
    const expose = process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("scene-debug");
    let cancelIdle = () => {};
    const timer = window.setTimeout(() => {
      cancelIdle = onIdle(() => {
        void (async () => {
          if (dead || !probeGpu().webgl) return;
          const { mountSocial3d } = await import("./social-3d");
          if (dead) return;
          api = mountSocial3d(nav, { accent: accentOf(), reduce: motion === "reduce" });
          if (api && expose) (window as unknown as { __mwSocial3d?: Social3d }).__mwSocial3d = api;
        })();
      }, 1500);
    }, MOUNT_AFTER_MS);
    const cancel = () => {
      window.clearTimeout(timer);
      cancelIdle();
    };
    const unsub = store.subscribe((s, p) => {
      if (s.prefs.theme !== p.prefs.theme) api?.setAccent(accentOf());
    });
    return () => {
      dead = true;
      cancel();
      unsub();
      api?.dispose();
      api = null;
      if (expose) delete (window as unknown as { __mwSocial3d?: Social3d }).__mwSocial3d;
    };
  }, [ref, wide, shell, motion, store]);
}
