import Image from "next/image";

export function TeamSection() {
  return (
    <section id="equipe" className="scroll-mt-24 bg-[#fffaf6]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-semibold text-[#ee5f98]">Equipe</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
            Garçons capacitados e time presente
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#5c5148]">
            No buffet completo, a equipe chega junto: garçons, copeiras e quem cuida da estação.
            Atendimento humanizado, uniforme alinhado e serviço que não deixa o convidado esperando.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#5c5148]">
            Nas barraquinhas e estações, o garçom é contratado à parte. No pacote de refeição
            completa, ele já entra incluso.
          </p>
        </div>
        <div className="order-1 grid gap-4 sm:grid-cols-2 lg:order-2">
          <div className="relative aspect-[3/4] overflow-hidden bg-[#f6ece4]">
            <Image
              src="/images/site/equipe-garcons.jpg"
              alt="Garçons da Hora da Festa servindo bebidas no evento"
              fill
              className="object-cover"
              sizes="40vw"
            />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden bg-[#f6ece4] sm:mt-10">
            <Image
              src="/images/site/equipe-time.jpg"
              alt="Equipe completa da Hora da Festa"
              fill
              className="object-cover"
              sizes="40vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
