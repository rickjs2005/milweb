import { chromium } from "playwright";
const url = process.argv[2] ?? "http://127.0.0.1:3001/lab/milo-null?force=1&pass=1";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
page.on("console", (m) => { if (m.type() === "error" || /THREE|shader/i.test(m.text())) console.log("[console]", m.type(), m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
const cdp = await page.context().newCDPSession(page);
await cdp.send("Profiler.enable");
await page.goto(url);
await page.waitForTimeout(3000);
await cdp.send("Profiler.start");
await page.waitForTimeout(4000);
const { profile } = await cdp.send("Profiler.stop");
// self time por função
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = profile.timeDeltas;
for (let i = 0; i < profile.samples.length; i++) {
  const n = byId.get(profile.samples[i]);
  const key = `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").pop().split("?")[0]}:${n.callFrame.lineNumber}`;
  self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0));
}
const total = [...self.values()].reduce((a, b) => a + b, 0);
console.log("total sampled ms", (total / 1000).toFixed(0));
for (const [k, v] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log((v / 1000).toFixed(0).padStart(6), "ms", k);
const fps = await page.evaluate(() => new Promise((r) => { let f = 0; const t0 = performance.now(); const loop = () => { f++; performance.now() - t0 < 1000 ? requestAnimationFrame(loop) : r(f); }; requestAnimationFrame(loop); }));
console.log("rAF fps", fps);
await browser.close();
