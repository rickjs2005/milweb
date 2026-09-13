"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import { sound } from "@/features/sound/sound";
import { publishSystemFrame, systemFrame, type SystemNodeRef } from "./system-store";

/**
 * MilWeb System — estado global mínimo.
 *
 * Baixa frequência (contexto React): nó dominante e vizinhos, mídia
 * (reduced-motion, ponteiro, breakpoint), viewport e áudio. Alta frequência
 * (system-store): progresso, direção e velocidade do scroll.
 *
 * Como mede sem ler layout em loop: os retângulos dos `[data-node]` são
 * medidos uma vez e re-medidos só em `ScrollTrigger.refresh`, resize e quando
 * a altura do documento muda (ResizeObserver no body). O cálculo por frame usa
 * só `window.scrollY` e o cache.
 *
 * Quem dá o quadro: em ponteiro fino sem movimento reduzido, o ticker do GSAP
 * (que o Lenis já mantém acordado). Em toque ou reduced-motion — onde o
 * ScrollProvider deliberadamente NÃO liga o ticker, pra deixá-lo dormir — um
 * laço próprio, que só pede quadros enquanto algo se move e dorme sozinho
 * quando pára. Nunca os dois ao mesmo tempo; nunca um rAF permanente.
 *
 * Fonte única de mídia: quatro `matchMedia` com `change`, espelhados em
 * `<html data-reduce data-pointer data-bp>` para CSS e para quem ainda lê
 * atributos.
 */

export type SystemMedia = { reduce: boolean; pointer: "fine" | "coarse"; bp: "mobile" | "tablet" | "desktop" };
export type SystemViewport = { w: number; h: number; dpr: number };

export type SystemState = {
  root: SystemNodeRef;
  current: SystemNodeRef;
  previous: SystemNodeRef | null;
  next: SystemNodeRef | null;
  media: SystemMedia;
  viewport: SystemViewport;
  audio: boolean;
};

const SSR_MEDIA: SystemMedia = { reduce: false, pointer: "fine", bp: "desktop" };
const SSR_VIEWPORT: SystemViewport = { w: 0, h: 0, dpr: 1 };

const SystemContext = createContext<SystemState | null>(null);

type Measured = { ref: SystemNodeRef; top: number; height: number };

function refOf(el: HTMLElement): SystemNodeRef {
  return {
    id: el.dataset.node ?? "",
    index: Number(el.dataset.nodeIndex ?? 0),
    key: el.dataset.nodeKey ?? "",
    title: el.dataset.nodeTitle ?? "",
    readout: el.dataset.nodeReadout ?? null,
  };
}

const MQ_REDUCE = "(prefers-reduced-motion: reduce)";
const MQ_COARSE = "(pointer: coarse)";
const MQ_TABLET = "(min-width: 720px)";
const MQ_DESKTOP = "(min-width: 1080px)";

