import Image from "next/image";
import Link from "next/link";
import { SERVICES } from "@/lib/site/content";

export function ServicesSection({ showAllLink = true }: { showAllLink?: boolean }) {
  const [lead, ...rest] = SERVICES;

  return (
    <section id="servicos" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-xl">
        <h2 className="text-3xl font-bold sm:text-4xl">O que a gente leva</h2>
        <p className="mt-3 text-base leading-relaxed text-[#5c5148]">
          Estação, refeição ou mesa de doces. O cardápio fecha no orçamento, pelo
          número de convidados.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <article className="lg:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#f6ece4] sm:aspect-[5/4]">
            <Image
              src={lead.image}
              alt={lead.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </div>
          <h3 className="mt-4 text-2xl font-bold">{lead.title}</h3>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[#5c5148]">{lead.lead}</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {lead.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-[#9a3d62]">{lead.note}</p>
        </article>

        <div className="grid gap-8 lg:col-span-5">
          {rest.map((service) => (
            <article key={service.title}>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#f6ece4]">
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 36vw, 100vw"
                />
              </div>
              <h3 className="mt-4 text-2xl font-bold">{service.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5c5148]">{service.lead}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {service.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-semibold text-[#9a3d62]">{service.note}</p>
            </article>
          ))}
        </div>
      </div>

      {showAllLink && (
        <Link href="/servicos" className="mt-10 inline-block text-sm font-semibold text-[#ee5f98] underline-offset-4 hover:underline">
          Ver o detalhe de cada pacote
        </Link>
      )}
    </section>
  );
}
