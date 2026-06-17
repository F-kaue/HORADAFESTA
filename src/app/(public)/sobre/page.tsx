import Image from "next/image";
import type { Metadata } from "next";
import { AnimatedSection } from "@/components/site/AnimatedSection";
import { CTASection } from "@/components/site/CTASection";
import { SiteButton } from "@/components/site/SiteButton";
import { SITE } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "Conheça a Hora da Festa — buffet móvel com estrutura completa em Caucaia e região, liderada pela Raissa Gomes.",
};

export default function SobrePage() {
  return (
    <>
      <section className="bg-[#1A1A2E] py-24 pt-32 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold sm:text-5xl">
            Sobre a Hora da Festa
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Buffet móvel com estrutura completa — sua festa onde quiser, sem preocupação.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <AnimatedSection>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(232,97,44,0.15)]">
              <Image
                src="/images/festa/buffet-2.jpg"
                alt="Raissa Gomes — Hora da Festa"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1A1A2E]">
              Raissa Gomes & equipe
            </h2>
            <div className="mt-6 space-y-4 text-lg text-[#6B7280] leading-relaxed">
              <p>
                A <strong className="text-[#1A1A2E]">Hora da Festa</strong> nasceu do sonho de levar celebrações
                completas até onde nossos clientes estiverem — com sabor, pontualidade e muito carinho.
              </p>
              <p>
                Com mais de 8 anos de experiência e centenas de eventos realizados, somos referência em{" "}
                <strong className="text-[#1A1A2E]">buffet móvel</strong> em {SITE.city}: barraquinhas, buffet
                completo, equipe uniformizada e estrutura que montamos e desmontamos para você.
              </p>
              <p>
                Cada festa é única. Por isso, personalizamos cardápios, horários e serviços conforme o seu evento —
                de aniversários infantis a casamentos e confraternizações corporativas.
              </p>
            </div>
            <SiteButton href="/orcamento" className="mt-8">
              Solicitar orçamento
            </SiteButton>
          </AnimatedSection>
        </div>
      </section>

      <CTASection />
    </>
  );
}
