"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { gsap, EASE, MQ, ScrollTrigger, useGSAP } from "@/animations/gsap";
import { vtOfSlug } from "@/lib/route-transition";
import { ACT, ACT_ORDER, SKIN, bleedOf, type ActSlug } from "./work/act-config";
import { ActStage } from "./work/act-stages";
import { WorkDots } from "./work/work-dots";
import { ACT_LAWS } from "./work/act-laws";
import { AUREX_PARTS } from "./work/aurex-movement";
import { SHEET, stripTargets, tattooPose } from "./work/inkvision-geometry";
import { ROUTE_H, ROUTE_V, headingInto, nodeAt, segments, type LegMode, type NodeKey, type UnitKey } from "./work/logistics-geometry";
import { dotsOf } from "./work/act-config";

export type WorkItem = {
  n: string;
  slug: string;
  name: string;
  title: [string, string];
  displayType: string;
  client: string | null;
  year: number | null;
  image: string;
  detail: string;
  href: string;
  /** Rótulos técnicos reais do projeto (nível 02 da hierarquia). */
  labels: string[];
  /** Etapas de um percurso (só o Logistics Demo: as sete da jornada do projeto). */
  stages: string[];
};

/**
 * ACT 03 — SELECTED WORK. Um filme em seis atos, não seis cards.
 *
 * ANATOMIA (idêntica nos seis; o que muda é o palco):
 *
 *   [ 01 / KAVITA ] ─────────────────────────────── [ 01 / 06 ]   nível 03
 *
 *                     ‹ palco: a experiência do ato ›
 *
 *   T25P · T70P · T100 · 26 ITENS · …                             nível 02
 *   AGRICULTURA                                                   nível 01
 *   REIMAGINADA.
 *   MW/002                        EXPERIÊNCIA INTERATIVA          nível 03
 *                                 [ EXPLORAR PROJETO ↗ ]
 *
 * RITMO. Cada ato tem um trilho de 200 svh com o conteúdo `sticky` dentro:
 * uma viewport PARADO (o ato acontece) e uma viewport sendo coberto pelo
 * próximo (a transição). No layout anterior os painéis tinham 100 svh e o
 * seguinte começava a subir no mesmo frame em que o atual grudava — nenhum ato
 * ficava sozinho na tela em momento nenhum, e era isso (não a falta de motion)
 * que fazia a seção ler como carrossel de cards.
 *
 * UMA TRIGGER POR ATO. `top bottom` → `bottom top`, progresso 0→1, e todo
 * comportamento derivado dele pelas faixas de `ACT`. Nada de setTimeout, delay
 * ou número mágico; nenhuma propriedade com dois donos (o cursor tem as leis em
 * work/act-laws.ts, e elas não tocam em nada que a timeline anime).
 *
 * CONTINUIDADE. O fio entre os atos é a cor: cada painel revela na saída a cor
 * do PRÓXIMO (`[data-bleed]`), então no frame da virada os dois mundos já são
 * da mesma cor. Junto, o motivo se dissolve no motivo seguinte — a topografia
 * vira grão, o grão vira linha de projeto, a linha vira referência mecânica — e
 * a malha de pontos troca de significado (work/work-dots.tsx).
 */
