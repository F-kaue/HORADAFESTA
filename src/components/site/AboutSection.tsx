import Image from "next/image";

export function AboutSection() {
  return (
    <section id="quem-somos" className="site-stripe scroll-mt-24">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-8">
        <div className="grid grid-cols-2 gap-3 lg:col-span-5">
          <div className="site-photo-frame relative col-span-2 aspect-[16/10]">
            <Image
              src="/images/site/stalls-jardim.jpg"
              alt="Barraquinhas da Hora da Festa no jardim"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
          <div className="site-photo-frame relative aspect-[4/5]">
            <Image
              src="/images/site/evento-burgers.jpg"
              alt="Mini hambúrgueres na estação"
              fill
              className="object-cover"
              sizes="20vw"
            />
          </div>
          <div className="site-photo-frame relative aspect-[4/5]">
            <Image
              src="/images/site/equipe-garcons.jpg"
              alt="Garçons da Hora da Festa"
              fill
              className="object-cover"
              sizes="20vw"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center lg:col-span-7 lg:pl-6">
          <p className="site-kicker">Quem somos</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
            Momentos especiais viram memória.
          </h2>
          <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-[#5c5148]">
            <p>
              O Hora da Festa nasceu com um propósito: transformar momentos especiais em memórias
              inesquecíveis.
            </p>
            <p>
              Somos especializados em buffet móvel para eventos, com praticidade, qualidade e um
              atendimento humanizado e personalizado. Levamos sabor e alegria para aniversários,
              casamentos, eventos corporativos, confraternizações e diversas celebrações.
            </p>
            <p>
              Nosso diferencial está no cuidado com cada detalhe: produtos preparados na hora,
              ingredientes selecionados, equipe dedicada e uma estrutura pensada para a melhor
              experiência.
            </p>
            <p className="border-l-4 border-[#ee5f98] bg-white/80 py-3 pl-4 font-semibold text-[#1a1210] shadow-[0_12px_30px_rgba(26,18,16,0.04)]">
              Mais do que servir alimentos, fazemos parte de histórias. Sua comemoração merece o
              nosso melhor.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#1a1210]/10 pt-6">
            <div className="site-stat border-0 pt-0">
              <strong className="text-[#ee5f98]">Buffet</strong>
              <span>Móvel e completo</span>
            </div>
            <div className="site-stat border-0 pt-0">
              <strong className="text-[#3db8b0]">Na hora</strong>
              <span>Feito no evento</span>
            </div>
            <div className="site-stat border-0 pt-0">
              <strong className="text-[#b8895c]">Ceará</strong>
              <span>Caucaia e região</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
