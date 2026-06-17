import { FAQ_ITEMS } from "@/lib/site/content";
import { AnimatedSection } from "./AnimatedSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  return (
    <section className="bg-[#FFF8F3] py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8612C]">Dúvidas</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1A1A2E] sm:text-4xl">
            Perguntas frequentes
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mt-10 rounded-2xl border border-[#E8612C]/10 bg-white px-6 shadow-[0_8px_32px_rgba(232,97,44,0.08)]">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  );
}
