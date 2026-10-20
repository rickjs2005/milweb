"use client";

import type { ReactNode } from "react";
import type { AppId } from "../registry";
import { ProjectsApp } from "./projects";
import { StudioApp } from "./studio";
import { LabApp } from "./lab";
import { ServicesApp } from "./services";
import { AboutApp } from "./about";
import { ContactApp } from "./contact";
import { SettingsApp } from "./settings";

/**
 * Raiz de cada app, desenhada a partir da carga do OS (mesma em desktop, celular e modo simples).
 * Projetos recebe o case como `dossier` (conteúdo da rota ou JSON) e o `slug` aberto: o mural nunca desmonta.
 */
export function AppContent({ id, active, dossier = null, slug = null }: { id: AppId; active: boolean; dossier?: ReactNode | null; slug?: string | null }) {
  switch (id) {
    case "projects":
      return <ProjectsApp dossier={dossier} slug={slug} active={active} />;
    case "studio":
      return <StudioApp />;
    case "lab":
      return <LabApp active={active} />;
    case "services":
      return <ServicesApp />;
    case "about":
      return <AboutApp />;
    case "contact":
      return <ContactApp />;
    case "settings":
      return <SettingsApp />;
  }
}
