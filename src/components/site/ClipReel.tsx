"use client";

import { useCallback, useEffect, useState } from "react";
import { CLIPS } from "@/lib/site/content";
import { SiteVideo } from "./SiteVideo";

export function ClipReel() {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const stop = useCallback(() => setPlayingIndex(null), []);

  useEffect(() => {
    if (playingIndex === null) return;

    const card = document.querySelector<HTMLElement>(`[data-clip-index="${playingIndex}"]`);
    if (!card) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) stop();
      },
      { threshold: 0.35 }
    );
    io.observe(card);

    const onHide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [playingIndex, stop]);

  return (
    <section id="videos" className="site-stripe-dark scroll-mt-24 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="site-kicker !text-[#ff9fc4]">Vídeos</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A estação ligada</h2>
          </div>
          <p className="text-sm leading-relaxed text-white/70 lg:col-span-5 lg:text-base">
            Arrasta para o lado e toca no play. A comida saindo na festa, do jeito que acontece.
          </p>
        </div>
      </div>

      <div className="site-rail mt-10 px-5 sm:px-8">
        {CLIPS.map((clip, i) => {
          const isPlaying = playingIndex === i;
          return (
            <figure
              key={clip.src}
              data-clip-index={i}
              className="w-[72vw] max-w-[260px] shrink-0 sm:max-w-[280px]"
            >
              <div className="site-photo-frame overflow-hidden">
                <SiteVideo
                  src={clip.src}
                  poster={clip.poster}
                  label={clip.alt}
                  playing={isPlaying}
                  onPlayRequest={() => setPlayingIndex(i)}
                  onStop={stop}
                  className="aspect-[9/16] w-full"
                />
              </div>
              <figcaption className="mt-3 text-sm font-semibold">{clip.caption}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
