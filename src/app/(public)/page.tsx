import type { Metadata } from "next";
import { HeroSection } from "@/components/site/HeroSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { FoodRail } from "@/components/site/FoodRail";
import { WhyUsSection } from "@/components/site/WhyUsSection";
import { GallerySection } from "@/components/site/GallerySection";
import { HouseNotes } from "@/components/site/HouseNotes";
import { FAQSection } from "@/components/site/FAQSection";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: { absolute: "Hora da Festa | Buffet móvel em Caucaia e Fortaleza" },
  description:
    "Barraquinhas, estações e refeição completa. A comida é frita, assada e montada na hora do evento, em Caucaia, Fortaleza e região.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <FoodRail />
      <WhyUsSection />
      <GallerySection compact />
      <HouseNotes />
      <FAQSection />
      <CTASection />
    </>
  );
}
