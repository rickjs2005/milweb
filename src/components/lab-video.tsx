"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo do Lab (preview mudo): autoplay garantido — `autoPlay` +
 * muted/playsInline (o combo que todo browser mobile aceita) e um
 * IntersectionObserver que pausa fora da viewport e RE-tenta o play ao
 * entrar (alguns browsers bloqueiam o primeiro play antes do load).
 * Em prefers-reduced-motion fica no poster, parado.
 */
export function LabVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.autoplay = false;
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
      { threshold: 0.25 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      className="block h-full w-full object-cover"
    />
  );
}
