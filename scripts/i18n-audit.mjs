/**
 * Auditoria automática de vazamento de idioma.
 *
 *   node scripts/i18n-audit.mjs [baseUrl]   (padrão http://localhost:3000)
 *
 * 1. Lê /sitemap.xml e agrupa cada URL pelo idioma (raiz = PT, /en = EN, /es = ES).
 * 2. Baixa o HTML de cada rota, extrai texto visível + title/description/OG/alt/aria.
 * 3. Procura palavras proibidas por idioma (com allowlist de nomes próprios/termos técnicos).
 * 4. Confere <html lang>, canonical e hreflang de cada página.
 * Sai com código 1 se houver qualquer vazamento real.
 */
const BASE = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000").replace(/\/$/, "");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7); // ex.: --only=/projetos/terral
const EXPECT_LANG = { pt: "pt-BR", en: "en", es: "es" };

// Palavras que NÃO podem aparecer numa página do idioma X (fronteira de palavra, case-insensitive).
// Rótulos em caixa alta (case-sensitive): vazam quando aparecem como label de interface.
const FORBIDDEN_CS = { pt: ["CLIENT", "STUDIO", "PROJECT", "INDEX", "YEAR", "TYPE"], en: ["CLIENTE", "ESTÚDIO", "PROJETO", "PROYECTO", "ÍNDICE"], es: ["CLIENT", "STUDIO", "PROJECT", "INDEX", "YEAR", "TYPE"] };

const FORBIDDEN = {
  pt: [
    "work", "all work", "selected work", "client work", "studio", "services", "contact", "built with", "next experience", "start a project", "project", "type", "year",
    "hold to inspect", "experiments", "made of", "capabilities", "code should", "not found", "steps", "under the hood", "the idea", "details", "screens", "visit", "again", "skip",
    "creative development", "creative developer", "business audit", "the", "and", "with", "your", "you", "scroll experience", "webgl experience", "digital product",
  ],
  en: [
    "projetos", "estúdio", "estudio", "serviços", "servicios", "contato", "contacto", "diagnostico", "diagnóstico", "partículas", "construído", "próxima", "selecionados", "seleccionados",
    "capacidades", "código", "codigo", "segure", "telas", "etapas", "você", "usted", "não", "também", "también", "orçamento", "presupuesto", "página", "quero", "quiero", "proyecto", "proyectos", "projeto",
    "experiência", "experiencia", "tienda", "loja", "para", "uma", "una", "desde",
  ],
  es: [
    "work", "all work", "selected work", "studio", "services", "contact", "built with", "next experience", "start a project", "project", "type", "year", "the", "and", "with", "your",
    "projetos", "estúdio", "serviços", "contato", "você", "não", "também", "construído", "selecionados", "orçamento", "projeto", "experiência", "loja", "quero", "uma",
    "creative development", "business audit", "not found", "made of", "capabilities",
  ],
};

// Nomes próprios e termos universais — removidos do texto antes da varredura.
const ALLOW = [
  /MilWeb/gi, /Kavita/gi, /Terral/gi, /Atelier Vertex/gi, /Aurex( Timepieces)?/gi, /WebGL/gi, /GSAP/gi, /Three\.js/gi, /Next\.js/gi, /React/gi, /Tailwind/gi, /TypeScript/gi, /Lenis/gi,
  /SaaS/gi, /SEO/gi, /WhatsApp/gi, /Vercel/gi, /Node\.js/gi, /Prisma/gi, /PostgreSQL/gi, /Supabase/gi, /Stripe/gi, /Framer Motion/gi, /Lighthouse/gi, /GitHub/gi, /Google( Business| Search| Maps)?/gi,
  /Português/gi, /English/gi, /Español/gi, /Rick Januario/gi, /Casa do Torrador/gi, /MilLead/gi, /Design/gi, /Motion Design/gi, /Motion/gi, /Lab/gi, /Landing Pages?/gi, /Web Design/gi,
  /Studio Sound/gi, /Open Source/gi, /Nova Serrana/gi, /Minas Gerais/gi, /Brasil/gi, /Full[- ]stack/gi, /Firebase/gi, /Cloudinary/gi, /Vite/gi, /Zustand/gi, /Docker/gi, /Express/gi, /MySQL/gi, /MongoDB/gi,
  /Instagram/gi, /Facebook/gi, /TikTok/gi, /YouTube/gi, /LinkedIn/gi, /Wi-?Fi/gi, /ScrollTrigger/gi, /View Transitions?/gi, /Satori/gi, /Playwright/gi, /Puppeteer/gi, /Redis/gi, /JWT/gi, /REST/gi, /GraphQL/gi,
  /Core Web Vitals/gi, /Web Vitals/gi, /Vercel Analytics/gi, /Speed Insights/gi, /Search Console/gi, /Google Analytics/gi, /Tag Manager/gi, /ISR/gi, /SSR/gi, /CSR/gi, /API/gi, /CMS/gi, /CRM/gi, /ERP/gi,
  /Dev/gi, /Hover/gi, /Reset/gi, /Skip to content/gi, /Loja de iPhone( Premium)?/gi, /NEXUS Loja Geek/gi, /\band \(pointer/g, /The Age of Dragons/gi, /Client Components?/g, /client[- ]side/gi, /Prisma ?Client/gi, /Supabase ?Client/gi, /[a-z@\/.-]+\.(com|br|dev|app)\b/gi, /(em|en) AND\b/g, /(de|del|do|o) Client\b/g,
];

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

function extract(html) {
  const meta = {};
  meta.lang = html.match(/<html[^>]*\slang="([^"]*)"/)?.[1] ?? "";
  meta.title = decode(html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? "");
  meta.description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  meta.ogTitle = decode(html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? "");
  meta.ogDescription = decode(html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] ?? "");
  meta.ogLocale = html.match(/<meta property="og:locale" content="([^"]*)"/)?.[1] ?? "";
  meta.canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  meta.hreflang = [...html.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/gi)].map((m) => [m[1], m[2]]);
  meta.jsonLdLang = [...html.matchAll(/"inLanguage":"([^"]*)"/g)].map((m) => m[1]);

  let body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<template[\s\S]*?<\/template>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  const attrs = [...body.matchAll(/\s(?:alt|aria-label|title|placeholder)="([^"]*)"/g)].map((m) => decode(m[1]));
  const text = decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
  return { meta, text: [text, ...attrs, meta.title, meta.description, meta.ogTitle, meta.ogDescription].join(" | ") };
}

