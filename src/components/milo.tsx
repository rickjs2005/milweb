/**
 * Milo — o mascote da MilWeb como SVG vetorial leve (sem lib de animação).
 *
 * Era um robô de moletom; virou coruja em 06/08 (pedido do Rick). O nome
 * continua Milo, então nada fora deste arquivo mudou: mesma assinatura,
 * mesmas 5 poses, mesmas classes de animação do globals.css.
 *
 * Duas restrições do CSS que o desenho tem de respeitar:
 *  - `.milo-arm-wave` gira em `transform-origin: 158px 172px`, em coordenadas
 *    do viewBox. A asa direita nasce exatamente nesse ponto, que é o ombro
 *    dela — por isso o aceno gira certo sem tocar no CSS.
 *  - `.milo-blink` é `scaleY(0.1)`, ou seja, o que pisca vira uma linha. Fica
 *    no grupo do olho inteiro (disco + pupila): a coruja fecha o olho todo,
 *    não só a pupila.
 *
 * O olhar segue o cursor movendo só as PUPILAS dentro dos discos
 * (--milo-lx/--milo-ly, setadas pelo MiloLive). No robô o rosto inteiro se
 * deslocava; com olho grande de coruja, mover a pupila lê muito melhor — e é
 * o mesmo mecanismo, só aplicado num grupo menor.
 */
export type MiloPose = "idle" | "think" | "shocked" | "happy" | "sleepy";

/**
 * Cor da plumagem (asas, pés, penas do peito, bico) — cravada de propósito,
 * NÃO vinda de --accent-soft: o hover do claro é mais ESCURO que o accent
 * (cai no meio do gradiente do corpo) e as asas sumiam contra o corpo.
 * Bone levemente tostado: contrasta com o corpo no acento da marca nos dois
 * temas (paleta graphite+bone — Milo trocou o azul junto com o site).
 */
const PLUMA = "#ece5d2";

/** Deslocamento do olhar, aplicado só nas pupilas. */
const GAZE = { transform: "translate(var(--milo-lx, 0px), var(--milo-ly, 0px))" };

