import Image from "next/image";

export function TeamSection() {
  return (
    <section id="equipe" className="site-stripe scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <p className="site-kicker">Equipe</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
              Garçons capacitados e time presente
            </h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-[#5c5148] lg:col-span-7 lg:text-lg">
            <p>
              No buffet completo, a equipe chega junto: garçons, copeiras e quem cuida da estação.
              Atendimento humanizado, uniforme alinhado e serviço que não deixa o convidado
              esperando.
            </p>
            <p>
              Nas barraquinhas e estações, o garçom é contratado à parte. No pacote de refeição
              completa, ele já entra incluso.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-12">
          <div className="site-photo-frame relative aspect-[4/5] md:col-span-7 md:aspect-[16/11]">
            <Image
              src="/images/site/equipe-garcons.jpg"
              alt="Garçons da Hora da Festa servindo bebidas no evento"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 58vw, 100vw"
            />
          </div>
          <div className="site-photo-frame relative aspect-[4/5] md:col-span-5 md:aspect-auto md:min-h-full">
            <Image
              src="/images/site/equipe-time.jpg"
              alt="Equipe completa da Hora da Festa"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
