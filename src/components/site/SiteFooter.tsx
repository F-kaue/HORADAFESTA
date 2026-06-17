import Link from "next/link";
import Image from "next/image";
import { SITE, SERVICES, whatsAppHref } from "@/lib/site/content";
import { SiteButton } from "./SiteButton";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#1A1A2E] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Hora da Festa" width={48} height={48} className="rounded-xl" />
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-lg font-bold">Hora da Festa</p>
              <p className="text-sm text-white/60">Buffet Móvel & Eventos</p>
            </div>
          </div>
          <p className="text-sm text-white/60">CNPJ {SITE.cnpj}</p>
          <div className="flex gap-3">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#E8612C]"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={whatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#E8612C]"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-[#F9C846]">Navegação</p>
          <ul className="space-y-2 text-sm text-white/75">
            {[
              { href: "/", label: "Home" },
              { href: "/sobre", label: "Sobre nós" },
              { href: "/servicos", label: "Serviços" },
              { href: "/galeria", label: "Galeria" },
              { href: "/contato", label: "Contato" },
              { href: "/orcamento", label: "Orçamento" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-[#E8612C]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-[#F9C846]">Serviços</p>
          <ul className="space-y-2 text-sm text-white/75">
            {SERVICES.slice(0, 5).map((s) => (
              <li key={s.title}>{s.title}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-[#F9C846]">Contato</p>
          <ul className="space-y-2 text-sm text-white/75">
            <li>
              <a href={whatsAppHref()} target="_blank" rel="noopener noreferrer" className="hover:text-[#E8612C]">
                WhatsApp
              </a>
            </li>
            <li>{SITE.email}</li>
            <li>📍 {SITE.city}</li>
          </ul>
          <SiteButton href="/orcamento" variant="primary" className="mt-5 !text-sm">
            Solicitar Orçamento
          </SiteButton>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Hora da Festa. Todos os direitos reservados.
      </div>
    </footer>
  );
}
