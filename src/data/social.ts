import { PROFILE } from "@/lib/content";

/**
 * Redes do estúdio, num lugar só. Quem precisa de uma URL de rede (painéis da
 * home do MilWeb OS, Contato, rodapé, llms.txt) lê daqui. `null` = ainda sem
 * endereço confirmado: o painel correspondente simplesmente não aparece —
 * nunca um link inventado ou quebrado.
 */
export const SOCIAL = {
  linkedin: (PROFILE.linkedin as string | undefined) || null,
  github: (PROFILE.github as string | undefined) || null,
  instagram: "https://www.instagram.com/milweb01/",
} as const satisfies Record<string, string | null>;

export type SocialKey = keyof typeof SOCIAL;
export const SOCIAL_ORDER: SocialKey[] = ["linkedin", "github", "instagram"];
