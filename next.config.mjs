/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // As OG images dos cases leem public/og/<slug>.jpg do disco: o /public não
  // entra no filesystem da função por padrão — só com tracing explícito.
  outputFileTracingIncludes: {
    "/[lang]/work/[slug]/opengraph-image": ["./public/og/**"],
    "/[lang]/work/[slug]/twitter-image": ["./public/og/**"],
  },

  // /raio-x foi a primeira casa do funil de diagnóstico (viveu algumas horas
  // no ar em 31/07/2026) antes de virar /diagnostico com o funil completo.
  // Redirect permanente preserva qualquer link já compartilhado.
  async redirects() {
    return [
      { source: "/raio-x", destination: "/diagnostico", permanent: true },
      { source: "/en/raio-x", destination: "/en/diagnostico", permanent: true },
      // O acervo e os cases mudaram de /projetos para /work na reconstrução
      // de 08/2026. Links antigos (WhatsApp, LinkedIn, Google) continuam.
      { source: "/projetos", destination: "/work", permanent: true },
      { source: "/projetos/:slug", destination: "/work/:slug", permanent: true },
      { source: "/en/projetos", destination: "/en/work", permanent: true },
      { source: "/en/projetos/:slug", destination: "/en/work/:slug", permanent: true },

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
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
