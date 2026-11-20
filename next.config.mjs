import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Revisão do modelo 3D do MilWeb OS: o começo do SHA-256 do arquivo, calculado a cada build (e ao subir o
 * `next dev`). Vai na URL do modelo (scene.config.ts › ENTITY_URL), então código e modelo andam sempre em par:
 * o navegador nunca junta o código novo com um GLB antigo que ficou no cache — o que deixava o personagem
 * parado, na imagem estática, para quem já tinha visitado o site.
 */
const entityRev = (() => {
  try {
    return createHash("sha256").update(readFileSync(new URL("./public/models/entity.glb", import.meta.url))).digest("hex").slice(0, 10);
  } catch {
    return "";
  }
})();

/** Mesma ideia para as moléculas e a malha da figura da Matéria (materia/config.ts › MATERIA_URLS e FIGURE_URLS). */
const materiaRev = (() => {
  try {
    const h = createHash("sha256");
    for (const f of ["materia-a.bin", "materia-b.bin", "materia-figure.bin", "materia-figure-lite.bin"]) h.update(readFileSync(new URL("./public/models/" + f, import.meta.url)));
    return h.digest("hex").slice(0, 10);
  } catch {
    return "";
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  env: { NEXT_PUBLIC_ENTITY_REV: entityRev, NEXT_PUBLIC_MATERIA_REV: materiaRev },

  // As OG images dos cases leem public/og/<slug>.jpg do disco: o /public não
  // entra no filesystem da função por padrão — só com tracing explícito.
  outputFileTracingIncludes: {
    "/**": ["./public/og/**"],
  },

  // /raio-x foi a primeira casa do funil de diagnóstico (viveu algumas horas
  // no ar em 31/07/2026) antes de virar /diagnostico com o funil completo.
  // Redirect permanente preserva qualquer link já compartilhado.
  async redirects() {
    return [
      { source: "/raio-x", destination: "/diagnostico", permanent: true },
      { source: "/en/raio-x", destination: "/en/business-audit", permanent: true },

      // www servia o site inteiro com 200, ou seja, cada página tinha dois
      // endereços públicos. O canonical já apontava pro apex e segurava a
      // duplicata, mas o crawler ainda gastava rastreamento nas duas versões
      // — e era pelo www que o PageSpeed estava medindo o site.
      // `has: host` deixa a regra valer só pro www; o destino é o apex, que
      // não casa mais com ela, então não há laço.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.milweb.com.br" }],
        destination: "https://milweb.com.br/:path*",
        permanent: true,
      },
    ];
  },

  // Content-Security-Policy é dinâmico (nonce por request) — fica no
  // middleware. Estes aqui são estáticos e cobrem o resto do checklist de
  // segurança do relatório de auditoria.
  async headers() {
    return [
      // O modelo 3D do MilWeb OS (1,8 MB) não muda a cada deploy: um dia de cache e revalidação em segundo plano.
      // Seguro porque a URL leva a revisão do arquivo (`entityRev`, acima): modelo novo = endereço novo.
      { source: "/models/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
