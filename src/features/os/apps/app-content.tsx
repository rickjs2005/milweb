"use client";

import type { AppId } from "../registry";
import { ProjectsApp } from "./projects";
import { StudioApp } from "./studio";
import { LabApp } from "./lab";
import { ServicesApp } from "./services";
import { ContactApp } from "./contact";
import { SettingsApp } from "./settings";

/** Raiz de cada app, desenhada a partir da carga do OS (mesma em desktop, celular e modo simples). */
export function AppContent({ id, active }: { id: AppId; active: boolean }) {
  switch (id) {
    case "projects":
      return <ProjectsApp />;
    case "studio":
      return <StudioApp />;
    case "lab":
      return <LabApp active={active} />;
    case "services":
      return <ServicesApp />;
    case "contact":
      return <ContactApp />;
    case "settings":
      return <SettingsApp />;
  }
}
