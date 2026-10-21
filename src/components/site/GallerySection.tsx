import Image from "next/image";
import Link from "next/link";
import { GALLERY } from "@/lib/site/content";

export function GallerySection({ compact = false }: { compact?: boolean }) {
  const photos = compact ? GALLERY.slice(0, 8) : GALLERY;

  if (compact) {
    return (
      <section className="bg-[#fffaf6] py-14 sm:py-20">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-5 sm:px-8">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Fotos dos eventos</h2>
            <p className="mt-2 max-w-md text-sm text-[#5c5148]">Registros da casa no salão e no jardim.</p>
          </div>
          <Link
            href="/galeria"
            className="shrink-0 text-sm font-semibold text-[#ee5f98] underline-offset-4 hover:underline"
          >
            Galeria
          </Link>
        </div>
        <div className="site-rail mt-8 px-5 sm:px-8">
          {photos.map((photo) => (
            <figure key={photo.src} className="w-56 shrink-0 sm:w-72">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#f6ece4]">
                <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="288px" />
              </div>
              <figcaption className="mt-3 text-sm text-[#5c5148]">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo) => (
          <figure key={photo.src} className="mb-4 break-inside-avoid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.alt} className="h-auto w-full bg-[#f6ece4]" />
            <figcaption className="mt-2 text-sm text-[#5c5148]">{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