export function MilwebSystemProvider({ root: rootProp, children }: { root: SystemNodeRef; children: ReactNode }) {
  const pathname = usePathname();
  // O layout monta o objeto inline a cada render; remontar a partir dos campos
  // fixa a identidade e evita re-registrar o ticker e re-medir sem necessidade.
  const { id: rootId, index: rootIndex, key: rootKey, title: rootTitle, readout: rootReadout } = rootProp;
  const root = useMemo<SystemNodeRef>(
    () => ({ id: rootId, index: rootIndex, key: rootKey, title: rootTitle, readout: rootReadout }),
    [rootId, rootIndex, rootKey, rootTitle, rootReadout],
  );
  const [current, setCurrent] = useState<SystemNodeRef>(root);
  const [neighbours, setNeighbours] = useState<{ previous: SystemNodeRef | null; next: SystemNodeRef | null }>({ previous: null, next: null });
  const [media, setMedia] = useState<SystemMedia>(SSR_MEDIA);
  const [viewport, setViewport] = useState<SystemViewport>(SSR_VIEWPORT);
  const [audio, setAudio] = useState(false);
  const nodes = useRef<Measured[]>([]);
  const currentKey = useRef<string>(root.key);

  /* ---- Mídia: uma fonte, espelhada no <html> ------------------------ */
  useEffect(() => {
    const html = document.documentElement;
    const qs = { reduce: matchMedia(MQ_REDUCE), coarse: matchMedia(MQ_COARSE), tablet: matchMedia(MQ_TABLET), desktop: matchMedia(MQ_DESKTOP) };
    const read = () => {
      const next: SystemMedia = {
        reduce: qs.reduce.matches,
        pointer: qs.coarse.matches ? "coarse" : "fine",
        bp: qs.desktop.matches ? "desktop" : qs.tablet.matches ? "tablet" : "mobile",
      };
      if (next.reduce) html.dataset.reduce = "1";
      else delete html.dataset.reduce;
      html.dataset.pointer = next.pointer;
      html.dataset.bp = next.bp;
      setMedia((prev) => (prev.reduce === next.reduce && prev.pointer === next.pointer && prev.bp === next.bp ? prev : next));
    };
    const readViewport = () => {
      const w = window.innerWidth, h = window.innerHeight, dpr = Math.round(window.devicePixelRatio * 10) / 10;
      setViewport((prev) => (prev.w === w && prev.h === h && prev.dpr === dpr ? prev : { w, h, dpr }));
    };
    read();
    readViewport();
    Object.values(qs).forEach((q) => q.addEventListener("change", read));
    window.addEventListener("resize", readViewport, { passive: true });
    return () => {
      Object.values(qs).forEach((q) => q.removeEventListener("change", read));
      window.removeEventListener("resize", readViewport);
    };
  }, []);

  /* ---- Áudio: espelha o singleton -------------------------------------- */
  useEffect(() => {
    setAudio(sound.on);
    const off = sound.subscribe(() => setAudio(sound.on));
    return () => {
      off();
    };
  }, []);

  /* ---- Nós: coleta, medição e frame ----------------------------------- */
  useEffect(() => {
    let dirty = true;
    let measuring = false;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let velocity = 0;
    let lastDir: -1 | 0 | 1 = 0;
    const html = document.documentElement;

    // Enquanto a página carrega, cada imagem que chega muda a altura do corpo. Medir
    // ali seria uma rajada de reflows forçados dentro da janela do LCP — então só se
    // mede depois do load. Antes disso o nó dominante é o raiz, que abre a página.
    let settled = document.readyState === "complete";
    let lastDocH = 0;
    // Cache do viewport e da altura do documento: só mudam em resize/refresh/altura
    // (os três eventos que já disparam scheduleMeasure), nunca dentro do loop por frame.
    let cachedVh = window.innerHeight;

    // Em ponteiro fino sem movimento reduzido, o Lenis já mantém o ticker do GSAP
    // acordado (scroll-provider.tsx) — andar de carona nele não é um rAF novo.
    // Em toque ou reduced-motion, o ScrollProvider some de propósito para deixar o
    // ticker DORMIR quando nada anima (GSAP autoSleep exige < 2 assinantes); um
    // listener nosso ali dentro apagaria esse ganho para sempre, em toda rota, para
    // quem mais precisa de bateria. Nesses dois casos rodamos nosso próprio laço,
    // que só pede quadros enquanto algo de fato se move e dorme sozinho quando pára.
    // Lido uma vez, como o próprio ScrollProvider faz — um flip ao vivo de OS só
    // muda de comportamento na próxima navegação, não vale a complexidade agora.
    const useOwnLoop = matchMedia(MQ_REDUCE).matches || matchMedia(MQ_COARSE).matches;
    let rafId = 0;

    const compute = (now: number) => {
      const y = window.scrollY;
      const dy = y - lastY;
      const dt = Math.max(1, now - lastT);
      lastY = y;
      lastT = now;
      const inst = (dy / dt) * 1000;
      velocity = velocity * 0.75 + inst * 0.25;
      if (Math.abs(velocity) < 2) velocity = 0;
      // A direção nasce da velocidade já com o piso aplicado, não do dy bruto: senão,
      // no exato frame em que a velocidade zera, a direção ainda podia acusar 1/-1 e
      // ficar presa (o guard do tick() só roda de novo enquanto velocity !== 0).
      const dir: -1 | 0 | 1 = velocity > 0 ? 1 : velocity < 0 ? -1 : 0;
      if (dir !== lastDir) {
        lastDir = dir;
        if (dir === 0) delete html.dataset.scroll;
        else html.dataset.scroll = dir > 0 ? "down" : "up";
      }

      const vh = cachedVh;
      const docH = lastDocH;
      const list = nodes.current;
      // Nó dominante: entre os visíveis, o que tem o centro mais perto do centro
      // da viewport. Sobreposição vertical sozinha falha na galeria em duas
      // colunas (o card largo da esquerda "venceria" o card estreito ao lado).
      const mid = vh / 2;
      let best: Measured | null = null;
      let bestDist = Infinity;
      for (const m of list) {
        const top = m.top - y;
        const overlap = Math.min(top + m.height, vh) - Math.max(top, 0);
        if (overlap <= 0) continue;
        const dist = Math.abs(top + m.height / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = m;
        }
      }
      let progress = 0;
      if (best) {
        const start = Math.max(0, best.top - vh);
        // `y` nunca passa de `docH - vh` (o navegador não deixa rolar além disso). Sem
        // este limite, um nó cujo fim fica perto do fim do documento nunca chega a
        // 100 % — o déficit é do tamanho do rodapé, não de onde o leitor está.
        const end = Math.min(best.top + best.height, Math.max(start, docH - vh));
        progress = end > start ? Math.min(1, Math.max(0, (y - start) / (end - start))) : 0;
      }
      systemFrame.scrollY = y;
      systemFrame.nodeProgress = progress;
      systemFrame.globalProgress = docH > vh ? Math.min(1, Math.max(0, y / (docH - vh))) : 0;
      systemFrame.scrollDirection = dir;
      systemFrame.scrollVelocity = velocity;
      publishSystemFrame();

      const key = best ? best.ref.key : root.key;
      if (key !== currentKey.current) {
        currentKey.current = key;
        html.dataset.nodeKey = key;
        const i = list.findIndex((m) => m.ref.key === key);
        setCurrent(best ? best.ref : root);
        setNeighbours({ previous: i > 0 ? list[i - 1].ref : null, next: i >= 0 && i < list.length - 1 ? list[i + 1].ref : null });
      }
    };

    const tick = () => {
      const now = performance.now();
      if (dirty || window.scrollY !== lastY || velocity !== 0) {
        dirty = false;
        compute(now);
        return true;
      }
      // Nada mudou: adianta o relógio mesmo assim, senão o próximo scroll depois de
      // uma pausa longa divide por todo o tempo ocioso e a velocidade nasce zerada.
      lastT = now;
      return false;
    };

    /** Só existe (e só se agenda) quando `useOwnLoop` é verdadeiro; nunca corre junto com o ticker do GSAP. */
    const ownFrame = () => {
      rafId = 0;
      if (tick()) rafId = requestAnimationFrame(ownFrame);
    };
    const wake = () => {
      if (useOwnLoop && !rafId) rafId = requestAnimationFrame(ownFrame);
    };

    const measure = () => {
      measuring = false;
      if (!settled) return;
      const y = window.scrollY;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-node]"));
      nodes.current = els
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { ref: refOf(el), top: r.top + y, height: r.height };
        })
        .filter((m) => m.height > 0)
        .sort((a, b) => a.top - b.top);
      cachedVh = window.innerHeight;
      lastDocH = html.scrollHeight;
      dirty = true;
      // Sem isto, uma re-medição com o laço próprio dormindo (resize, imagem
      // carregando) fica sem quem publique o novo estado até o próximo scroll.
      wake();
    };
    const scheduleMeasure = () => {
      if (measuring || !settled) return;
      measuring = true;
      requestAnimationFrame(measure);
    };
    /** O observer do corpo só interessa quando a ALTURA do documento muda de fato. */
    const onBodyResize = () => {
      if (!settled || html.scrollHeight === lastDocH) return;
      scheduleMeasure();
    };
    const onLoad = () => {
      settled = true;
      scheduleMeasure();
    };

    measure();
    // O ticker do GSAP tipa o retorno do callback como `void | null`; `tick` devolve
    // `boolean` pro laço próprio saber se continua. Um wrapper fino resolve os dois.
    const tickForGsap = () => { tick(); };
    if (useOwnLoop) {
      wake(); // publica o primeiro quadro (nó raiz) mesmo antes do load, sem nós ainda
      window.addEventListener("scroll", wake, { passive: true });
    } else {
      gsap.ticker.add(tickForGsap);
    }

    ScrollTrigger.addEventListener("refresh", scheduleMeasure);
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    if (!settled) window.addEventListener("load", onLoad, { once: true });
    const ro = new ResizeObserver(onBodyResize);
    ro.observe(document.body);

    return () => {
      if (useOwnLoop) {
        window.removeEventListener("scroll", wake);
        if (rafId) cancelAnimationFrame(rafId);
      } else {
        gsap.ticker.remove(tickForGsap);
      }
      ScrollTrigger.removeEventListener("refresh", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("load", onLoad);
      ro.disconnect();
      delete html.dataset.scroll;
      delete html.dataset.nodeKey;
    };
    // `pathname` na dependência: cada rota re-coleta os nós.
  }, [pathname, root]);

  const value = useMemo<SystemState>(
    () => ({ root, current, previous: neighbours.previous, next: neighbours.next, media, viewport, audio }),
    [root, current, neighbours, media, viewport, audio],
  );

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem(): SystemState {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem: fora do MilwebSystemProvider");
  return ctx;
}
