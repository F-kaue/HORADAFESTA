"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO = "/videos/site/marca.mp4";
const STILL = "/images/site/marca.jpg";

export function BrandSeal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [done, setDone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(motion.matches);
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) {
      finishedRef.current = true;
      setDone(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setDone(true);
    };

    const tryPlay = async () => {
      if (finishedRef.current) return;
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
      } catch {
        finish();
      }
    };

    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);

    const start = window.setTimeout(() => {
      void tryPlay();
    }, 200);

    const unlock = () => {
      if (!finishedRef.current && video.paused) void tryPlay();
    };
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    window.addEventListener("click", unlock, { once: true });

    const safety = window.setTimeout(finish, 10000);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(safety);
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
    };
  }, [reduced]);

  return (
    <div className="relative mx-auto aspect-square w-[min(52vw,210px)] overflow-hidden rounded-full bg-white shadow-[0_18px_42px_rgba(28,20,18,0.28)] ring-1 ring-black/5 sm:w-[240px] lg:w-[400px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STILL}
        alt="Hora da Festa, buffet móvel e eventos"
        className={`absolute inset-0 h-full w-full object-contain p-[5%] transition-opacity duration-500 ${
          done ? "opacity-100" : "opacity-0"
        }`}
      />
      {!reduced && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-contain p-[5%] transition-opacity duration-300 ${
            done ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          src={VIDEO}
          poster={STILL}
          muted
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden={done}
          aria-label="O carrinho chega e forma a marca Hora da Festa"
        />
      )}
    </div>
  );
}
