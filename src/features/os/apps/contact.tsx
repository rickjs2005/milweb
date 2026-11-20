"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useOs } from "../os-shell";
import { ProjectGuide } from "./project-guide";
import styles from "./project-guide.module.css";

function GuideFromLink() {
  const { payload } = useOs();
  const search = useSearchParams();
  const slug = search.get("project");
  const project = slug ? [...payload.projects, ...payload.authorial].find((item) => item.slug === slug) : undefined;
  const service = payload.services.items.find((item) => item.slug === search.get("service"));
  return <ProjectGuide key={[payload.locale, project?.slug, service?.slug].join("/")} initialProject={project} initialService={service?.slug} />;
}

export function ContactApp() {
  const { payload } = useOs();
  const c = payload.contact;
  return (
    <div className="os-contact">
      <Suspense fallback={<ProjectGuide />}>
        <GuideFromLink />
      </Suspense>
      <nav className={styles.channels} aria-label={payload.s.contact.channels}>
        <span className={styles.caption}>{payload.s.contact.channels}</span>
        <a href={c.waHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href={"mailto:" + c.email}>{c.email}</a>
        <a href={c.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href={c.github} target="_blank" rel="noopener noreferrer">GitHub</a>
      </nav>
    </div>
  );
}
