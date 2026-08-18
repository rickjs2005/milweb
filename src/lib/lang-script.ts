/**
 * Segundo (e último) <script> inline autoral do site, junto do THEME_SCRIPT.
 *
 * O <html lang> não pode mais vir pronto do servidor: desde que not-found.tsx
 * passou a exigir um app/layout.tsx de verdade na raiz (fora de [lang]), o
 * `<html>` mora lá, e a raiz não tem acesso ao parâmetro de rota `lang`. Este
 * script corrige o atributo pelo prefixo da URL antes do primeiro paint —
 * mesma técnica e mesmo motivo do anti-flash de tema em theme-script.ts.
 */
export const LANG_SCRIPT =
  "(function(){try{document.documentElement.lang=location.pathname.indexOf('/en')===0?'en':'pt-BR';}catch(e){}})();";
