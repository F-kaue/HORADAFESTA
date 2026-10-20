import Image from "next/image";
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
    <section className="relative min-h-[100svh] bg-[#1c1412] text-white">
      <Image
        src="/images/site/hero.jpg"
        alt="Três barraquinhas de madeira da Hora da Festa montadas num salão, com a equipe e as lâmpadas acesas"
        fill
        priority
        className="object-cover object-[center_30%]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1412] via-[#1c1412]/35 to-[#1c1412]/20" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-24 pt-28 sm:px-8">
        <p className="text-sm font-semibold text-white/80">Caucaia, Fortaleza e região</p>
        <h1 className="mt-3 max-w-xl text-[2.6rem] font-bold leading-[1.02] sm:text-6xl">
          A cozinha chega na sua festa.
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
          A barraquinha de madeira entra no salão. A comida sai quente, na sua frente.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <SiteButton href="/orcamento">Montar meu orçamento</SiteButton>
          <SiteButton href={whatsAppHref()} variant="ghost" external>
            Chamar no WhatsApp
          </SiteButton>
        </div>
      </div>

      <ul className="absolute inset-x-0 bottom-0 hidden gap-6 overflow-x-auto border-t border-white/15 bg-[#1c1412]/80 px-5 py-3 pr-36 backdrop-blur-sm sm:flex">
        {FACTS.map((fact) => (
          <li key={fact} className="shrink-0 text-sm font-medium text-white/90">
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
