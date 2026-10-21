import Image from "next/image";
import { FEEDBACK } from "@/lib/site/content";

export function FeedbackSection() {
  return (
    <section id="feedback" className="site-stripe-dark scroll-mt-24 text-white">
      <div className="mx-auto max-w-6xl px-5 pt-16 sm:px-8 sm:pt-24">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="site-kicker !text-[#ff9fc4]">Feedback</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">O que os clientes mandam</h2>
          </div>
          <p className="text-sm text-white/70 lg:col-span-5">
            Prints reais depois da festa. Arrasta para o lado e lê do jeito que chegou no WhatsApp.
          </p>
        </div>
      </div>
      <div className="site-rail mt-8 px-5 pb-16 sm:px-8 sm:pb-24">
        {FEEDBACK.map((item) => (
          <figure key={item.src} className="w-[72vw] max-w-[320px] shrink-0 sm:max-w-[360px]">
            <div className="site-photo-frame relative aspect-[9/16] bg-white">
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
