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
  alt,
  frameClass = "h-60 sm:h-72",
  fit = "scroll",
  loading = "lazy",
}: {
  src: string;
  /**
   * Mantido por compatibilidade com quem chama (projects/case-study passam o
   * host). Não exibimos URL crua na barra — ver decisão na barra abaixo.
   */
  host?: string;
  alt: string;
  frameClass?: string;
  /** "scroll" = screenshot alto rolando em loop; "contain" = imagem estática inteira (ex.: print de celular). */
  fit?: "scroll" | "contain";
  /**
   * Default lazy porque quase todo uso é grade ou esteira DEPOIS do hero: a
   * home carregava os 8 screenshots (430KB) junto com o resto, e o React
   * ainda emitia <link rel=preload> pra cada um, disputando banda com o LCP.
   * `eager` fica para o preview grande do case, que é o candidato a LCP da
   * própria página.
   */
  loading?: "lazy" | "eager";
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
      {/* Barra do "navegador" — só as 3 bolinhas, idêntica à do AppPreview
          (decisão: nada de URL crua *.vercel.app). */}
      <div className="flex items-center gap-1.5 border-b border-line/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-line/20" />
      </div>
      {/* Janela com o screenshot (rolando, ou estático+inteiro quando fit=contain) */}
      <div
        ref={frameRef}
        className={
          "relative overflow-hidden " +
          frameClass +
          (fit === "contain" ? " flex items-center justify-center px-4 py-4" : "")
        }
      >
        {fit === "contain" && (
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent/15 blur-3xl"
          />
        )}
        {fit === "scroll" && (
          // Fundo: a MESMA imagem borrada cobrindo a moldura. Screenshot 16:9
          // mais baixo que a moldura fixa (card estreito no mobile) deixava
          // uma faixa vazia embaixo — branca no tema claro. O blur preenche
          // qualquer proporção sem cortar a imagem principal nem quebrar a
          // rolagem dos screenshots altos.
          //
          // É uma `div` com background, não uma `<img>`: sendo puramente
          // decorativa ela nunca deveria ter entrado na contagem de imagens da
          // página. Como <img aria-hidden alt=""> ela era marcação correta,
          // mas auditorias automáticas contavam o alternativo vazio como falha
          // e o número de imagens dobrava sem necessidade. Em background o
          // navegador reaproveita o mesmo arquivo já baixado.
          <div
            aria-hidden
            className="absolute inset-0 scale-125 opacity-90 blur-xl"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          className={
            fit === "contain"
              ? // Print retrato/de celular: coluna estreita centralizada, enquadrada
                // como um mockup (sem letterbox feio numa moldura wide). Mantém proporção.
                "relative block h-full w-auto max-w-full rounded-xl border border-line/10 object-contain shadow-[0_10px_30px_-12px_rgb(0_0_0/0.55)]"
              : "relative block w-full will-change-transform"
          }
        />
      </div>
    </div>
  );
}
