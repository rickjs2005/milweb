import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 360, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:3001/"); await page.waitForTimeout(1500); await page.keyboard.press("Escape"); await page.waitForTimeout(3500);
console.log(JSON.stringify(await page.evaluate(() => {
  const W = document.documentElement.clientWidth; const out = [];
  const clippedBy = (el) => { let e = el.parentElement; while (e && e !== document.body) { const o = getComputedStyle(e).overflowX; if (o !== "visible") return true; e = e.parentElement; } return false; };
  document.querySelectorAll("body *").forEach((el) => {
    if (el.closest("svg") || clippedBy(el)) return;
    const cs = getComputedStyle(el);
    // conteúdo de texto mais largo que a caixa (overflow visível)
    if (cs.overflowX === "visible" && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const r = el.getBoundingClientRect();
      if (r.left + el.scrollWidth > W + 1) out.push(`text: ${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")} box=${Math.round(r.left)}..${Math.round(r.right)} content→${Math.round(r.left + el.scrollWidth)} "${(el.textContent || "").trim().slice(0, 28)}"`);
    }
    for (const ps of ["::before", "::after"]) { const p = getComputedStyle(el, ps); if (p.content !== "none" && p.position !== "static") { const r = el.getBoundingClientRect(); const w = parseFloat(p.width) || 0; const l = parseFloat(p.left) || 0; if (w > W || r.left + l + w > W + 1) out.push(`pseudo ${ps}: ${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")} w=${p.width} left=${p.left} right=${p.right}`); } }
  });
  return { clientW: W, bodySW: document.body.scrollWidth, offenders: out.slice(0, 15) };
}), null, 1));
await b.close();
