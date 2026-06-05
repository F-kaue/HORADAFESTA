"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { Notification } from "@/types/database";

interface HeaderProps {
  userName?: string;
}

export function Header({ userName = "Usuária" }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setNotifications(data as Notification[]);
    };
    load();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    setNotifications([]);
    setOpen(false);
  };

  const unread = notifications.length;

  return (
    <header className="sticky top-0 z-30 flex h-[4.25rem] items-center justify-between border-b border-border/80 bg-card/95 px-4 backdrop-blur-md sm:px-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Bem-vinda
        </p>
        <p className="truncate font-display text-lg font-bold text-foreground sm:text-xl">
          {userName}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
          {open && (
            <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] max-h-96 overflow-auto rounded-2xl border border-border bg-card shadow-elevated">
              {notifications.length > 0 && (
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    {unread} não lida{unread !== 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-bold text-primary hover:underline"
                    onClick={clearAll}
                  >
                    Limpar todas
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <p className="p-4 text-sm font-medium text-muted-foreground">
                  Nenhuma notificação
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="w-full border-b border-border/60 p-4 text-left transition-colors hover:bg-muted"
                    onClick={() => markRead(n.id)}
                  >
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
          <LogOut className="h-5 w-5 text-foreground" />
        </Button>
      </div>
    </header>
  );
}
