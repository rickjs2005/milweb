import Image from "next/image";

/**
 * Fundo cinematográfico do hero: imagem 2K (estúdio dark, gerada no
 * Higgsfield e otimizada pra WebP/AVIF) coberta por camadas codificadas —
 * Ken Burns, parallax de mouse, gradiente de legibilidade, vinheta, glow
 * azul da marca e o bg-grid como textura por cima (DNA visual do site).
 *
 * Server component puro: todo o movimento é CSS + o MouseParallax global
 * (via data-depth). Se a imagem falhar, o bg-grid + glow da seção (que
 * ficam POR BAIXO, no hero.tsx) seguram o fundo — o hero nunca quebra.
 */
export function HeroCinema() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* -inset-[5%]: sobra de borda pro parallax não revelar o fim da imagem. */}
      <div data-depth="0.05" className="absolute -inset-[5%]">
        <div className="hero-kenburns absolute inset-0">
          <Image
            src="/hero-cinema.webp"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover object-[72%_center]"
          />
        </div>
      </div>

      {/* Legibilidade: gradiente escuro vindo da esquerda (área do texto). */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] from-[8%] via-[#05070d]/70 via-[46%] to-[#05070d]/15" />
      {/* Vinheta: prende o olhar no centro e esconde as bordas do crop. */}
      <div className="absolute inset-0 [background:radial-gradient(120%_100%_at_50%_42%,transparent_52%,rgb(5_7_13/0.78)_100%)]" />
      {/* Punch de azul da marca sobre as telas (a imagem veio menos "elétrica"
          que o pedido — o acento entra por código, sem gastar outra geração). */}
      <div className="absolute inset-0 mix-blend-screen [background:radial-gradient(46rem_30rem_at_78%_38%,rgb(56_189_248/0.16),transparent_65%)]" />
      {/* Textura de grid por cima da foto — costura a imagem no resto do site. */}
      <div className="bg-grid absolute inset-0 opacity-60" />
    </div>
  );
}
