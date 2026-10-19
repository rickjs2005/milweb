"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useOs, useOsStore } from "../os-shell";
import { BountyMural } from "./bounty/mural";

/**
 * Projetos — no OS, o mural de cartazes (THE BOUNTY COLLECTION, ver
 * bounty/mural.tsx); o case chega como `dossier` (o server component da rota,
 * ou a versão por JSON quando a janela não tem o foco) e `slug` diz qual
 * cartaz está aberto. No modo simples, uma lista direta: cada projeto é um
 * link para a página do case.
 */
export function ProjectsApp({ dossier = null, slug = null, active = true }: { dossier?: ReactNode | null; slug?: string | null; active?: boolean }) {
  const shell = useOsStore((s) => s.shell);
  if (shell === "simple") return <ProjectsList />;
  return <BountyMural dossier={dossier} slug={slug} active={active} />;
}

function ProjectsList() {
  const { payload } = useOs();
  const s = payload.s;
  return (
    <div className="os-projects os-projects--list">
      <p className="t-mono os-app__eyebrow">
        {String(payload.projects.length).padStart(2, "0")} {s.projects.count}
      </p>
      <ul className="os-projects__list">
        {payload.projects.map((p) => (
          <li key={p.slug} className="os-project">
            <Link href={p.href} className="os-project__link os-projects__row">
              <span className="os-projects__thumb">
                <Image src={p.image} alt="" fill sizes="96px" className="os-projects__thumb-img" />
              </span>
              <span className="os-projects__text">
                <span className="t-mono os-projects__n">{p.n}</span>
                <span className="os-projects__name">{p.name}</span>
                <span className="t-mono os-projects__meta">{p.type}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
