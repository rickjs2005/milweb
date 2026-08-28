/** Consolida .audit/matrix/report-*.json numa tabela browser × viewport × página. */
import { readdirSync, readFileSync } from "node:fs";
const dir = ".audit/matrix";
const rows = readdirSync(dir).filter((f) => f.startsWith("report-")).flatMap((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")));
const NOISE = /LCP\)\. Please add the "priority"|"sizes" prop of "100vw"|GL Driver Message|preloaded using link preload/;
const byKey = new Map();
for (const r of rows) {
  const real = r.issues.filter((i) => !NOISE.test(i));
  const k = `${r.browser}|${r.viewport}`;
  const cur = byKey.get(k) ?? { browser: r.browser, viewport: r.viewport, vt: r.vt, pages: [], issues: [] };
  cur.pages.push(r.path);
  cur.issues.push(...real.map((i) => `${r.path}: ${i}`));
  byKey.set(k, cur);
}
console.log("BROWSER   VIEWPORT  VT   STATUS");
for (const c of byKey.values()) console.log(`${c.browser.padEnd(9)} ${c.viewport.padEnd(9)} ${(c.vt ? "yes" : "no").padEnd(4)} ${c.issues.length ? "ISSUE" : "PASS"}${c.issues.length ? "\n    " + [...new Set(c.issues)].join("\n    ") : ""}`);
