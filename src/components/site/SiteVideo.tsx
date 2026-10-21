"use client";

import { useEffect, useRef } from "react";

export function SiteVideo({
  src,
  poster,
  label,
  className,
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const tryPlay = () => {
      const play = el.play();
      if (play && typeof play.catch === "function") {
        play.catch(() => {});
      }
    };

    const onVisible = (visible: boolean) => {
      if (visible) tryPlay();
      else el.pause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => onVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.6] }
    );
    observer.observe(el);

    el.addEventListener("loadeddata", tryPlay);
    el.addEventListener("canplay", tryPlay);

    const unlock = () => tryPlay();
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    window.addEventListener("scroll", unlock, { once: true, passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("loadeddata", tryPlay);
      el.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("scroll", unlock);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-label={label}
    >
      <source src={`${src}#t=0.001`} type="video/mp4" />
    </video>
  );
}
