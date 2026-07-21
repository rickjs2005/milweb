"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo do Lab (preview mudo): NADA é baixado até o card se aproximar da
 * viewport — `preload="none"` + poster, sem atributo `autoPlay` (que faz o
 * browser baixar o arquivo inteiro já no load da página, mesmo fora da
 * tela; era isso que colocava ~4MB de vídeo no first load da home). O
 * IntersectionObserver dá o play ao entrar (o play() dispara o download) e
 * pausa ao sair. Em prefers-reduced-motion fica no poster, parado.
 */
export function LabVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    const tryPlay = () => {
      video.play().catch(() => {
        // Primeiro play pode falhar se os metadados ainda não chegaram —
        // tenta de novo assim que der.
        video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryPlay();
        else video.pause();
      },
      // rootMargin: começa a baixar um pouco antes de aparecer, pra não
      // entrar na tela ainda no poster.
      { threshold: 0.1, rootMargin: "25% 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      className="block h-full w-full object-cover"
    />
  );
}
