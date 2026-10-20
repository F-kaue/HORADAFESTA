import Image from "next/image";
import { BrandSeal } from "./BrandSeal";
import { SiteButton } from "./SiteButton";
import { whatsAppHref } from "@/lib/site/content";

const FACTS = [
  "Frito, assado e montado na hora",
  "Bowls, molho, palito e guardanapo inclusos",
  "Garçom só na refeição completa",
  "Deslocamento cobrado por km",
];

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#1c1412] text-white">
      <Image
        src="/images/site/hero.jpg"
        alt="Três barraquinhas de madeira da Hora da Festa montadas num salão, com a equipe e as lâmpadas acesas"
        fill
        priority
        className="hero-photo object-cover object-[center_35%]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1412] via-[#1c1412]/30 to-[#1c1412]/25" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-8 pt-20 lg:min-h-[100svh] lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="w-[200px] shrink-0 sm:w-[230px] lg:order-2 lg:w-[420px]">
          <BrandSeal />
        </div>

        <div className="mt-5 w-full max-w-xl lg:order-1 lg:mt-0">
          <p className="text-sm font-semibold text-white/80">Caucaia, Fortaleza e região</p>
          <h1 className="mt-3 text-[2.35rem] font-bold leading-[1.02] sm:text-5xl lg:text-6xl">
            A cozinha chega na sua festa.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
            A barraquinha de madeira entra no salão. A comida sai quente, na sua frente.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-8">
            <SiteButton href="/orcamento">Montar meu orçamento</SiteButton>
            <SiteButton href={whatsAppHref()} variant="ghost" external>
              Chamar no WhatsApp
            </SiteButton>
          </div>
        </div>
      </div>

      <ul className="absolute inset-x-0 bottom-0 hidden gap-6 overflow-x-auto border-t border-white/15 bg-[#1c1412]/80 px-5 py-3 pr-36 backdrop-blur-sm lg:flex">
        {FACTS.map((fact) => (
          <li key={fact} className="shrink-0 text-sm font-medium text-white/90">
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
