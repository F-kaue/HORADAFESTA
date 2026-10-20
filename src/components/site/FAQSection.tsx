"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/site/content";

export function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="duvidas" className="scroll-mt-24 bg-[#f6ece4] py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">Antes de fechar</h2>
        <p className="mt-3 text-[#5c5148]">
          Pagamento, garçom, deslocamento e o que já vem no pacote.
        </p>
        <div className="mt-8 divide-y divide-[#1c1412]/10 border-y border-[#1c1412]/10">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 py-4 text-left text-base font-semibold"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  {item.q}
                  <span className={`mt-0.5 text-[#ee5f98] ${isOpen ? "rotate-45" : ""}`} aria-hidden>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-4 text-[15px] leading-relaxed text-[#5c5148]">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