function leaks(locale, text) {
  let clean = text;
  for (const re of ALLOW) clean = clean.replace(re, " ");
  const found = new Map();
  for (const w of FORBIDDEN[locale]) {
    const re = new RegExp("(?<![\\p{L}\\p{N}_])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}\\p{N}_])", "giu");
    const m = clean.match(re);
    if (m) {
      // contexto da primeira ocorrência
      const i = clean.search(re);
      found.set(w, `${m.length}× — "…${clean.slice(Math.max(0, i - 40), i + w.length + 40).trim()}…"`);
    }
  }
  for (const w of FORBIDDEN_CS[locale]) {
    const re = new RegExp("(?<![\\p{L}\\p{N}_])" + w + "(?![\\p{L}\\p{N}_])", "gu");
    const m = clean.match(re);
    if (m) {
      const i = clean.search(re);
      found.set(w, `${m.length}× (caixa alta) — "…${clean.slice(Math.max(0, i - 40), i + w.length + 40).trim()}…"`);
    }
  }
  return found;
}

async function main() {
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error("sitemap vazio");
  const routes = urls.map((u) => {
    const path = new URL(u).pathname;
    const locale = path === "/en" || path.startsWith("/en/") ? "en" : path === "/es" || path.startsWith("/es/") ? "es" : "pt";
    return { path, locale };
  });
  // 404 e páginas fora do sitemap
  routes.push({ path: "/pagina-que-nao-existe", locale: "pt" }, { path: "/en/page-that-does-not-exist", locale: "en" }, { path: "/es/pagina-que-no-existe", locale: "es" });

  let total = 0;
  const report = [];
  for (const r of routes) {
    if (ONLY && r.path !== ONLY) continue;
    const res = await fetch(`${BASE}${r.path}`, { redirect: "manual" });
    const html = await res.text();
    const { meta, text } = extract(html);
    const problems = [];
    if (meta.lang !== EXPECT_LANG[r.locale]) problems.push(`<html lang> = "${meta.lang}" (esperado ${EXPECT_LANG[r.locale]})`);
    const is404 = res.status === 404;
    if (!is404) {
      if (!meta.canonical.endsWith(r.path === "/" ? "/" : r.path) && !(r.path === "/" && meta.canonical.endsWith(".br"))) problems.push(`canonical = ${meta.canonical}`);
      const langs = meta.hreflang.map((h) => h[0]).sort().join(",");
      if (langs !== "en,es,pt-BR,x-default") problems.push(`hreflang = [${langs}]`);
      const xd = meta.hreflang.find((h) => h[0] === "x-default")?.[1] ?? "";
      if (!xd) problems.push("sem x-default");
      else if (/\/(en|es)(\/|$)/.test(new URL(xd).pathname)) problems.push(`x-default aponta para ${xd}`);
      for (const l of meta.jsonLdLang) if (l !== EXPECT_LANG[r.locale]) problems.push(`JSON-LD inLanguage = ${l}`);
      const ogl = { pt: "pt_BR", en: "en_US", es: "es_419" }[r.locale];
      if (meta.ogLocale && meta.ogLocale !== ogl) problems.push(`og:locale = ${meta.ogLocale}`);
    }
    for (const [w, ctx] of leaks(r.locale, text)) problems.push(`"${w}" ${ctx}`);
    total += problems.length;
    if (problems.length) report.push({ route: r.path, locale: r.locale, status: res.status, problems });
    else process.stdout.write(`ok   ${r.locale}  ${res.status}  ${r.path}\n`);
  }
  for (const r of report) {
    console.log(`\nLEAK ${r.locale}  ${r.status}  ${r.route}`);
    for (const p of r.problems) console.log(`   - ${p}`);
  }
  console.log(`\n${routes.length} rotas · ${report.length} com problema · ${total} ocorrências`);
  process.exit(total ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
