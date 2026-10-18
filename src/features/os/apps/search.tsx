"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { APPS, DOCK_ORDER, type AppId } from "../registry";
import { useOs } from "../os-shell";
import { useLaunch } from "../desktop";
import { AppGlyph, Glyph, ProjectTile } from "../icons";

type Hit = { kind: "app"; id: AppId; label: string; href: string } | { kind: "project"; slug: string; label: string; sub: string; href: string; image: string } | { kind: "service"; slug: string; label: string; sub: string; href: string };

const norm = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Busca local — projetos, serviços e aplicativos. `<dialog>` nativo: foco
 * contido, Esc fecha, foco volta ao botão que abriu. Enter abre o primeiro.
 */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { payload } = useOs();
  const s = payload.s.search;
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const launch = useLaunch();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setQ("");
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const n = norm(q.trim());
    const apps: Hit[] = DOCK_ORDER.filter((id) => APPS[id].route).map((id) => ({ kind: "app", id, label: payload.s.apps[id], href: payload.hrefs[id as keyof typeof payload.hrefs] ?? "#" }));
    const projects: Hit[] = payload.projects.map((p) => ({ kind: "project", slug: p.slug, label: p.name === p.title ? p.title : `${p.name} — ${p.title}`, sub: [p.type, p.client, p.tagline].filter(Boolean).join(" · "), href: p.href, image: p.image }));
    const services: Hit[] = payload.services.items.map((x) => ({ kind: "service", slug: x.slug, label: x.label, sub: x.sub, href: x.href }));
    if (!n) return [...apps, ...projects.slice(0, 6)];
    const match = (h: Hit) => {
      const hay = h.kind === "project" ? [h.label, h.sub, payload.projects.find((p) => p.slug === h.slug)?.stack.join(" ") ?? ""].join(" ") : h.kind === "service" ? `${h.label} ${h.sub}` : h.label;
      return norm(hay).includes(n);
    };
    return [...projects.filter(match), ...services.filter(match), ...apps.filter(match)];
  }, [q, payload]);

  const pick = (e: React.MouseEvent<HTMLAnchorElement>, h: Hit) => {
    onClose();
    if (h.kind === "app") launch(e, h.id);
    else if (h.kind === "project") launch(e, "projects", `/work/${h.slug}`);
    else launch(e, "services", `/${h.slug}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const first = ref.current?.querySelector<HTMLAnchorElement>(".os-search__hit");
    first?.click();
  };

  return (
    <dialog ref={ref} className="os-search" aria-label={s.title} onClose={onClose} onCancel={onClose} data-no-inspect data-lenis-prevent="">
      <form className="os-search__form" onSubmit={onSubmit} role="search">
        <Glyph name="search" size={16} />
        <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.placeholder} aria-label={s.title} autoComplete="off" />
        <button type="button" className="os-search__close t-mono" onClick={onClose}>
          ESC
        </button>
      </form>
      <ul className="os-search__list" aria-label={s.title}>
        {hits.length === 0 && <li className="t-mono os-search__empty">{s.empty}</li>}
        {hits.map((h) => (
          <li key={h.kind + (h.kind === "app" ? h.id : h.slug)}>
            <a href={h.href} className="os-search__hit" onClick={(e) => pick(e, h)}>
              {h.kind === "project" ? <ProjectTile src={h.image} alt="" size={36} /> : <AppGlyph kind={h.kind === "app" ? h.id : "services"} size={36} />}
              <span className="os-search__text">
                <span className="os-search__label">{h.label}</span>
                {h.kind !== "app" && <span className="t-mono os-search__sub">{h.sub}</span>}
              </span>
              <span className="t-mono os-search__kind">{h.kind === "app" ? s.apps : h.kind === "project" ? s.projects : s.services}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="t-mono os-search__hint">{s.hint}</p>
    </dialog>
  );
}
