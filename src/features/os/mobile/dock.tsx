"use client";

import { useOs } from "../os-shell";
import { SocialIcon, type SocialKey } from "../social-hud";
import { ThemeToggle } from "../theme-toggle";
import { WhatsAppIcon } from "./icons";

/**
 * Dock do telefone — os caminhos rápidos de conversa, não os apps da grade:
 * WhatsApp (conversão), LinkedIn, GitHub e Instagram (data/social.ts; uma rede
 * sem URL confirmada simplesmente não aparece), e o sol/lua do tema no fim.
 * Translúcida, fixa, dentro da área segura; some atrás do app aberto, como a
 * dock de um telefone.
 */
const SOCIAL_ORDER: SocialKey[] = ["linkedin", "github", "instagram"];

export function MobileDock() {
  const { payload } = useOs();
  const s = payload.s;
  const label = (k: SocialKey) => (k === "instagram" ? "Instagram" : s.contact[k]);
  const items: { key: "whatsapp" | SocialKey; href: string; label: string }[] = [
    { key: "whatsapp", href: payload.contact.waHref, label: s.contact.whatsapp },
    ...SOCIAL_ORDER.filter((k) => payload.social[k]).map((k) => ({ key: k, href: payload.social[k]!, label: label(k) })),
  ];
  return (
    <nav className="os-mdock" aria-label={s.regions.dock} data-no-inspect>
      <ul>
        {items.map((it) => (
          <li key={it.key}>
            <a href={it.href} className="os-mdock__item" target="_blank" rel="noopener noreferrer" data-dock-social={it.key}>
              <span className="os-mdock__icon" data-social={it.key} aria-hidden="true">
                {it.key === "whatsapp" ? <WhatsAppIcon /> : <SocialIcon k={it.key} />}
              </span>
              <span className="os-mdock__label">{it.label}</span>
              <span className="sr-only">· {s.social.external}</span>
            </a>
          </li>
        ))}
        <li>
          <ThemeToggle variant="mdock" />
        </li>
      </ul>
    </nav>
  );
}
