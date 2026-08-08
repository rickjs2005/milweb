/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desligado por causa do GSAP/ScrollTrigger: o double-invoke do React Strict
  // Mode em DEV monta→desmonta→monta cada página, e a recriação de
  // ScrollTriggers (inclusive em navegação client-side, ex.: voltar de /cv para
  // a home) corrompe a lista interna do GSAP — erro "Cannot read properties of
  // undefined (reading 'end')". Strict Mode só roda em dev; produção (next
  // start) monta uma vez só, então isto não muda o comportamento publicado.
  reactStrictMode: false,

  // /raio-x foi a primeira casa do funil de diagnóstico (viveu algumas horas
  // no ar em 31/07/2026) antes de virar /diagnostico com o funil completo.
  // Redirect permanente preserva qualquer link já compartilhado.
  async redirects() {
    return [
      { source: "/raio-x", destination: "/diagnostico", permanent: true },
      { source: "/en/raio-x", destination: "/en/diagnostico", permanent: true },

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
