import Image from "next/image";
import { SiteButton } from "./SiteButton";

export function BuffetSection() {
  return (
    <section id="buffet" className="scroll-mt-24 bg-[#f6ece4]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e7d9cc] sm:aspect-[5/4]">
          <Image
            src="/images/site/mesa-buffet.jpg"
            alt="Mesa de buffet completo com arroz, carnes e saladas"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#ee5f98]">Buffet completo</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
            Sabor e sofisticação na mesa
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#5c5148]">
            Oferecemos refeições completas, cardápios variados e uma apresentação impecável para
            tornar o evento ainda mais especial.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#5c5148]">
            Com garçons, copeiras e estrutura completa, garantimos praticidade, qualidade e um
            atendimento personalizado. Você celebra, nós cuidamos de cada detalhe.
          </p>
          <ul className="mt-6 space-y-2 text-sm font-semibold text-[#1c1412]">
            <li>Garçom incluso neste pacote</li>
            <li>Comida finalizada no evento</li>
            <li>Bowls, molhos, palitos e guardanapos inclusos</li>
          </ul>
          <div className="mt-8">
            <SiteButton href="/orcamento">Montar meu orçamento</SiteButton>
          </div>
        </div>
      </div>
    </section>
  );
}
