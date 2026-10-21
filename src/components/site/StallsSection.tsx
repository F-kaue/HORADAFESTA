import Image from "next/image";
import { STALL_PHOTOS } from "@/lib/site/content";

export function StallsSection() {
  const [hero, second, third, fourth] = STALL_PHOTOS;

  return (
    <section id="barraquinhas" className="site-stripe-dark scroll-mt-24 text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="site-kicker !text-[#ff9fc4]">Barraquinhas</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
              Barraquinhas que encantam e valorizam seu evento
            </h2>
          </div>
          <p className="text-base leading-relaxed text-white/75 lg:col-span-5 lg:text-lg">
            Muito além de servir delícias, nossas barraquinhas levam charme, sofisticação e uma
            experiência diferenciada para a comemoração.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:gap-4 lg:grid-cols-12 lg:grid-rows-2">
          <div className="site-photo-frame relative aspect-[4/5] sm:aspect-[16/11] lg:col-span-7 lg:row-span-2 lg:aspect-auto lg:min-h-[540px]">
            <Image src={hero.src} alt={hero.alt} fill className="object-cover" sizes="58vw" priority={false} />
          </div>
          <div className="site-photo-frame relative aspect-[16/11] lg:col-span-5">
            <Image src={second.src} alt={second.alt} fill className="object-cover" sizes="40vw" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-5">
            <div className="site-photo-frame relative aspect-[4/5]">
              <Image src={third.src} alt={third.alt} fill className="object-cover" sizes="20vw" />
            </div>
            <div className="site-photo-frame relative aspect-[4/5]">
              <Image src={fourth.src} alt={fourth.alt} fill className="object-cover" sizes="20vw" />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 border-t border-white/15 pt-8 md:grid-cols-2">
          <p className="text-[15px] leading-relaxed text-white/75 sm:text-base">
            Com apresentação cuidadosamente planejada, produtos preparados na hora e atendimento de
            qualidade, cada estação vira um atrativo para os convidados.
          </p>
          <p className="text-[15px] leading-relaxed text-white/75 sm:text-base">
            Seja em aniversários, casamentos ou eventos corporativos, o Hora da Festa une sabor,
            elegância e praticidade. Porque cada detalhe faz a diferença em um evento inesquecível.
          </p>
        </div>
      </div>
    </section>
  );
}
