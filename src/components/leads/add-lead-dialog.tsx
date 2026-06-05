"use client";

import { useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { AvailabilityCalendar } from "@/components/orcamento/availability-calendar";
import { maskWhatsApp, formatWhatsApp } from "@/lib/utils";
import { EVENT_TYPES } from "@/types/database";
import type { SlotType } from "@/lib/slots";
import { toast } from "sonner";

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddLeadDialog({ open, onClose, onCreated }: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [slotType, setSlotType] = useState<SlotType | "">("");
  const [location, setLocation] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [guestCount, setGuestCount] = useState(100);
  const [eventType, setEventType] = useState("");
  const [observations, setObservations] = useState("");

  const reset = () => {
    setName("");
    setWhatsapp("");
    setEventDate("");
    setSlotType("");
    setLocation("");
    setNeighborhood("");
    setGuestCount(100);
    setEventType("");
    setObservations("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp || !location || !neighborhood || !eventType) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp: formatWhatsApp(whatsapp),
          event_date: eventDate || undefined,
          slot_type: slotType || undefined,
          location,
          neighborhood,
          guest_count: guestCount,
          event_type: eventType,
          observations: observations || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar lead");
        return;
      }
      toast.success(`Lead ${name} adicionado`);
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
          Adicione manualmente — mesmo formulário do orçamento online.
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
            <Label>Data e turno</Label>
            <AvailabilityCalendar
              selectedDate={eventDate}
              onSelectDate={(d) => {
                setEventDate(d);
                setSlotType("");
              }}
              selectedSlot={slotType}
              onSelectSlot={setSlotType}
            />
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
          <div className="space-y-2">
            <Label>Convidados: ~{guestCount}</Label>
            <Slider
              value={[guestCount]}
              onValueChange={([v]) => setGuestCount(v)}
              min={50}
              max={500}
              step={10}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de evento *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
