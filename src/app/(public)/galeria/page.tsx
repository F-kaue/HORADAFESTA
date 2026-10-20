import type { Metadata } from "next";
import { ClipReel } from "@/components/site/ClipReel";
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
            Fotos e vídeos dos eventos. A comida saindo na hora, do jeito que acontece.
          </p>
        </div>
      </section>
      <ClipReel />
      <GallerySection />
      <CTASection />
    </>
  );
}
