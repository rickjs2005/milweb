import Image from "next/image";

/** Logo MilWeb (marca "MW" em PNG com fundo transparente, public/logo-mw.png)
 *  + wordmark opcional. A arte é 512x320 (proporção 1.6) — `size` controla a
 *  ALTURA e a largura acompanha, então trocar a arte não mexe em quem usa.
 *  `animate`: entrada única ao montar (fade + leve zoom — a assinatura de
 *  desenhar traços era do SVG antigo e não existe em raster). */
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
      <Image
        src="/logo-mw.png"
        alt="MilWeb"
        width={Math.round(size * 1.6)}
        height={size}
        priority
        className={animate ? "mw-logo-in" : undefined}
      />
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-fg">MilWeb</span>
      )}
    </span>
  );
}
