import Image from "next/image";
import Link from "next/link";
import { GALLERY } from "@/lib/site/content";

export function GallerySection({ compact = false }: { compact?: boolean }) {
  const photos = compact ? GALLERY.slice(0, 10) : GALLERY;

  if (compact) {
    const [hero, ...rest] = photos;
    return (
      <section className="site-band bg-[#fffaf6] py-16 sm:py-24">
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="site-kicker">Galeria</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Fotos dos eventos</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5c5148] sm:text-base">
                Jardim, salão, mesa posta e a estação ligada. Registros reais da casa.
              </p>
            </div>
            <Link
              href="/galeria"
              className="shrink-0 text-sm font-semibold text-[#ee5f98] underline-offset-4 hover:underline"
            >
              Ver galeria completa
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:gap-4 md:grid-cols-12">
            <figure className="site-photo-frame relative aspect-[16/11] md:col-span-7 md:row-span-2 md:aspect-auto md:min-h-[420px]">
              <Image
                src={hero.src}
                alt={hero.alt}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 58vw, 100vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1412]/80 to-transparent px-4 pb-4 pt-12 text-sm font-semibold text-white">
                {hero.caption}
              </figcaption>
            </figure>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:col-span-5 md:grid-cols-2">
              {rest.slice(0, 4).map((photo) => (
                <figure key={photo.src} className="site-photo-frame relative aspect-[4/5]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 20vw, 45vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1412]/75 to-transparent px-2.5 pb-2.5 pt-8 text-xs font-semibold text-white">
                    {photo.caption}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:col-span-12 md:grid-cols-5">
              {rest.slice(4, 9).map((photo) => (
                <figure key={photo.src} className="site-photo-frame relative aspect-[4/5]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 18vw, 45vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1412]/75 to-transparent px-2.5 pb-2.5 pt-8 text-xs font-semibold text-white">
                    {photo.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="site-band mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="relative mb-10 max-w-2xl">
        <p className="site-kicker">Galeria</p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Tudo o que a festa mostra</h2>
        <p className="mt-3 text-base text-[#5c5148]">
          Barraquinhas, buffet, equipe e convidados. Sem stock photo.
        </p>
      </div>
      <div className="site-masonry relative">
        {photos.map((photo) => (
          <figure key={photo.src}>
            <div className="site-photo-frame relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt={photo.alt} className="h-auto w-full" />
            </div>
            <figcaption className="mt-2 text-sm font-medium text-[#5c5148]">{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
