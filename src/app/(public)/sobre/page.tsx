import Image from "next/image";
import type { Metadata } from "next";
import { AboutSection } from "@/components/site/AboutSection";
import { TeamSection } from "@/components/site/TeamSection";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "O Hora da Festa transforma momentos especiais em memórias com buffet móvel em Caucaia e Fortaleza.",
};

export default function SobrePage() {
  return (
    <>
      <section className="bg-[#1c1412] px-5 pb-16 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-5xl">Sobre a casa</h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">
            Buffet móvel, barraquinhas com charme e uma equipe que chega junto no evento.
          </p>
        </div>
      </section>

      <AboutSection />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f6ece4]">
          <Image
            src="/images/site/stalls-day.jpg"
            alt="Barraquinhas da Hora da Festa no jardim"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div className="space-y-4 text-[17px] leading-relaxed text-[#5c5148]">
          <p>
            Atendemos Caucaia, Fortaleza e a região metropolitana. O deslocamento entra à parte,
            calculado pelo endereço.
          </p>
          <p>
            A estrutura de madeira vai até o salão, a chácara ou a casa. A comida é frita, assada e
            montada ali, na hora.
          </p>
        </div>
      </section>

      <TeamSection />
      <CTASection />
    </>
  );
}
