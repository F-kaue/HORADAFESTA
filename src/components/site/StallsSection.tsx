import Image from "next/image";
import { STALL_PHOTOS } from "@/lib/site/content";

export function StallsSection() {
  const [hero, ...rest] = STALL_PHOTOS;

  return (
    <section id="barraquinhas" className="scroll-mt-24 bg-[#1c1412] text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#ee5f98]">Barraquinhas</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
            Barraquinhas que encantam e valorizam seu evento
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
            Muito além de servir delícias, nossas barraquinhas levam charme, sofisticação e uma
            experiência diferenciada para a comemoração.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#2a211c] sm:aspect-[16/11] lg:col-span-7">
            <Image
              src={hero.src}
              alt={hero.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
            {rest.map((photo) => (
              <div key={photo.src} className="relative aspect-[16/11] overflow-hidden bg-[#2a211c]">
                <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="40vw" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 max-w-3xl space-y-4 text-[15px] leading-relaxed text-white/75 sm:text-base">
          <p>
            Com apresentação cuidadosamente planejada, produtos preparados na hora e atendimento de
            qualidade, cada estação vira um atrativo para os convidados.
          </p>
          <p>
            Seja em aniversários, casamentos ou eventos corporativos, o Hora da Festa une sabor,
            elegância e praticidade. Porque cada detalhe faz a diferença em um evento inesquecível.
          </p>
        </div>
      </div>
    </section>
  );
}
