import Image from "next/image";
import { Check } from "lucide-react";
import { WHY_US } from "@/lib/site/content";
import { AnimatedSection } from "./AnimatedSection";

export function WhyUsSection() {
  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <AnimatedSection direction="left">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(232,97,44,0.15)]">
            <Image
              src="/images/festa/buffet-1.jpg"
              alt="Equipe Hora da Festa em evento"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </AnimatedSection>

        <div>
          <AnimatedSection>
            <p className="text-sm font-bold uppercase tracking-widest text-[#E8612C]">Por que nos escolher</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1A1A2E] sm:text-4xl">
              Sua festa onde quiser, sem preocupação
            </h2>
            <p className="mt-4 text-lg text-[#6B7280]">
              A Raissa e a equipe levam estrutura completa até você — do orçamento à desmontagem, com carinho e
              profissionalismo.
            </p>
          </AnimatedSection>

          <ul className="mt-8 space-y-4">
            {WHY_US.map((item, i) => (
              <AnimatedSection key={item} delay={i * 0.08} direction="right">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8612C]/15 text-[#E8612C]">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-[#1A1A2E] font-medium">{item}</span>
                </li>
              </AnimatedSection>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
