import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Deliverables } from "@/components/deliverables";
import { DiagnosticBanner } from "@/components/diagnostic-banner";
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
    // Um item só pro funil: /diagnostico reúne Raio-X, Google, cálculo do
    // orçamento, o que está incluso e CTA (raciocínio do designer: dois
    // caminhos no menu eram o mesmo funil partido em dois). Href de rota
    // funciona no Nav: o scroll-spy filtra ids inexistentes.
    { href: "/diagnostico", label: t(UI.nav.diagnosis) },
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
        <Projects locale={locale} />
        {/* Card-ponte pro /diagnostico (opção 3 do designer): depois de ver
            os projetos, o visitante que gostou mas não está pronto pro
            orçamento tem um próximo passo mais leve. */}
        <DiagnosticBanner locale={locale} />
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
