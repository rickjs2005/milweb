import Image from "next/image";

export type WorldBridge = { image: string; name: string; title: readonly string[]; label: string };

/** Decorative lens; the accessible project link lives in SelectedWork. */
export function HeroWorldBridge({ world }: { world: WorldBridge }) {
  return (
    <div data-world-bridge aria-hidden="true" className="hero-world-bridge pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div data-bridge-image className="absolute inset-0">
        <Image src={world.image} alt="" fill sizes="100vw" loading="lazy" className="object-cover object-[46%_58%]" />
      </div>
      <div className="bridge-shade absolute inset-0" />
      <div className="absolute inset-x-margin bottom-10 text-[#F2F0EA] md:bottom-14">
        <p data-bridge-caption className="t-mono mb-5 flex items-center gap-3"><span className="h-1.5 w-1.5 bg-signal" />01 / {world.name}</p>
        <p data-bridge-caption className="t-display bridge-title">{world.title.map(line => <span key={line} className="block">{line}</span>)}</p>
        <p data-bridge-caption className="t-mono mt-6 flex justify-between border-t border-white/35 pt-4"><span>{world.label}</span><span>↓</span></p>
      </div>
    </div>
  );
}