export function Milo({
  pose = "idle",
  className = "",
  title = "Milo, a coruja mascote da MilWeb",
  waving = false,
}: {
  pose?: MiloPose;
  className?: string;
  title?: string;
  waving?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 220 270"
      role="img"
      aria-label={title}
      className={`milo-float select-none ${className}`}
    >
      <defs>
        <linearGradient id="milo-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent-deep))" />
          <stop offset="0.55" stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor={PLUMA} />
        </linearGradient>
        <linearGradient id="milo-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor="rgb(var(--accent-deep))" />
        </linearGradient>
        <radialGradient id="milo-base" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.45" />
          <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* base de holograma */}
      <ellipse cx="110" cy="256" rx="58" ry="8" fill="url(#milo-base)" />

      {/* pés */}
      <g stroke={PLUMA} strokeWidth="5" strokeLinecap="round" opacity="0.9">
        <path d="M92 236v12M92 248h-8M92 248h8" />
        <path d="M128 236v12M128 248h-8M128 248h8" />
      </g>

      {/* corpo em ovo */}
      <path d="M110 84c40 0 62 44 62 92 0 40-27 62-62 62s-62-22-62-62c0-48 22-92 62-92z" fill="url(#milo-body)" />

      {/* peito emplumado */}
      <g fill="none" stroke={PLUMA} strokeWidth="2.2" strokeLinecap="round" opacity="0.45">
        <path d="M96 186q14 12 28 0" />
        <path d="M92 204q18 14 36 0" />
        <path d="M96 222q14 12 28 0" />
      </g>

      {/* asa esquerda (parada) */}
      <path
        d="M62 172c-13 12-15 40-4 60"
        fill="none"
        stroke={PLUMA}
        strokeWidth="11"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* asa direita — o ombro dela é o pivô do aceno (158,172 no CSS) */}
      <g className={waving ? "milo-arm-wave" : undefined}>
        <path
          d="M158 172c13 12 15 40 4 60"
          fill="none"
          stroke={PLUMA}
          strokeWidth="11"
          strokeLinecap="round"
        />
      </g>

      {/* disco facial + tufos de orelha */}
      <path
        d="M110 72c34 0 55 23 55 51 0 30-24 49-55 49s-55-19-55-49c0-28 21-51 55-51z"
        fill="#1a1815"
        stroke="url(#milo-edge)"
        strokeWidth="2.5"
      />
      <path d="M67 82 57 46l31 17z" fill="#1a1815" stroke="url(#milo-edge)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M153 82l10-36-31 17z" fill="#1a1815" stroke="url(#milo-edge)" strokeWidth="2.5" strokeLinejoin="round" />

      {/* olhos por pose */}
      {pose === "shocked" ? (
        <>
          <g>
            <circle cx="86" cy="118" r="25" fill="#0c0c0a" stroke="rgb(var(--accent))" strokeWidth="3" />
            <circle cx="86" cy="118" r="5.5" fill="rgb(var(--accent))" style={GAZE} />
          </g>
          <g>
            <circle cx="134" cy="118" r="25" fill="#0c0c0a" stroke="rgb(var(--accent))" strokeWidth="3" />
            <circle cx="134" cy="118" r="5.5" fill="rgb(var(--accent))" style={GAZE} />
          </g>
        </>
      ) : pose === "happy" ? (
        <g fill="none" stroke="rgb(var(--accent))" strokeWidth="6.5" strokeLinecap="round">
          <path d="M70 124q16 -22 32 0" />
          <path d="M118 124q16 -22 32 0" />
        </g>
      ) : pose === "sleepy" ? (
        <g fill="none" stroke="rgb(var(--accent))" strokeWidth="6" strokeLinecap="round">
          <path d="M70 116q16 18 32 0" />
          <path d="M118 116q16 18 32 0" />
        </g>
      ) : pose === "think" ? (
        // olhando pra cima: as pupilas ficam altas e não seguem o cursor —
        // quem está pensando não está olhando pra você.
        <>
          <g>
            <circle cx="86" cy="118" r="24" fill="#0c0c0a" stroke="rgb(var(--accent))" strokeWidth="2" strokeOpacity="0.35" />
            <circle cx="80" cy="111" r="10" fill="rgb(var(--accent))" />
          </g>
          <g>
            <circle cx="134" cy="118" r="24" fill="#0c0c0a" stroke="rgb(var(--accent))" strokeWidth="2" strokeOpacity="0.35" />
            <circle cx="128" cy="111" r="10" fill="rgb(var(--accent))" />
          </g>
        </>
      ) : (
        <>
          <g className="milo-blink">
            <circle cx="86" cy="118" r="24" fill="#0c0c0a" stroke="rgb(var(--accent))" strokeWidth="2" strokeOpacity="0.35" />
            <g style={GAZE}>
              <circle cx="86" cy="118" r="10" fill="rgb(var(--accent))" />
              <circle cx="81" cy="113" r="3.2" fill="#fff" opacity="0.85" />
            </g>
          </g>
          <g className="milo-blink">
            <circle cx="134" cy="118" r="24" fill="#0c0c0a" stroke="rgb(var(--accent))" strokeWidth="2" strokeOpacity="0.35" />
            <g style={GAZE}>
              <circle cx="134" cy="118" r="10" fill="rgb(var(--accent))" />
              <circle cx="129" cy="113" r="3.2" fill="#fff" opacity="0.85" />
            </g>
          </g>
        </>
      )}

      {/* bico — abre no susto */}
      {pose === "shocked" ? (
        <path d="M110 148l-11 16 11 10 11-10z" fill={PLUMA} />
      ) : (
        <path d="M110 146l-9 13 9 6 9-6z" fill={PLUMA} />
      )}

      {/* zZ do cochilo */}
      {pose === "sleepy" && (
        <g fill="none" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path className="milo-zzz" d="M172 40h9l-9 9h9" />
          <path className="milo-zzz [animation-delay:0.9s]" d="M188 24h12l-12 12h12" />
        </g>
      )}
    </svg>
  );
}
