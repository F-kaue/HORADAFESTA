import type { Metadata } from "next";
import { SITE, whatsAppHref } from "@/lib/site/content";
import { SiteButton } from "@/components/site/SiteButton";

export const metadata: Metadata = {
  title: "Contato",
  description: "WhatsApp, Instagram e formulário de orçamento da Hora da Festa.",
};

export default function ContatoPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-20 pt-32 sm:px-8">
      <h1 className="text-4xl font-bold sm:text-5xl">Falar com a Hora da Festa</h1>
      <p className="mt-4 text-lg text-[#5c5148]">
        O jeito mais direto é o WhatsApp. O formulário já deixa o resumo pronto para enviar.
      </p>
      <div className="mt-10 space-y-4 text-lg">
        <p>
          <a className="font-semibold text-[#ee5f98]" href={whatsAppHref()} target="_blank" rel="noopener noreferrer">
            WhatsApp {SITE.whatsappDisplay}
          </a>
        </p>
        <p>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
            Instagram {SITE.instagramHandle}
          </a>
        </p>
        <p>{SITE.email}</p>
      </div>
      <div className="mt-8">
        <SiteButton href="/orcamento">Abrir o formulário</SiteButton>
      </div>
    </section>
  );
}
