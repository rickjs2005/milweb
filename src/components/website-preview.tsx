"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

gsap.registerPlugin(useGSAP);

/**
 * Preview de site real dentro de uma "janela de navegador": o screenshot
 * (alto) rola sozinho de cima a baixo em loop, dando a sensação de navegar
 * pela página. Pausa no hover. Respeita prefers-reduced-motion.
 */
export function WebsitePreview({
  src,
  host,
  alt,
  frameClass = "h-60 sm:h-72",
  fit = "scroll",
}: {
  src: string;
  host: string;
  alt: string;
  frameClass?: string;
  /** "scroll" = screenshot alto rolando em loop; "contain" = imagem estática inteira (ex.: print de celular). */
  fit?: "scroll" | "contain";
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      if (fit === "contain") return; // estático: sem rolagem
      const frame = frameRef.current;
      const img = imgRef.current;
      if (!frame || !img) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const start = () => {
        const dist = img.offsetHeight - frame.offsetHeight;
        if (dist <= 8) return;
        tweenRef.current?.kill();
        tweenRef.current = gsap.fromTo(
          img,
          { y: 0 },
          {
            y: -dist,
            duration: 2,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true,
            repeatDelay: 0.5,
          },
        );
      };

      if (img.complete && img.offsetHeight) start();
      else img.addEventListener("load", start, { once: true });
    },
    { scope: frameRef },
  );

  const pause = () => tweenRef.current?.pause();
  const resume = () => tweenRef.current?.resume();

  return (
    <div
      className="overflow-hidden rounded-xl border border-line/10 bg-surface-2/60"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* Barra do "navegador" */}
      <div className="flex items-center gap-1.5 border-b border-line/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="ml-2 truncate rounded-md bg-bg/70 px-2 py-0.5 font-mono text-[11px] text-fg-subtle">
          {host}
        </span>
      </div>
      {/* Janela com o screenshot (rolando, ou estático+inteiro quando fit=contain) */}
      <div ref={frameRef} className={"relative overflow-hidden " + frameClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={
            fit === "contain"
              ? "block h-full w-full object-contain"
              : "block w-full will-change-transform"
          }
        />
      </div>
    </div>
  );
}
