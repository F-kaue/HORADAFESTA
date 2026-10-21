import Image from "next/image";
import { SITE, whatsAppHref } from "@/lib/site/content";
import { SiteButton } from "./SiteButton";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#1c1412] text-white">
      <div className="absolute inset-0">
        <Image
          src="/images/site/evento-noite.jpg"
          alt=""
          fill
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1412] via-[#1c1412]/85 to-[#1c1412]/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(61,184,176,0.2),transparent_40%)]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="site-kicker !text-[#ff9fc4]">Orçamento</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
            Manda a data e o endereço.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            O formulário já abre o resumo no WhatsApp da casa. Se preferir, chama direto no{" "}
            {SITE.whatsappDisplay}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
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
