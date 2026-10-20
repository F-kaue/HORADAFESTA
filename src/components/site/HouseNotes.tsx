import { AREAS } from "@/lib/site/content";

export function HouseNotes() {
  return (
    <section id="atendimento" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">Como se paga</h2>
          <ul className="mt-6 space-y-5 text-[15px] leading-relaxed text-[#5c5148]">
            <li>
              <strong className="text-[#2a211c]">Cartão em até 12x</strong>
              <span className="block">Com o acréscimo da máquina.</span>
            </li>
            <li>
              <strong className="text-[#2a211c]">50% para reservar</strong>
              <span className="block">Os outros 50% até um dia antes do evento.</span>
            </li>
            <li>
              <strong className="text-[#2a211c]">Crediário próprio acima de R$ 2.000</strong>
              <span className="block">
                20% reserva a data. O restante você paga do jeito que for melhor, até 5 dias antes.
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">Onde a gente vai</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5c5148]">
            O deslocamento não está incluso. É cobrado pela quilometragem. Envia o
            endereço no orçamento que a gente calcula.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {AREAS.map((city) => (
              <li key={city} className="rounded-full bg-[#f3ebe3] px-4 py-2 text-sm font-semibold">
                {city}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
