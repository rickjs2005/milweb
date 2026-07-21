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
      <div className="absolute inset-0 mix-blend-screen [background:radial-gradient(46rem_30rem_at_78%_38%,rgb(56_189_248/0.26),transparent_65%)]" />
      {/* Textura de grid por cima da foto — costura a imagem no resto do site. */}
      <div className="bg-grid absolute inset-0 opacity-60" />

      {/* Poeira em suspensão (concentrada na metade direita, onde há luz —
          mote brilhando em área escura entrega que é fake). */}
      {DUST.map((d, i) => (
        <span
          key={i}
          className="hero-dust absolute rounded-full bg-accent-soft/80 blur-[1px]"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            ["--dust-dur" as string]: d.dur,
            ["--dust-delay" as string]: d.delay,
            ["--dust-drift" as string]: d.drift,
            ["--dust-peak" as string]: d.peak,
          }}
        />
      ))}

      {/* Fade no pé: dissolve a cena no fundo do site antes da próxima seção. */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[rgb(var(--bg))]" />
    </div>
  );
}

/* Motes fixos (server component: valores determinísticos, sem Math.random —
   mismatch de hidratação). Posições em % concentradas no lado direito. */
const DUST = [
  { left: "58%", top: "30%", size: 3, dur: "9s", delay: "0s", drift: "18px", peak: 0.55 },
  { left: "66%", top: "52%", size: 2, dur: "12s", delay: "2.1s", drift: "-14px", peak: 0.4 },
  { left: "72%", top: "24%", size: 2, dur: "10s", delay: "4.4s", drift: "10px", peak: 0.5 },
  { left: "78%", top: "44%", size: 3, dur: "8s", delay: "1.2s", drift: "-20px", peak: 0.6 },
  { left: "84%", top: "34%", size: 2, dur: "13s", delay: "5.6s", drift: "12px", peak: 0.45 },
  { left: "88%", top: "58%", size: 2, dur: "11s", delay: "3.3s", drift: "-10px", peak: 0.4 },
  { left: "62%", top: "66%", size: 2, dur: "10.5s", delay: "6.8s", drift: "16px", peak: 0.35 },
  { left: "93%", top: "26%", size: 3, dur: "9.5s", delay: "0.9s", drift: "-16px", peak: 0.5 },
  { left: "48%", top: "40%", size: 2, dur: "14s", delay: "7.5s", drift: "12px", peak: 0.3 },
];
