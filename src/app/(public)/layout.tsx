import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { SITE } from "@/lib/site/content";
import "./site.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://horadafestaoficial.com.br"),
  title: {
    default: "Hora da Festa | Buffet móvel em Caucaia e Fortaleza",
    template: "%s | Hora da Festa",
  },
  description:
    "Barraquinhas, estações e refeição completa. A comida é frita, assada e montada na hora do evento, em Caucaia, Fortaleza e região.",
  openGraph: {
    title: "Hora da Festa",
    description: "A cozinha chega na sua festa. Comida feita na hora.",
    images: ["/images/site/hero.jpg"],
    locale: "pt_BR",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://horadafestaoficial.com.br",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: "Hora da Festa Buffet e Eventos",
  description: "Buffet móvel com comida feita na hora do evento",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Caucaia",
    addressRegion: "CE",
    addressCountry: "BR",
  },
  telephone: `+${SITE.whatsapp.replace(/\D/g, "")}`,
  servesCuisine: "Buffet",
  sameAs: [SITE.instagram],
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-theme min-h-screen antialiased">
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
