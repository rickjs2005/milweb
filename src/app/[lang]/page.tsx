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
import { BRAND } from "@/data/brand";
import { getDict } from "@/i18n";
import { HeroVisual, HeroVisualDirector } from "@/features/hero-visual/HeroVisual";
import { getHeroVisualVariant } from "@/features/hero-visual/useHeroVisualVariant";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";

const WORLD_DETAIL: Record<string, string> = { terral: "/shots/terral/casa-do-torrador.webp" };
const WORLD_KEY: Record<string, "kavita" | "terral" | "vertex" | "aurex"> = { "kavita-drones": "kavita", terral: "terral", "atelier-vertex": "vertex", "aurex-timepieces": "aurex" };
const REACT: ("depth" | "structure" | "perspective" | "type" | "grid")[] = ["depth", "structure", "perspective", "type", "grid"];

/**
 * Home — a experiência em atos (ver docs/rebuild/00-audit.md, §7).
 * Server component: resolve o idioma, lê o dicionário tipado e entrega
 * strings prontas às ilhas client (o conteúdo fica fora do bundle).
 */
export default async function Home({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const d = getDict(locale);
  return (
    <>
      <Boot mark={BRAND.mark} tagline={d.boot.tagline} origin={d.boot.origin} lines={d.boot.lines} skip={d.boot.skip} compile={d.boot.compile} />
      <HeroVisual />
      <HeroVisualDirector />
      <main>
        <BuildHero
          act={d.acts.build}
          visual={getHeroVisualVariant()}
          s={{
            headline: d.hero.headline,
            support: [...d.hero.support],
            stages: d.hero.stages,
            inspect: d.hero.inspect,
            scroll: d.hero.scroll,
            sub: d.hero.sub,
            cta: d.hero.cta,
          }}
          workHref={withLocale(locale, "/#work")}
        />
        <SelectedWork
          act={d.acts.work}
          eyebrow={d.work.eyebrow}
          enter={d.work.enter}
          all={d.work.all}
          clientWork={d.work.clientWork}
          allHref={withLocale(locale, "/work")}
          items={SELECTED.map((p, i) => {
            const w = SELECTED_WORK.find((x) => x.slug === p.slug)!;
            return {
              n: String(i + 1).padStart(2, "0"),
              slug: p.slug,
              name: w.name,
              title: w.title[locale],
              displayType: d.displayType[p.displayType],
              client: p.clientWork ? p.clientName ?? null : null,
              year: p.year ?? null,
              image: w.image,
              detail: WORLD_DETAIL[p.slug] ?? w.image,
              href: withLocale(locale, `/work/${p.slug}`),
              labels: [...d.work.labels[WORLD_KEY[p.slug]]],
            };
          })}
        />
        <Capabilities act={d.acts.capabilities} eyebrow={d.capabilities.eyebrow} items={d.capabilities.items.map((label, i) => ({ n: String(i + 1).padStart(2, "0"), label, react: REACT[i], reactLabel: d.capabilities.react[REACT[i]] }))} />
        <LabTeaser act={d.acts.lab} eyebrow={d.lab.eyebrow} tech={d.lab.tech} title={d.lab.title} body={t(BRAND.labBody)} enter={d.lab.enter} href={withLocale(locale, "/lab")} poster="/lab/blackhole.jpg" />
        <BreakTheWebsite act={d.acts.brk} trigger={d.brk.trigger} headline={d.brk.headline} sub={d.brk.sub} rebuild={d.brk.rebuild} title={d.brk.title} pieces={d.brk.pieces} />
        <Human act={d.acts.human} headline={d.human.headline} tail={d.human.tail} name={BRAND.founder} role={t(BRAND.founderRole).toUpperCase()} location={t(BRAND.location).toUpperCase()} />
        <BuiltWith act={d.acts.builtWith} eyebrow={d.builtWith.eyebrow} big={d.builtWith.big} stack={BRAND.stack} />
        <ContactCta act={d.acts.contact} label={d.contact.label} headline={d.contact.headline} cta={d.contact.cta} ctaWord={d.contact.ctaWord} href={withLocale(locale, "/contact")} email={d.contact.email} whatsapp="WHATSAPP" />
      </main>
      <Footer locale={locale} />
    </>
  );
}
