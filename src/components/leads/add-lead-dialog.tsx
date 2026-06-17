"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestCountField } from "@/components/orcamento/guest-count-field";
import { AvailabilityCalendar } from "@/components/orcamento/availability-calendar";
import { maskWhatsApp, formatWhatsApp } from "@/lib/utils";
import { addHoursToTime } from "@/lib/event-time";
import { EVENT_TYPES } from "@/types/database";
import { toast } from "sonner";

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AddLeadDialog({ open, onClose, onCreated }: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState<{ id: string; name: string }[]>([]);
  const [serviceTypes, setServiceTypes] = useState<
    { id: string; name: string; duration_hours: number }[]
  >([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [startTime, setStartTime] = useState("13:00");
  const [location, setLocation] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [guestCount, setGuestCount] = useState(100);
  const [eventType, setEventType] = useState("");
  const [observations, setObservations] = useState("");
  const [markAsFinalized, setMarkAsFinalized] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/catalog", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setEventTypes(data.event_types ?? []);
        setServiceTypes(data.service_types ?? []);
      })
      .catch(() => {});
  }, [open]);

  const selectedService = useMemo(
    () => serviceTypes.find((s) => s.name === serviceType),
    [serviceTypes, serviceType]
  );

  const endTime = useMemo(() => {
    if (!startTime || !selectedService) return "";
    return addHoursToTime(startTime, selectedService.duration_hours);
  }, [startTime, selectedService]);

  const isPastEvent = eventDate && eventDate < todayISO();

  const eventTypeOptions =
    eventTypes.length > 0 ? eventTypes.map((e) => e.name) : [...EVENT_TYPES];

  const reset = () => {
    setName("");
    setWhatsapp("");
    setEventDate("");
    setServiceType("");
    setStartTime("13:00");
    setLocation("");
    setNeighborhood("");
    setGuestCount(100);
    setEventType("");
    setObservations("");
    setMarkAsFinalized(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!name.trim()) missing.push("nome");
    if (formatWhatsApp(whatsapp).length < 10) missing.push("WhatsApp válido");
    if (!eventType) missing.push("tipo de evento");
    if (!location.trim()) missing.push("local");
    if (!neighborhood.trim()) missing.push("bairro");

    if (missing.length) {
      toast.error(`Preencha: ${missing.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: formatWhatsApp(whatsapp),
          event_date: eventDate || undefined,
          service_type: serviceType || undefined,
          event_start_time: startTime || undefined,
          event_end_time: endTime || undefined,
          location: location.trim(),
          neighborhood: neighborhood.trim(),
          guest_count: guestCount,
          event_type: eventType,
          observations: observations.trim() || undefined,
          mark_as_finalized: markAsFinalized && Boolean(isPastEvent),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const fieldErr = data.details?.fieldErrors
          ? Object.entries(data.details.fieldErrors as Record<string, string[]>)
              .map(([k, v]) => `${k}: ${v.join(", ")}`)
              .join(" · ")
          : "";
        toast.error(fieldErr || data.error || "Erro ao criar lead");
        return;
      }
      const statusNote =
        data.status === "finalizado" ? " (finalizado — evento já realizado)" : "";
      toast.success(`Lead ${name} adicionado${statusNote}`);
      reset();
      onClose();
      onCreated();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="font-display text-xl font-bold">Novo lead</DialogTitle>
        <p className="text-sm text-muted-foreground">
          Cadastro interno — preencha todos os campos obrigatórios (*) e role até o final para
          salvar. Datas retroativas são permitidas.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp *</Label>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de evento *</Label>
            <Select value={eventType} onValueChange={setEventType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Local *</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border-2 border-primary/20 bg-primary/5 p-3">
            <Label>Data do evento</Label>
            <AvailabilityCalendar
              selectedDate={eventDate}
              onSelectDate={setEventDate}
              internalMode
            />
            {isPastEvent && (
              <label className="mt-2 flex items-start gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={markAsFinalized}
                  onChange={(e) => setMarkAsFinalized(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span>
                  Evento já aconteceu — cadastrar como <strong>Finalizado</strong> (aparece em
                  &quot;Ver finalizados&quot; no kanban)
                </span>
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de serviço</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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
            <div className="space-y-2">
              <Label>Início</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="time" value={endTime} readOnly className="bg-muted/50" />
            </div>
          </div>
          <GuestCountField value={guestCount} onChange={setGuestCount} />
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <Plus className="h-4 w-4" />
            {loading ? "Salvando..." : "Adicionar lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddLeadButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="gap-2 font-semibold" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo lead
      </Button>
      <AddLeadDialog open={open} onClose={() => setOpen(false)} onCreated={onCreated} />
    </>
  );
}
