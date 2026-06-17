"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SiteButton } from "./SiteButton";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/servicos", label: "Serviços" },
  { href: "/galeria", label: "Galeria" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const light = scrolled || !isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-[#E8612C]/10 bg-white/95 shadow-[0_4px_24px_rgba(26,26,46,0.08)] backdrop-blur-md"
            : isHome
              ? "bg-transparent"
              : "border-b border-[#E8612C]/10 bg-white/95 shadow-sm"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Hora da Festa"
              width={44}
              height={44}
              className="rounded-xl"
              priority
            />
            <div className="hidden sm:block">
              <p
                className={cn(
                  "font-[family-name:var(--font-playfair)] text-base font-bold leading-tight",
                  light ? "text-[#1A1A2E]" : "text-white"
                )}
              >
                Hora da Festa
              </p>
              <p
                className={cn(
                  "text-2xs font-semibold",
                  light ? "text-[#6B7280]" : "text-white/75"
                )}
              >
                Buffet Móvel & Eventos
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-[#E8612C]",
                  light ? "text-[#1A1A2E]" : "text-white/90"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <SiteButton
              href="/orcamento"
              variant="primary"
              className="hidden !min-h-[40px] !px-5 !py-2 text-sm sm:inline-flex"
            >
              Solicitar Orçamento
            </SiteButton>
            <Link
              href="/login"
              aria-label="Acesso ao sistema"
              className={cn(
                "hidden rounded-lg p-2 transition-colors hover:text-[#E8612C] sm:block",
                light ? "text-[#9CA3AF]" : "text-white/50"
              )}
            >
              <Lock className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className={cn(
                "rounded-xl p-2.5 lg:hidden",
                light ? "text-[#1A1A2E]" : "text-white"
              )}
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-[#1A1A2E]/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-[min(100%,320px)] flex-col bg-[#FFF8F3] shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-[#E8612C]/15 p-4">
                <span className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#1A1A2E]">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-[#1A1A2E]"
                  aria-label="Fechar menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 p-4">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="min-h-[48px] rounded-xl px-4 py-3 text-lg font-semibold text-[#1A1A2E] hover:bg-[#E8612C]/10"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex min-h-[48px] items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#6B7280]"
                >
                  <Lock className="h-4 w-4" />
                  Acesso ao sistema
                </Link>
              </nav>
              <div className="border-t border-[#E8612C]/15 p-4">
                <SiteButton href="/orcamento" className="w-full">
                  Solicitar Orçamento
                </SiteButton>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
