"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  formatCurrency,
  formatDate,
  formatCurrencyInput,
  parseCurrencyBRL,
} from "@/lib/utils";
import { roundMoney, splitAmount } from "@/lib/payments";
import {
  derivedEventTimes,
  formatSlotsLabel,
  normalizeSlotSelection,
  type SlotType,
} from "@/lib/slots";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { AvailabilityCalendar } from "@/components/orcamento/availability-calendar";
import { LeadFinancial } from "@/components/leads/lead-financial";
import type { Lead, StatusHistory } from "@/types/database";
import { toast } from "sonner";

interface LeadModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

function defaultFirstDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function LeadModal({ lead, open, onClose, onUpdate }: LeadModalProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [confirmSlots, setConfirmSlots] = useState<SlotType[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [useCustomTimes, setUseCustomTimes] = useState(false);
  const [totalValue, setTotalValue] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [installments, setInstallments] = useState("5");
  const [paymentType, setPaymentType] = useState<"avista" | "parcelado">("parcelado");
  const [downPaymentPaid, setDownPaymentPaid] = useState(false);
  const [downPaymentPaidDate, setDownPaymentPaidDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [firstDueDate, setFirstDueDate] = useState(defaultFirstDueDate);
  const [internalNotes, setInternalNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!lead?.id) return;
    setTotalValue(
      lead.total_value ? formatCurrencyInput(Number(lead.total_value)) : ""
    );
    setInternalNotes(lead.internal_notes ?? "");
    setEventDate(lead.event_date ?? "");
    const initialSlots =
      lead.slot_types?.length
        ? normalizeSlotSelection(lead.slot_types as SlotType[])
        : lead.slot_type
          ? [lead.slot_type as SlotType]
          : [];
    setConfirmSlots(initialSlots);
    setStartTime(lead.event_start_time ?? "");
    setEndTime(lead.event_end_time ?? "");
    setUseCustomTimes(Boolean(lead.event_start_time || lead.event_end_time));
    fetch(`/api/leads/${lead.id}/history`)
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []))
      .catch(() => setHistory([]));
  }, [
    lead?.id,
    lead?.total_value,
    lead?.internal_notes,
    lead?.slot_type,
    lead?.slot_types,
    lead?.event_date,
    lead?.event_start_time,
    lead?.event_end_time,
  ]);

  const suggestedTimes = useMemo(() => {
    if (confirmSlots.length === 0) return null;
    return derivedEventTimes(
      confirmSlots,
      useCustomTimes ? startTime : undefined,
      useCustomTimes ? endTime : undefined
    );
  }, [confirmSlots, useCustomTimes, startTime, endTime]);

  const total = parseCurrencyBRL(totalValue);
  const entrada = parseCurrencyBRL(downPayment);
  const remainingPlan = roundMoney(Math.max(0, total - entrada));

  const preview = useMemo(() => {
    if (total <= 0) return null;
    const parcelCount =
      paymentType === "avista" ? 1 : Math.max(1, parseInt(installments, 10) || 1);
    const parcelValues =
      remainingPlan > 0 ? splitAmount(remainingPlan, parcelCount) : [];
    return { parcelCount, parcelValues, remaining: remainingPlan, entrada };
  }, [total, entrada, remainingPlan, paymentType, installments]);

  if (!lead) return null;

  const clientWa = buildWhatsAppUrl(
    lead.whatsapp,
    `Olá ${lead.name}! Aqui é da Hora da Festa 🎉`
  );

  const handleConfirm = async () => {
    const amount = parseCurrencyBRL(totalValue);
    const entradaAmount = parseCurrencyBRL(downPayment);
    if (amount <= 0) {
      toast.error("Informe o valor total");
      return;
    }
    if (entradaAmount > amount) {
      toast.error("A entrada não pode ser maior que o total");
      return;
    }
    if (!eventDate) {
      toast.error("Selecione a data do evento");
      return;
    }
    const slots = normalizeSlotSelection(confirmSlots);
    if (slots.length === 0) {
      toast.error("Selecione ao menos um turno disponível");
      return;
    }

    const times = derivedEventTimes(
      slots,
      useCustomTimes ? startTime : undefined,
      useCustomTimes ? endTime : undefined
    );

    setConfirming(true);
    const res = await fetch(`/api/leads/${lead.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_date: eventDate,
        slot_types: slots,
        event_start_time: useCustomTimes ? times.start : undefined,
        event_end_time: useCustomTimes ? times.end : undefined,
        total_value: amount,
        internal_notes: internalNotes || undefined,
        down_payment: entradaAmount,
        installments: parseInt(installments, 10) || 1,
        payment_type: paymentType,
        down_payment_paid: entradaAmount > 0 ? downPaymentPaid : false,
        down_payment_paid_date: downPaymentPaid ? downPaymentPaidDate : undefined,
        first_installment_due_date: firstDueDate,
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
                    `${lead.event_date ? formatDate(lead.event_date) : "—"}${formatSlotsLabel(lead.slot_types as SlotType[] | null, lead.slot_type) ? ` (${formatSlotsLabel(lead.slot_types as SlotType[] | null, lead.slot_type)})` : ""}`,
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
                <div className="space-y-3">
                  <p className="text-success font-medium">✅ Evento já confirmado</p>
                  {lead.total_value != null && (
                    <p className="text-sm font-medium text-foreground">
                      Valor fechado: {formatCurrency(Number(lead.total_value))}
                    </p>
                  )}
                  {(lead.slot_types?.length || lead.slot_type) && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(lead.event_date ?? "")} ·{" "}
                      {formatSlotsLabel(lead.slot_types as SlotType[] | null, lead.slot_type)}
                      {lead.event_start_time && ` · ${lead.event_start_time}`}
                      {lead.event_end_time && ` – ${lead.event_end_time}`}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Pagamentos, entrada e recebimentos estão na aba Financeiro.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Ajuste a data se mudou, escolha os turnos (bloqueados se já
                    houver evento) e defina o pagamento.
                  </p>

                  <div className="space-y-2">
                    <Label>Data e turnos do evento</Label>
                    {lead.event_date && eventDate !== lead.event_date && (
                      <p className="text-xs font-medium text-amber-800 bg-amber-50 rounded-lg px-2 py-1">
                        Data original do lead: {formatDate(lead.event_date)} → nova:{" "}
                        {formatDate(eventDate)}
                      </p>
                    )}
                    <AvailabilityCalendar
                      multiSelect
                      selectedDate={eventDate}
                      onSelectDate={setEventDate}
                      selectedSlots={confirmSlots}
                      onChangeSlots={setConfirmSlots}
                      excludeLeadId={lead.id}
                    />
                  </div>

                  {suggestedTimes && confirmSlots.length > 0 && (
                    <p className="text-sm font-medium text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                      Horário sugerido no calendário:{" "}
                      <span className="text-foreground">
                        {suggestedTimes.start} – {suggestedTimes.end}
                      </span>
                    </p>
                  )}

                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={useCustomTimes}
                      onChange={(e) => setUseCustomTimes(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Ajustar horário manualmente
                  </label>
                  {useCustomTimes && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Início</Label>
                        <Input
                          type="time"
                          value={startTime || suggestedTimes?.start || ""}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Fim</Label>
                        <Input
                          type="time"
                          value={endTime || suggestedTimes?.end || ""}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 rounded-2xl border-2 border-border bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Contrato e pagamento
                    </p>
                    <div>
                      <Label>Valor total fechado *</Label>
                      <CurrencyInput
                        value={totalValue}
                        onValueChange={setTotalValue}
                        placeholder="R$ 5.000,00"
                      />
                    </div>
                    <div>
                      <Label>Entrada (sinal)</Label>
                      <CurrencyInput
                        value={downPayment}
                        onValueChange={setDownPayment}
                        placeholder="R$ 0,00"
                      />
                    </div>
                    {entrada > 0 && (
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={downPaymentPaid}
                          onChange={(e) => setDownPaymentPaid(e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Entrada já recebida
                      </label>
                    )}
                    {downPaymentPaid && entrada > 0 && (
                      <div>
                        <Label>Data da entrada</Label>
                        <Input
                          type="date"
                          value={downPaymentPaidDate}
                          onChange={(e) => setDownPaymentPaidDate(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={paymentType === "avista" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setPaymentType("avista")}
                      >
                        Saldo à vista
                      </Button>
                      <Button
                        type="button"
                        variant={paymentType === "parcelado" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setPaymentType("parcelado")}
                      >
                        Saldo parcelado
                      </Button>
                    </div>
                    {paymentType === "parcelado" && remainingPlan > 0 && (
                      <>
                        <div>
                          <Label>Parcelas do saldo</Label>
                          <Input
                            type="number"
                            min={1}
                            max={24}
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>1ª parcela vence em</Label>
                          <Input
                            type="date"
                            value={firstDueDate}
                            onChange={(e) => setFirstDueDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    {preview && total > 0 && (
                      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-3 text-sm font-medium">
                        <p className="font-bold">Resumo</p>
                        <p>
                          Total {formatCurrency(total)} · Entrada{" "}
                          {formatCurrency(preview.entrada)}
                        </p>
                        <p>
                          Saldo {formatCurrency(preview.remaining)} em{" "}
                          {paymentType === "parcelado"
                            ? `${preview.parcelCount}x de ~${formatCurrency(
                                preview.parcelValues[0] ?? 0
                              )}`
                            : "1 pagamento"}
                        </p>
                        {entrada > 0 && downPaymentPaid && (
                          <p className="text-emerald-700 text-xs mt-1">
                            Entrada será registrada como recebida na confirmação.
                          </p>
                        )}
                      </div>
                    )}
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
                      : "✅ Confirmar evento e criar plano de pagamento"}
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="finance">
              <LeadFinancial key={lead.id} lead={lead} onUpdate={onUpdate} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
