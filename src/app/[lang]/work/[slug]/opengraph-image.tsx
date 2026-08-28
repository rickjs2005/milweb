import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getProject, TOTAL_LABEL } from "@/data/projects";
import { SELECTED_WORK } from "@/data/work";
import { SITE_URL } from "@/lib/content";

export const dynamic = "force-dynamic";
export const alt = "MilWeb — case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG do case na identidade nova: papel, tinta, régua, índice e o frame REAL
 * do projeto à direita (lido do /public — nunca stock).
 */
export default async function Image({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  const { slug, lang } = await params;
  const locale = lang === "en" ? "en" : "pt";
  const p = getProject(slug);
  const sel = SELECTED_WORK.find((w) => w.slug === slug);
  const title = sel ? sel.title[locale] : [p?.title ?? "MilWeb"];
  const font = await readFile(join(process.cwd(), "src/app/inter-700.ttf"));
  // Satori só decodifica PNG/JPEG: scripts/og-assets.mjs gera public/og/<slug>.jpg
  // a partir do frame real de cada projeto. Lido do disco (incluído no bundle
  // da função via outputFileTracingIncludes no next.config) — buscar por
  // URL falha quando o firewall da Vercel desafia o fetch da própria função.
  let img: string | null = null;
  if (p) {
    try {
      const buf = await readFile(join(process.cwd(), "public", "og", `${p.slug}.jpg`));
      img = `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      // Fallback: busca pela CDN (pode ser barrado pelo firewall; melhor que nada).
      try {
        const res = await fetch(`${SITE_URL}/og/${p.slug}.jpg`);
        if (res.ok && (res.headers.get("content-type") ?? "").startsWith("image/")) img = `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
      } catch {}
    }
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#F2F0EA", color: "#111111", fontFamily: "Inter", padding: "56px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "58%", paddingRight: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #111", paddingTop: "12px", fontSize: "20px", letterSpacing: "0.1em" }}>
            <span>MILWEB®</span>
            <span style={{ color: "#5F5F5A" }}>MW / {p?.n ?? "—"} / {TOTAL_LABEL}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: "72px", lineHeight: 0.92, letterSpacing: "-0.04em", fontWeight: 700 }}>
            {title.map((l) => (
              <span key={l}>{l.toUpperCase()}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", letterSpacing: "0.1em", color: "#5F5F5A" }}>
            <span>{p?.title.toUpperCase()}</span>
            <span>{p?.displayType}</span>
          </div>
        </div>
        <div style={{ display: "flex", width: "42%", backgroundColor: "#DAD8D1", overflow: "hidden" }}>
          {img && <img src={img} alt="" width={720} height={450} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />}
        </div>
        <div style={{ position: "absolute", left: "64px", bottom: "40px", width: "10px", height: "10px", backgroundColor: "#B7FF37" }} />
      </div>
    ),
    { ...size, fonts: [{ name: "Inter", data: font, weight: 700, style: "normal" }] },
  );
}
