import { Footer } from "@/components/footer";
import { Boot } from "@/sections/home/boot";
import { BuildHero } from "@/sections/home/build-hero";
import { HeroVisual, HeroVisualDirector } from "@/features/hero-visual/HeroVisual";
import { getHeroVisualVariant } from "@/features/hero-visual/useHeroVisualVariant";
import { ProjectGallery } from "@/sections/home/project-gallery";
import { SELECTED_WORK } from "@/data/work";
import { SELECTED } from "@/data/projects";
import { nodeAttrs, nodeOf, nodeOfProject } from "@/data/milweb-system";
import { Capabilities } from "@/sections/home/capabilities";
import { LabTeaser } from "@/sections/home/lab-teaser";
import { BreakTheWebsite } from "@/sections/home/break-the-website";
import { Human } from "@/sections/home/human";
import { BuiltWith } from "@/sections/home/built-with";
import { ContactCta } from "@/sections/home/contact-cta";
import { BRAND } from "@/data/brand";
import { getDict } from "@/i18n";
import { localeFrom, makeT, withLocale, type LangParams } from "@/lib/i18n";

/** Project imagery supplies the setting behind each real website capture. */
const WORLD_PLATE: Record<string, string> = {
  "kavita-drones": "/shots/kavita-drones/field.webp",
  terral: "/shots/terral/grao.webp",
  "atelier-vertex": "/shots/atelier-vertex/estrutura.webp",
  inkvision: "/shots/inkvision/skin.webp",
  "logistics-demo": "/shots/logistics-demo/port.webp",
};
const REACT: ("depth" | "structure" | "perspective" | "type" | "grid")[] = ["depth", "structure", "perspective", "type", "grid"];

/**
 * Loops curtos dos próprios projetos (scripts/project-motion.sh). Só quem tem material real.
 * DESLIGADO por ora: o crop central 4:5 do master corta o título em cena ("TERRAL" vira
 * "ERRA", o logo do Vertex vira "VE") — o card volta a mostrar só a captura estática, que
 * está correta, até o clip ser reexportado com um recorte que não passe por cima do texto.
 */
const MOTION: Record<string, { webm: string; mp4: string }> = {};

/**
 * Home — a experiência em nós do MilWeb System (ver
 * docs/superpowers/specs/2026-09-12-milweb-system-design.md).
 * Server component: resolve o idioma, lê o dicionário tipado e o registro de
 * nós, e entrega strings e atributos prontos às ilhas client (o conteúdo fica
 * fora do bundle).
 */
export default async function Home({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  const t = makeT(locale);
  const d = getDict(locale);
  const node = (key: string) => nodeAttrs(nodeOf(key), locale);
  return (
    <>
      <Boot mark={BRAND.mark} tagline={d.boot.tagline} origin={d.boot.origin} lines={d.boot.lines} skip={d.boot.skip} compile={d.boot.compile} />
      <HeroVisual />
      <HeroVisualDirector />
      <main>
        <BuildHero
          node={node("system")}
          visual={getHeroVisualVariant()}
          s={{
            headline: d.hero.headline,
            orb: d.hero.orb,
            support: [...d.hero.support],
            stages: d.hero.stages,
            inspect: d.hero.inspect,
            scroll: d.hero.scroll,
            sub: d.hero.sub,
            cta: d.hero.cta,
          }}
          workHref="#work"
        />
        <ProjectGallery
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
              node: nodeAttrs(nodeOfProject(p.slug), locale),
              name: w.name,
              title: w.title[locale],
              displayType: d.displayType[p.displayType],
              client: p.clientWork ? p.clientName ?? null : null,
              year: p.year ?? null,
              image: w.image,
              motion: MOTION[p.slug],
              atmosphere: WORLD_PLATE[p.slug],
              href: withLocale(locale, `/work/${p.slug}`),
            };
          })}
        />
        <Capabilities node={node("capabilities")} eyebrow={d.capabilities.eyebrow} items={d.capabilities.items.map((label, i) => ({ n: String(i + 1).padStart(2, "0"), label, react: REACT[i], reactLabel: d.capabilities.react[REACT[i]] }))} />
        <LabTeaser node={node("lab")} eyebrow={d.lab.eyebrow} tech={d.lab.tech} title={d.lab.title} body={t(BRAND.labBody)} enter={d.lab.enter} href={withLocale(locale, "/lab")} />
        <BreakTheWebsite node={node("break")} trigger={d.brk.trigger} headline={d.brk.headline} sub={d.brk.sub} rebuild={d.brk.rebuild} title={d.brk.title} pieces={d.brk.pieces} />
        <Human node={node("human")} headline={d.human.headline} tail={d.human.tail} name={BRAND.founder} role={t(BRAND.founderRole).toUpperCase()} location={t(BRAND.location).toUpperCase()} />
        <BuiltWith node={node("built-with")} eyebrow={d.builtWith.eyebrow} big={d.builtWith.big} stack={BRAND.stack} />
        <ContactCta node={node("contact")} label={d.contact.label} headline={d.contact.headline} cta={d.contact.cta} ctaWord={d.contact.ctaWord} href={withLocale(locale, "/contact")} email={d.contact.email} whatsapp="WHATSAPP" />
      </main>
      <Footer locale={locale} />
    </>
  );
}
