"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CLIPS } from "@/lib/site/content";
import { SiteVideo } from "./SiteVideo";

export function ClipReel() {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number>(0);
  const [active, setActive] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);

  const pickActive = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const railRect = rail.getBoundingClientRect();
    const centerX = railRect.left + railRect.width / 2;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-clip]"));

    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      const dist = Math.abs(mid - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    setActive((prev) => (prev === best ? prev : best));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const section = rail.closest("section");
    const sectionObserver = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting && entry.intersectionRatio >= 0.2),
      { threshold: [0, 0.2, 0.4] }
    );
    if (section) sectionObserver.observe(section);

    const onScroll = () => {
      window.clearTimeout(scrollTimer.current);
      scrollTimer.current = window.setTimeout(pickActive, 80);
    };

    pickActive();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", pickActive, { passive: true });

    return () => {
      sectionObserver.disconnect();
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", pickActive);
      window.clearTimeout(scrollTimer.current);
    };
  }, [pickActive]);

  return (
    <section id="videos" className="site-stripe-dark scroll-mt-24 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="site-kicker !text-[#ff9fc4]">Vídeos</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A estação ligada</h2>
          </div>
          <p className="text-sm leading-relaxed text-white/70 lg:col-span-5 lg:text-base">
            Arrasta para o lado. O clipe do centro toca sozinho; os outros ficam no poster.
          </p>
        </div>
      </div>
      <div ref={railRef} className="site-rail mt-10 px-5 sm:px-8">
        {CLIPS.map((clip, i) => {
          const isActive = sectionInView && i === active;
          return (
            <figure
              key={clip.src}
              data-clip
              className="w-[78vw] max-w-[280px] shrink-0 sm:max-w-[300px]"
            >
              <div className="site-photo-frame">
                <SiteVideo
                  src={clip.src}
                  poster={clip.poster}
                  label={clip.alt}
                  active={isActive}
                  className="aspect-[9/16] w-full"
                />
              </div>
              <figcaption className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{clip.caption}</span>
                {isActive ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3db8b0]">
                    Ao vivo
                  </span>
                ) : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
