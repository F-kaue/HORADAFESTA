import { CLIPS } from "@/lib/site/content";
import { SiteVideo } from "./SiteVideo";

export function ClipReel() {
  return (
    <section className="bg-[#1c1412] py-14 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">A estação ligada</h2>
        <p className="mt-2 max-w-md text-sm text-white/70">
          Arrasta para o lado. É a comida saindo na festa, sem pose.
        </p>
      </div>
      <div className="site-rail mt-8 px-5 sm:px-8">
        {CLIPS.map((clip) => (
          <figure key={clip.src} className="w-[78vw] max-w-[280px] shrink-0 sm:max-w-[320px]">
            <SiteVideo
              src={clip.src}
              poster={clip.poster}
              label={clip.alt}
              className="aspect-[9/16] w-full bg-[#2a211c] object-cover"
            />
            <figcaption className="mt-3 text-sm font-semibold">{clip.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
