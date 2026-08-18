"use client";

import { useEffect, useState, type ElementType, type Ref } from "react";

const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#0123456789";

/**
 * Efeito "decodificando": embaralha caracteres aleatórios até resolver no
 * texto real, da esquerda pra direita. Roda uma vez ao montar. Sem
 * prefers-reduced-motion o texto nasce direto resolvido.
 */
export function ScrambleText({
  text,
  as: Tag = "span",
  className = "",
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(text);
      return;
    }
    let frame = 0;
    const totalFrames = text.length * 3;
    let timer: number;
    const step = () => {
      frame++;
      const revealed = Math.floor((frame / totalFrames) * text.length);
      setDisplay(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " " || i < revealed) return ch;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join(""),
      );
      if (frame < totalFrames) {
        timer = window.setTimeout(step, 28);
      } else {
        setDisplay(text);
      }
    };
    step();
    return () => window.clearTimeout(timer);
  }, [text]);

  const T = Tag as "span";
  return (
    <T aria-label={text} className={className}>
      {display}
    </T>
  );
}
