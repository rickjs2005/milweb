"use client";

import { useEffect, useState } from "react";
import { PROFILE } from "@/lib/content";

const HREF = `https://wa.me/${PROFILE.whatsapp}?text=${encodeURIComponent(
  "Olá Rick! Vim pelo site da MilWeb e quero um orçamento.",
)}`;

/** Logo oficial do WhatsApp (glifo). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.107zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
    </svg>
  );
}

export function WhatsappFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={[
        "group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center",
        "rounded-full bg-[#25D366] text-white",
        "shadow-lg shadow-[#25D366]/30 ring-1 ring-white/15",
        "transition-[opacity,transform] duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "motion-reduce:transition-opacity motion-reduce:hover:scale-100",
        visible
          ? "pointer-events-auto opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-4 motion-reduce:translate-y-0",
      ].join(" ")}
    >
      {/* Subtle pulse ring (rendered behind, not clipped) */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-[#25D366]/40 motion-safe:animate-ping motion-reduce:hidden"
      />

      <WhatsAppIcon className="h-7 w-7 shrink-0" />

      {/* Desktop-only label that reveals on hover */}
      <span
        className={[
          "pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap",
          "rounded-md bg-bg px-3 py-1.5 text-sm font-medium text-fg",
          "border border-line/15 shadow-md",
          "opacity-0 transition-opacity duration-200",
          "sm:block sm:group-hover:opacity-100",
        ].join(" ")}
      >
        WhatsApp
      </span>
    </a>
  );
}
