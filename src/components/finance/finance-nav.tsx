"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/financeiro",
    label: "Fluxo de caixa",
    short: "Fluxo",
    icon: TrendingUp,
    match: (p: string) => p === "/financeiro",
  },
  {
    href: "/financeiro/receber",
    label: "Contas a receber",
    short: "Receber",
    icon: ArrowDownCircle,
    match: (p: string) => p.startsWith("/financeiro/receber"),
  },
  {
    href: "/financeiro/pagar",
    label: "Contas a pagar",
    short: "Pagar",
    icon: ArrowUpCircle,
    match: (p: string) => p.startsWith("/financeiro/pagar"),
  },
];

export function FinanceNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Wallet className="h-4 w-4 text-primary" />
        <span>Financeiro</span>
      </div>
      <nav className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all min-h-[48px] sm:justify-start sm:px-4",
                active
                  ? "bg-primary text-primary-foreground shadow-warm ring-2 ring-primary/20"
                  : "border border-border/80 bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">{tab.short}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
