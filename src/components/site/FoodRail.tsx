import Image from "next/image";
import { FOOD_PHOTOS } from "@/lib/site/content";

export function FoodRail() {
  return (
    <section className="bg-[#fff7f9] py-14 sm:py-20">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <p className="site-kicker">Apresentação</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Mesas e estações</h2>
          <p className="mt-2 max-w-md text-sm text-[#5c5148]">
            Arrasta para o lado. Apresentação pensada para o convidado parar e provar.
          </p>
        </div>
      </div>
      <div className="site-rail mt-8 px-5 sm:px-8">
        {FOOD_PHOTOS.map((item, i) => (
          <figure
            key={item.src}
            className={`w-56 shrink-0 sm:w-72 ${i % 2 === 1 ? "sm:mt-8" : ""}`}
          >
            <div className="site-photo-frame relative aspect-[3/4]">
              <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="288px" />
            </div>
            <figcaption className="mt-3 text-sm font-semibold">{item.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
