import type { Metadata } from "next";
import { ServicesSection } from "@/components/site/ServicesSection";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Buffet móvel, barraquinhas, festas infantis, eventos corporativos e celebrações completas em Caucaia e região.",
};

export default function ServicosPage() {
  return (
    <>
      <section className="bg-[#1A1A2E] py-24 pt-32 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold sm:text-5xl">
            Nossos serviços
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Estrutura completa, equipe e sabor — levamos tudo até o local do seu evento.
          </p>
        </div>
      </section>
      <ServicesSection showAllLink={false} />
      <CTASection />
    </>
  );
}
