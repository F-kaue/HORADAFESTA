import { CLIPS } from "@/lib/site/content";
import { SiteVideo } from "./SiteVideo";

export function ClipReel() {
  return (
    <section id="videos" className="site-stripe-dark scroll-mt-24 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="site-kicker !text-[#ff9fc4]">Vídeos</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A estação ligada</h2>
          </div>
          <p className="text-sm leading-relaxed text-white/70 lg:col-span-5 lg:text-base">
            Arrasta para o lado. É a comida saindo na festa — chapa, algodão, churros e mini
            hambúrguer, sem pose.
          </p>
        </div>
      </div>
      <div className="site-rail mt-10 px-5 sm:px-8">
        {CLIPS.map((clip) => (
          <figure key={clip.src} className="w-[78vw] max-w-[280px] shrink-0 sm:max-w-[300px]">
            <div className="site-photo-frame">
              <SiteVideo
                src={clip.src}
                poster={clip.poster}
                label={clip.alt}
                className="aspect-[9/16] w-full bg-[#2a211c] object-cover"
              />
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{clip.caption}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3db8b0]">
                Ao vivo
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
