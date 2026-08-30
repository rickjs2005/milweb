import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
for (const [w, h] of [[1920, 1080], [768, 1024], [390, 844], [360, 800]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3001/"); await page.waitForTimeout(1500); await page.keyboard.press("Escape"); await page.waitForTimeout(3500);
  const r = await page.evaluate(() => {
    const out = new Map();
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width > 0 && r.right > innerWidth + 1 && cs.position !== "fixed") {
        // sobe até o ancestral com overflow visível que realmente estende o scrollWidth
        let e = el, clipped = false; while (e && e !== document.body) { const c = getComputedStyle(e); if (/hidden|clip|auto|scroll/.test(c.overflowX)) { clipped = true; break; } e = e.parentElement; }
        if (clipped) return;
        const sec = el.closest("section, header, footer, main, nav"); const key = (sec ? sec.tagName + "#" + (sec.id || sec.dataset.act || sec.className.split(" ")[0]) : "?") + " › " + el.tagName.toLowerCase() + "." + [...el.classList].slice(0, 3).join(".");
        out.set(key, Math.max(out.get(key) ?? 0, Math.round(r.right)));
      }
    });
    return { sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: innerWidth, offenders: [...out.entries()].slice(0, 10) };
  });
  console.log(`${w}x${h}`, JSON.stringify(r));
  await ctx.close();
}
await b.close();
