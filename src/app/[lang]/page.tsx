import { Footer } from "@/components/footer";
import { Boot } from "@/sections/home/boot";
import { BuildHero } from "@/sections/home/build-hero";
import { SelectedWork } from "@/sections/home/selected-work";
import { SELECTED_WORK } from "@/data/work";
import { Capabilities } from "@/sections/home/capabilities";
import { LabTeaser } from "@/sections/home/lab-teaser";
import { BreakTheWebsite } from "@/sections/home/break-the-website";
import { Human } from "@/sections/home/human";
import { BuiltWith } from "@/sections/home/built-with";
import { ContactCta } from "@/sections/home/contact-cta";
import { BRAND, HOME } from "@/data/brand";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";

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
          items={SELECTED_WORK.map((w) => ({
            n: w.n,
            slug: w.slug,
            name: w.name,
            title: w.title[locale],
            kind: t(w.kind).toUpperCase(),
            image: w.image,
            href: withLocale(locale, `/work/${w.slug}`),
          }))}
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
