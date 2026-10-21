import Link from "next/link";
import Image from "next/image";
import { AREAS, SITE, whatsAppHref } from "@/lib/site/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1c1412]/10 bg-[#1c1412] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={52} height={52} className="rounded-xl" />
            <div>
              <p className="text-lg font-bold">Hora da Festa</p>
              <p className="text-sm text-white/65">Buffet móvel e eventos</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            Comida feita na hora, barraquinhas com charme e equipe presente em Caucaia, Fortaleza e
            região metropolitana.
          </p>
          <p className="mt-4 text-xs text-white/45">CNPJ {SITE.cnpj}</p>
        </div>

        <div className="text-sm md:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff9fc4]">Falar com a casa</p>
          <a
            href={whatsAppHref()}
            className="mt-4 block text-base font-semibold text-white hover:text-[#ee5f98]"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {SITE.whatsappDisplay}
          </a>
          <a
            href={SITE.instagram}
            className="mt-2 block text-white/75 hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram {SITE.instagramHandle}
          </a>
          <a href={`mailto:${SITE.email}`} className="mt-2 block text-white/75 hover:text-white">
            {SITE.email}
          </a>
          <Link href="/orcamento" className="mt-4 inline-block font-semibold text-[#3db8b0] hover:underline">
            Formulário de orçamento
          </Link>
        </div>

        <div className="text-sm md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff9fc4]">Navegar</p>
          <nav className="mt-4 flex flex-col gap-2 text-white/75">
            <Link href="/#quem-somos" className="hover:text-white">Quem somos</Link>
            <Link href="/#barraquinhas" className="hover:text-white">Barraquinhas</Link>
            <Link href="/servicos" className="hover:text-white">Serviços</Link>
            <Link href="/galeria" className="hover:text-white">Galeria</Link>
            <Link href="/#duvidas" className="hover:text-white">Dúvidas</Link>
          </nav>
        </div>

        <div className="text-sm md:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff9fc4]">Atendimento</p>
          <ul className="mt-4 space-y-2 text-white/75">
            {AREAS.map((city) => (
              <li key={city}>{city}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Deslocamento cobrado pela quilometragem, com o endereço em mãos.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 pb-24">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-white/40 sm:px-8">
          © {new Date().getFullYear()} Hora da Festa. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