export function SelectedWork({ items, eyebrow, enter, all, allHref, act, clientWork }: { items: WorkItem[]; eyebrow: string; enter: string; all: string; allHref: string; act: string; clientWork: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const acts = gsap.utils.selector(el)<HTMLElement>("[data-panel]");
      const mm = gsap.matchMedia();
      // A seção vive abaixo da dobra: a configuração (que lê layout) espera o
      // navegador ficar ocioso — TBT e LCP da Home intactos.
      const w = window as Window & { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number };
      const idle = (cb: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 1200 }) : window.setTimeout(cb, 200));
      let disposed = false;
      idle(() => {
        if (disposed) return;
        setup();
        ScrollTrigger.refresh();
      });

      const setup = () =>
        mm.add(MQ.noReduce, () => {
          const small = window.innerWidth < 720;
          const fine = window.matchMedia(MQ.fine).matches;
          const laws = fine ? acts.map((p) => ACT_LAWS[p.dataset.world ?? ""]?.(p)).filter(Boolean) : [];

          acts.forEach((article, i) => {
            const slug = article.dataset.world as ActSlug;
            const q = gsap.utils.selector(article);
            const one = <T extends HTMLElement>(s: string) => q<T>(s)[0] as T | undefined;
            const last = i === items.length - 1;
            // O Aurex e o InkVision foram coreografados como último ato: progresso
            // inteiro com o painel em tela. Com um ato depois deles, mantêm esse
            // mapeamento e ficam de fora da escurecida e da sangria de saída (que
            // aconteceriam com o calibre / a simulação ainda inteiros na tela; o
            // escuro já é o mesmo) — é o mínimo na fronteira, sem tocar neles.
            const holdsToEnd = last || slug === "aurex-timepieces" || slug === "inkvision";

            const tl = gsap.timeline({
              scrollTrigger: {
                id: `act-${slug}`,
                trigger: article,
                start: "top bottom",
                // O ÚLTIMO ato não é coberto por ninguém: o sticky dele solta
                // quando o trilho acaba, e daí em diante o painel já está
                // subindo. Terminar em `bottom top` daria a ele um terço final
                // de progresso acontecendo fora da tela — a decomposição do
                // calibre só terminava depois do painel ter começado a sair.
                // O Aurex foi coreografado como último ato (progresso inteiro com
                // o painel em tela); com o InkVision depois dele, mantém esse
                // mapeamento — é o mínimo na fronteira, sem tocar no calibre.
                end: holdsToEnd ? "bottom bottom" : "bottom top",
                scrub: 0.55,
                invalidateOnRefresh: true,
              },
              defaults: { ease: "none" },
            });

            /* ---------- ENTRADA (0 → 0.18): a estrutura editorial chega ---------- */
            tl.fromTo(q("[data-reveal]"), { yPercent: 26, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.02, duration: ACT.enter, ease: EASE.outQuint }, 0.02);

            /* ---------- o palco de cada ato ---------- */
            if (slug === "kavita-drones") kavita(tl, q, one, small);
            if (slug === "terral") terral(tl, q, one, small);
            if (slug === "atelier-vertex") vertex(tl, q, one, small);
            if (slug === "aurex-timepieces") aurex(tl, q, one, small);
            if (slug === "inkvision") inkvision(tl, q, one, small);
            if (slug === "logistics-demo") logistics(tl, q, one, small);

            /* ---------- PREPARAÇÃO + TRANSIÇÃO (0.70 → 1) ----------
               A malha troca de significado antes da virada e a cor do próximo
               mundo sobe por cima: quando o painel seguinte encosta, os dois já
               são da mesma cor — não existe corte, existe dissolução. */
            const dotsNext = q("[data-dots-next]");
            if (dotsNext.length) {
              tl.to(q("[data-dots]"), { autoAlpha: 0, duration: 0.18 }, ACT.hold);
              tl.to(dotsNext, { autoAlpha: 1, duration: 0.18 }, ACT.hold);
            }
            // O último ato não é coberto por ninguém: apagar a coluna editorial
            // ali deixaria a cena morta ainda em tela cheia.
            if (!holdsToEnd) tl.to(q("[data-reveal]"), { autoAlpha: 0.2, duration: 0.16 }, ACT.prepare - 0.06);
            // A cor do próximo mundo sobe durante TODA a cortina (0.70 → 0.96),
            // não só no fim: o painel seguinte começa a cobrir em ~0.67, e uma
            // revelação que só começasse em 0.86 deixaria uma borda dura entre os
            // dois fundos por meia tela de scroll. Para em 0.9 de opacidade para
            // o mundo que sai continuar visível por baixo — dissolve, não apaga.
            if (!holdsToEnd) tl.fromTo(q("[data-bleed]"), { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.96 - ACT.hold, ease: "power1.in" }, ACT.hold);

            /* ---------- resíduo do ato anterior ----------
               Os primeiros frames de cada ato ainda carregam o motivo do
               anterior, que se apaga durante a construção. É a outra metade da
               continuidade: a transição não termina na virada, ela vaza. */
            const residue = q("[data-residue]");
            if (residue.length) tl.to(residue, { autoAlpha: 0, duration: ACT.build - ACT.enter }, ACT.enter);
            // ...e a borda de cima do painel que sobe carrega a cor do anterior,
            // apagando conforme ele toma a tela: a cortina vira dissolução.
            const veil = q("[data-veil]");
            if (veil.length) tl.to(veil, { autoAlpha: 0, duration: ACT.build }, 0.02);
          });

          if (process.env.NODE_ENV !== "production") {
            // Sonda de auditoria: a cena inteira é função do progresso, então
            // poder LER o progresso de cada ato é o que permite conferir por
            // checkpoint em vez de adivinhar a posição de scroll.
            (window as unknown as { __mwWork?: unknown }).__mwWork = {
              acts: acts.map((a) => ({
                world: a.dataset.world,
                get p() { return Number((ScrollTrigger.getById(`act-${a.dataset.world}`)?.progress ?? -1).toFixed(4)); },
                get start() { return Math.round(ScrollTrigger.getById(`act-${a.dataset.world}`)?.start ?? -1); },
                get end() { return Math.round(ScrollTrigger.getById(`act-${a.dataset.world}`)?.end ?? -1); },
                get top() { return Math.round(a.getBoundingClientRect().top + window.scrollY); },
              })),
              refresh: () => ScrollTrigger.refresh(),
              all: () => ScrollTrigger.getAll().map((t) => ({ id: String(t.vars.id ?? ""), trig: (t.trigger as HTMLElement | null)?.dataset?.world ?? (t.trigger as HTMLElement | null)?.id ?? (t.trigger as HTMLElement | null)?.tagName, start: Math.round(t.start), end: Math.round(t.end), pin: !!t.pin })),
              seek: (i: number, p: number) => {
                const st = ScrollTrigger.getById(`act-${acts[i].dataset.world}`);
                if (st) window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "instant" });
              },
            };
          }
          return () => laws.forEach((off) => off?.());
        });

      /**
       * REDUCED MOTION — composição final estática. Vários elementos nascem em
       * `opacity: 0` no HTML porque quem os acende é a timeline; sem este ramo
       * eles ficariam invisíveis para sempre e o ato perderia justamente o que
       * ele mostra (a fachada revelada, o calibre aberto, as leituras técnicas).
       * Aqui não há scrub nem trigger: só o estado de repouso, tudo legível.
       */
      const stillness = () =>
        mm.add(MQ.reduce, () => {
          acts.forEach((article) => {
            const q = gsap.utils.selector(article);
            // cada palco tem só parte destes elementos; um alvo vazio faz o GSAP
            // avisar no console ("target not found") — pula em vez de avisar
            const set = (sel: string, vars: gsap.TweenVars) => {
              const els = q(sel);
              if (els.length) gsap.set(els, vars);
            };
            set("[data-coord], [data-meta], [data-target], [data-frame], [data-anchor], [data-plan-label], [data-part-label], [data-movement-wrap], [data-axis]", { autoAlpha: 1 });
            if (article.dataset.world === "inkvision") {
              // em repouso: o RESULTADO — pele clara, tatuagem enrolada e integrada,
              // malha leve, só os tracking points-chave, a última etapa acesa
              const pose = tattooPose();
              set("[data-dark], [data-contour], [data-sheet], [data-track]:not([data-key]), [data-sweep], [data-sweep-line], [data-compare]", { autoAlpha: 0 });
              set("[data-track][data-key]", { autoAlpha: 0.9 });
              set("[data-mesh-line]", { strokeDashoffset: 0 });
              set("[data-mesh]", { autoAlpha: 0.1 });
              set("[data-tattoo]", { autoAlpha: 1, x: pose.x, y: pose.y });
              set("[data-tattoo-rot]", { rotation: pose.rotation, transformOrigin: "50% 50%" });
              stripTargets().forEach((t, i) => set(`[data-strip]:nth-child(${i + 1})`, { x: t.x, y: t.y, scaleX: t.scaleX, transformOrigin: `${t.cx}px 100px` }));
              const steps = q("[data-step]");
              if (steps.length) gsap.set(steps, { autoAlpha: (i: number) => (i === steps.length - 1 ? 0.85 : 0.18) });
            }
            if (article.dataset.world === "logistics-demo") {
              // em repouso: a rota inteira executada, os quatro nós e as legendas,
              // a carga já no destino (última milha), a janela no mar aberto
              set("[data-plan]", { autoAlpha: 0 });
              set("[data-leg]", { strokeDashoffset: 0, opacity: 1 });
              set("[data-node], [data-cargo], [data-plate-b]", { autoAlpha: 1 });
              set("[data-node-cap], [data-leg-label], [data-status], [data-route-pct]", { autoAlpha: 1 });
              set('[data-unit="truck-back"]', { autoAlpha: 1 });
              ([["[data-route-h]", ROUTE_H], ["[data-route-v]", ROUTE_V]] as const).forEach(([sel, r]) => {
                const [x, y] = nodeAt(r, "dst");
                set(`${sel} [data-cargo]`, { x, y });
                set(`${sel} [data-cargo-rot]`, { rotation: headingInto(r, "dst"), transformOrigin: "50% 50%" });
              });
              const steps = q("[data-step]");
              if (steps.length) gsap.set(steps, { autoAlpha: (i: number) => (i === steps.length - 1 ? 0.9 : 0) });
              const n = q("[data-route-pct-n]")[0];
              if (n) n.textContent = "100";
            }
            if (article.dataset.world === "atelier-vertex") {
              // em repouso: prancha inteira desenhada, obra entregue nas quatro
              // fatias, cotas e elevação leve por cima
              set("[data-guide-v], [data-guide-m], [data-dim-v]", { scaleY: 1 });
              set("[data-guide-h], [data-leader], [data-dim-h]", { scaleX: 1 });
              set("[data-layer-a], [data-layer-b]", { clipPath: "none" });
              set("[data-dim-h], [data-dim-v], [data-dim-label]", { autoAlpha: 0.8 });
              set("[data-elevation]", { autoAlpha: 0.25 });
              set("[data-draw]", { strokeDashoffset: 0 });
            }
            if (article.dataset.world === "terral") {
              // em repouso: figuras com marcas de corte e borda leve, o instrumento
              // já desenhado; as linhas estendidas ficam de fora (são ferramenta de saída)
              set("[data-roast], [data-roast-label], [data-fig]", { autoAlpha: 1 });
              set("[data-frame]", { autoAlpha: 0.4 });
              set("[data-mark]", { autoAlpha: 0.55 });
              set("[data-roast-curve]", { strokeDashoffset: 0 });
            }
            // véu e sangria são ferramentas de TRANSIÇÃO: sem timeline para
            // apagá-los, ficariam cobrindo metade do painel para sempre
            set("[data-scan], [data-veil], [data-bleed]", { autoAlpha: 0 });
            set("[data-grain]", { autoAlpha: 0.4 });
            set("[data-media]", { autoAlpha: 1, clipPath: "none" });
            if (article.dataset.world === "aurex-timepieces") {
              gsap.set(q("[data-media]"), { autoAlpha: 0.2 });
              AUREX_PARTS.forEach((part) => gsap.set(q(`[data-part="${part.id}"]`), { x: part.dx, y: part.dy, rotate: part.spin * 42, svgOrigin: "0 0" }));
            }
          });
        });
      stillness();

      return () => {
        disposed = true;
        mm.revert();
      };
    },
    { scope: root },
  );

  const total = String(items.length).padStart(2, "0");

  return (
    <section ref={root} id="work" data-act={act} data-inspect="SELECTED_WORK" className="relative">
      {items.map((item, i) => {
        const slug = item.slug as ActSlug;
        const skin = SKIN[slug];
        const prev = i > 0 ? (items[i - 1].slug as ActSlug) : null;
        const nextSlug = ACT_ORDER[ACT_ORDER.indexOf(slug) + 1];
        const chars = Math.max(...item.title.map((l) => l.length));
        const last = i === items.length - 1;
        return (
          <article
            key={item.slug}
            data-panel
            data-world={item.slug}
            data-inspect={`ACT_${item.n} / ${item.name}`}
            className="relative h-[170svh] md:h-[200svh]"
            style={{ "--act-bg": skin.bg, "--act-ink": skin.ink, "--chars": chars } as CSSProperties}
          >
            <div className="act sticky top-0 h-[100svh] overflow-hidden" style={{ background: skin.bg, color: skin.ink }}>
              {/* palco (nível 00 — atrás de tudo) */}
              <ActStage slug={slug} image={item.image} detail={item.detail} labels={item.labels} stages={item.stages} />

              {/* a malha: a mesma em todos os atos, com o significado do mundo */}
              <div className="pointer-events-none absolute inset-0 z-[1] opacity-45" style={{ color: skin.ink }}>
                <WorkDots mode={skin.dots} next={nextSlug ? SKIN[nextSlug].dots : undefined} />
              </div>

              {/* resíduo do ato anterior — o motivo que ainda não foi embora */}
              {prev ? <Residue from={prev} /> : null}
              {/* véu de entrada: a borda superior deste painel nasce com a cor do
                  ato anterior, então a cortina do sticky não aparece como um
                  corte reto entre dois fundos de cores diferentes */}
              {prev ? <span data-veil aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[42%]" style={{ background: `linear-gradient(to bottom, ${SKIN[prev].bg} 0%, ${SKIN[prev].bg}00 100%)` }} /> : null}

              {/* a cor do próximo mundo, revelada na saída */}
              {nextSlug ? <span data-bleed aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] opacity-0" style={{ background: bleedOf(slug) }} /> : null}

              {/* ===== anatomia editorial (nível 01–03) ===== */}
              <div className="relative z-10 flex h-full flex-col px-margin pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-nav md:pb-8">
                {i === 0 ? (
                  <p data-reveal className="t-mono pt-3 opacity-55">
                    {eyebrow}
                  </p>
                ) : null}
                <div data-reveal className="flex items-center justify-between border-t border-current/25 pt-3 t-mono">
                  <span>
                    {item.n} / {item.name}
                  </span>
                  <span className="tnum opacity-55">
                    {item.n} / {total}
                  </span>
                </div>

                {/* o palco vive atrás desta folga */}
                <div className="flex-1" />

                {/* NÍVEL 02 — metadata técnica do projeto. No Vertex ela não é
                    uma linha: são as anotações da prancha, distribuídas pelo
                    palco (ESC no canto, REV no outro, a cota sob o frame…). */}
                {slug === "atelier-vertex" ? null : (
                  <ul data-reveal className="t-mono flex flex-wrap items-center gap-x-5 gap-y-1 opacity-90">
                    {item.labels.map((l) => (
                      <li key={l} data-meta className="whitespace-nowrap">
                        {l}
                      </li>
                    ))}
                  </ul>
                )}

                {/* NÍVEL 01 — a manchete domina a viewport */}
                <h2 data-headline data-reveal className="t-display t-fit-work mt-3 md:mt-4" data-inspect="CASE_TITLE" style={{ viewTransitionName: `case-title-${item.slug}` }}>
                  <span className="block">{item.title[0]}</span>
                  <span className="block">{item.title[1]}</span>
                </h2>

                {/* NÍVEL 03 — interface */}
                <div className="mt-4 flex items-end justify-between gap-6 t-mono md:mt-5">
                  <div data-reveal className="opacity-55">
                    <span>MW/00{i + 2}</span>
                    {last ? (
                      <Link href={allHref} className="link-rule ml-4 md:ml-6">
                        {all} →
                      </Link>
                    ) : null}
                  </div>
                  <div data-reveal className="text-right">
                    <p className="opacity-55">
                      {item.client ? `${clientWork} — ${item.client.toUpperCase()}` : item.displayType}
                      {item.year ? ` — ${item.year}` : ""}
                    </p>
                    <Link href={item.href} data-vt={vtOfSlug(item.slug)} data-cta className="act-cta mt-2 inline-flex items-center gap-1.5 whitespace-nowrap" data-inspect="CTA / EXPLORE">
                      <span aria-hidden="true" className="act-cta-br">
                        [
                      </span>
                      <span className="act-cta-txt">{enter}</span>
                      <span aria-hidden="true" className="act-cta-arrow">
                        ↗
                      </span>
                      <span aria-hidden="true" className="act-cta-br">
                        ]
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

/** O motivo do ato anterior, ainda em cena nos primeiros frames deste. */
function Residue({ from }: { from: ActSlug }) {
  if (from === "kavita-drones")
    // contornos de levantamento já virando grão — o estado em que o Kavita
    // termina (linhas pontilhadas com corpo), sobrando sobre o papel quente
    return (
      <svg data-residue aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.004 0.014" opacity="0.3">
        <path pathLength="1" d="M-40 700 C240 620 420 760 700 690 C960 626 1180 720 1480 660" />
        <path pathLength="1" d="M-40 780 C260 700 460 830 720 764 C980 700 1200 792 1480 736" />
        <path pathLength="1" d="M-40 620 C220 540 400 690 680 616" />
      </svg>
    );
  if (from === "terral")
    // grãos que ainda caem antes do papel ficar limpo
    return (
      <svg data-residue aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="xMidYMid slice" fill="currentColor" opacity="0.35">
        {Array.from({ length: 26 }).map((_, k) => {
          const x = ((k * 37) % 100) + 0.5;
          const y = ((k * 23) % 56) + 0.5;
          return <circle key={k} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(0.12 + (k % 4) * 0.07).toFixed(2)} />;
        })}
      </svg>
    );
  if (from === "aurex-timepieces")
    // aurex → inkvision: os pivôs do calibre ainda em cena, já no lugar dos
    // tracking points — mecânica virando visão computacional
    return (
      <svg data-residue aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="xMidYMid slice" fill="currentColor" opacity="0.35">
        {dotsOf("pivot").map((d, k) => (
          <circle key={k} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={d.r.toFixed(2)} opacity={d.o.toFixed(2)} />
        ))}
      </svg>
    );
  if (from === "inkvision")
    // inkvision → logistics: os tracking points ainda em cena — a timeline do
    // ato os alinha numa linha de coordenadas antes de apagá-los, e é dessa
    // linha que a origem da rota nasce (visão computacional virando instrumento)
    return (
      <svg data-residue aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="xMidYMid slice" fill="currentColor" opacity="0.4">
        {dotsOf("track").map((d, k) => (
          <rect key={k} x={(d.x - d.r).toFixed(2)} y={(d.y - d.r).toFixed(2)} width={(d.r * 2).toFixed(2)} height={(d.r * 2).toFixed(2)} opacity={d.o.toFixed(2)} />
        ))}
      </svg>
    );
  // vertex → aurex: as guias já convergidas num feixe (o estado em que o Vertex
  // termina) — eixos que ainda não viraram mecânica
  return (
    <svg data-residue aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.22">
      {[0, 1, 2, 3, 4].map((k) => (
        <line key={k} x1={792 + k * 43} y1="0" x2={792 + k * 43} y2="900" transform={`rotate(${(k - 2) * 9} ${792 + k * 43} 450)`} vectorEffect="non-scaling-stroke" />
      ))}
      <line x1="783" y1="162" x2="973" y2="162" vectorEffect="non-scaling-stroke" />
      <line x1="783" y1="594" x2="973" y2="594" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ==================================================================
   OS SEIS PALCOS — cada função recebe a timeline do ato e escreve as
   suas batidas nas faixas de `ACT`. Uma propriedade, um dono.
   ================================================================== */
type Q = ReturnType<typeof gsap.utils.selector>;
type One = <T extends HTMLElement>(s: string) => T | undefined;

/**
 * 01 KAVITA — território sob análise. O roteiro do ato, em progresso da trigger:
 *
 *   0.00–0.22  ENTRADA      topografia se desenha; a janela abre como uma fenda
 *   0.22–0.56  VARREDURA    a linha lê o campo de cima para baixo (o véu sai com ela)
 *   0.32–0.46  DRONE        entra de baixo e cruza a moldura; alvo e leitura T70P
 *   0.28–0.62  LEITURAS     uma por vez, no instante em que a linha passa pela região
 *   0.48–0.62  METADATA     três blocos, em sequência
 *   0.64–0.74  ESTABILIZA   a janela fecha como abriu e o drone decola: a manchete
 *                           fica sozinha em tela — nada compete
 *   0.72–0.92  SAÍDA        os contornos viram grão (a língua do Terral) e as
 *                           rotas somem; a sangria de cor (compartilhada) sobe
 *
 * GEOMETRIA QUE MANDA NO ROTEIRO: o conteúdo é sticky dentro de um trilho de
 * 200 svh, então a partir de ~0.67 o painel começa a subir coberto pelo
 * próximo. A metade de cima (onde a janela mora) sai da tela em ~0.72 — por
 * isso a janela fecha ANTES disso, e a "dominância" da manchete é feita por
 * subtração, não por mexer nela (x/y da manchete pertencem à lei do cursor).
 */
function kavita(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const media = one("[data-media]");
  const drone = one("[data-media-b]");
  const img = one("[data-media] [data-crop]");
  const scan = q("[data-scan]");
  const frame = q("[data-frame]");
  const target = q("[data-target]");
  const readouts = q("[data-readout] [data-coord]");
  const meta = q("[data-meta]");
  const contours = q("[data-contour]");
  const routes = q("[data-route]");

  /* ENTRADA — a topografia se desenha e a janela abre como uma fenda de varredura */
  tl.fromTo(contours, { strokeDashoffset: 1, strokeDasharray: "1 1" }, { strokeDashoffset: 0, stagger: 0.012, duration: 0.22 }, 0.04);
  tl.fromTo(routes, { strokeDashoffset: 1, strokeDasharray: "1 1" }, { strokeDashoffset: 0, stagger: 0.04, duration: 0.16 }, ACT.enter);
  // depois de desenhadas, as rotas viram linha de voo pontilhada (pathLength = 1)
  tl.set(routes, { strokeDasharray: "0.008 0.02" }, ACT.enter + 0.2);
  tl.fromTo(q("[data-crosshair]"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%" }, { autoAlpha: 0.55, scale: 1, stagger: 0.05, duration: 0.12 }, ACT.enter + 0.04);
  tl.fromTo(media ?? [], { clipPath: "inset(50% 0 50% 0)" }, { clipPath: "inset(0% 0 0% 0)", duration: 0.18, ease: EASE.outQuint }, 0.06);
  tl.fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.16);

  /* VARREDURA — a linha lê o campo; o que está abaixo dela ainda é véu */
  tl.fromTo(scan, { yPercent: 0 }, { yPercent: 100, duration: 0.34 }, 0.22);

  /* DRONE — entra de baixo quando a linha chega ao meio da janela e cruza a
     moldura. Só xPercent/yPercent/scale/autoAlpha aqui: x/y são da lei do cursor. */
  tl.fromTo(drone ?? [], { autoAlpha: 0, yPercent: 16, xPercent: -6, scale: 0.94, transformOrigin: "50% 50%" }, { autoAlpha: 1, yPercent: 0, xPercent: 0, scale: 1, duration: 0.14, ease: EASE.outQuint }, 0.32);
  tl.fromTo(target, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.46);

  /* LEITURAS — cada uma no seu instante; a anterior baixa quando a próxima chega */
  const beats = [0.28, 0.46, 0.53, 0.6];
  readouts.forEach((r, i) => {
    tl.fromTo(r, { autoAlpha: 0, x: 10 }, { autoAlpha: 0.85, x: 0, duration: 0.05, ease: EASE.outQuint }, beats[i] ?? 0.6);
    if (i < readouts.length - 1) tl.to(r, { autoAlpha: 0.16, duration: 0.05 }, beats[i + 1]);
  });

  /* METADATA — três blocos independentes, em sequência, enquanto a leitura termina */
  meta.forEach((m, i) => tl.fromTo(m, { autoAlpha: 0, x: 10 }, { autoAlpha: 1, x: 0, duration: 0.06, ease: EASE.outQuint }, 0.48 + i * 0.06));

  /* EXPERIÊNCIA — profundidade lenta: a placa quase parada, o mapa vivo atrás */
  if (!small && img) tl.fromTo(img, { yPercent: 3 }, { yPercent: -3, duration: ACT.hold - ACT.build }, ACT.build);
  tl.fromTo(q("[data-topo]"), { yPercent: 0, scale: 1, transformOrigin: "50% 60%" }, { yPercent: -4, scale: 1.035, duration: ACT.prepare - ACT.build }, ACT.build);
  // relevo vivo: os anéis respiram em opacidade, do centro para fora — sem morph
  tl.to(contours, { opacity: (i: number) => 0.36 - (i % 6) * 0.03, stagger: { each: 0.015, from: "center" }, duration: 0.14 }, 0.4);
  if (drone) tl.to(drone, { yPercent: -5, xPercent: 3, duration: 0.18 }, 0.46);

  /* ESTABILIZAÇÃO — a manchete fica sozinha: a janela fecha como abriu e o drone decola */
  tl.to(readouts, { autoAlpha: 0, duration: 0.06 }, 0.66);
  tl.to(target, { autoAlpha: 0, duration: 0.05 }, 0.64);
  tl.to(frame, { autoAlpha: 0, duration: 0.06 }, 0.64);
  if (media) tl.to(media, { clipPath: "inset(50% 0 50% 0)", duration: 0.1, ease: EASE.smooth }, 0.65);
  if (drone) tl.to(drone, { yPercent: -34, xPercent: 12, scale: 1.04, autoAlpha: 0.4, duration: 0.16, ease: "power1.in" }, 0.66);

  /* SAÍDA → TERRAL — a topografia perde a rigidez: os contornos viram grão
     (pathLength = 1, então o tracejado é fração do caminho) e ganham corpo,
     as rotas e as cruzetas somem. É a língua do próximo ato nascendo aqui. */
  tl.to(contours, { strokeDasharray: "0.004 0.014", strokeWidth: 1.6, opacity: 0.24, stagger: 0.012, duration: 0.2 }, ACT.hold + 0.02);
  tl.to(routes, { autoAlpha: 0, duration: 0.1 }, ACT.hold + 0.04);
  tl.to(q("[data-crosshair]"), { autoAlpha: 0, duration: 0.08 }, ACT.hold + 0.04);
}

/**
 * 02 TERRAL — matéria. O roteiro do ato, em progresso da trigger:
 *
 *   0.02–0.22  PAPEL        a fibra e o ruído de impressão sobem; a malha de grãos já está
 *   0.08–0.30  GRÃO         a FIG. 01 entra pela direita (a caixa abre como cortina e a
 *                           foto desliza dentro no sentido contrário: matéria chegando)
 *   0.26–0.42  TORRA        a FIG. 02 cruza a composição de baixo/esquerda e assenta
 *                           sobre o canto da FIG. 01; o grão sobe nas duas
 *   0.36–0.86  PROFUNDIDADE três velocidades: a FIG. 01 quase parada (yPercent −3 → 0,
 *                           zoom 1 → 1,06 e deriva lateral — a matéria viva), a
 *                           FIG. 02 mais viva (yPercent +2 → −9, x +2), a malha de
 *                           grãos entre as duas. Tudo em xPercent/yPercent/scale:
 *                           x/y são da lei do cursor
 *   0.40–0.62  REGISTRO     marcas de corte, rótulos FIG., a curva de torra se
 *                           desenha e a metadata chega em três blocos
 *   0.62–0.66  ESTABILIZA   o instrumento sai: só as duas figuras e a manchete
 *   0.66–0.86  SAÍDA        a matéria esfria — grão e papel limpam, as fotos
 *                           baixam, as bordas endurecem em linha e as marcas de
 *                           corte se ESTENDEM até a tela: os frames viram as guias
 *                           de projeto do Vertex (mesmas posições: 28/50/94 % e 18,67 %)
 *
 * A mesma geometria sticky do Kavita manda aqui: a metade de cima sai da tela
 * em ~0.72, então a coreografia das figuras termina antes e a dominância da
 * manchete é por subtração (o instrumento e os rótulos saem, nada é somado).
 */
function terral(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const aWrap = one("[data-media-wrap]");
  const a = one("[data-media]");
  const aImg = one("[data-media] [data-crop]");
  const bWrap = one("[data-media-b-wrap]");
  const bImg = one("[data-media-b] [data-crop]");
  const meta = q("[data-meta]");
  const marks = q("[data-mark]");
  const figs = q("[data-fig]");
  const frames = q("[data-frame]");
  const roast = q("[data-roast]");

  /* PAPEL — a folha ganha corpo */
  tl.fromTo(q("[data-fibre]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.02);
  tl.fromTo(q("[data-paper]"), { autoAlpha: 0 }, { autoAlpha: 0.08, duration: 0.2 }, 0.02);

  /* GRÃO — a FIG. 01 entra pela direita: cortina + deslize interno contrário */
  tl.fromTo(a ?? [], { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 0.22, ease: EASE.outQuint }, 0.08);
  tl.fromTo(aImg ?? [], { xPercent: 5, scale: 1.04 }, { xPercent: 0, scale: 1, duration: 0.24, ease: EASE.outQuint }, 0.08);

  /* TORRA — a FIG. 02 cruza e assenta; o grão sobe nas duas */
  tl.fromTo(bWrap ?? [], { autoAlpha: 0, xPercent: -16, yPercent: 14 }, { autoAlpha: 1, xPercent: 0, yPercent: 2, duration: 0.16, ease: EASE.outQuint }, 0.26);
  tl.fromTo(q("[data-grain]"), { autoAlpha: 0 }, { autoAlpha: 0.5, duration: 0.14 }, 0.3);

  /* PROFUNDIDADE — três velocidades, todas do scroll */
  if (!small) {
    if (aWrap) tl.fromTo(aWrap, { yPercent: -3 }, { yPercent: 0, duration: ACT.prepare - ACT.build }, ACT.build);
    if (aImg) tl.to(aImg, { scale: 1.06, xPercent: -1.5, duration: ACT.prepare - ACT.build }, ACT.build);
    if (bWrap) tl.to(bWrap, { yPercent: -9, xPercent: 2, duration: ACT.prepare - 0.42 }, 0.42);
    if (bImg) tl.fromTo(bImg, { yPercent: 1.5 }, { yPercent: -1.5, duration: ACT.prepare - 0.42 }, 0.42);
    // a malha de grãos anda devagar entre as duas figuras (unidades do viewBox)
    tl.fromTo(q("[data-dots]"), { y: 0.6 }, { y: -1, duration: ACT.prepare - ACT.build }, ACT.build);
  }

  /* REGISTRO — marcas, rótulos, instrumento e metadata: a composição se declara montada */
  tl.fromTo(marks, { autoAlpha: 0, scale: 0.5, transformOrigin: "50% 50%" }, { autoAlpha: 0.55, scale: 1, stagger: 0.008, duration: 0.08 }, 0.4);
  figs.forEach((f, i) => tl.fromTo(f, { autoAlpha: 0, x: -6 }, { autoAlpha: 0.7, x: 0, duration: 0.06, ease: EASE.outQuint }, 0.3 + i * 0.14));
  tl.fromTo(roast, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.44);
  tl.fromTo(q("[data-roast-curve]"), { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 0.16 }, 0.46);
  tl.fromTo(q("[data-roast-label]"), { autoAlpha: 0 }, { autoAlpha: 0.75, stagger: 0.04, duration: 0.05 }, 0.52);
  meta.forEach((m, i) => tl.fromTo(m, { autoAlpha: 0, x: 10 }, { autoAlpha: 1, x: 0, duration: 0.06, ease: EASE.outQuint }, 0.46 + i * 0.06));

  /* ESTABILIZAÇÃO — só figuras e manchete: o instrumento sai de cena */
  tl.to(roast, { autoAlpha: 0, duration: 0.06 }, 0.62);

  /* SAÍDA → VERTEX — a matéria esfria e os frames viram linhas de projeto.
     Começa em 0.66, antes da faixa de preparação: a metade de cima do painel
     (onde as figuras moram) sai da tela em ~0.72, e a sangria de cor do próximo
     ato passa de 50 % perto de 0.9 — depois disso não há mais nada para ver. As
     linhas que descem das figuras cruzam a zona da manchete, que fica em tela
     até o fim: é por elas que a transformação continua visível. */
  tl.to(q("[data-grain]"), { autoAlpha: 0.1, duration: 0.12 }, 0.66);
  tl.to(q("[data-paper]"), { autoAlpha: 0, duration: 0.12 }, 0.66);
  tl.to(q("[data-fibre]"), { autoAlpha: 0.35, duration: 0.14 }, 0.66);
  tl.to(frames, { autoAlpha: 0.7, duration: 0.08 }, 0.66);
  tl.to(marks, { autoAlpha: 0, duration: 0.05 }, 0.69);
  tl.to(figs, { autoAlpha: 0, duration: 0.05 }, 0.69);
  // as marcas de corte se estendem: verticais primeiro, a horizontal depois
  tl.fromTo(q("[data-line-v]"), { scaleY: 0 }, { scaleY: 1, stagger: 0.012, duration: 0.12, ease: EASE.smooth }, 0.68);
  tl.fromTo(q("[data-line-h]"), { scaleX: 0 }, { scaleX: 1, duration: 0.1, ease: EASE.smooth }, 0.72);
  // as fotos cedem lugar ao frame (a caixa clipada, não o invólucro: as linhas ficam)
  tl.to([a ?? [], q("[data-media-b]")], { autoAlpha: 0.38, duration: 0.14 }, 0.72);
}

/**
 * 03 VERTEX — construído no scroll. O roteiro do ato, em progresso da trigger:
 *
 *   0.02–0.26  PRANCHA      a guia de margem e as cinco verticais se desenham de cima
 *                           para baixo; as horizontais crescem do centro; cada anchor
 *                           point acende quando a guia chega ao cruzamento (□ → ■ → □);
 *                           os rótulos assentam. Nenhuma fotografia.
 *   0.14–0.36  ELEVAÇÃO     o desenho técnico da fachada se traça dentro do frame
 *   0.30–0.58  ESTRUTURA    fatia a fatia (0.30/0.35/0.40/0.45), a obra sobe do chão:
 *                           clip de baixo para cima com o primeiro frame do vídeo
 *                           (andaime, laje), cada fatia assentando 5 % ao subir
 *   0.44–0.56  COTAS        11,50 M mede o frame quando a estrutura existe; 3,20 M um pavimento
 *   0.46–0.72  ENTREGA      pelo mesmo caminho (0.46/0.51/0.56/0.61), o último frame: o
 *                           prédio pronto cobre a estrutura; a elevação vira traço leve
 *   0.66–0.74  ASSINATURA   elevação, rótulos, cotas e anchors saem — só a obra e a
 *                           manchete CONSTRUÍDO / NO SCROLL, que já estava lá
 *   0.72–0.96  SAÍDA        as verticais deixam de ser grid: convergem para o centro
 *                           do frame e abrem em feixe (±9° por guia), as horizontais
 *                           encolhem para o eixo, a obra apaga e o frame recua —
 *                           arquitetura → engenharia → mecânica, sobre a sangria
 *                           de cor (compartilhada) que vai do papel ao preto do Aurex
 *
 * Tudo termina antes de ~0.72: a metade de cima do painel (onde o frame mora)
 * sai da tela aí, e a sangria passa de 50 % perto de 0.9.
 */
function vertex(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const wrap = one("[data-media-wrap]");
  const media = one("[data-media]");
  const guidesV = q<HTMLElement>("[data-guide-v]");
  const guidesH = q("[data-guide-h]");
  const guideM = q("[data-guide-m]");
  const anchors = q("[data-anchor]");
  const fills = q("[data-anchor-fill]");
  const labels = q("[data-plan-label]");
  const leader = q("[data-leader]");
  const dimH = q("[data-dim-h]");
  const dimV = q("[data-dim-v]");
  const dimLabels = q("[data-dim-label]");
  const elevation = q("[data-elevation]");
  const draw = q("[data-draw]");
  const slicesIn = q("[data-slice-in]");
  const layersA = q("[data-layer-a]");
  const layersB = q("[data-layer-b]");

  /* PRANCHA — as guias se desenham; os anchors acendem quando a guia chega */
  const vAt = (k: number) => 0.04 + k * 0.03; // início da vertical k (dura 0.16, 100 svh de cima para baixo)
  tl.fromTo(guideM, { scaleY: 0 }, { scaleY: 1, duration: 0.14 }, 0.02);
  tl.fromTo(guidesV, { scaleY: 0 }, { scaleY: 1, stagger: 0.03, duration: 0.16 }, vAt(0));
  tl.fromTo(guidesH, { scaleX: 0 }, { scaleX: 1, stagger: 0.05, duration: 0.16 }, 0.1);
  anchors.forEach((a, i) => {
    const k = Math.floor(i / 2);
    const j = i % 2; // 0 = borda de cima do frame (15 svh), 1 = borda de baixo (~55 svh)
    const t = vAt(k) + 0.16 * (j ? 0.55 : 0.15);
    tl.fromTo(a, { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%" }, { autoAlpha: 0.8, scale: 1, duration: 0.03 }, t);
    const f = fills[i];
    if (f) {
      tl.fromTo(f, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.012 }, t);
      tl.to(f, { autoAlpha: 0, duration: 0.03 }, t + 0.02);
    }
  });
  tl.fromTo(labels, { autoAlpha: 0, y: -6 }, { autoAlpha: 0.8, y: 0, stagger: 0.03, duration: 0.1, ease: EASE.outQuint }, 0.14);
  tl.fromTo(leader, { scaleX: 0 }, { scaleX: 1, duration: 0.1 }, 0.2);

  /* ELEVAÇÃO — o projeto se desenha dentro do frame vazio */
  tl.fromTo(draw, { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, stagger: 0.02, duration: 0.16 }, 0.14);

  /* ESTRUTURA — a obra sobe do chão, fatia a fatia, e assenta */
  layersA.forEach((l, k) => tl.fromTo(l, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.14, ease: EASE.smooth }, 0.3 + k * 0.05));
  slicesIn.forEach((s, k) => tl.fromTo(s, { yPercent: 5 }, { yPercent: 0, duration: 0.14, ease: EASE.outQuint }, 0.3 + k * 0.05));

  /* COTAS — medem a obra quando ela existe */
  tl.fromTo(dimH, { autoAlpha: 0, scaleX: 0.2 }, { autoAlpha: 0.7, scaleX: 1, duration: 0.12, ease: EASE.outQuint }, 0.44);
  tl.fromTo(dimV, { autoAlpha: 0, scaleY: 0.2 }, { autoAlpha: 0.7, scaleY: 1, duration: 0.12, ease: EASE.outQuint }, 0.5);
  tl.fromTo(dimLabels, { autoAlpha: 0 }, { autoAlpha: 0.8, stagger: 0.06, duration: 0.06 }, 0.48);

  /* ENTREGA — o prédio pronto cobre a estrutura pelo mesmo caminho */
  layersB.forEach((l, k) => tl.fromTo(l, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.12, ease: EASE.smooth }, 0.46 + k * 0.05));
  tl.to(elevation, { autoAlpha: 0.25, duration: 0.14 }, 0.46);

  /* ASSINATURA — só a obra e a manchete */
  tl.to(elevation, { autoAlpha: 0, duration: 0.08 }, 0.66);
  tl.to([labels, leader, dimH, dimV, dimLabels], { autoAlpha: 0, duration: 0.08 }, 0.68);
  tl.to(anchors, { autoAlpha: 0, duration: 0.06 }, 0.7);

  /* SAÍDA → AUREX — o grid vira feixe de eixos; a obra apaga; o frame recua */
  const w = () => wrap?.offsetWidth ?? 0;
  guidesV.forEach((g, k) => tl.to(g, { x: () => (0.5 - k / 4) * w() * 0.82, rotation: (k - 2) * 9, transformOrigin: "50% 60%", duration: 0.24, ease: "power1.in" }, 0.72));
  tl.to(guidesH, { scaleX: 0.12, duration: 0.24, ease: "power1.in" }, 0.72);
  tl.to(guideM, { autoAlpha: 0, duration: 0.1 }, 0.74);
  if (media) tl.to(media, { autoAlpha: 0.3, duration: 0.2 }, 0.76);
  if (wrap) tl.to(wrap, { scale: small ? 0.96 : 0.94, transformOrigin: "50% 50%", duration: 0.24 }, 0.74);
}

/** 04 AUREX — o tempo desmontado: o calibre AX-01 em vista explodida, pelo scroll. */
function aurex(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const media = one("[data-media]");
  const wrap = one("[data-movement-wrap]");

  // ENTRADA — o relógio real abre em círculo (a composição que já funcionava)
  tl.fromTo(media ?? [], { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(72% at 50% 50%)", duration: ACT.enter + 0.04, ease: EASE.smooth }, 0);

  // CONSTRUÇÃO — o esquema entra ALINHADO com a fotografia: estado montado
  tl.fromTo(wrap ?? [], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, ACT.enter);
  tl.fromTo(q("[data-axis]"), { autoAlpha: 0, scaleY: 0.2, transformOrigin: "50% 50%" }, { autoAlpha: 0.4, scaleY: 1, duration: 0.14 }, ACT.enter + 0.04);

  // EXPERIÊNCIA — a DECOMPOSIÇÃO. Cada peça anda pelo seu vetor e cada roda gira
  // pela sua razão do trem: a explosão é mecânica, não uma rotação aleatória.
  // A foto cede lugar ao esquema conforme ele se separa.
  const spread = small ? 0.62 : 1;
  AUREX_PARTS.forEach((part, k) => {
    const g = q<SVGGElement>(`[data-part="${part.id}"]`)[0];
    if (!g) return;
    tl.fromTo(
      g,
      { x: 0, y: 0, rotate: 0 },
      { x: part.dx * spread, y: part.dy * spread, rotate: part.spin * 42, duration: ACT.hold - ACT.build, ease: "power1.inOut", svgOrigin: "0 0" },
      ACT.build + k * 0.012,
    );
  });
  if (media) tl.to(media, { autoAlpha: 0.18, duration: ACT.hold - ACT.build }, ACT.build);
  tl.fromTo(q("[data-part-label]"), { autoAlpha: 0, x: -8 }, { autoAlpha: 0.6, x: 0, stagger: 0.03, duration: 0.12 }, ACT.hold - 0.08);

  // SAÍDA — o calibre continua girando devagar e a cena se apaga com a seção
  AUREX_PARTS.forEach((part) => {
    const g = q<SVGGElement>(`[data-part="${part.id}"]`)[0];
    if (!g || !part.spin) return;
    tl.to(g, { rotate: part.spin * 70, duration: 1 - ACT.hold, svgOrigin: "0 0" }, ACT.hold);
  });
  // a saída do calibre acontece no fim de tudo: o painel ainda está inteiro em
  // tela durante `prepare`, e apagar antes seria apagar o ato no auge
  if (wrap) tl.to(wrap, { autoAlpha: 0.55, scale: 1.05, duration: 0.06 }, 0.94);
  tl.to(q("[data-part-label]"), { autoAlpha: 0, duration: 0.05 }, 0.94);
}

/**
 * 05 INKVISION — um sistema entendendo a pele. É o ÚLTIMO ato: a trigger vai
 * até `bottom bottom`, então o painel entra durante 0 → 0.5 (a metade de cima,
 * onde o frame mora, aparece primeiro) e fica preso, inteiro em tela, de 0.5 a
 * 1. O roteiro, em progresso da trigger:
 *
 *   0.04–0.24  CORPO        a pele emerge do preto do Aurex (véu 0.55 → 0.28)
 *   0.14–0.30  DETECÇÃO     o contorno se desenha ao redor do antebraço; os tracking
 *                           points pousam nos dois bordos; etapa 01 acende
 *   0.30–0.44  MALHA        a superfície paramétrica se constrói (longitudinais e
 *                           anéis do cilindro); etapa 02
 *   0.42–0.50  DESENHO      a folha branca sobe com o desenho plano (a marca do
 *                           InkVision em traço fino) — um arquivo, não uma tatuagem
 *   0.50–0.60  PROJEÇÃO     a folha some, o desenho viaja até a pele e gira para o
 *                           eixo do braço; etapa 03
 *   0.56–0.68  WARP         tira a tira, do centro para fora, o desenho enrola no
 *                           cilindro (posição r·sin φ, largura cos φ, curvatura); a
 *                           malha baixa para 0.22 — ela segue, mas cede
 *   0.64–0.78  IMG2IMG      a varredura de baixa intensidade cruza o frame da
 *                           esquerda para a direita e "fecha" a simulação: o véu sai,
 *                           o contorno sai, sobram três marcações; etapa 04
 *   0.62–0.80  RESULTADO    metadata em três batidas; as etapas anteriores baixam
 *   0.80–1.00  COMPARAÇÃO   ORIGINAL ↔ SIMULATION disponível ao cursor (lei do mundo)
 *
 * Uma propriedade, um dono: a timeline tem x/y/rotation/scaleX das tiras e o
 * clip da varredura; a lei do cursor só tem o clip da cópia original.
 */
function inkvision(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const dark = q("[data-dark]");
  const contour = q("[data-contour]");
  const meshLines = q("[data-mesh-line]");
  const mesh = q("[data-mesh]");
  const track = q("[data-track]");
  const trackAux = q("[data-track]:not([data-key])");
  const sheet = q("[data-sheet]");
  const tattoo = one("[data-tattoo]");
  const rot = one("[data-tattoo-rot]");
  const strips = q("[data-strip]");
  const sweep = q("[data-sweep]");
  const sweepLine = q("[data-sweep-line]");
  const compare = q("[data-compare]");
  const steps = q("[data-step]");
  const meta = q("[data-meta]");
  const wrap = one("[data-media-wrap]");
  const pose = tattooPose();
  const targets = stripTargets();
  // Último ato: nenhum tween chega a 1.0 (não há sangria nem saída), e a duração
  // de uma timeline é o fim do último tween — sem esta âncora o progresso 0.7
  // da trigger cairia no tempo 0.60 e todo o roteiro ficaria adiantado.
  tl.set({}, {}, 1);
  const step = (i: number, at: number) => {
    if (!steps[i]) return;
    tl.fromTo(steps[i], { autoAlpha: 0, x: 10 }, { autoAlpha: 0.85, x: 0, duration: 0.05, ease: EASE.outQuint }, at);
    if (i > 0) tl.to(steps[i - 1], { autoAlpha: 0.18, duration: 0.05 }, at);
  };

  /* CORPO — a pele emerge */
  tl.fromTo(dark, { autoAlpha: 0.55 }, { autoAlpha: 0.28, duration: 0.2 }, 0.04);

  /* DETECÇÃO */
  tl.fromTo(contour, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.14 }, 0.14);
  tl.fromTo(track, { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%" }, { autoAlpha: 0.9, scale: 1, stagger: 0.012, duration: 0.06, ease: EASE.outQuint }, 0.2);
  step(0, 0.14);

  /* MALHA */
  tl.fromTo(meshLines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.008, duration: 0.12 }, 0.3);
  step(1, 0.3);

  /* DESENHO PLANO — a folha e o desenho, um arquivo */
  // x/y absolutos: num <g> com `transform` de atributo, um `y: 0` relativo apagaria o translate
  tl.fromTo(sheet, { autoAlpha: 0, x: SHEET.x, y: SHEET.y + 24 }, { autoAlpha: 1, x: SHEET.x, y: SHEET.y, duration: 0.06, ease: EASE.outQuint }, 0.42);
  tl.fromTo(tattoo ?? [], { autoAlpha: 0, x: SHEET.x, y: SHEET.y + 24 }, { autoAlpha: 1, x: SHEET.x, y: SHEET.y, duration: 0.06, ease: EASE.outQuint }, 0.43);
  tl.fromTo(rot ?? [], { rotation: 0, transformOrigin: "50% 50%" }, { rotation: 0, duration: 0.01 }, 0.43);

  /* PROJEÇÃO — a folha some, o desenho viaja até a pele e gira para o eixo do braço */
  tl.to(sheet, { autoAlpha: 0, duration: 0.05 }, 0.5);
  if (tattoo) tl.to(tattoo, { x: pose.x, y: pose.y, duration: 0.1, ease: EASE.smooth }, 0.5);
  if (rot) tl.to(rot, { rotation: pose.rotation, duration: 0.1, ease: EASE.smooth }, 0.5);
  step(2, 0.52);

  /* WARP — tira a tira, do centro para fora, o desenho enrola no cilindro */
  strips.forEach((st, i) => {
    const t = targets[i];
    if (!t) return;
    tl.fromTo(st, { x: 0, y: 0, scaleX: 1, transformOrigin: `${t.cx}px 100px` }, { x: t.x, y: t.y, scaleX: t.scaleX, duration: 0.1, ease: EASE.smooth }, 0.56 + Math.abs(i - (strips.length - 1) / 2) * 0.008);
  });
  tl.to(mesh, { autoAlpha: 0.22, duration: 0.1 }, 0.58);

  /* IMG2IMG — a varredura fecha a simulação; o sistema recua, sobra o resultado */
  step(3, 0.64);
  tl.fromTo(sweepLine, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.64);
  tl.fromTo(sweep, { clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 0 100%)", duration: 0.12 }, 0.64);
  tl.fromTo(sweepLine, { x: 0 }, { x: () => wrap?.offsetWidth ?? 0, duration: 0.12 }, 0.64);
  tl.to(sweepLine, { autoAlpha: 0, duration: 0.02 }, 0.76);
  tl.to(dark, { autoAlpha: 0, duration: 0.12 }, 0.64);
  tl.to(contour, { autoAlpha: 0, duration: 0.08 }, 0.66);
  tl.to(trackAux, { autoAlpha: 0, duration: 0.08, stagger: 0.006 }, 0.68);
  tl.to(mesh, { autoAlpha: small ? 0 : 0.1, duration: 0.1 }, 0.7);

  /* RESULTADO — metadata em três batidas; a comparação fica disponível */
  meta.forEach((m, i) => tl.fromTo(m, { autoAlpha: 0, x: 10 }, { autoAlpha: 1, x: 0, duration: 0.06, ease: EASE.outQuint }, 0.62 + i * 0.06));
  tl.fromTo(compare, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.8);
}

/**
 * 06 LOGISTICS DEMO — cada milha sob controle. É o ÚLTIMO ato (trigger até
 * `bottom bottom`: o painel entra em 0 → 0.5 e fica preso, inteiro em tela,
 * de 0.5 a 1). O roteiro, em progresso da trigger:
 *
 *   0.02–0.18  FRONTEIRA    os tracking points do InkVision (resíduo) se alinham numa
 *                           linha de coordenadas e apagam; o plano tracejado da rota sobe
 *   0.10–0.16  ORIGEM       ORG-01 nasce com um pulso; a carga é consolidada e lacrada
 *                           (STG-01, STG-02: contêiner → caminhão)
 *   0.17–0.32  TERRESTRE    a primeira perna se desenha e o caminhão a percorre (STG-03)
 *   0.30–0.38  PORTO        a janela abre no porto ao anoitecer; handover no terminal —
 *                           o contêiner desce do caminhão (STG-04)
 *   0.36–0.54  OCEANO       a perna longa cruza a composição; o navio; a janela vira mar
 *                           aberto (STG-05)
 *   0.54–0.58  HUB          HUB-02 pulsa; a carga troca para o avião
 *   0.57–0.70  AÉREO        a última perna; a janela recua; DST-03 aparece antes da
 *                           chegada (STG-06)
 *   0.70–0.78  DESTINO      pulso no destino, última milha (caminhão espelhado, como no
 *                           projeto); o plano some e sobra a execução inteira (STG-07)
 *   0.66–0.80  METADATA     três batidas; o card resolve — a manchete já estava lá
 *
 * A carga percorre a polilinha vértice a vértice (x/y em unidades do SVG, tempo
 * proporcional ao comprimento), girando para o rumo de cada segmento. Só a
 * composição visível é animada (larga ou vertical); a lei do cursor tem apenas o
 * retículo e a profundidade da caixa — nunca a carga.
 */
function logistics(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const layer = one(small ? "[data-route-v]" : "[data-route-h]");
  if (!layer) return;
  const route = small ? ROUTE_V : ROUTE_H;
  const s = gsap.utils.selector(layer);
  const first = <T extends Element>(sel: string) => s<T>(sel)[0] as T | undefined;
  const plan = s("[data-plan]");
  const legs = s("[data-leg]");
  const leg = (m: LegMode) => s(`[data-leg][data-mode="${m}"]`);
  const legLabel = (m: LegMode) => s(`[data-leg-label][data-mode="${m}"]`);
  const node = (k: NodeKey) => s(`[data-node="${k}"]`);
  const pulse = (k: NodeKey) => s(`[data-node="${k}"] [data-pulse]`);
  const cap = (k: NodeKey) => s(`[data-node-cap="${k}"]`);
  const unit = (u: UnitKey) => s(`[data-unit="${u}"]`);
  const cargo = first<SVGGElement>("[data-cargo]");
  const rot = first<SVGGElement>("[data-cargo-rot]");
  const media = first<HTMLElement>("[data-media]");
  const plateB = s("[data-plate-b]");
  const steps = q("[data-step]");
  const status = q("[data-status]");
  const pctWrap = q("[data-route-pct]");
  const pctN = one("[data-route-pct-n]");
  const meta = q("[data-meta]");
  const residue = q("[data-residue] rect");
  // Último ato: nenhum tween chega a 1.0 — sem esta âncora a duração da timeline
  // seria o fim do último tween e todo o roteiro ficaria adiantado.
  tl.set({}, {}, 1);

  const step = (i: number, at: number) => {
    if (!steps[i]) return;
    // a anterior apaga ANTES da próxima acender (as duas ocupam o mesmo lugar) e os
    // dois tweens nunca se sobrepõem no tempo — quem escreve por último ganharia
    tl.fromTo(steps[i], { autoAlpha: 0, x: 8 }, { autoAlpha: 0.9, x: 0, duration: 0.02, ease: EASE.outQuint }, at);
    if (i > 0) tl.to(steps[i - 1], { autoAlpha: 0, duration: 0.02 }, at - 0.03);
  };
  // um nó chega: ponto + anel assentam, a legenda sobe; o pulso laranja é UMA vez
  const land = (k: NodeKey, at: number, withPulse = true) => {
    tl.fromTo(node(k), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: 0.05, ease: EASE.outQuint }, at);
    if (withPulse) tl.fromTo(pulse(k), { autoAlpha: 0.9, scale: 0.4, transformOrigin: "50% 50%" }, { autoAlpha: 0, scale: 2.6, duration: 0.07, ease: "power1.out" }, at + 0.01);
    tl.fromTo(cap(k), { autoAlpha: 0, y: 4 }, { autoAlpha: 0.85, y: 0, duration: 0.05, ease: EASE.outQuint }, at + 0.02);
  };
  // a carga troca de modal: o recorte que sai apaga, o que entra acende meio passo depois
  const swap = (from: UnitKey, to: UnitKey, at: number) => {
    tl.to(unit(from), { autoAlpha: 0, duration: 0.03 }, at);
    tl.fromTo(unit(to), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, at + 0.015);
  };
  // o percurso entre dois vértices no intervalo t0 → t1, tempo proporcional ao comprimento
  const travel = (from: number, to: number, t0: number, t1: number) => {
    const segs = segments(route, from, to);
    const total = segs.reduce((a, sg) => a + sg.len, 0);
    let at = t0;
    segs.forEach((sg) => {
      const d = ((t1 - t0) * sg.len) / total;
      if (rot) tl.to(rot, { rotation: sg.angle, duration: 0.012, ease: EASE.smooth }, Math.max(0.01, at - 0.006));
      if (cargo) tl.to(cargo, { x: sg.x1, y: sg.y1, duration: d, ease: "none" }, at);
      at += d;
    });
  };
  const draw = (m: LegMode, t0: number, dur: number) => tl.fromTo(leg(m), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, ease: "none" }, t0);
  const label = (m: LegMode, at: number) => tl.fromTo(legLabel(m), { autoAlpha: 0, y: 4 }, { autoAlpha: 0.8, y: 0, duration: 0.05, ease: EASE.outQuint }, at);
  // fração do percurso executado (só o número; o texto em volta é estático)
  const lens = route.legs.map((l) => segments(route, l.from, l.to).reduce((a, sg) => a + sg.len, 0));
  const sum = lens.reduce((a, b) => a + b, 0);
  const pct = { v: 0 };
  const show = () => {
    if (pctN) pctN.textContent = String(Math.round(pct.v)).padStart(3, "0");
  };
  const progress = (to: number, t0: number, t1: number) => tl.to(pct, { v: to, duration: t1 - t0, ease: "none", onUpdate: show }, t0);

  /* FRONTEIRA — os tracking points viram uma linha de coordenadas (o resíduo apaga em 0.18 → 0.36) */
  const track = dotsOf("track");
  residue.forEach((r, i) => {
    const d = track[i];
    if (d) tl.to(r, { x: ((i + 0.5) / residue.length) * 100 - d.x, y: 13.4 - d.y, duration: 0.16, ease: EASE.smooth }, 0.02);
  });
  tl.fromTo(plan, { autoAlpha: 0 }, { autoAlpha: 0.28, duration: 0.1 }, 0.08);

  /* ORIGEM */
  const [ox, oy] = nodeAt(route, "org");
  if (cargo) tl.set(cargo, { x: ox, y: oy }, 0);
  if (rot) tl.set(rot, { rotation: 0, transformOrigin: "50% 50%" }, 0);
  land("org", 0.1);
  tl.fromTo(status, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.09);
  step(0, 0.09);
  tl.fromTo(cargo ?? [], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.12);
  tl.fromTo(unit("container"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.12);
  step(1, 0.145);
  swap("container", "truck", 0.16);

  /* TERRESTRE */
  draw("ground", 0.17, 0.15);
  label("ground", 0.19);
  step(2, 0.2);
  tl.fromTo(pctWrap, { autoAlpha: 0 }, { autoAlpha: 0.7, duration: 0.04 }, 0.18);
  travel(route.nodes.org, route.nodes.port, 0.18, 0.32);
  progress((lens[0] / sum) * 100, 0.18, 0.32);

  /* PORTO — a janela abre no terminal; a carga desce do caminhão */
  tl.fromTo(media ?? [], { clipPath: "inset(50% 0 50% 0)", autoAlpha: 1 }, { clipPath: "inset(0% 0 0% 0)", duration: 0.08, ease: EASE.outQuint }, 0.3);
  land("port", 0.31);
  step(3, 0.32);
  swap("truck", "container", 0.32);

  /* OCEANO — a perna longa; o navio; a janela vira mar aberto */
  swap("container", "ship", 0.36);
  draw("ocean", 0.36, 0.18);
  step(4, 0.38);
  label("ocean", 0.4);
  travel(route.nodes.port, route.nodes.hub, 0.38, 0.54);
  progress(((lens[0] + lens[1]) / sum) * 100, 0.38, 0.54);
  tl.fromTo(plateB, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.42);

  /* HUB */
  land("hub", 0.54);
  swap("ship", "plane", 0.56);
  step(5, 0.58);

  /* AÉREO — a janela recua; o destino aparece antes da chegada */
  draw("air", 0.57, 0.13);
  label("air", 0.6);
  if (media) tl.to(media, { autoAlpha: 0.4, duration: 0.08 }, 0.58);
  travel(route.nodes.hub, route.nodes.dst, 0.58, 0.7);
  progress(100, 0.58, 0.7);
  land("dst", 0.64, false);

  /* DESTINO — pulso, última milha, o plano some: sobra a execução inteira */
  tl.fromTo(pulse("dst"), { autoAlpha: 0.9, scale: 0.4, transformOrigin: "50% 50%" }, { autoAlpha: 0, scale: 2.6, duration: 0.07, ease: "power1.out" }, 0.705);
  step(6, 0.72);
  swap("plane", "truck-back", 0.72);
  tl.to(plan, { autoAlpha: 0, duration: 0.06 }, 0.72);
  tl.to(legs, { opacity: 1, duration: 0.06 }, 0.72);
  if (media) tl.to(media, { autoAlpha: 0.28, duration: 0.06 }, 0.72);

  /* METADATA — três batidas */
  meta.forEach((m, i) => tl.fromTo(m, { autoAlpha: 0, x: 10 }, { autoAlpha: 1, x: 0, duration: 0.06, ease: EASE.outQuint }, 0.66 + i * 0.06));
}
