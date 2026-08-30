import { webkit } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await webkit.launch();
async function run(label, { noVT, selectorQuery }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  if (noVT) await ctx.addInitScript(() => { delete Document.prototype.startViewTransition; });
  const page = await ctx.newPage();
  let crashed = false; page.on("crash", () => (crashed = true));
  let stage = "goto";
  try {
    await page.goto(BASE + "/projetos"); await page.waitForTimeout(2000);
    if (selectorQuery) { stage = "selector"; await page.locator('a[href="/estudio"]:not(#nav-overlay *):not([data-nav-root] *)').filter({ visible: true }).first().count(); }
    stage = "open-menu"; await page.locator('button[aria-controls="nav-overlay"]').click(); await page.waitForTimeout(1200);
    const l = page.locator('#nav-overlay a[href="/estudio"]').first();
    stage = "scroll"; await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(300);
    stage = "click"; const b = await l.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3000);
    stage = "done:" + (await page.evaluate(() => location.pathname));
  } catch (e) {}
  console.log(`${label}: stage=${stage} crashed=${crashed}`);
  await ctx.close().catch(() => {});
}
for (let i = 0; i < 2; i++) {
  await run("VT on  · com selector :not(...) ", { noVT: false, selectorQuery: true });
  await run("VT on  · sem selector           ", { noVT: false, selectorQuery: false });
  await run("VT off · com selector :not(...) ", { noVT: true, selectorQuery: true });
}
await browser.close();
