import { webkit } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await webkit.launch();
async function run(label, { noVT, wait }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  if (noVT) await ctx.addInitScript(() => { delete Document.prototype.startViewTransition; });
  const page = await ctx.newPage();
  let crashed = false; page.on("crash", () => (crashed = true));
  let url = "?";
  try {
    await page.goto(BASE + "/projetos"); await page.waitForTimeout(2000);
    await page.locator('button[aria-controls="nav-overlay"]').click(); await page.waitForTimeout(wait);
    const l = page.locator('#nav-overlay a[href="/estudio"]').first(); const b = await l.boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3000);
    url = await page.evaluate(() => location.pathname);
  } catch (e) {}
  console.log(`${label} wait=${wait}: url=${url} crashed=${crashed}`);
  await ctx.close().catch(() => {});
}
for (let i = 0; i < 3; i++) {
  await run("VT on ", { noVT: false, wait: 1200 });
  await run("VT off", { noVT: true, wait: 1200 });
}
await run("VT on ", { noVT: false, wait: 600 });
await run("VT off", { noVT: true, wait: 600 });
await browser.close();
