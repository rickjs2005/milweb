"use client";

import { useEffect, useState } from "react";
import { sound } from "./sound";

/**
 * Controle global de som — no header e no menu mobile. Estado real em
 * `aria-pressed` (não só cor), rótulo textual, alvo confortável. O site
 * é silencioso até alguém apertar aqui; a preferência sobrevive ao reload.
 */
export function SoundToggle({ label, on, off, className = "", tabbable = true }: { label: string; on: string; off: string; className?: string; tabbable?: boolean }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(sound.restore());
    const off = sound.subscribe(() => setActive(sound.on));
    return () => {
      off();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setActive(sound.toggle())}
      aria-pressed={active}
      // Texto visível (SOM ON/OFF) é o nome acessível; a descrição longa vai no title
      // (axe: label-content-name-mismatch).
      title={label}
      tabIndex={tabbable ? 0 : -1}
      data-no-inspect
      className={"link-rule t-mono inline-flex min-h-[44px] items-center gap-2 px-1 uppercase " + className}
    >
      <span aria-hidden="true" className={"inline-block h-1.5 w-1.5 " + (active ? "bg-signal" : "bg-current opacity-40")} />
      {active ? on : off}
    </button>
  );
}
