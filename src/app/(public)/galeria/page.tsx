import type { Metadata } from "next";
import { GallerySection } from "@/components/site/GallerySection";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: "Galeria",
  description: "Fotos reais dos eventos da Hora da Festa: barraquinhas, estações e mesa.",
};

export default function GaleriaPage() {
  return (
    <>
      <section className="bg-[#1c1412] px-5 pb-12 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-5xl">Galeria</h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">
            Barraquinhas, mesas e a equipe no evento. Fotos da casa, sem inventar.
          </p>
        </div>
      </section>
      <GallerySection />
      <CTASection />
    </>
  );
}
