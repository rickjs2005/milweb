/** Logo MilWeb (badge do monograma "MW" em SVG inline) + wordmark opcional.
 *  `animate`: desenha os traços do "MW" uma vez ao montar (assinatura da marca). */
export function Logo({
  withWordmark = true,
  size = 36,
  className = "",
  animate = false,
}: {
  withWordmark?: boolean;
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <span className={"flex items-center gap-2.5 " + className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-label="MilWeb"
        className="rounded-lg ring-1 ring-inset ring-accent/30 text-accent"
      >
        <defs>
          <linearGradient id="mwGrad" x1="8" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="55%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <linearGradient id="mwBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0d1424" />
            <stop offset="100%" stopColor="#070a12" />
          </linearGradient>
        </defs>

        {/* dark badge background */}
        <rect width="48" height="48" rx="11" fill="url(#mwBg)" />

        {/* "MW" monogram: M (left), W (right), sharing a center stem */}
        <g
          stroke="url(#mwGrad)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className={animate ? "mw-draw" : undefined}
        >
          {/* M — left half: up-stroke, down to inner valley, back up to shared center peak */}
          <path pathLength={1} d="M7 34 V15 L16 26 L24 14" />
          {/* W — right half: down from shared center peak, up to inner peak, down */}
          <path pathLength={1} d="M24 14 L32 26 L41 15 V34" />
        </g>
      </svg>
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-fg">MilWeb</span>
      )}
    </span>
  );
}
