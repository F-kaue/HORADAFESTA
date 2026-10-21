import Image from "next/image";
import { AREAS } from "@/lib/site/content";

const PAYMENTS = [
  {
    title: "Cartão em até 12x",
    text: "Com o acréscimo da máquina.",
  },
  {
    title: "50% para reservar",
    text: "Os outros 50% até um dia antes do evento.",
  },
  {
    title: "Crediário próprio acima de R$ 2.000",
    text: "20% reserva a data. O restante você paga do jeito que for melhor, até 5 dias antes.",
  },
] as const;

export function HouseNotes() {
  return (
    <section id="atendimento" className="site-stripe scroll-mt-24">
      <div className="mx-auto grid max-w-6xl gap-0 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div className="lg:pr-10">
          <p className="site-kicker">Pagamento</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Como se paga</h2>
          <div className="mt-8 space-y-4">
            {PAYMENTS.map((item) => (
              <article key={item.title} className="site-pay-card">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5c5148]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative mt-12 overflow-hidden bg-[#1c1412] text-white lg:mt-0 lg:-mr-8 lg:ml-4 lg:rounded-none">
          <Image
            src="/images/site/stalls-indoor.jpg"
            alt=""
            fill
            className="object-cover opacity-35"
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1412] via-[#1c1412]/75 to-[#1c1412]/45" />
          <div className="relative px-6 py-10 sm:px-8 sm:py-12">
            <p className="site-kicker !text-[#ff9fc4]">Atendimento</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Onde a gente vai</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
              O deslocamento não está incluso. É cobrado pela quilometragem. Envia o endereço no
              orçamento que a gente calcula.
            </p>
            <ul className="mt-8">
              {AREAS.map((city, i) => (
                <li key={city} className="site-city-row border-white/15 text-white">
                  <span className="font-mono text-xs text-[#3db8b0]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl font-bold sm:text-2xl">{city}</span>
                  <span className="text-xs font-semibold tracking-wide text-white/55">CE</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
