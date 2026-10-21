import Image from "next/image";
import { FEEDBACK } from "@/lib/site/content";

export function FeedbackSection() {
  return (
    <section id="feedback" className="scroll-mt-24 bg-[#1c1412] text-white">
      <div className="mx-auto max-w-6xl px-5 pt-16 sm:px-8 sm:pt-24">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-[#ee5f98]">Feedback</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">O que os clientes mandam</h2>
          <p className="mt-3 text-sm text-white/70">
            Prints reais depois da festa. Arrasta para o lado.
          </p>
        </div>
      </div>
      <div className="site-rail mt-8 px-5 pb-16 sm:px-8 sm:pb-24">
        {FEEDBACK.map((item) => (
          <figure key={item.src} className="w-[72vw] max-w-[320px] shrink-0 sm:max-w-[360px]">
            <div className="relative aspect-[9/16] overflow-hidden bg-[#2a211c]">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover object-top"
                sizes="360px"
              />
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
