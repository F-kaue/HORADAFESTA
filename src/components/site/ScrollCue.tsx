"use client";

export function ScrollCue() {
  return (
    <button
      type="button"
      onClick={() => {
        const next = document.getElementById("quem-somos");
        next?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="group absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-white/85"
      aria-label="Descer para conhecer a Hora da Festa"
    >
      <span className="text-[11px] font-semibold tracking-[0.18em] uppercase">Descer</span>
      <span className="site-scroll-cue flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
