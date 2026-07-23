/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desligado por causa do GSAP/ScrollTrigger: o double-invoke do React Strict
  // Mode em DEV monta→desmonta→monta cada página, e a recriação de
  // ScrollTriggers (inclusive em navegação client-side, ex.: voltar de /cv para
  // a home) corrompe a lista interna do GSAP — erro "Cannot read properties of
  // undefined (reading 'end')". Strict Mode só roda em dev; produção (next
  // start) monta uma vez só, então isto não muda o comportamento publicado.
  reactStrictMode: false,

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
