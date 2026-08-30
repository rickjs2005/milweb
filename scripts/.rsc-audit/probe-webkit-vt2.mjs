import { webkit } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await webkit.launch();
async function run(label, { noVT, steps }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  if (noVT) await ctx.addInitScript(() => { delete Document.prototype.startViewTransition; });
  const page = await ctx.newPage();
  let crashed = false; page.on("crash", () => (crashed = true));
  const out = []; let stage = "goto";
  try {
    await page.goto(BASE + steps[0]); stage = "after-goto"; await page.waitForTimeout(2000);
    for (const to of steps.slice(1)) {
      const sel = `a[href="${to}"]`;
      stage = "find:" + to;
      let l = page.locator(`${sel}:not(#nav-overlay *):not([data-nav-root] *)`).filter({ visible: true }).first();
      if (!(await l.count())) { stage = "open-menu:" + to; await page.locator('button[aria-controls="nav-overlay"]').click(); await page.waitForTimeout(1200); l = page.locator(`#nav-overlay ${sel}`).first(); }
      stage = "scroll:" + to; await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(300);
      stage = "click:" + to; const b = await l.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3000);
      out.push(`${to}=${await page.evaluate(() => location.pathname)}`);
    }
  } catch (e) { out.push(`EXC@${stage}`); }
  console.log(`${label}: ${out.join("  ")} crashed=${crashed}`);
  await ctx.close().catch(() => {});
}
for (let i = 0; i < 2; i++) await run("VT on · menu", { noVT: false, steps: ["/projetos", "/estudio", "/servicos"] });
await browser.close();
