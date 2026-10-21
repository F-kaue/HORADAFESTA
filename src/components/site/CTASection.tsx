import { SITE, whatsAppHref } from "@/lib/site/content";
import { SiteButton } from "./SiteButton";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#1c1412] px-5 py-20 text-white sm:px-8 sm:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url(/images/site/stalls-row.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#1c1412]/55" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold sm:text-5xl">Manda a data e o endereço.</h2>
          <p className="mt-4 text-base leading-relaxed text-white/75">
            O formulário já abre o resumo no WhatsApp da casa. Se preferir, chama direto
            no {SITE.whatsappDisplay}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SiteButton href="/orcamento" variant="white">
            Pedir orçamento
          </SiteButton>
          <SiteButton href={whatsAppHref()} variant="ghost" external>
            WhatsApp
          </SiteButton>
        </div>
      </div>
    </section>
  );
}
