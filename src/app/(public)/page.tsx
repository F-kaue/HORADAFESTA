import type { Metadata } from "next";
import { HeroSection } from "@/components/site/HeroSection";
import { AboutSection } from "@/components/site/AboutSection";
import { StallsSection } from "@/components/site/StallsSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { BuffetSection } from "@/components/site/BuffetSection";
import { FoodRail } from "@/components/site/FoodRail";
import { TeamSection } from "@/components/site/TeamSection";
import { FeedbackSection } from "@/components/site/FeedbackSection";
import { GallerySection } from "@/components/site/GallerySection";
import { HouseNotes } from "@/components/site/HouseNotes";
import { FAQSection } from "@/components/site/FAQSection";
import { CTASection } from "@/components/site/CTASection";

export const metadata: Metadata = {
  title: { absolute: "Hora da Festa | Buffet móvel em Caucaia e Fortaleza" },
  description:
    "Barraquinhas sofisticadas, buffet completo e equipe presente. Comida feita na hora do evento, em Caucaia, Fortaleza e região.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <StallsSection />
      <ServicesSection />
      <BuffetSection />
      <FoodRail />
      <TeamSection />
      <FeedbackSection />
      <GallerySection compact />
      <HouseNotes />
      <FAQSection />
      <CTASection />
    </>
  );
}
