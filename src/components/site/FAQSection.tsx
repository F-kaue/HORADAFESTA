"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/site/content";

export function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="duvidas" className="site-band scroll-mt-24 bg-[#f6ece4] py-16 sm:py-24">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="site-kicker">Dúvidas</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Antes de fechar</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5c5148]">
            Pagamento, garçom, deslocamento e o que já vem no pacote. Se faltar algo, o WhatsApp
            resolve rápido.
          </p>
          <div className="mt-8 hidden gap-6 border-t border-[#1a1210]/12 pt-6 lg:grid">
            <div className="site-stat">
              <strong>12x</strong>
              <span>No cartão, com acréscimo da máquina</span>
            </div>
            <div className="site-stat">
              <strong>50%</strong>
              <span>Para reservar a data do evento</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="divide-y divide-[#1c1412]/10 border border-[#1c1412]/10 bg-white/70 shadow-[0_18px_40px_rgba(26,18,16,0.05)]">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className="px-5 sm:px-6">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 py-5 text-left text-base font-semibold"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{item.q}</span>
                    <span
                      className={`mt-0.5 shrink-0 text-xl leading-none text-[#ee5f98] transition-transform ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <p className="pb-5 text-[15px] leading-relaxed text-[#5c5148]">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
