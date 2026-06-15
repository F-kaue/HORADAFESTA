"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
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
    <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all min-h-[44px]",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-warm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
