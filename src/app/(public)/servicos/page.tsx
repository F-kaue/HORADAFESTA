import type { Metadata } from "next";
import { ServicesSection } from "@/components/site/ServicesSection";
import { StallsSection } from "@/components/site/StallsSection";
import { BuffetSection } from "@/components/site/BuffetSection";
import { HouseNotes } from "@/components/site/HouseNotes";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Barraquinhas, estações, buffet completo e mesa de doces. Comida feita na hora do evento.",
};

export default function ServicosPage() {
  return (
    <>
      <section className="bg-[#1c1412] px-5 pb-16 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-5xl">Serviços</h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">
            Barraquinha, estação ou refeição completa. O que muda é o cardápio e se o garçom entra no
            pacote.
          </p>
        </div>
      </section>
      <ServicesSection showAllLink={false} />
      <StallsSection />
      <BuffetSection />
      <HouseNotes />
      <CTASection />
    </>
  );
}
