import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Deliverables } from "@/components/deliverables";
import { FairPrice } from "@/components/fair-price";
import { Why } from "@/components/why";
import { Stats } from "@/components/stats";
import { Projects } from "@/components/projects";
import { Lab } from "@/components/lab";
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
    // Pedido do Rick: a seção Preço Justo tem item próprio no menu
    // ("Orçamento"), lado a lado com o Raio-X, que virou página própria.
    // Href de rota funciona no Nav: o scroll-spy filtra ids inexistentes
    // e o <a> navega normalmente.
    { href: "#preco-justo", label: t(UI.nav.pricing) },
    { href: "/raio-x", label: t(UI.nav.risk) },
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
            por que me contratar → prova (números) → preço justo → projetos →
            como trabalho → stack → dúvidas (FAQ) → MilWeb (discreto) → CTA.
            Raio-X + teste do Google moraram aqui até 07/2026; hoje são a
            página /raio-x, linkada no menu e no banner do Preço Justo. */}
        <Hero locale={locale} />
        <Deliverables locale={locale} />
        <Why locale={locale} />
        <Stats locale={locale} />
        <FairPrice locale={locale} />
        <Projects locale={locale} />
        <Lab locale={locale} />
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
