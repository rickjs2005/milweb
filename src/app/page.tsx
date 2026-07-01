import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Deliverables } from "@/components/deliverables";
import { Why } from "@/components/why";
import { Stats } from "@/components/stats";
import { Projects } from "@/components/projects";
import { Process } from "@/components/process";
import { Tech } from "@/components/tech";
import { Faq } from "@/components/faq";
import { About } from "@/components/about";
import { Contact, Footer } from "@/components/contact";
import { UI } from "@/lib/content";
import { getLocale, makeT } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();
  const t = makeT(locale);

  const navLinks = [
    { href: "#deliverables", label: t(UI.nav.deliverables) },
    { href: "#projects", label: t(UI.nav.projects) },
    { href: "#process", label: t(UI.nav.process) },
    { href: "#faq", label: t(UI.nav.faq) },
    { href: "#contact", label: t(UI.nav.contact) },
  ];

  return (
    <>
      <Nav locale={locale} links={navLinks} contactLabel={t(UI.nav.contact)} />
      <main>
        {/* Página de venda freelancer: oferta (Hero) → o que entrego →
            por que me contratar → prova (números) → projetos → como trabalho →
            stack → dúvidas (FAQ) → MilWeb (discreto) → CTA. */}
        <Hero locale={locale} />
        <Deliverables locale={locale} />
        <Why locale={locale} />
        <Stats locale={locale} />
        <Projects locale={locale} />
        <Process locale={locale} />
        <Tech locale={locale} />
        <Faq locale={locale} />
        <About locale={locale} />
        <Contact locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
