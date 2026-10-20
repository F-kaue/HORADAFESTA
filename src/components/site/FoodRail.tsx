import Image from "next/image";
import { FOOD } from "@/lib/site/content";

export function FoodRail() {
  return (
    <section className="bg-[#1c1412] py-14 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">O que sai da estação</h2>
        <p className="mt-2 max-w-md text-sm text-white/70">
          Arrasta para o lado. Tudo isso é feito na hora do evento.
        </p>
      </div>
      <div className="site-rail mt-8 px-5 sm:px-8">
        {FOOD.map((item) => (
          <figure key={item.src} className="w-56 shrink-0 sm:w-64">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#2a211c]">
              <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="256px" />
            </div>
            <figcaption className="mt-3 text-sm font-semibold">{item.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
