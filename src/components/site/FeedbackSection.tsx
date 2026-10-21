import { FEEDBACK } from "@/lib/site/content";

export function FeedbackSection() {
  return (
    <section id="feedback" className="scroll-mt-24 bg-[#1c1412] text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-[#ee5f98]">Feedback</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">O que os clientes mandam</h2>
          <p className="mt-3 text-sm text-white/70">
            Mensagens reais depois da festa. Sem depoimento inventado.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {FEEDBACK.map((item) => (
            <figure key={item.quote} className="border border-white/15 bg-white/5 p-6">
              <blockquote className="text-[15px] leading-relaxed text-white/90">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold text-[#ee5f98]">
                {item.source}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
