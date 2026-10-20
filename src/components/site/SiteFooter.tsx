import Link from "next/link";
import Image from "next/image";
import { SITE, whatsAppHref } from "@/lib/site/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1c1412]/10 bg-[#fffaf6] pb-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl" />
            <div>
              <p className="font-bold">Hora da Festa</p>
              <p className="text-sm text-[#5c5148]">Buffet móvel e eventos</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#5c5148]">CNPJ {SITE.cnpj}</p>
          <p className="text-sm text-[#5c5148]">{SITE.email}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Falar com a casa</p>
          <a href={whatsAppHref()} className="mt-3 block font-semibold text-[#ee5f98]" target="_blank" rel="noopener noreferrer">
            WhatsApp {SITE.whatsappDisplay}
          </a>
          <a href={SITE.instagram} className="mt-2 block" target="_blank" rel="noopener noreferrer">
            Instagram {SITE.instagramHandle}
          </a>
          <Link href="/orcamento" className="mt-2 block">
            Formulário de orçamento
          </Link>
        </div>
        <div className="text-sm text-[#5c5148]">
          <p className="font-semibold text-[#2a211c]">Atendimento</p>
          <p className="mt-3">Caucaia, Fortaleza e região metropolitana.</p>
          <p className="mt-2">Deslocamento cobrado pela quilometragem, com o endereço em mãos.</p>
        </div>
      </div>
    </footer>
  );
}
