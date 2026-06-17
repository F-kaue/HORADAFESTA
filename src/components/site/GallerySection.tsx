"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { GALLERY_IMAGES } from "@/lib/site/content";
import { AnimatedSection } from "./AnimatedSection";
import { cn } from "@/lib/utils";

export function GallerySection({ compact = false }: { compact?: boolean }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i !== null ? (i + 1) % GALLERY_IMAGES.length : null));
      if (e.key === "ArrowLeft")
        setLightbox((i) =>
          i !== null ? (i - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length : null
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const images = compact ? GALLERY_IMAGES.slice(0, 3) : GALLERY_IMAGES;

  return (
    <section id="galeria" className="bg-white py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8612C]">Portfólio</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1A1A2E] sm:text-4xl">
            Nosso trabalho fala por nós
          </h2>
        </AnimatedSection>

        {/* Desktop grid */}
        <div className="mt-12 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <AnimatedSection key={`${img.src}-${i}`} delay={(i % 3) * 0.08}>
              <button
                type="button"
                onClick={() => setLightbox(i)}
                className={cn(
                  "group relative w-full overflow-hidden rounded-2xl",
                  i === 0 && !compact && "md:row-span-2 md:aspect-[3/4]",
                  (i === 0 && !compact) ? "aspect-[3/4]" : "aspect-[4/3]"
                )}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A2E]/0 transition-all group-hover:bg-[#1A1A2E]/60">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="mt-2 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {img.title}
                  </span>
                </div>
              </button>
            </AnimatedSection>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="relative mt-10 md:hidden">
          <div ref={emblaRef} className="overflow-hidden rounded-2xl">
            <div className="flex">
              {GALLERY_IMAGES.map((img, i) => (
                <div key={i} className="min-w-0 shrink-0 grow-0 basis-full">
                  <button type="button" onClick={() => setLightbox(i)} className="relative block aspect-[4/3] w-full">
                    <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="100vw" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" onClick={scrollPrev} className="rounded-full bg-[#E8612C]/10 p-2 text-[#E8612C]" aria-label="Anterior">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={scrollNext} className="rounded-full bg-[#E8612C]/10 p-2 text-[#E8612C]" aria-label="Próximo">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A2E]/95 p-4">
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setLightbox(null)}
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white sm:left-4"
            onClick={() => setLightbox((i) => (i !== null ? (i - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length : null))}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative h-[70vh] w-full max-w-4xl">
            <Image
              src={GALLERY_IMAGES[lightbox].src}
              alt={GALLERY_IMAGES[lightbox].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white sm:right-4"
            onClick={() => setLightbox((i) => (i !== null ? (i + 1) % GALLERY_IMAGES.length : null))}
            aria-label="Próximo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <p className="absolute bottom-6 text-center text-white/80">{GALLERY_IMAGES[lightbox].title}</p>
        </div>
      )}
    </section>
  );
}
