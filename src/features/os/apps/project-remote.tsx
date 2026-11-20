"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { ProjectDetailData } from "../project-data";
import { ProjectDetailView } from "../project-detail-view";

const cache = new Map<string, ProjectDetailData>();

/**
 * O case na janela de Projetos quando ela NÃO é a rota atual (outra janela
 * em foco). Busca o JSON estático do case uma vez por sessão e desenha a
 * mesma view da página canônica. Enquanto carrega, mostra o esqueleto com o
 * nome; se falhar, um link para abrir a rota.
 */
export function useProjectDetail(locale: Locale, slug: string) {
  const key = `${locale}/${slug}`;
  const [state, setState] = useState<{ key: string; data: ProjectDetailData | null; failed: boolean }>(() => ({ key, data: cache.get(key) ?? null, failed: false }));

  useEffect(() => {
    if (cache.has(key)) {
      setState({ key, data: cache.get(key)!, failed: false });
      return;
    }
    let alive = true;
    setState({ key, data: null, failed: false });
    fetch(`/api/os/project/${locale}/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: ProjectDetailData) => {
        cache.set(key, json);
        if (alive) setState({ key, data: json, failed: false });
      })
      .catch(() => alive && setState({ key, data: null, failed: true }));
    return () => {
      alive = false;
    };
  }, [key, locale, slug]);

  // ao trocar de projeto, o dado do anterior não vale nem por um quadro
  return state.key === key ? state : { key, data: cache.get(key) ?? null, failed: false };
}

export function ProjectRemote({ slug, locale, name, href, openLabel }: { slug: string; locale: Locale; name: string; href: string; openLabel: string }) {
  const { data, failed } = useProjectDetail(locale, slug);

  if (data) return <ProjectDetailView data={data} headingLevel={2} />;
  return (
    <div className="os-case os-case--loading" aria-busy={!failed}>
      <p className="t-mono os-case__eyebrow">{name.toUpperCase()}</p>
      {failed ? (
        <p className="t-mono">
          <a href={href} className="link-rule">
            {openLabel.toUpperCase()} →
          </a>
        </p>
      ) : (
        <div className="os-case__skeleton" aria-hidden="true" />
      )}
    </div>
  );
}
