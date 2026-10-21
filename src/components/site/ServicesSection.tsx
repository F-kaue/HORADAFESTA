import Image from "next/image";
import Link from "next/link";
import { SERVICES } from "@/lib/site/content";

export function ServicesSection({ showAllLink = true }: { showAllLink?: boolean }) {
  return (
    <section id="servicos" className="scroll-mt-24 bg-[#fff7f9]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="site-kicker">Serviços</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">O que a gente leva</h2>
            <p className="mt-3 text-base leading-relaxed text-[#5c5148]">
              Estação, refeição ou mesa de doces. O cardápio fecha no orçamento, pelo número de
              convidados.
            </p>
          </div>
          {showAllLink && (
            <Link
              href="/servicos"
              className="shrink-0 text-sm font-semibold text-[#ee5f98] underline-offset-4 hover:underline"
            >
              Ver o detalhe de cada pacote
            </Link>
          )}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SERVICES.map((service) => (
            <article key={service.title} className="flex h-full flex-col bg-white shadow-[0_18px_40px_rgba(26,18,16,0.06)]">
              <div className="site-photo-frame relative aspect-[4/5]">
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 30vw, 100vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="text-2xl font-bold">{service.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5c5148]">{service.lead}</p>
                <ul className="mt-4 space-y-2 border-t border-[#1a1210]/8 pt-4 text-sm">
                  {service.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3db8b0]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-5 text-sm font-semibold text-[#d44d84]">{service.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
