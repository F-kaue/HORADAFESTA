"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SiteButton } from "./SiteButton";
import { whatsAppHref } from "@/lib/site/content";

export function HeroSection() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, reduced ? 0 : 80]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#1A1A2E]">
      <motion.div style={{ y }} className="absolute inset-0">
        <Image
          src="/images/festa/hero.jpg"
          alt="Buffet móvel Hora da Festa — estrutura completa para sua festa"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/90 via-[#1A1A2E]/70 to-[#1A1A2E]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/80 via-transparent to-transparent" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#F9C846]">
            🚚 Buffet móvel com estrutura completa
          </p>
          <h1 className="max-w-2xl font-[family-name:var(--font-playfair)] text-[2.625rem] font-bold leading-[1.1] text-white drop-shadow-lg sm:text-5xl lg:text-[4.5rem]">
            Sua festa começa aqui.
          </h1>
        </motion.div>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 max-w-xl text-lg text-white/85 sm:text-xl"
        >
          Sua festa onde quiser, sem preocupação! Buffets, barraquinhas e eventos completos em{" "}
          <strong className="text-white">Caucaia e região</strong>.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <SiteButton href="/orcamento" variant="primary">
            🎉 Solicitar Orçamento Grátis
          </SiteButton>
          <SiteButton href="/servicos" variant="ghost">
            Ver nossos serviços ↓
          </SiteButton>
          <SiteButton href={whatsAppHref()} variant="ghost" external className="sm:hidden">
            📱 WhatsApp
          </SiteButton>
        </motion.div>
      </div>

      <a
        href="#servicos"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 transition-colors hover:text-white"
        aria-label="Rolar para serviços"
      >
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </a>
    </section>
  );
}
