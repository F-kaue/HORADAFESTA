"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatDate,
  formatCurrencyInput,
  parseCurrencyBRL,
  maskWhatsApp,
  formatWhatsApp,
} from "@/lib/utils";
import { roundMoney, splitAmount } from "@/lib/payments";
import { addHoursToTime, formatTimeRange } from "@/lib/event-time";
import { formatSlotsLabel } from "@/lib/slots";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { AvailabilityCalendar } from "@/components/orcamento/availability-calendar";
import { GuestCountField } from "@/components/orcamento/guest-count-field";
import { LeadFinancial } from "@/components/leads/lead-financial";
import { EVENT_TYPES, type Lead, type StatusHistory } from "@/types/database";
import { toast } from "sonner";

interface LeadModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  initialTab?: "info" | "confirm" | "finance";
}

function defaultFirstDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function LeadModal({
  lead,
  open,
  onClose,
  onUpdate,
  initialTab = "info",
}: LeadModalProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceTypes, setServiceTypes] = useState<
    { id: string; name: string; duration_hours: number }[]
  >([]);
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("");
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
  const [savingInfo, setSavingInfo] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [displayLead, setDisplayLead] = useState<Lead | null>(null);
  const [infoName, setInfoName] = useState("");
  const [infoWhatsapp, setInfoWhatsapp] = useState("");
  const [infoEventDate, setInfoEventDate] = useState("");
  const [infoStartTime, setInfoStartTime] = useState("");
  const [infoEndTime, setInfoEndTime] = useState("");
  const [infoServiceType, setInfoServiceType] = useState("");
  const [infoLocation, setInfoLocation] = useState("");
  const [infoNeighborhood, setInfoNeighborhood] = useState("");
  const [infoGuestCount, setInfoGuestCount] = useState(50);
  const [infoEventType, setInfoEventType] = useState("");
  const [infoObservations, setInfoObservations] = useState("");
  const [infoInternalNotes, setInfoInternalNotes] = useState("");
  const [catalogEventTypes, setCatalogEventTypes] = useState<{ id: string; name: string }[]>([]);
  const endTimeManualRef = useRef(false);
  const infoEndTimeManualRef = useRef(false);

  useEffect(() => {
    if (!lead?.id) return;
    setDisplayLead(lead);
    setActiveTab(initialTab);
    endTimeManualRef.current = false;
    infoEndTimeManualRef.current = !!lead.event_end_time;
    setInfoName(lead.name ?? "");
    setInfoWhatsapp(maskWhatsApp(lead.whatsapp ?? ""));
    setInfoEventDate(lead.event_date ?? "");
    setInfoStartTime(lead.event_start_time?.slice(0, 5) ?? "");
    setInfoEndTime(lead.event_end_time?.slice(0, 5) ?? "");
    setInfoServiceType(lead.service_type ?? "");
    setInfoLocation(lead.location ?? "");
    setInfoNeighborhood(lead.neighborhood ?? "");
    setInfoGuestCount(lead.guest_count ?? 50);
    setInfoEventType(lead.event_type ?? "");
    setInfoObservations(lead.observations ?? "");
    setInfoInternalNotes(lead.internal_notes ?? "");
    setTotalValue(
      lead.total_value ? formatCurrencyInput(Number(lead.total_value)) : ""
    );
    setInternalNotes(lead.internal_notes ?? "");
    setEventDate(lead.event_date ?? "");
    setServiceType(lead.service_type ?? "");
    setStartTime(lead.event_start_time?.slice(0, 5) ?? "13:00");
    const savedEnd = lead.event_end_time?.slice(0, 5) ?? "";
    setEndTime(savedEnd);
    endTimeManualRef.current = !!savedEnd;
    fetch("/api/catalog", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCatalogEventTypes(d.event_types ?? []))
      .catch(() => setCatalogEventTypes([]));
    fetch("/api/service-types")
      .then((r) => r.json())
      .then((d) => setServiceTypes(d.items ?? []))
      .catch(() => setServiceTypes([]));
    fetch(`/api/leads/${lead.id}/history`)
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []))
      .catch(() => setHistory([]));
  }, [
    lead?.id,
    initialTab,
    lead?.name,
    lead?.whatsapp,
    lead?.total_value,
    lead?.internal_notes,
    lead?.event_date,
    lead?.event_start_time,
    lead?.event_end_time,
    lead?.service_type,
    lead?.location,
    lead?.neighborhood,
    lead?.guest_count,
    lead?.event_type,
    lead?.observations,
  ]);

  const eventTypeOptions =
    catalogEventTypes.length > 0
      ? catalogEventTypes.map((e) => e.name)
      : [...EVENT_TYPES];

  const infoSelectedService = useMemo(
    () => serviceTypes.find((s) => s.name === infoServiceType),
    [serviceTypes, infoServiceType]
  );

  useEffect(() => {
    if (!infoSelectedService || !infoStartTime) return;
    if (infoEndTimeManualRef.current) return;
    setInfoEndTime(addHoursToTime(infoStartTime, infoSelectedService.duration_hours));
  }, [infoSelectedService, infoStartTime]);

  const selectedService = useMemo(
    () => serviceTypes.find((s) => s.name === serviceType),
    [serviceTypes, serviceType]
  );

  useEffect(() => {
    if (!selectedService || !startTime) return;
    if (endTimeManualRef.current) return;
    setEndTime(addHoursToTime(startTime, selectedService.duration_hours));
  }, [selectedService, startTime]);

  const handleServiceTypeChange = (value: string) => {
    endTimeManualRef.current = false;
    setServiceType(value);
  };

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

  if (!lead || !displayLead) return null;

  const clientWa = buildWhatsAppUrl(
    displayLead.whatsapp,
    `Olá ${displayLead.name}! Aqui é da Hora da Festa 🎉`
  );

  const handleSaveInfo = async () => {
    if (!infoName.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (formatWhatsApp(infoWhatsapp).length < 10) {
      toast.error("Informe um WhatsApp válido");
      return;
    }
    if (!infoLocation.trim() || !infoNeighborhood.trim()) {
      toast.error("Informe local e bairro");
      return;
    }

    setSavingInfo(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: infoName.trim(),
          whatsapp: formatWhatsApp(infoWhatsapp),
          event_date: infoEventDate || null,
          event_start_time: infoStartTime || null,
          event_end_time: infoEndTime || null,
          service_type: infoServiceType || null,
          location: infoLocation.trim(),
          neighborhood: infoNeighborhood.trim(),
          guest_count: infoGuestCount,
          event_type: infoEventType || null,
          observations: infoObservations.trim() || null,
          internal_notes: infoInternalNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      const {
        googleCalendarSynced,
        googleCalendarCreated,
        googleCalendarError,
        ...updatedLead
      } = data;
      setDisplayLead(updatedLead as Lead);
      toast.success("Informações salvas");

      if (googleCalendarSynced) {
        toast.message(
          googleCalendarCreated
            ? "Evento criado no Google Calendar."
            : "Google Calendar atualizado."
        );
      } else if (googleCalendarError) {
        toast.warning(`Salvo, mas calendário não atualizou: ${googleCalendarError}`);
      }

      onUpdate();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSavingInfo(false);
    }
  };

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
    if (!serviceType) {
      toast.error("Selecione o tipo de serviço");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("Informe o horário de início");
      return;
    }

    setConfirming(true);
    const res = await fetch(`/api/leads/${lead.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_date: eventDate,
        service_type: serviceType,
        event_start_time: startTime,
        event_end_time: endTime,
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
    if (data.googleCalendarError) {
      toast.warning(
        `Evento confirmado, mas o Google Calendar não foi atualizado: ${data.googleCalendarError}`
      );
    } else if (data.googleEventId) {
      toast.message("Evento criado no Google Calendar.");
    }
    onUpdate();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent side="right" className="overflow-y-auto">
        <div className="p-5 pt-14 pb-8 sm:p-6 sm:pt-14">
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            {displayLead.name}
          </DialogTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Chegou em{" "}
            {displayLead.arrived_at
              ? formatDate(String(displayLead.arrived_at).slice(0, 10))
              : "—"}
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="confirm">Confirmação</TabsTrigger>
              <TabsTrigger value="finance">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Edite os dados e salve — o Google Calendar atualiza automaticamente
                para eventos confirmados ou finalizados.
              </p>

              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={infoName} onChange={(e) => setInfoName(e.target.value)} />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={infoWhatsapp}
                    onChange={(e) => setInfoWhatsapp(maskWhatsApp(e.target.value))}
                    placeholder="(85) 99999-9999"
                  />
                </div>
                <div>
                  <Label>Data do evento</Label>
                  <Input
                    type="date"
                    value={infoEventDate}
                    onChange={(e) => setInfoEventDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={infoStartTime}
                      onChange={(e) => setInfoStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={infoEndTime}
                      onChange={(e) => {
                        infoEndTimeManualRef.current = true;
                        setInfoEndTime(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Serviço</Label>
                  <Select
                    value={infoServiceType || undefined}
                    onValueChange={(v) => {
                      infoEndTimeManualRef.current = false;
                      setInfoServiceType(v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Local</Label>
                  <Input
                    value={infoLocation}
                    onChange={(e) => setInfoLocation(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={infoNeighborhood}
                    onChange={(e) => setInfoNeighborhood(e.target.value)}
                  />
                </div>
                <GuestCountField value={infoGuestCount} onChange={setInfoGuestCount} />
                <div>
                  <Label>Tipo de evento</Label>
                  <Select value={infoEventType || undefined} onValueChange={setInfoEventType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={infoObservations}
                    onChange={(e) => setInfoObservations(e.target.value)}
                    rows={4}
                    placeholder="Detalhes do pedido, valores, itens..."
                  />
                </div>
                <div>
                  <Label>Notas internas</Label>
                  <Textarea
                    value={infoInternalNotes}
                    onChange={(e) => setInfoInternalNotes(e.target.value)}
                    rows={3}
                    placeholder="Anotações privadas da equipe..."
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveInfo} disabled={savingInfo}>
                {savingInfo ? "Salvando..." : "Salvar e atualizar calendário"}
              </Button>

              <Button asChild className="w-full" variant="outline">
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
              {displayLead.status === "confirmado" ? (
                <div className="space-y-3">
                  <p className="text-success font-medium">✅ Evento já confirmado</p>
                  {displayLead.total_value != null && (
                    <p className="text-sm font-medium text-foreground">
                      Valor fechado: {formatCurrency(Number(displayLead.total_value))}
                    </p>
                  )}
                  {formatTimeRange(displayLead.event_start_time, displayLead.event_end_time) ||
                  formatSlotsLabel(displayLead.slot_types, displayLead.slot_type) ? (
                    <p className="text-sm text-muted-foreground">
                      {displayLead.event_date ? formatDate(displayLead.event_date) : "—"} ·{" "}
                      {formatTimeRange(displayLead.event_start_time, displayLead.event_end_time) ||
                        formatSlotsLabel(displayLead.slot_types, displayLead.slot_type)}
                      {displayLead.service_type && ` · ${displayLead.service_type}`}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    Pagamentos, entrada e recebimentos estão na aba Financeiro.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Ajuste a data se mudou, escolha o serviço e defina o horário.
                    O fim é sugerido pela duração do serviço, mas você pode alterar.
                  </p>

                  <div className="space-y-2">
                    <Label>Data do evento</Label>
                    {lead.event_date && eventDate && eventDate !== lead.event_date && (
                      <p className="text-xs font-medium text-amber-800 bg-amber-50 rounded-lg px-2 py-1">
                        Data original do lead: {formatDate(lead.event_date)} → nova:{" "}
                        {formatDate(eventDate)}
                      </p>
                    )}
                    {activeTab === "confirm" && (
                      <AvailabilityCalendar
                        selectedDate={eventDate}
                        onSelectDate={setEventDate}
                        excludeLeadId={lead.id}
                        internalMode
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de serviço *</Label>
                    <Select value={serviceType} onValueChange={handleServiceTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((s) => (
                          <SelectItem key={s.id} value={s.name}>
                            {s.name} ({s.duration_hours}h)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Horário de início *</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Horário de fim *</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                          endTimeManualRef.current = true;
                          setEndTime(e.target.value);
                        }}
                      />
                      <p className="mt-1 text-2xs text-muted-foreground">
                        Sugerido pela duração do serviço — pode ajustar se precisar
                      </p>
                    </div>
                  </div>

                  {selectedService && startTime && endTime && (
                    <p className="text-sm font-medium text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                      Horário:{" "}
                      <span className="text-foreground">
                        {startTime} – {endTime}
                      </span>{" "}
                      ({selectedService.duration_hours}h de {selectedService.name})
                    </p>
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
              {activeTab === "finance" && (
                <LeadFinancial key={displayLead.id} lead={displayLead} onUpdate={onUpdate} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
