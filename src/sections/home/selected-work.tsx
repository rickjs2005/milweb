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
};

/**
 * ACT 03 — SELECTED WORK. Um filme em quatro atos, não quatro cards.
 *
 * ANATOMIA (idêntica nos quatro; o que muda é o palco):
 *
 *   [ 01 / KAVITA ] ─────────────────────────────── [ 01 / 04 ]   nível 03
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
                end: last ? "bottom bottom" : "bottom top",
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
            if (!last) tl.to(q("[data-reveal]"), { autoAlpha: 0.2, duration: 0.16 }, ACT.prepare - 0.06);
            // A cor do próximo mundo sobe durante TODA a cortina (0.70 → 0.96),
            // não só no fim: o painel seguinte começa a cobrir em ~0.67, e uma
            // revelação que só começasse em 0.86 deixaria uma borda dura entre os
            // dois fundos por meia tela de scroll. Para em 0.9 de opacidade para
            // o mundo que sai continuar visível por baixo — dissolve, não apaga.
            if (!last) tl.fromTo(q("[data-bleed]"), { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.96 - ACT.hold, ease: "power1.in" }, ACT.hold);

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
            set("[data-coord], [data-meta], [data-target], [data-frame], [data-anchor], [data-plan-label], [data-part-label], [data-dim], [data-movement-wrap], [data-axis]", { autoAlpha: 1 });
            // véu e sangria são ferramentas de TRANSIÇÃO: sem timeline para
            // apagá-los, ficariam cobrindo metade do painel para sempre
            set("[data-scan], [data-veil], [data-bleed]", { autoAlpha: 0 });
            set("[data-grain]", { autoAlpha: 0.4 });
            set("[data-slice]", { clipPath: "inset(0% 0 0 0)", xPercent: 0 });
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
              <ActStage slug={slug} image={item.image} detail={item.detail} />

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

                {/* NÍVEL 02 — metadata técnica do projeto */}
                <ul data-reveal className="t-mono flex flex-wrap items-center gap-x-5 gap-y-1 opacity-90">
                  {item.labels.map((l) => (
                    <li key={l} data-meta className="whitespace-nowrap">
                      {l}
                    </li>
                  ))}
                </ul>

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
                    <Link href={item.href} data-vt={vtOfSlug(item.slug)} data-cta className="act-cta mt-2 inline-flex items-center gap-1.5" data-inspect="CTA / EXPLORE">
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
  // vertex → aurex: as guias de projeto que ainda não viraram eixos mecânicos
  return (
    <svg data-residue aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.22" vectorEffect="non-scaling-stroke">
      {[86, 403, 720, 1037, 1354].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="900" />
      ))}
      <line x1="0" y1="168" x2="1440" y2="168" />
      <line x1="0" y1="612" x2="1440" y2="612" />
    </svg>
  );
}

/* ==================================================================
   OS QUATRO PALCOS — cada função recebe a timeline do ato e escreve as
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

/** 02 TERRAL — matéria: duas fotografias fora de fase, grão físico, papel ao fundo. */
function terral(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const a = one("[data-media]");
  const aImg = one("[data-media] [data-crop]");
  const b = one("[data-media-b]");

  // ENTRADA — A entra por baixo, quente e lenta
  tl.fromTo(a ?? [], { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: ACT.enter + 0.08, ease: EASE.smooth }, 0);
  // CONSTRUÇÃO — B chega depois, pela esquerda, e o grão sobe nas duas
  tl.fromTo(b ?? [], { autoAlpha: 0, xPercent: -12, yPercent: 10 }, { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: 0.2, ease: EASE.outQuint }, ACT.enter);
  tl.fromTo(q("[data-grain]"), { autoAlpha: 0 }, { autoAlpha: 0.55, duration: 0.16 }, ACT.enter + 0.04);
  tl.fromTo(q("[data-fibre]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.04);

  // EXPERIÊNCIA — as duas em velocidades diferentes (é o que cria a profundidade)
  if (!small) {
    if (aImg) tl.fromTo(aImg, { scale: 1 }, { scale: 1.05, duration: ACT.prepare - ACT.build }, ACT.build);
    if (b) tl.fromTo(b, { yPercent: 0, xPercent: 0 }, { yPercent: -7, xPercent: -3, duration: ACT.prepare - ACT.build }, ACT.build);
  }

  // PREPARAÇÃO → VERTEX: o papel limpa e as bordas viram linha de projeto
  tl.to(q("[data-fibre]"), { autoAlpha: 0.15, duration: 0.14 }, ACT.hold + 0.02);
  tl.to(q("[data-grain]"), { autoAlpha: 0.12, duration: 0.14 }, ACT.hold + 0.02);
  tl.to([a ?? [], b ?? []], { autoAlpha: 0.5, duration: 0.16 }, ACT.prepare - 0.08);
}

/** 03 VERTEX — o desenho constrói o espaço: guias → fatias → fachada alinhada. */
function vertex(tl: gsap.core.Timeline, q: Q, one: One, small: boolean) {
  const slices = q<HTMLElement>("[data-slice]");
  const media = one("[data-media]");

  // ENTRADA — as guias se desenham de cima para baixo
  tl.fromTo(q("[data-guide]"), { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, stagger: 0.025, duration: 0.2 }, 0);
  tl.fromTo(media ?? [], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0.04);

  // CONSTRUÇÃO — anchor points e rótulos de prancha
  tl.fromTo(q("[data-anchor]"), { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%" }, { autoAlpha: 0.8, scale: 1, stagger: 0.012, duration: 0.12 }, ACT.enter);
  tl.fromTo(q("[data-plan-label]"), { autoAlpha: 0, y: -6 }, { autoAlpha: 0.75, y: 0, stagger: 0.04, duration: 0.12 }, ACT.enter + 0.06);

  // EXPERIÊNCIA — cada fatia revela a fachada de baixo para cima, fora de fase,
  // e só depois se alinham: é a obra sendo construída pelo scroll
  slices.forEach((s, k) => {
    tl.fromTo(s, { clipPath: "inset(100% 0 0 0)", xPercent: k % 2 ? 9 : -9 }, { clipPath: "inset(0% 0 0 0)", duration: 0.2 }, ACT.build + k * 0.05);
    tl.to(s, { xPercent: 0, duration: 0.14, ease: EASE.outQuint }, ACT.hold - 0.1 + k * 0.02);
  });
  // a cota mede a obra depois que ela existe
  tl.fromTo(q("[data-dim]"), { autoAlpha: 0, scaleX: 0.2, transformOrigin: "0% 50%" }, { autoAlpha: 0.6, scaleX: 1, duration: 0.14, ease: EASE.outQuint }, ACT.hold - 0.04);

  // PREPARAÇÃO → AUREX: as guias convergem para o centro e a luz cai
  tl.to(q("[data-guides]"), { scale: small ? 0.9 : 0.78, autoAlpha: 0.35, transformOrigin: "50% 42%", duration: 1 - ACT.hold }, ACT.hold);
  tl.to(q("[data-plan-label]"), { autoAlpha: 0, duration: 0.1 }, ACT.hold + 0.02);
  tl.to(q("[data-dim]"), { autoAlpha: 0, duration: 0.1 }, ACT.hold + 0.02);
  if (media) tl.to(media, { autoAlpha: 0.32, scale: 0.94, duration: 0.2 }, ACT.prepare - 0.1);
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
