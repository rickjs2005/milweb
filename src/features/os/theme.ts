/**
 * Tema do MilWeb OS — fonte única de nomes, chave de armazenamento e da
 * resolução "preferência salva → tema do sistema".
 *
 *   gojo   · claro: branco gelo, azul dos Six Eyes como acento
 *   obito  · escuro: preto carvão, vermelho do Mangekyō como acento
 *
 * O estado vive no store (features/os/store.ts › prefs.theme); o <html>
 * espelha em `data-os-theme` para o CSS. Antes da hidratação, THEME_SCRIPT
 * (inline no layout) escreve o mesmo atributo a partir do localStorage ou de
 * `prefers-color-scheme` — sem flash do tema errado. Os nomes antigos
 * ("graphite"/"paper") continuam sendo lidos.
 */
export type OsTheme = "gojo" | "obito";

export const OS_THEMES: readonly OsTheme[] = ["gojo", "obito"];
export const PREFS_KEY = "milweb-os:prefs";
export const DARK_MQ = "(prefers-color-scheme: dark)";

/** Normaliza um valor salvo (aceita os nomes antigos). null = nada salvo/inválido. */
export function parseTheme(v: unknown): OsTheme | null {
  if (v === "gojo" || v === "paper") return "gojo";
  if (v === "obito" || v === "graphite") return "obito";
  return null;
}

/** Tema do sistema (só no cliente). */
export function systemTheme(): OsTheme {
  return window.matchMedia(DARK_MQ).matches ? "obito" : "gojo";
}

export function otherTheme(t: OsTheme): OsTheme {
  return t === "gojo" ? "obito" : "gojo";
}

/** Cor do papel de parede por tema (= styles/os.css › --os-bg); vai na meta theme-color. */
export const THEME_COLOR: Record<OsTheme, string> = { gojo: "#F3F5F8", obito: "#0A0A0C" };

/**
 * Script inline (primeiro filho do <body>, antes de qualquer pintura): a mesma
 * regra de parseTheme/systemTheme, sem módulos. Mantido à mão — scripts/os-check.mjs
 * confere que o atributo já existe no primeiro quadro.
 */
export const THEME_SCRIPT =
  "(function(){try{var t=null;try{var p=JSON.parse(localStorage.getItem('" +
  PREFS_KEY +
  "')||'null');t=p&&p.theme;}catch(e){}" +
  "t=(t==='gojo'||t==='paper')?'gojo':(t==='obito'||t==='graphite')?'obito':(matchMedia('" +
  DARK_MQ +
  "').matches?'obito':'gojo');" +
  "document.documentElement.setAttribute('data-os-theme',t);}catch(e){}})();";
