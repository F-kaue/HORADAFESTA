import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/site/content";
import { AnimatedSection } from "./AnimatedSection";

export function ServicesSection({ showAllLink = true }: { showAllLink?: boolean }) {
  return (
    <section id="servicos" className="bg-[#FFF8F3] py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8612C]">O que fazemos</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1A1A2E] sm:text-4xl">
            Nossos serviços
          </h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            Buffet móvel com estrutura completa — levamos a festa até você em Caucaia e região.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <AnimatedSection key={service.title} delay={i * 0.1}>
              <div className="group h-full rounded-2xl border border-[#E8612C]/10 bg-white p-6 shadow-[0_8px_32px_rgba(232,97,44,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(232,97,44,0.15)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8612C]/10 text-[#E8612C]">
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-bold text-[#1A1A2E]">
                  {service.title}
                </h3>
                <p className="mt-2 text-[#6B7280] leading-relaxed">{service.description}</p>
                {showAllLink && (
                  <Link
                    href="/servicos"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#E8612C] group-hover:gap-2 transition-all"
                  >
                    Saiba mais <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
