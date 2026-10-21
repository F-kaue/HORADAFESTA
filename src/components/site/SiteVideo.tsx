"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vídeo leve do site: só baixa e decodifica quando `active`.
 * Fora de foco fica no poster — evita travar a home com vários MP4 juntos.
 */
export function SiteVideo({
  src,
  poster,
  label,
  className,
  active = false,
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
  active?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!active || reduce) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      setReady(false);
      return;
    }

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    if (el.getAttribute("src") !== src) {
      el.src = src;
      el.load();
    }

    let cancelled = false;

    const tryPlay = () => {
      if (cancelled) return;
      const play = el.play();
      if (play && typeof play.catch === "function") {
        play.catch(() => {});
      }
    };

    const onCanPlay = () => {
      setReady(true);
      tryPlay();
    };

    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("loadeddata", onCanPlay);
    tryPlay();

    return () => {
      cancelled = true;
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("loadeddata", onCanPlay);
      el.pause();
    };
  }, [active, src]);

  return (
    <div className={`relative overflow-hidden bg-[#2a211c] ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          active && ready ? "opacity-0" : "opacity-100"
        }`}
      />
      <video
        ref={ref}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          active && ready ? "opacity-100" : "opacity-0"
        }`}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
      />
    </div>
  );
}
