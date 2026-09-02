"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { gsap, EASE, MQ, ScrollTrigger, useGSAP } from "@/animations/gsap";
import { loadSplitText, type SplitTextInstance } from "@/animations/split-text";
import { onIdle } from "@/animations/idle";
import { getQuality } from "@/lib/quality";
import { createHorizon, letterTransform, type HorizonState } from "@/features/lab/event-horizon";

/**
 * ACT 05 — MILWEB LAB · HORIZONTE DE EVENTOS.
 *
 * A interface inteira está sendo atraída por uma singularidade — controladamente.
 *
 * TRÊS ZONAS. A seção é um trilho (220 svh) com o palco `sticky` dentro,
 * isolado (`isolate` + `overflow-hidden`): header em cima, intocado; a
 * experiência (manchete em duas linhas desencontradas + a singularidade no vão
 * entre elas) no miolo; a régua de rodapé (texto, índice, CTA) embaixo.
 *
 * POR QUE STICKY. Antes a seção rolava normalmente por baixo do header fixo,
 * que usa `mix-blend-difference`: as letras brancas gigantes invertiam o logo
 * e o "GLSL / WEBGL" passava sob o seletor de idioma — o "bug do header". Com o
 * palco preso, nada da manchete cruza o header durante o ato; e no fim a
 * singularidade ENGOLE a manchete antes de a seção soltar, então o que passa
 * sob o header é só o fundo.
 *
 * O CAMPO. Uma função só, por distância à massa: além de `r0` nada acontece;
 * entre `r0` e `r1` a letra é puxada (até 14,5 % do corpo: 22 px a 1920),
 * comprimida (até 24 %), esticada (10 %) e inclinada (até 7°) rumo ao centro;
 * dentro de `r1` o máximo. Raios e puxão escalam com o corpo da manchete, então
 * a 1024 px ou no celular as letras nunca se sobrepõem.
 * As posições das letras são medidas UMA vez por layout (nunca por frame).
 * `k` (força) vem do scroll: 0 → 0.55 → 1 → 0.4 → colapso. O cursor desloca a
 * massa 8 % e puxa o CTA 3 px quando chega perto.
 */
const fieldK = (p: number) => {
  if (p < 0.2) return 0;
  if (p < 0.45) return gsap.utils.interpolate(0, 0.55, (p - 0.2) / 0.25);
  if (p < 0.62) return gsap.utils.interpolate(0.55, 1, (p - 0.45) / 0.17);
  if (p < 0.72) return 1;
  if (p < 0.86) return gsap.utils.interpolate(1, 0.4, (p - 0.72) / 0.14);
  return gsap.utils.interpolate(0.4, 0.6, (p - 0.86) / 0.14);
};
const swallowOf = (p: number) => (p < 0.88 ? 0 : gsap.parseEase("power2.in")((p - 0.88) / 0.12));

