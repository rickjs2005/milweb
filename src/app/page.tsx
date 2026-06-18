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

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Página de venda freelancer: oferta (Hero) → o que entrego →
            por que me contratar → prova (números) → projetos → como trabalho →
            stack → dúvidas (FAQ) → MilWeb (discreto) → CTA. */}
        <Hero />
        <Deliverables />
        <Why />
        <Stats />
        <Projects />
        <Process />
        <Tech />
        <Faq />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
