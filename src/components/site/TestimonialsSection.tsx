"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/site/content";
import { AnimatedSection } from "./AnimatedSection";

export function TestimonialsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="bg-[#FFF8F3] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8612C]">Depoimentos</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1A1A2E] sm:text-4xl">
            O que nossos clientes dizem
          </h2>
        </AnimatedSection>

        <div className="relative mt-12">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="min-w-0 shrink-0 grow-0 basis-full px-2 sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="h-full rounded-2xl border border-[#E8612C]/10 bg-white p-6 shadow-[0_8px_32px_rgba(232,97,44,0.08)]">
                    <div className="flex gap-0.5 text-[#F9C846]">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-[#1A1A2E] leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                    <p className="mt-4 font-semibold text-[#1A1A2E]">— {t.name}</p>
                    <p className="text-sm text-[#6B7280]">
                      {t.event} · {t.city}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => emblaApi?.scrollPrev()} className="rounded-full bg-[#E8612C]/10 p-2 text-[#E8612C]" aria-label="Anterior">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`h-2 rounded-full transition-all ${i === selected ? "w-6 bg-[#E8612C]" : "w-2 bg-[#E8612C]/30"}`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Depoimento ${i + 1}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => emblaApi?.scrollNext()} className="rounded-full bg-[#E8612C]/10 p-2 text-[#E8612C]" aria-label="Próximo">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
