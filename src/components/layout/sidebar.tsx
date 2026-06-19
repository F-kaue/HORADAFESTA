"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Wallet, Settings, CalendarDays, FileText } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState<string>();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("business_name")
      .single()
      .then(({ data }) => {
        if (!data) return;
        setBusinessName(data.business_name ?? undefined);
      });
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col border-r border-border/80 bg-card lg:flex">
      <div className="flex min-h-[5.5rem] items-center justify-center border-b border-border/80 px-4 py-4">
        <BrandLogo size="sidebar" showText={false} businessName={businessName} />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-warm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
