import Image from "next/image";
import { BrandSeal } from "./BrandSeal";
import { ScrollCue } from "./ScrollCue";
import { SiteButton } from "./SiteButton";
import { whatsAppHref } from "@/lib/site/content";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#1c1412] text-white">
      <Image
        src="/images/site/stalls-day.jpg"
        alt="Barraquinhas de madeira da Hora da Festa montadas no jardim, com luminárias"
        fill
        priority
        className="hero-photo object-cover object-[center_40%]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1412] via-[#1c1412]/45 to-[#1c1412]/30" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-5 pb-20 pt-[5.5rem] lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-8 lg:pb-16 lg:pt-28">
        <div className="w-full shrink-0 lg:order-2 lg:w-[42%]">
          <BrandSeal />
        </div>

        <div className="mt-5 w-full max-w-xl text-center lg:order-1 lg:mt-0 lg:text-left">
          <p className="text-sm font-semibold text-white/80">Caucaia, Fortaleza e região</p>
          <h1 className="mt-3 text-[2.2rem] font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            A cozinha chega na sua festa.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
            Barraquinhas com charme, comida feita na hora e uma equipe que cuida de cada detalhe.
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <SiteButton href="/orcamento">Montar meu orçamento</SiteButton>
            <SiteButton href={whatsAppHref()} variant="ghost" external>
              Chamar no WhatsApp
            </SiteButton>
          </div>
        </div>
      </div>

      <ScrollCue />
    </section>
  );
}
