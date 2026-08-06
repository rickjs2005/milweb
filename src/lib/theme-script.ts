/**
 * Único <script> inline autoral do site (o resto dos inline é o payload RSC
 * que o próprio Next injeta).
 *
 * Anti-flash do tema: aplica a classe salva antes do primeiro paint. Tem de
 * ser inline e síncrono no <head> — arquivo externo chegaria depois do paint
 * e o visitante veria o tema errado piscar.
 */
export const THEME_SCRIPT =
  "(function(){try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light');}catch(e){}})();";
