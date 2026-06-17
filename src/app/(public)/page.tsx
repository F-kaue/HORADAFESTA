import dynamic from "next/dynamic";
import { HeroSection } from "@/components/site/HeroSection";
import { StatsSection } from "@/components/site/StatsSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { WhyUsSection } from "@/components/site/WhyUsSection";
import { CTASection } from "@/components/site/CTASection";
import { FAQSection } from "@/components/site/FAQSection";

const GallerySection = dynamic(
  () => import("@/components/site/GallerySection").then((m) => m.GallerySection),
  { ssr: true }
);

const TestimonialsSection = dynamic(
  () => import("@/components/site/TestimonialsSection").then((m) => m.TestimonialsSection),
  { ssr: true }
);

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <ServicesSection />
      <GallerySection compact />
      <TestimonialsSection />
      <WhyUsSection />
      <CTASection />
      <FAQSection />
    </>
  );
}
