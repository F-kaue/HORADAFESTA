"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO = "/videos/site/marca.mp4";
const STILL = "/images/site/marca.jpg";

export function BrandSeal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(motion.matches);
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced || failed) return;
    const video = videoRef.current;
    if (!video) return;

    const holdLastFrame = () => {
      if (!Number.isFinite(video.duration)) return;
      video.currentTime = Math.max(0, video.duration - 0.04);
    };

    video.addEventListener("ended", holdLastFrame);

    const start = window.setTimeout(() => {
      video.play().catch(() => setFailed(true));
    }, 550);

    return () => {
      window.clearTimeout(start);
      video.removeEventListener("ended", holdLastFrame);
    };
  }, [reduced, failed]);

  return (
    <div className="aspect-square overflow-hidden rounded-full bg-white p-[7%] shadow-[0_22px_50px_rgba(28,20,18,0.34)] ring-1 ring-black/5">
      {reduced || failed ? (
        <img src={STILL} alt="Hora da Festa, buffet móvel e eventos" className="h-full w-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={VIDEO}
          muted
          playsInline
          preload="auto"
          aria-label="O carrinho chega e forma a marca Hora da Festa"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
