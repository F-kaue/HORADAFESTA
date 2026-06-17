import type { Metadata } from "next";
import { GallerySection } from "@/components/site/GallerySection";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Fotos de eventos realizados pela Hora da Festa — buffet móvel em Caucaia e região.",
};

export default function GaleriaPage() {
  return (
    <>
      <section className="bg-[#1A1A2E] py-24 pt-32 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold sm:text-5xl">Galeria</h1>
          <p className="mt-4 text-lg text-white/80">Momentos que criamos juntos.</p>
        </div>
      </section>
      <GallerySection />
      <CTASection />
    </>
  );
}
