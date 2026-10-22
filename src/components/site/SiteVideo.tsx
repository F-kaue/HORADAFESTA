"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Card de clipe: poster estático por padrão.
 * O MP4 só entra no DOM depois do toque — um de cada vez, sem autoplay.
 */
export function SiteVideo({
  src,
  poster,
  label,
  className,
  playing,
  onPlayRequest,
  onStop,
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
  playing: boolean;
  onPlayRequest: () => void;
  onStop: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!playing || !el) return;

    let cancelled = false;
    setBuffering(true);

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;

    const onPlaying = () => {
      if (!cancelled) setBuffering(false);
    };
    const onWaiting = () => {
      if (!cancelled) setBuffering(true);
    };
    const onEnded = () => onStop();

    el.addEventListener("playing", onPlaying);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("ended", onEnded);

    const run = el.play();
    if (run && typeof run.catch === "function") {
      run.catch(() => {
        if (!cancelled) {
          setBuffering(false);
          onStop();
        }
      });
    }

    return () => {
      cancelled = true;
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("ended", onEnded);
      el.pause();
    };
  }, [playing, src, onStop]);

  return (
    <button
      type="button"
      onClick={() => (playing ? onStop() : onPlayRequest())}
      className={`relative block w-full overflow-hidden bg-[#2a211c] text-left ${className ?? ""}`}
      aria-label={playing ? `Pausar: ${label}` : `Reproduzir: ${label}`}
    >
      <Image
        src={poster}
        alt={label}
        fill
        sizes="300px"
        className={`object-cover transition-opacity duration-200 ${
          playing && !buffering ? "opacity-0" : "opacity-100"
        }`}
        draggable={false}
      />

      {playing ? (
        <video
          ref={videoRef}
          key={src}
          src={src}
          className={`absolute inset-0 h-full w-full object-cover ${
            buffering ? "opacity-0" : "opacity-100"
          }`}
          muted
          playsInline
          loop
          preload="auto"
          poster={poster}
        />
      ) : null}

      <span
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          playing && !buffering ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ee5f98] text-white shadow-[0_10px_28px_rgba(238,95,152,0.45)] ring-4 ring-white/20">
          {buffering && playing ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current" aria-hidden>
              <path d="M8 5.14v13.72L19 12 8 5.14z" />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}
