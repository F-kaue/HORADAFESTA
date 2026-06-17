import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { SITE } from "@/lib/site/content";
import "./site.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://horadafestaoficial.com.br"),
  title: {
    default: "Hora da Festa Buffet & Eventos | Caucaia e região",
    template: "%s | Hora da Festa",
  },
  description:
    "Buffet móvel com estrutura completa em Caucaia e região. Mais de 500 festas realizadas. Solicite seu orçamento grátis!",
  keywords: [
    "buffet móvel caucaia",
    "buffet fortaleza",
    "festa infantil caucaia",
    "barraquinhas festa",
    "hora da festa",
  ],
  openGraph: {
    title: "Hora da Festa Buffet & Eventos",
    description: "Sua festa começa aqui. Buffet móvel em Caucaia e região.",
    images: ["/images/festa/hero.jpg"],
    locale: "pt_BR",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://horadafestaoficial.com.br",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: "Hora da Festa Buffet & Eventos",
  description: "Buffet móvel com estrutura completa",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Caucaia",
    addressRegion: "CE",
    addressCountry: "BR",
  },
  telephone: `+${SITE.whatsapp.replace(/\D/g, "")}`,
  servesCuisine: "Buffet",
  priceRange: "$$",
  sameAs: [SITE.instagram],
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`site-theme ${playfair.variable} ${dmSans.variable} font-[family-name:var(--font-dm-sans)] text-[#1A1A2E] antialiased`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
