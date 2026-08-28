import { Footer } from "@/components/footer";
import { Boot } from "@/sections/home/boot";
import { BuildHero } from "@/sections/home/build-hero";
import { SelectedWork } from "@/sections/home/selected-work";
import { SELECTED_WORK } from "@/data/work";
import { SELECTED } from "@/data/projects";
import { Capabilities } from "@/sections/home/capabilities";
import { LabTeaser } from "@/sections/home/lab-teaser";
import { BreakTheWebsite } from "@/sections/home/break-the-website";
import { Human } from "@/sections/home/human";
import { BuiltWith } from "@/sections/home/built-with";
import { ContactCta } from "@/sections/home/contact-cta";
import { BRAND, HOME } from "@/data/brand";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";

/** Rótulos técnicos reais de cada mundo (todos vêm das narrativas dos cases). */
const WORLD_LABELS: Record<string, string[]> = {
  "kavita-drones": ["T25P · T70P · T100", "26 ITEMS · 05 CATEGORIES", "04 BRANCHES · MG / ES / RJ"],
  terral: ["CASA DO TORRADOR — HOLD 6S", "05 CHAPTERS", "03 BLENDS"],
  "atelier-vertex": ["ESC 1:75 · REV 03", "11,50 M", "GOP 1 — EVERY FRAME A KEYFRAME"],
  "aurex-timepieces": ["CALIBRE AX-01 TOURBILLON", "15 SCENES", "10 PARTS · 05 GEARS"],
};
const WORLD_DETAIL: Record<string, string> = { terral: "/shots/terral/casa-do-torrador.webp" };

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
              { src: "/shots/kavita-drones/hero.webp", alt: "Kavita", n: "01 / KAVITA" },
              { src: "/shots/terral/sol.webp", alt: "Terral", n: "02 / TERRAL" },
              { src: "/shots/atelier-vertex/entregue.webp", alt: "Atelier Vertex", n: "03 / VERTEX" },
            ],
          }}
        />
        <SelectedWork
          eyebrow={t(HOME.work.eyebrow).toUpperCase()}
          enter={t(HOME.work.enter).toUpperCase()}
          all={t(HOME.work.all).toUpperCase()}
          allHref={withLocale(locale, "/work")}
          items={SELECTED.map((p, i) => {
            const w = SELECTED_WORK.find((x) => x.slug === p.slug)!;
            return {
              n: String(i + 1).padStart(2, "0"),
              slug: p.slug,
              name: w.name,
              title: w.title[locale],
              displayType: p.displayType,
              client: p.clientWork ? p.clientName ?? null : null,
              year: p.year ?? null,
              image: w.image,
              detail: WORLD_DETAIL[p.slug] ?? w.image,
              href: withLocale(locale, `/work/${p.slug}`),
              labels: WORLD_LABELS[p.slug] ?? [],
            };
          })}
        />
        <Capabilities eyebrow={t(HOME.capabilities.eyebrow).toUpperCase()} items={HOME.capabilities.items.map((c) => ({ n: c.n, label: t(c.label), react: c.react }))} />
        <LabTeaser eyebrow={HOME.lab.eyebrow} title={HOME.lab.title} body={t(HOME.lab.body)} enter={t(HOME.lab.enter).toUpperCase()} href={withLocale(locale, "/lab")} poster="/lab/blackhole.jpg" />
        <BreakTheWebsite trigger={t(HOME.brk.trigger)} headline={HOME.brk.headline} sub={t(HOME.brk.sub).toUpperCase()} rebuild={t(HOME.brk.rebuild).toUpperCase()} title={locale === "en" ? ["EVERYTHING", "IN ITS PLACE."] : ["TUDO NO", "SEU LUGAR."]} />
        <Human headline={HOME.human.headline} tail={HOME.human.tail} name={BRAND.founder} role={t(BRAND.founderRole).toUpperCase()} location={t(HOME.human.location).toUpperCase()} />
        <BuiltWith eyebrow={t(HOME.builtWith.eyebrow).toUpperCase()} big={HOME.builtWith.big} stack={HOME.builtWith.stack} />
        <ContactCta headline={HOME.contact.headline} cta={t(HOME.contact.cta).toUpperCase()} ctaWord="PROJECT" href={withLocale(locale, "/contact")} email={t(HOME.contact.email).toUpperCase()} whatsapp={HOME.contact.whatsapp.toUpperCase()} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
