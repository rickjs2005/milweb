/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desligado por causa do GSAP/ScrollTrigger: o double-invoke do React Strict
  // Mode em DEV monta→desmonta→monta cada página, e a recriação de
  // ScrollTriggers (inclusive em navegação client-side, ex.: voltar de /cv para
  // a home) corrompe a lista interna do GSAP — erro "Cannot read properties of
  // undefined (reading 'end')". Strict Mode só roda em dev; produção (next
  // start) monta uma vez só, então isto não muda o comportamento publicado.
  reactStrictMode: false,
};

export default nextConfig;
