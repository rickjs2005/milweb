"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MILO_FAB, MILO_TOUR, PROFILE, type Locale } from "@/lib/content";
import { Milo, type MiloPose } from "./milo";

/** Logo oficial do WhatsApp (glifo). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.107zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
    </svg>
  );
}

/**
 * FAB do WhatsApp estrelado pelo Milo: o mascote flutua no canto com um
 * selo do WhatsApp; no hover (desktop) ele solta um convite em balão.
 * Depois de 2,5s visível, o balão dá um "oi" sozinho uma vez.
 */
export function WhatsappFab({ locale = "pt" }: { locale?: Locale }) {
  const [visible, setVisible] = useState(false);
  const [wave, setWave] = useState(false);
  const [tour, setTour] = useState<{ text: string; pose: MiloPose } | null>(null);
  const [handoff, setHandoff] = useState(false);
  const visibleRef = useRef(false);
  const pathname = usePathname();

  // Passa o bastão: nos viewports em que o Milo protagonista está ativo
  // (desktop lg+ fino, sem reduced-motion), o FAB sai de cena — é o
  // protagonista quem fala, reage e vira o botão do WhatsApp no contato.
  useEffect(() => {
    const ok =
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setHandoff(ok);
  }, []);

  useEffect(() => {
    // setState só quando o limiar é CRUZADO — o listener em si vira um
    // comparativo barato e o React não é acionado a cada pixel de scroll.
    // A visibilidade roda SEMPRE (o botão verde do modo protagonista também
    // usa); a despedida só quando o FAB é o Milo (senão é o protagonista
    // quem se despede).
    let saidGoodbye = false;
    let goodbyeTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const v = window.scrollY > 300;
      if (v !== visibleRef.current) {
        visibleRef.current = v;
        setVisible(v);
      }
      if (
        !handoff &&
        !saidGoodbye &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80
      ) {
        saidGoodbye = true;
        setTour({ text: MILO_FAB.goodbye[locale], pose: "happy" });
        goodbyeTimer = setTimeout(() => setTour(null), 5000);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(goodbyeTimer);
    };
  }, [locale, handoff]);

  // Convite espontâneo: aparece uma vez, alguns segundos após o FAB surgir.
  useEffect(() => {
    if (handoff || !visible) return;
    const show = setTimeout(() => setWave(true), 2500);
    const hide = setTimeout(() => setWave(false), 8000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [visible, handoff]);

  // Reações avulsas: qualquer ilha pode fazer o Milo falar via milo:say
  // (calculadora do Raio-X, vitrine do Lab...). Última fala vence.
  useEffect(() => {
    if (handoff) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onSay = (e: Event) => {
      const d = (e as CustomEvent).detail as { text?: string; pose?: MiloPose; ttl?: number };
      if (!d?.text) return;
      setTour({ text: d.text, pose: d.pose ?? "idle" });
      clearTimeout(timer);
      timer = setTimeout(() => setTour(null), d.ttl ?? 4500);
    };
    window.addEventListener("milo:say", onSay);
    return () => {
      window.removeEventListener("milo:say", onSay);
      clearTimeout(timer);
    };
  }, [handoff]);

  // Tour guiado: o Milo comenta cada seção quando ela cruza o meio da
  // viewport (banda central via rootMargin — funciona mesmo em seções mais
  // altas que a tela, onde um threshold por fração nunca dispararia).
  // Cada fala aparece UMA vez por visita à página; a fala troca a pose.
  useEffect(() => {
    if (handoff) return;
    const targets = MILO_TOUR.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!targets.length) return;
    const shown = new Set<string>();
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          if (shown.has(id)) continue;
          shown.add(id);
          const step = MILO_TOUR.find((t) => t.id === id);
          if (!step) continue;
          setTour({ text: step.text[locale], pose: step.pose ?? "idle" });
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => setTour(null), 4500);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    targets.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      clearTimeout(hideTimer);
      setTour(null);
    };
  }, [pathname, locale, handoff]);

  const href = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(MILO_FAB.message[locale])}`;

  // Modo protagonista (desktop): o Milo anda pelo site, então o FAB vira só
  // o botão verde do WhatsApp — sempre acessível, sem mascote duplicado. No
  // contato o protagonista caminha até aqui e fica ao lado dele.
  if (handoff) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={MILO_FAB.label[locale]}
        className={[
          "fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 ring-2 ring-bg",
          "transition-[opacity,transform] duration-300 ease-out hover:scale-110 active:scale-95",
          visible
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 translate-y-4",
        ].join(" ")}
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={MILO_FAB.label[locale]}
      className={[
        "group fixed bottom-4 right-4 z-40 block",
        "transition-[opacity,transform] duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "motion-reduce:transition-opacity motion-reduce:hover:scale-100",
        visible
          ? "pointer-events-auto opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-4 motion-reduce:translate-y-0",
      ].join(" ")}
    >
      <Milo pose={tour?.pose ?? "idle"} className="w-[74px] drop-shadow-[0_6px_18px_rgb(var(--accent)/0.35)]" />

      {/* selo do WhatsApp sobre o mascote */}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 ring-2 ring-bg">
        <WhatsAppIcon className="h-[18px] w-[18px]" />
      </span>

      {/* balão: fala do tour (por seção) > "oi" espontâneo > hover desktop */}
      <span
        className={[
          "pointer-events-none absolute right-full top-3 mr-3 w-max max-w-[220px] sm:max-w-[300px]",
          "rounded-2xl rounded-br-md border border-line/15 bg-surface-2/95 px-4 py-2.5",
          "text-sm font-medium leading-snug text-fg shadow-lg",
          "transition-all duration-300",
          tour || wave ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
          "sm:group-hover:translate-x-0 sm:group-hover:opacity-100",
        ].join(" ")}
      >
        {tour?.text ?? MILO_FAB.bubble[locale]}
      </span>
    </a>
  );
}
