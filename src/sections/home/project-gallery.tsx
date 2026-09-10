"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/animations/gsap";
import { vtOfSlug } from "@/lib/route-transition";

export type GalleryProject = {
  n: string;
  slug: string;
  name: string;
  title: readonly string[];
  displayType: string;
  client: string | null;
  year: number | null;
  image: string;
  atmosphere?: string;
  href: string;
};

type ProjectGalleryProps = {
  act: string;
  eyebrow: string;
  enter: string;
  all: string;
  clientWork: string;
  allHref: string;
  items: GalleryProject[];
};

/** A varied, scannable gallery. Captures are always visible, including on touch. */
export function ProjectGallery({ act, eyebrow, enter, all, clientWork, allHref, items }: ProjectGalleryProps) {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`(min-width: 768px) and ${MQ.noReduce}`, () => {
      const projects = root.current!.querySelectorAll<HTMLElement>("[data-gallery-project]");
      projects.forEach((project) => {
        gsap.fromTo(project.querySelector("[data-gallery-capture]"), { yPercent: 4 }, {
          yPercent: -4, ease: "none",
          scrollTrigger: { trigger: project, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
      });
    });
    return () => mm.revert();
  }, { scope: root });

  const words = eyebrow.split(" ");
  return (
    <section ref={root} id="work" data-act={act} className="project-gallery container-page">
      <div className="project-gallery__heading">
        <h2><span>{words[0]}</span><span>{words.slice(1).join(" ")}<span className="project-gallery__period">.</span></span></h2>
        <div className="project-gallery__edition t-mono">
          <span>MilWeb — {String(items.length).padStart(2, "0")}</span>
          <span aria-hidden="true" className="project-gallery__down">↙</span>
        </div>
      </div>

      <div className="project-gallery__grid">
        {items.map((project) => (
          <article key={project.slug} className="gallery-project" data-gallery-project data-project={project.slug}>
            <a href={project.href} data-vt={vtOfSlug(project.slug)} data-cursor="link"
              className="gallery-project__link" aria-label={`${enter} — ${project.name}`}>
              <div className="gallery-project__media" style={{ viewTransitionName: `case-media-${project.slug}` }}>
                {project.atmosphere && <Image src={project.atmosphere} alt="" fill
                  className="gallery-project__atmosphere" sizes="(max-width: 767px) 92vw, 62vw" />}
                <div className="gallery-project__capture" data-gallery-capture>
                  <Image src={project.image} alt={project.name} fill
                    sizes="(max-width: 767px) 92vw, (max-width: 1200px) 60vw, 900px"
                    className="gallery-project__image" />
                </div>
                <span className="gallery-project__open" aria-hidden="true">↗</span>
              </div>
              <div className="gallery-project__caption">
                <span className="gallery-project__number t-mono">({project.n})</span>
                <div><h3>{project.name}</h3><p className="t-mono">{project.displayType}</p></div>
                <span className="gallery-project__year t-mono">{project.year}</span>
              </div>
            </a>
            <div className="gallery-project__detail">
              <p>{project.title.join(" ")}</p>
              {project.client && <span className="t-mono">{clientWork} · {project.client}</span>}
            </div>
          </article>
        ))}
      </div>

      <a className="project-gallery__all" href={allHref} data-cursor="link">
        <span>{all}</span><span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
