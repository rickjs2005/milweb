import { Footer } from "@/components/footer";
import { HeroShip } from "@/sections/home/hero-ship";
import { localeFrom, type LangParams } from "@/lib/i18n";

/**
 * Home — a experiência em atos (ver docs/rebuild/00-audit.md, §7).
 * Os atos entram um a um; cada um valida visual, console e performance
 * antes do próximo.
 */
export default async function Home({ params }: { params: Promise<LangParams> }) {
  const locale = await localeFrom(params);
  return (
    <>
      <main>
        <HeroShip locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
