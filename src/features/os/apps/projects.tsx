"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useOs } from "../os-shell";

type Filter = "all" | "client" | "scroll" | "webgl" | "product";

/**
 * Projetos — a coleção inteira em miniaturas generosas, com os mesmos
 * filtros do arquivo. Cada card é um link real para o case (a rota canônica);
 * o shell abre o conteúdo dentro desta janela.
 */
export function ProjectsApp() {
  const { payload, route } = useOs();
  const s = payload.s;
  const [filter, setFilter] = useState<Filter>("all");
  const list = payload.projects.filter((p) => (filter === "all" ? true : filter === "client" ? p.clientWork : filter === "scroll" ? p.scroll : filter === "webgl" ? p.webgl : p.product));
  const current = route.kind === "project" ? route.detail : null;
  const filters: Filter[] = ["all", "client", "scroll", "webgl", "product"];

  return (
    <div className="os-projects">
      <header className="os-app__header os-projects__header">
        <p className="t-mono os-app__eyebrow">
          {String(payload.projects.length).padStart(2, "0")} {s.projects.count}
        </p>
        <div className="os-projects__filters" role="group" aria-label={s.projects.kind}>
          {filters.map((f) => (
            <button key={f} type="button" className="os-chip t-mono" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {payload.filters[f]}
            </button>
          ))}
        </div>
      </header>

      {list.length === 0 ? (
        <p className="t-mono os-projects__empty">{s.projects.empty}</p>
      ) : (
        <ul className="os-projects__grid">
          {list.map((p) => (
            <li key={p.slug} className="os-project" data-current={current === p.slug ? "1" : "0"}>
              <Link href={p.href} className="os-project__link" scroll={false} aria-current={current === p.slug ? "page" : undefined}>
                <span className="os-project__media">
                  <Image src={p.image} alt={p.title} fill sizes="(max-width: 719px) 92vw, (max-width: 1079px) 45vw, 320px" className="os-project__img" />
                </span>
                <span className="os-project__caption">
                  <span className="t-mono os-project__n">({p.n})</span>
                  <span className="os-project__name">{p.name}</span>
                  <span className="t-mono os-project__meta">
                    {p.type}
                    {p.year ? ` · ${p.year}` : ""}
                  </span>
                  <span className="t-mono os-project__badge">{p.clientWork ? `${s.projects.client}${p.client ? ` · ${p.client}` : ""}` : p.live ? s.projects.demo : s.projects.study}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
