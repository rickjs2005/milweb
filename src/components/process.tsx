import { PROCESS, UI, type Locale } from "@/lib/content";
import { makeT } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { StackCard } from "./stack-card";

export function Process({ locale }: { locale: Locale }) {
  const t = makeT(locale);

  return (
    <section id="process" className="container-page scroll-mt-20 py-20 sm:py-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="text-accent/40">07 / </span>
          {t(UI.sections.processEyebrow)}
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t(UI.sections.processTitle)}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-fg-subtle">{t(UI.sections.processSub)}</p>
      </Reveal>

      {/* Mobile: pilha "sticky stack" -- cada card gruda (position: sticky)
          no MESMO `top` (o `z-index` crescente decide quem cobre quem) e o
          próximo sobe por cima, encolhendo e esmaecendo o de baixo
          (StackCard cuida do scroll). Um `top` quase igual entre os cards é
          essencial: se cada um grudar num `top` bem diferente, o de cima
          "solta" antes do próximo chegar na mesma posição, abrindo um vão
          vazio no meio da rolagem. A margem-inferior (mobile only) é a
          "pista" que segura o card no lugar enquanto o próximo se aproxima
          por baixo -- curta o bastante pra não deixar um vão morto de tela
          vazia entre os cards. No desktop (md+) volta pra grade normal
          lado a lado, sem sticky nem margem extra. */}
      <div className="mt-10 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PROCESS.map((s, i) => (
          <StackCard
            key={s.n}
            top={88 + i * 4}
            zIndex={i + 1}
            delay={i * 90}
            className="sticky mb-[14vh] flex min-h-[13rem] flex-col justify-center rounded-2xl border border-line/10 glass p-7 shadow-2xl shadow-bg/60 md:static md:mb-0 md:min-h-0 md:justify-start md:shadow-none"
          >
            <span className="font-mono text-3xl font-bold text-accent/30">{s.n}</span>
            <h3 className="mt-3 text-lg font-semibold text-fg">{t(s.title)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t(s.desc)}</p>
          </StackCard>
        ))}
      </div>
    </section>
  );
}