export function LabTeaser({ eyebrow, title, body, enter, href, act, tech }: { eyebrow: string; title: string; body: string; enter: string; href: string; act: string; tech: string }) {
  const root = useRef<HTMLElement>(null);
  const [first, ...rest] = title.split(" ");
  const longest = Math.max(first.length, rest.join(" ").length);

  useGSAP(
    () => {
      const el = root.current!;
      const stage = el.querySelector<HTMLElement>("[data-lab-stage]")!;
      const canvas = stage.querySelector<HTMLCanvasElement>("canvas")!;
      const h2 = stage.querySelector<HTMLElement>("h2")!;
      const top = stage.querySelector<HTMLElement>("[data-top]")!;
      const cta = stage.querySelector<HTMLElement>("[data-cta]")!;
      const mm = gsap.matchMedia();
      let disposed = false;
      const still = () =>
        mm.add(MQ.reduce, () => {
          const hz = createHorizon(canvas);
          hz.resize();
          const r = stage.getBoundingClientRect();
          hz.render({ k: 0.7, swallow: 0, cx: r.width * 0.52, cy: r.height * 0.5, t: 0 });
          return () => hz.destroy();
        });

      const cancel = onIdle(() => {
        if (disposed) return;
        if (getQuality().tier === "low") {
          still();
          return;
        }
        still();
        mm.add(MQ.noReduce, () => {
          const fine = window.matchMedia(MQ.fine).matches;
          const hz = createHorizon(canvas);
          let chars: HTMLElement[] = [];
          let split: SplitTextInstance | null = null;
          let centers: { x: number; y: number }[] = [];
          let W = 0;
          let H = 0;
          let hc = 0; // centro vertical da manchete (o vão entre as linhas)
          let fs = 150; // corpo da manchete: o campo escala com ele (22 px a 1920, 11 px a 1024, 5 px no celular)
          const st = { p: 0, target: 0, mx: 0.5, my: 0.5, t: 0 };
          let live = false;
          let raf = 0;

          // medida rara: no resize e quando as letras nascem — nunca por frame
          const measure = () => {
            const r = stage.getBoundingClientRect();
            W = r.width;
            H = r.height;
            const hr = h2.getBoundingClientRect();
            hc = hr.top + hr.height / 2 - r.top;
            fs = parseFloat(getComputedStyle(h2).fontSize) || 150;
            hz.resize();
            chars.forEach((c) => (c.style.transform = ""));
            centers = chars.map((c) => {
              const b = c.getBoundingClientRect();
              return { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top };
            });
            render();
          };

          const render = () => {
            st.t += 1 / 60;
            st.p += (st.target - st.p) * 0.14;
            const s: HorizonState = { k: fieldK(st.p), swallow: swallowOf(st.p), cx: W * (0.52 + (st.mx - 0.5) * 0.08), cy: hc + (st.my - 0.5) * H * 0.08, t: st.t };
            hz.render(s);
            const r0 = Math.min(380, Math.max(120, fs * 2.5));
            const r1 = fs * 0.45;
            const maxPull = fs * 0.145;
            for (let i = 0; i < chars.length; i++) {
              const c = chars[i];
              c.style.transform = letterTransform(centers[i].x, centers[i].y, s, r0, r1, maxPull);
              c.style.opacity = String(1 - s.swallow);
            }
            top.style.opacity = String(1 - s.swallow);
            if (live) raf = requestAnimationFrame(render);
          };

          const io = new IntersectionObserver(([e]) => {
            live = e.isIntersecting;
            if (live && !raf) raf = requestAnimationFrame(render);
            if (!live) {
              cancelAnimationFrame(raf);
              raf = 0;
            }
          });
          io.observe(stage);

          const trigger = ScrollTrigger.create({
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (t) => {
              st.target = t.progress;
              if (!live) render();
            },
            onRefresh: () => measure(),
          });

          // o cursor desloca a massa e puxa o CTA
          let off = () => {};
          if (fine) {
            const ctaX = gsap.quickTo(cta, "x", { duration: 0.5, ease: EASE.outQuint });
            const ctaY = gsap.quickTo(cta, "y", { duration: 0.5, ease: EASE.outQuint });
            const move = (e: PointerEvent) => {
              const r = stage.getBoundingClientRect();
              st.mx = (e.clientX - r.left) / r.width;
              st.my = (e.clientY - r.top) / r.height;
              const ctaRect = cta.getBoundingClientRect();
              const dx = e.clientX - (ctaRect.left + ctaRect.width / 2);
              const dy = e.clientY - (ctaRect.top + ctaRect.height / 2);
              const d = Math.hypot(dx, dy) || 1;
              const g = d < 180 ? (1 - d / 180) * 3 : 0;
              ctaX((dx / d) * g);
              ctaY((dy / d) * g);
            };
            const leave = () => {
              ctaX(0);
              ctaY(0);
            };
            stage.addEventListener("pointermove", move, { passive: true });
            stage.addEventListener("pointerleave", leave);
            off = () => {
              stage.removeEventListener("pointermove", move);
              stage.removeEventListener("pointerleave", leave);
            };
          }

          const ro = new ResizeObserver(() => measure());
          ro.observe(stage);

          // entrada: as duas linhas sobem (as letras pertencem só ao campo)
          const intro = gsap.from(stage.querySelectorAll("[data-lab-line]"), { yPercent: 30, autoAlpha: 0, stagger: 0.08, duration: 1, ease: EASE.outExpo, scrollTrigger: { trigger: el, start: "top 70%", once: true } });

          void loadSplitText().then((SplitText) => {
            if (disposed) return;
            split = SplitText.create(h2, { type: "chars", aria: "none" });
            chars = split.chars as HTMLElement[];
            chars.forEach((c) => (c.style.willChange = "transform"));
            measure();
          });

          measure();
          return () => {
            io.disconnect();
            cancelAnimationFrame(raf);
            trigger.kill();
            intro.scrollTrigger?.kill();
            intro.kill();
            ro.disconnect();
            off();
            split?.revert();
            hz.destroy();
          };
        });
      });
      return () => {
        disposed = true;
        cancel();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="lab" data-act={act} data-inspect="LAB_TEASER" className="relative h-[220svh] bg-[#0B0B0B] text-paper max-md:h-[180svh]">
      {/* o palco: preso, isolado, nada escapa dele */}
      <div data-lab-stage className="isolate sticky top-0 flex h-[100svh] flex-col justify-between overflow-hidden px-margin pb-8 pt-nav">
        {/* a singularidade e o campo de pontos (nível 00) */}
        <canvas aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full" data-inspect="EVENT HORIZON" />

        <div data-top className="relative z-10 flex items-center justify-between border-t border-paper/40 pt-3 t-mono">
          <span>{eyebrow}</span>
          <span className="tnum text-paper/60">{tech}</span>
        </div>

        {/* a manchete em duas linhas desencontradas: a massa mora no vão */}
        <h2 className="t-display t-fit-lab relative z-10 text-paper [&_div]:inline-block" style={{ "--chars": (longest / 0.82).toFixed(1), "--chars-m": (longest / 0.94).toFixed(1) } as CSSProperties} data-inspect="LAB_TITLE">
          <span data-lab-line className="block">{first}</span>
          <span data-lab-line className="mt-[0.16em] block pl-[18%] max-md:pl-[6%]">{rest.join(" ")}</span>
        </h2>

        <div className="relative z-10 flex flex-col gap-y-5 t-mono md:flex-row md:items-end md:justify-between md:gap-x-8">
          <p className="max-w-sm normal-case tracking-normal text-paper/70 md:flex-1" style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-0)", letterSpacing: 0, textTransform: "none" }}>
            {body}
          </p>
          <p className="text-paper/50 md:flex-1 md:text-center">MW/008</p>
          <p className="md:flex-1 md:text-right">
            <Link href={href} data-vt="horizon" data-cta className="act-cta inline-flex items-center gap-1.5 text-paper" data-inspect="CTA">
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
          </p>
        </div>
      </div>
    </section>
  );
}
