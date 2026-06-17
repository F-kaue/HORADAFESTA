import { SiteButton } from "./SiteButton";
import { whatsAppHref } from "@/lib/site/content";
import { AnimatedSection } from "./AnimatedSection";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E8612C] via-[#E8612C] to-[#F9C846]" />
      <div className="absolute inset-0 opacity-20 bg-[url('/images/festa/hero.jpg')] bg-cover bg-center mix-blend-overlay" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <AnimatedSection>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Vamos tornar sua festa inesquecível?
          </h2>
          <p className="mt-4 text-lg text-white/90 sm:text-xl">
            A Raissa e sua equipe estão prontas para criar a celebração dos seus sonhos em Caucaia e região.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SiteButton href="/orcamento" variant="white">
              🎉 Solicitar Orçamento Grátis
            </SiteButton>
            <SiteButton href={whatsAppHref()} variant="outline-white" external>
              📱 Chamar no WhatsApp
            </SiteButton>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
