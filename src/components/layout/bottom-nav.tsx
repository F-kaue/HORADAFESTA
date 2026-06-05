"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Wallet, Settings, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes", label: "Config", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-md lg:hidden safe-area-pb">
      <div className="grid grid-cols-5 gap-0.5 px-1 py-1.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-2xs font-semibold transition-colors sm:text-xs",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
