"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

/**
 * Player da página /lab: o filme completo TOCANDO em loop mudo desde o
 * primeiro segundo (nada de poster parado), com controles nativos para
 * ativar o som/fullscreen. Um selo "toque para ouvir" some no primeiro
 * unmute. Pausa fora da viewport; respeita prefers-reduced-motion.
 */
export function LabPlayer({ src, poster, label, hint }: { src: string; poster: string; label: string; hint: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.autoplay = false;
      video.pause();
      return;
    }

    const tryPlay = () => {
      if (!video.muted) return; // usuário assumiu o controle (com som)
      video.play().catch(() => {
        video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
      });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryPlay();
        else if (video.muted) video.pause();
      },
      { threshold: 0.3 },
    );
    io.observe(video);

    const onVolume = () => setMuted(video.muted);
    video.addEventListener("volumechange", onVolume);
    return () => {
      io.disconnect();
      video.removeEventListener("volumechange", onVolume);
    };
  }, []);

  return (
    <div className="relative h-full">
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label={label}
        className="block h-full w-full object-cover"
      />
      {muted && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-bg/75 px-3 py-1.5 text-xs font-medium text-fg backdrop-blur-sm">
          <Volume2 className="h-3.5 w-3.5 text-accent" />
          {hint}
        </span>
      )}
    </div>
  );
}
