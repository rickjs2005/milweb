/**
 * Milo — o mascote da MilWeb como SVG vetorial leve (sem lib de animação).
 * Flutuação e piscada via CSS (globals: .milo-float / .milo-blink); a "pose"
 * troca só o rosto (olhos/boca), o suficiente pra ele reagir na calculadora.
 */
export type MiloPose = "idle" | "think" | "shocked";

export function Milo({
  pose = "idle",
  className = "",
  title = "Milo, o mascote da MilWeb",
}: {
  pose?: MiloPose;
  className?: string;
  title?: string;
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
          <stop offset="1" stopColor="rgb(var(--accent-soft))" />
        </linearGradient>
        <linearGradient id="milo-hoodie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f56d8" />
          <stop offset="1" stopColor="#1b2f80" />
        </linearGradient>
        <radialGradient id="milo-base" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.45" />
          <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* base de holograma */}
      <ellipse cx="110" cy="256" rx="62" ry="9" fill="url(#milo-base)" />

      {/* corpo (moletom) */}
      <path d="M62 150c0-27 21-42 48-42s48 15 48 42v10H62v-10z" fill="url(#milo-hoodie)" opacity="0.9" />
      <path d="M64 246c-3-46 6-88 46-88s49 42 46 88H64z" fill="url(#milo-hoodie)" />
      <path d="M98 168v22M122 168v22" stroke="#9db7ff" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <path d="M85 216h50v18a8 8 0 0 1-8 8H93a8 8 0 0 1-8-8v-18z" fill="#16266b" opacity="0.85" />

      {/* braços wireframe */}
      <path d="M62 170c-14 8-20 26-18 46" fill="none" stroke="#6ea6ff" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      <circle cx="44" cy="218" r="8" fill="#0d1330" stroke="rgb(var(--accent))" strokeWidth="2.4" />
      <path d="M158 170c14 8 20 26 18 46" fill="none" stroke="#6ea6ff" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      <circle cx="176" cy="218" r="8" fill="#0d1330" stroke="rgb(var(--accent))" strokeWidth="2.4" />

      {/* cabeça */}
      <rect x="45" y="30" width="130" height="102" rx="30" fill="#0d1126" stroke="url(#milo-edge)" strokeWidth="2.5" />
      <rect x="54" y="39" width="112" height="84" rx="23" fill="#04060f" />
      <g stroke="rgb(var(--accent))" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M64 52v-5a4 4 0 0 1 4-4h5" />
        <path d="M156 52v-5a4 4 0 0 0-4-4h-5" />
        <path d="M64 110v5a4 4 0 0 0 4 4h5" />
        <path d="M156 110v5a4 4 0 0 1-4 4h-5" />
      </g>

      {/* rosto por pose */}
      {pose === "shocked" ? (
        <g>
          <circle cx="89" cy="80" r="13" fill="none" stroke="rgb(var(--accent))" strokeWidth="6" />
          <circle cx="131" cy="80" r="13" fill="none" stroke="rgb(var(--accent))" strokeWidth="6" />
          <ellipse cx="110" cy="107" rx="7" ry="9" fill="rgb(var(--accent))" opacity="0.9" />
        </g>
      ) : pose === "think" ? (
        <g fill="rgb(var(--accent))">
          <rect x="81" y="66" width="15" height="30" rx="7.5" />
          <rect x="123" y="72" width="15" height="18" rx="7.5" />
        </g>
      ) : (
        <g fill="rgb(var(--accent))">
          <rect className="milo-blink" x="81" y="62" width="15" height="38" rx="7.5" />
          <rect className="milo-blink" x="124" y="62" width="15" height="38" rx="7.5" />
          <path d="M98 106c4 5 20 5 24 0" fill="none" stroke="rgb(var(--accent))" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
