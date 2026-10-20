import Image from "next/image";
import type { Metadata } from "next";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "Sobre",
  description: "A Hora da Festa leva a cozinha até o evento, em Caucaia e Fortaleza.",
};

export default function SobrePage() {
  return (
    <>
      <section className="bg-[#1c1412] px-5 pb-16 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-5xl">Sobre a casa</h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">
            Buffet móvel. A estrutura vai até o evento e a comida é feita ali.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f3ebe3]">
          <Image
            src="/images/site/equipe.jpg"
            alt="Equipe da Hora da Festa na barraquinha"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div className="space-y-4 text-[17px] leading-relaxed text-[#5c5148]">
          <p>
            A Hora da Festa é buffet móvel. A estrutura de madeira vai até o salão, a chácara ou a casa, e a comida é frita, assada e montada ali.
          </p>
          <p>
            Não é bandeja que saiu pronta de uma cozinha distante. A equipe acende a estação no evento e serve quente.
          </p>
          <p>
            Atende Caucaia, Fortaleza e a região. O deslocamento entra à parte, calculado pelo endereço.
          </p>
        </div>
      </section>
      <CTASection />
    </>
  );
}
