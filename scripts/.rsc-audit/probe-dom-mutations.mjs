// Quem remove/insere filhos diretos de <body> na Home durante os swaps de idioma?
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const seq = (process.argv[3] ?? "/,en,pt,en").split(",");
const booted = process.argv[4] === "booted";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript((booted) => {
  if (booted) try { sessionStorage.setItem("mw:booted", "1"); } catch {}
  window.__mut = [];
  const desc = (n) => (n && n.nodeType === 1 ? n.tagName + (n.id ? "#" + n.id : "") + (n.className && typeof n.className === "string" ? "." + n.className.split(" ").slice(0, 2).join(".") : "") : String(n && n.nodeName));
  const wrap = (proto, name) => {
    const orig = proto[name];
    proto[name] = function (...args) {
      try {
        const parent = name === "remove" ? this.parentNode : this;
        const child = name === "remove" ? this : args[0];
        if (parent === document.body || parent === document.documentElement || parent === document.head && false) {
          const st = (new Error().stack || "").split("\n").slice(2, 6).map((l) => l.trim().replace(location.origin, "")).join(" <- ");
          window.__mut.push({ op: name, parent: desc(parent), child: desc(child), at: location.pathname, st });
        }
      } catch {}
      return orig.apply(this, args);
    };
  };
  wrap(Node.prototype, "removeChild");
  wrap(Node.prototype, "appendChild");
  wrap(Node.prototype, "insertBefore");
  wrap(Element.prototype, "remove");
}, booted);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", String(e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error" && /NotFound/.test(m.text())) console.log("  [console]", m.text().split("\n").slice(0, 5).join(" | ").slice(0, 700)); });
const dump = async (label) => {
  const m = await page.evaluate(() => { const x = window.__mut; window.__mut = []; return x; });
  const body = await page.evaluate(() => [...document.body.children].map((e) => e.tagName + (e.id ? "#" + e.id : "")).filter((t) => t !== "SCRIPT"));
  console.log(`\n== ${label} body(non-script)=${JSON.stringify(body)}`);
  for (const x of m) if (!/^SCRIPT/.test(x.child)) console.log(`   ${x.op.padEnd(12)} ${x.parent.padEnd(6)} ${x.child.padEnd(34)} @${x.at}  ${x.st.slice(0, 260)}`);
};
await page.goto(BASE + seq[0]); await page.waitForTimeout(2500); await dump("start " + seq[0]);
for (const step of seq.slice(1)) {
  const sel = step.startsWith("/") ? `a[href="${step}"]` : `a[lang="${step === "pt" ? "pt-BR" : step}"]`;
  const l = page.locator(sel).first(); if (!(await l.count())) { console.log("NO LINK", sel); break; }
  await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(300);
  const b = await l.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3000);
  await dump("after → " + step + " url=" + (await page.evaluate(() => location.pathname)));
}
await browser.close();
