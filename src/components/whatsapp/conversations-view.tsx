"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppConversation, WhatsAppMessage } from "@/types/database";
import { LEAD_STATUS_CONFIG } from "@/types/database";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return formatDate(iso);
}

function displayName(conv: WhatsAppConversation) {
  return conv.contact_name || conv.leads?.name || conv.phone;
}

export function ConversationsView() {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/whatsapp/conversations", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setConversations(data.conversations ?? []);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(
      `/api/whatsapp/messages?conversation_id=${conversationId}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (res.ok) setMessages(data.messages ?? []);
  }, []);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
    const data = await res.json();
    setWaConnected(Boolean(data.connected));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStatus(), loadConversations()]);
    setLoading(false);
  }, [loadStatus, loadConversations]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);

    const channel = supabase
      .channel(`wa-messages-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as WhatsAppMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, loadMessages, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("wa-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations" },
        () => loadConversations()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      displayName(c).toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.last_message ?? "").toLowerCase().includes(q)
    );
  });

  const handleSend = async () => {
    if (!text.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: selectedId, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar");
        return;
      }
      setText("");
      await loadMessages(selectedId);
      await loadConversations();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4 lg:h-[calc(100dvh-6rem)]">
      <PageHeader
        title="Conversas WhatsApp"
        description="Atenda clientes pelo CRM — mensagens sincronizadas com seu WhatsApp."
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-2 font-semibold"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      {!waConnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          <span className="font-semibold text-amber-900 dark:text-amber-100">
            WhatsApp desconectado.{" "}
          </span>
          <Link href="/configuracoes" className="font-semibold text-primary underline">
            Conecte em Configurações
          </Link>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {/* Lista */}
        <div
          className={cn(
            "flex w-full flex-col border-r border-border lg:w-80 xl:w-96",
            selectedId && "hidden lg:flex"
          )}
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Nenhuma conversa ainda
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    selectedId === conv.id && "bg-primary/5"
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{displayName(conv)}</p>
                      <span className="shrink-0 text-2xs text-muted-foreground">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {conv.last_message || "—"}
                    </p>
                    {conv.leads && (
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-bold text-primary">
                        {LEAD_STATUS_CONFIG[conv.leads.status]?.label ?? "Lead"}
                      </span>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-2xs font-bold text-primary-foreground">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            !selectedId && "hidden lg:flex"
          )}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <MessageCircle className="h-12 w-12 opacity-30" />
              <p className="font-semibold">Selecione uma conversa</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSelectedId(null)}
                >
                  ← Voltar
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{displayName(selected)}</p>
                  <p className="text-xs text-muted-foreground">{selected.phone}</p>
                </div>
                {selected.lead_id && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/leads">Ver lead</Link>
                  </Button>
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4 dark:bg-muted/10">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.from_me ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                        msg.from_me
                          ? "rounded-br-md bg-emerald-600 text-white"
                          : "rounded-bl-md bg-card border border-border"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-2xs",
                          msg.from_me ? "text-emerald-100" : "text-muted-foreground"
                        )}
                      >
                        {formatTime(msg.sent_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2 border-t border-border p-3">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={!waConnected || sending}
                />
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={handleSend}
                  disabled={!waConnected || sending || !text.trim()}
                  aria-label="Enviar"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
