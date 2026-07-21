/**
 * Atmosfera do hero: fundo codificado (gradiente profundo, feixes de luz
 * volumétrica, poeira em suspensão, vinheta e fade no pé) — a foto genérica
 * de escritório FOI REMOVIDA de propósito: a identidade visual agora é a
 * cena 3D (hero-scene) por cima desta base. No mobile (sem cena 3D) esta
 * atmosfera + o conteúdo são o hero inteiro.
 *
 * Server component puro; todo movimento é CSS (reduced-motion global zera).
 */
export function HeroCinema() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Profundidade de cor: azul da marca respirando nos cantos. */}
      <div className="absolute inset-0 [background:radial-gradient(52rem_34rem_at_78%_30%,rgb(56_189_248/0.10),transparent_62%),radial-gradient(40rem_30rem_at_8%_82%,rgb(14_165_233/0.07),transparent_60%)]" />

      {/* Feixes de luz volumétrica descendo da direita (cena 3D vive ali). */}
      <div data-depth="0.12" className="absolute -inset-y-[10%] inset-x-0">
        <div className="absolute -top-24 right-[10%] h-[130%] w-44 rotate-[22deg] bg-gradient-to-b from-accent/12 via-accent/[0.04] to-transparent blur-2xl" />
        <div className="absolute -top-24 right-[30%] h-[130%] w-24 rotate-[22deg] bg-gradient-to-b from-accent/[0.09] via-accent/[0.03] to-transparent blur-2xl" />
        <div className="absolute -top-24 right-[48%] h-[120%] w-14 rotate-[22deg] bg-gradient-to-b from-accent/[0.06] to-transparent blur-xl" />
      </div>

      {/* Poeira em suspensão (CSS): serve o mobile e reforça o desktop. */}
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

      {/* Vinheta suave + fade no pé pra dissolver na próxima seção. O fade
          usa --page-bg (fundo do TEMA, fora do escopo .hero-dark): no claro
          o hero dissolve pro branco da seção seguinte, não pro escuro. */}
      <div className="absolute inset-0 [background:radial-gradient(130%_105%_at_50%_40%,transparent_55%,rgb(5_7_13/0.6)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[rgb(var(--page-bg))]" />
    </div>
  );
}

/* Motes fixos (server component: valores determinísticos, sem Math.random —
   mismatch de hidratação). Espalhados pela cena toda, mais densos à direita. */
const DUST = [
  { left: "58%", top: "30%", size: 3, dur: "9s", delay: "0s", drift: "18px", peak: 0.55 },
  { left: "66%", top: "52%", size: 2, dur: "12s", delay: "2.1s", drift: "-14px", peak: 0.4 },
  { left: "72%", top: "24%", size: 2, dur: "10s", delay: "4.4s", drift: "10px", peak: 0.5 },
  { left: "78%", top: "44%", size: 3, dur: "8s", delay: "1.2s", drift: "-20px", peak: 0.6 },
  { left: "84%", top: "34%", size: 2, dur: "13s", delay: "5.6s", drift: "12px", peak: 0.45 },
  { left: "88%", top: "58%", size: 2, dur: "11s", delay: "3.3s", drift: "-10px", peak: 0.4 },
  { left: "62%", top: "66%", size: 2, dur: "10.5s", delay: "6.8s", drift: "16px", peak: 0.35 },
  { left: "93%", top: "26%", size: 3, dur: "9.5s", delay: "0.9s", drift: "-16px", peak: 0.5 },
  { left: "22%", top: "36%", size: 2, dur: "14s", delay: "7.5s", drift: "12px", peak: 0.3 },
  { left: "12%", top: "62%", size: 2, dur: "12.5s", delay: "5.2s", drift: "-12px", peak: 0.3 },
  { left: "38%", top: "72%", size: 2, dur: "11.5s", delay: "3.9s", drift: "14px", peak: 0.35 },
];
