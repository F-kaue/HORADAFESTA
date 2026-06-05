"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrencyInput, parseCurrencyBRL } from "@/lib/utils";
import { SLOT_LABELS, type SlotType } from "@/lib/slots";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { LeadFinancial } from "@/components/leads/lead-financial";
import type { Lead, StatusHistory } from "@/types/database";
import { toast } from "sonner";

interface LeadModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadModal({ lead, open, onClose, onUpdate }: LeadModalProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [confirmSlot, setConfirmSlot] = useState<SlotType>("tarde");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!lead?.id) return;
    setTotalValue(
      lead.total_value ? formatCurrencyInput(Number(lead.total_value)) : ""
    );
    setInternalNotes(lead.internal_notes ?? "");
    fetch(`/api/leads/${lead.id}/history`)
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []))
      .catch(() => setHistory([]));
  }, [lead?.id, lead?.total_value, lead?.internal_notes]);

  if (!lead) return null;

  const clientWa = buildWhatsAppUrl(
    lead.whatsapp,
    `Olá ${lead.name}! Aqui é da Hora da Festa 🎉`
  );

  const handleConfirm = async () => {
    const amount = parseCurrencyBRL(totalValue);
    if (amount <= 0) {
      toast.error("Informe o valor total");
      return;
    }
    setConfirming(true);
    const res = await fetch(`/api/leads/${lead.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_type: confirmSlot,
        event_start_time: startTime || undefined,
        event_end_time: endTime || undefined,
        total_value: amount,
        internal_notes: internalNotes || undefined,
      }),
    });
    const data = await res.json();
    setConfirming(false);
    if (!res.ok) {
      toast.error(data.error || "Erro ao confirmar");
      return;
    }
    toast.success(data.message);
    onUpdate();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent side="right" className="overflow-y-auto">
        <div className="p-5 pt-14 pb-8 sm:p-6 sm:pt-14">
          <h2 className="font-display text-2xl font-bold text-foreground">{lead.name}</h2>
          <p className="text-sm font-medium text-muted-foreground">
            Chegou em {formatDate(lead.arrived_at.slice(0, 10))}
          </p>

          <Tabs defaultValue="info" className="mt-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="confirm">Confirmação</TabsTrigger>
              <TabsTrigger value="finance">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <dl className="space-y-4 text-sm">
                {[
                  ["WhatsApp", lead.whatsapp],
                  [
                    "Data",
                    `${lead.event_date ? formatDate(lead.event_date) : "—"}${lead.slot_type ? ` (${SLOT_LABELS[lead.slot_type as SlotType]})` : ""}`,
                  ],
                  ["Local", `${lead.location} — ${lead.neighborhood}`],
                  ["Convidados", `~${lead.guest_count}`],
                  ["Tipo", lead.event_type],
                  ...(lead.observations
                    ? [["Observações", lead.observations] as [string, string]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              <Button asChild className="w-full">
                <a href={clientWa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
                </a>
              </Button>

              {history.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Histórico de status</p>
                  <ul className="space-y-2 border-l-2 border-primary/30 pl-4">
                    {history.map((h) => (
                      <li key={h.id} className="text-xs">
                        <span className="text-muted-foreground">
                          {new Date(h.created_at).toLocaleString("pt-BR")}
                        </span>
                        <br />
                        {h.from_status ?? "—"} → {h.to_status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="confirm" className="space-y-4">
              {lead.status === "confirmado" ? (
                <p className="text-success font-medium">✅ Evento já confirmado</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Defina horário e valor para confirmar o evento.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["manha", "tarde", "noite", "dia_todo"] as SlotType[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setConfirmSlot(s)}
                        className={`rounded-xl border-2 px-3 py-2 text-sm min-h-[44px] ${
                          confirmSlot === s
                            ? "border-primary bg-primary/5"
                            : "border-input"
                        }`}
                      >
                        {SLOT_LABELS[s]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Início (opcional)</Label>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div>
                      <Label>Fim (opcional)</Label>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Valor total fechado</Label>
                    <CurrencyInput
                      value={totalValue}
                      onValueChange={setTotalValue}
                      placeholder="R$ 5.000,00"
                    />
                  </div>
                  <div>
                    <Label>Observações internas</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Notas privadas..."
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming
                      ? "Confirmando..."
                      : "✅ Confirmar e adicionar ao Google Calendar"}
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="finance">
              <LeadFinancial lead={lead} onUpdate={onUpdate} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
