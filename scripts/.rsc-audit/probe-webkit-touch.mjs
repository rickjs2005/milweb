// WebKit 390: o crash de processo depende de hasTouch (emulação de toque)?
import { webkit } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await webkit.launch();
for (const hasTouch of [true, false]) {
  for (const [from, to] of [["/", "/projetos"], ["/projetos", "/estudio"], ["/estudio", "/servicos"]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch });
    const page = await ctx.newPage();
    let crashed = false;
    page.on("crash", () => (crashed = true));
    try {
      await page.goto(BASE + from); await page.waitForTimeout(1500);
      const sel = `a[href="${to}"]`;
      const inOverlay = page.locator(`#nav-overlay ${sel}`).first();
      let l = page.locator(`${sel}:not(#nav-overlay *):not([data-nav-root] *)`).filter({ visible: true }).first();
      if (!(await l.count())) { await page.locator('button[aria-controls="nav-overlay"]').click(); await page.waitForTimeout(1200); l = inOverlay; }
      await l.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(300);
      const b = await l.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(3000);
      console.log(`hasTouch=${hasTouch} ${from} → ${to}: url=${await page.evaluate(() => location.pathname)} crashed=${crashed}`);
    } catch (e) { console.log(`hasTouch=${hasTouch} ${from} → ${to}: EXC ${e.message.split("\n")[0].slice(0, 80)} crashed=${crashed}`); }
    await ctx.close().catch(() => {});
  }
}
await browser.close();
