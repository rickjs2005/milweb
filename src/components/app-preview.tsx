"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./lang-provider";
import type { Localized } from "@/lib/content";

export type AppMedia = {
  label: Localized;
  src: string;
  poster: string;
  kind: "desktop" | "mobile";
};

/**
 * Preview do app em uma "moldura de celular": vídeo mudo em loop que toca
 * só quando visível (economia de banda/CPU). Com 2+ telas, mostra um toggle.
 */
export function AppPreview({ media, big = false }: { media: AppMedia[]; big?: boolean }) {
  const { t } = useLang();
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = media[active];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [active]);

  return (
    <div className="flex flex-col items-center">
      {media.length > 1 && (
        <div className="relative z-10 mb-4 inline-flex rounded-lg border border-line/15 bg-surface-2/60 p-1 text-sm">
          {media.map((m, i) => (
            <button
              key={m.src}
              type="button"
              onClick={() => setActive(i)}
              className={
                "rounded-md px-3 py-1.5 font-medium transition-colors " +
                (active === i ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg")
              }
            >
              {t(m.label)}
            </button>
          ))}
        </div>
      )}
      {current.kind === "desktop" ? (
        <div className="w-full overflow-hidden rounded-xl border border-line/15 bg-black shadow-[0_0_60px_-16px_rgb(var(--accent)/0.45)]">
          <div className="flex items-center gap-1.5 border-b border-line/15 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
          </div>
          <video
            ref={videoRef}
            key={current.src}
            src={current.src}
            poster={current.poster}
            muted
            loop
            playsInline
            preload="none"
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : (
        <div
          className={
            "relative mx-auto aspect-[384/832] w-full overflow-hidden rounded-[2rem] border border-line/15 bg-black ring-1 ring-inset ring-accent/20 " +
            "shadow-[0_0_60px_-15px_rgb(var(--accent)/0.5)] " +
            (big ? "max-w-[300px]" : "max-w-[240px]")
          }
        >
          <video
            ref={videoRef}
            key={current.src}
            src={current.src}
            poster={current.poster}
            muted
            loop
            playsInline
            preload="none"
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
