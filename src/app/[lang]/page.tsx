import { Footer } from "@/components/footer";
import { Boot } from "@/sections/home/boot";
import { BuildHero } from "@/sections/home/build-hero";
import { BRAND, HOME } from "@/data/brand";
import { localeFrom, makeT, type LangParams } from "@/lib/i18n";

/**
 * Home — a experiência em atos (ver docs/rebuild/00-audit.md, §7).
 * Server component: resolve o idioma e entrega strings prontas às ilhas.
 */
export default async function Home({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  return (
    <>
      <Boot mark={BRAND.mark} tagline={t(BRAND.tagline).toUpperCase()} origin={t(BRAND.origin).toUpperCase()} lines={[...HOME.boot.lines]} skip={t(HOME.boot.skip)} />
      <main>
        <BuildHero
          s={{
            headline: HOME.hero.headline,
            support: HOME.hero.support.map(t),
            stages: HOME.hero.stages,
            inspect: t(HOME.hero.inspect),
            scroll: t(HOME.hero.scroll),
            images: [
              { src: "/shots/kavita-drones.webp", alt: "Kavita", n: "01 / KAVITA" },
              { src: "/shots/terral.webp", alt: "Terral", n: "02 / TERRAL" },
              { src: "/shots/atelier-vertex.webp", alt: "Atelier Vertex", n: "03 / VERTEX" },
            ],
          }}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
