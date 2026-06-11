"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, QrCode, Unplug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type WaStatus = "disconnected" | "connecting" | "connected";

export function WhatsAppConnectCard() {
  const [status, setStatus] = useState<WaStatus>("disconnected");
  const [configured, setConfigured] = useState(true);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
    const data = await res.json();
    setConfigured(data.configured !== false);
    if (data.status) setStatus(data.status);
    if (data.connected) {
      setQrBase64(null);
      setPolling(false);
    }
    return data.connected as boolean;
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(async () => {
      const connected = await loadStatus();
      if (connected) {
        toast.success("WhatsApp conectado!");
        setPolling(false);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [polling, loadStatus]);

  const handleConnect = async () => {
    setLoading(true);
    setQrBase64(null);
    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao gerar QR Code");
        return;
      }
      if (data.base64) {
        setQrBase64(data.base64);
        setStatus("connecting");
        setPolling(true);
        toast.message("Escaneie o QR Code com o WhatsApp");
      } else {
        await loadStatus();
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao desconectar");
        return;
      }
      setStatus("disconnected");
      setQrBase64(null);
      setPolling(false);
      toast.success("WhatsApp desconectado");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-600" />
          WhatsApp — Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!configured ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Servidor WhatsApp não configurado
            </p>
            <p className="mt-1 text-amber-800/80 dark:text-amber-200/80">
              O administrador precisa configurar a Evolution API (variáveis{" "}
              <code className="text-xs">EVOLUTION_API_URL</code> e{" "}
              <code className="text-xs">EVOLUTION_API_KEY</code>) no servidor.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  status === "connected"
                    ? "bg-emerald-500"
                    : status === "connecting"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-muted-foreground/50"
                }`}
              />
              <span className="text-sm font-semibold">
                {status === "connected"
                  ? "✅ Conectado — pronto para atender"
                  : status === "connecting"
                    ? "⏳ Aguardando leitura do QR Code..."
                    : "⚠️ Desconectado"}
              </span>
            </div>

            {status === "connected" ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <a href="/conversas">Abrir conversas</a>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-danger"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  <Unplug className="h-4 w-4" />
                  Desconectar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Conecte o WhatsApp do buffet para ver e responder mensagens direto no
                  CRM — como um ZapResponder.
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Clique em &quot;Gerar QR Code&quot;</li>
                  <li>No celular: WhatsApp → Aparelhos conectados → Conectar</li>
                  <li>Escaneie o código abaixo</li>
                </ol>
                <Button
                  className="gap-2"
                  onClick={handleConnect}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  {qrBase64 ? "Atualizar QR Code" : "Gerar QR Code"}
                </Button>
              </div>
            )}

            {qrBase64 && status !== "connected" && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrBase64}
                  alt="QR Code WhatsApp"
                  className="h-56 w-56 rounded-xl bg-white p-2"
                />
                <p className="text-center text-xs font-medium text-muted-foreground">
                  O QR Code expira em ~60s. Se não funcionar, clique em Atualizar.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
