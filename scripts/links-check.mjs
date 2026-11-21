/**
 * Confere os endereços públicos cadastrados nos projetos (src/lib/content-projects-*.ts › live) e a lista dos que
 * estavam fora do ar (src/data/projects.ts › LIVE_DOWN), que tira o botão "Visitar site" da coleção.
 *
 *   node scripts/links-check.mjs
 *
 * Sai com 1 quando a lista está desatualizada: um endereço caiu e não está nela, ou voltou e ainda está.
 */
import { readdirSync, readFileSync } from "node:fs";

const rows = [];
for (const f of readdirSync("src/lib").filter((x) => /^content-projects-\d+\.ts$/.test(x))) {
  let slug = null;
  for (const line of readFileSync("src/lib/" + f, "utf8").split(/\r?\n/)) {
    const a = /^\s*slug:\s*"([^"]+)"/.exec(line);
    if (a) slug = a[1];
    const b = /^\s*live:\s*"(https?:\/\/[^"]+)"/.exec(line);
    if (b) rows.push([slug, b[1]]);
  }
}
const data = readFileSync("src/data/projects.ts", "utf8");
const listed = new Set([.../LIVE_DOWN = new Set\(\[([\s\S]*?)\]\)/.exec(data)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));

const check = async ([slug, url]) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(url, { redirect: "follow", signal: c.signal, headers: { "user-agent": "Mozilla/5.0 link-check" } });
    return { slug, url, status: r.status, note: r.headers.get("x-vercel-error") ?? "" };
  } catch (e) {
    return { slug, url, status: 0, note: "sem resposta (" + (e.name ?? "erro") + ")" };
  } finally {
    clearTimeout(t);
  }
};
const out = await Promise.all(rows.map(check));
let stale = 0;
for (const r of out) {
  const up = r.status >= 200 && r.status < 400;
  const inList = listed.has(r.slug);
  const verdict = up ? (inList ? "VOLTOU — tirar de LIVE_DOWN" : "ok") : inList ? "fora do ar (na lista)" : "CAIU — pôr em LIVE_DOWN";
  if (up === inList) stale++;
  console.log(`${String(r.status).padEnd(3)} ${r.slug.padEnd(28)} ${r.url.padEnd(52)} ${verdict}${r.note ? " · " + r.note : ""}`);
}
const down = out.filter((r) => !(r.status >= 200 && r.status < 400)).length;
console.log(`\n${out.length} endereços cadastrados · ${out.length - down} no ar · ${down} fora do ar · lista ${stale ? "DESATUALIZADA (" + stale + ")" : "em dia"}`);
process.exit(stale ? 1 : 0);
