"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

  const unread = notifications.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-xs text-muted-foreground">Bem-vinda,</p>
        <p className="font-display text-lg font-semibold text-secondary">
          {userName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
          {open && (
            <div className="absolute right-0 top-12 w-80 max-h-96 overflow-auto rounded-xl border bg-white shadow-lg">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Nenhuma notificação
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="w-full border-b p-4 text-left text-sm hover:bg-muted transition-colors"
                    onClick={() => markRead(n.id)}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground">{n.message}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
