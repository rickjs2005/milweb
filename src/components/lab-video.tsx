"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo do Lab: `preload="none"` e só dá play quando entra na viewport
 * (IntersectionObserver) — pausa ao sair. Mudo, em loop, sem controles.
 * Em prefers-reduced-motion fica no poster, parado.
 */
export function LabVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
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
