"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, MQ, useGSAP } from "@/animations/gsap";

/**
 * NEXT EXPERIENCE. Não é rodapé: a mídia do próximo projeto começa a
 * subir por baixo antes da página acabar (scrub), o título assenta e o
 * clique leva à transição compartilhada (view-transition-name igual ao
 * hero do próximo case).
 */
export function CaseNext({ label, title, name, n, image, href, slug, allHref, allLabel }: { label: string; title: string[]; name: string; n: string; image: string; href: string; slug: string; allHref: string; allLabel: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add(MQ.noReduce, () => {
        const media = el.querySelector<HTMLElement>("[data-next-media]")!;
        const text = el.querySelectorAll<HTMLElement>("[data-next-text]");
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top bottom", end: "top 20%", scrub: 0.6 }, defaults: { ease: "none" } })
          .fromTo(media, { yPercent: 40, scale: 0.86 }, { yPercent: 0, scale: 1 }, 0)
          .fromTo(text, { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.05 }, 0.3);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="container-page relative mt-12 overflow-hidden pt-16 md:mt-24 md:pt-24" data-inspect="NEXT_EXPERIENCE">
      <div className="rule flex items-center justify-between pt-3 t-mono">
        <span data-next-text>{label}</span>
        <span data-next-text className="tnum text-ink-3">
          {n} / {name.toUpperCase()}
        </span>
      </div>
      <Link href={href} className="group block pb-12 pt-8 md:pt-12" data-inspect="CTA / NEXT">
        <h2 data-next-text className="t-display t-display-lg text-ink transition-colors duration-medium group-hover:text-ink-3" style={{ viewTransitionName: `case-title-${slug}` }}>
          {title.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h2>
        <div data-next-media className="relative mt-8 aspect-[16/10] max-h-[60svh] overflow-hidden bg-neutral md:mt-12" style={{ viewTransitionName: `case-media-${slug}` }}>
          {image && <Image src={image} alt={name} fill loading="lazy" sizes="100vw" className="object-cover object-top transition-transform duration-slow ease-out-expo group-hover:scale-[1.02]" />}
        </div>
      </Link>
      <p className="t-mono pb-4">
        <Link href={allHref} className="link-rule inline-block py-2 text-ink-3">
          {allLabel} →
        </Link>
      </p>
    </section>
  );
}
