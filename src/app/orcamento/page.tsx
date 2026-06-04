"use client";

import { useState } from "react";
import { PartyPopper } from "lucide-react";
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
import { buildOrcamentoMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { EVENT_TYPES } from "@/types/database";
import type { SlotType } from "@/lib/slots";
import { toast } from "sonner";

export default function OrcamentoPage() {
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !whatsapp || !eventDate || !slotType || !location || !neighborhood || !eventType) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp: formatWhatsApp(whatsapp),
          event_date: eventDate,
          slot_type: slotType,
          location,
          neighborhood,
          guest_count: guestCount,
          event_type: eventType,
          observations: observations || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar");
        return;
      }

      const message = buildOrcamentoMessage({
        name,
        eventDate,
        slotType,
        location,
        neighborhood,
        guestCount,
        eventType,
        observations,
      });

      const waUrl = buildWhatsAppUrl(data.whatsapp, message);
      setSubmitted(true);
      window.location.href = waUrl;
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md text-center rounded-2xl border bg-white p-10 shadow-warm">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-display text-2xl font-bold text-secondary">
            Sua solicitação foi enviada!
          </h1>
          <p className="mt-3 text-muted-foreground">
            Em breve entraremos em contato. Se o WhatsApp não abriu, verifique
            se o app está instalado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-lg px-4 py-8 pb-16">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <PartyPopper className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-primary">🎉 BEM-VINDO(A) AO</p>
          <h1 className="font-display text-2xl font-bold text-secondary md:text-3xl">
            HORA DA FESTA
          </h1>
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">
            BUFFET E EVENTOS
          </p>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Para agilizar seu orçamento e garantir uma proposta perfeita para o
            seu evento, preencha abaixo:
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-white p-6 shadow-card">
          <div className="space-y-2">
            <Label>👤 Seu nome completo *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>📱 Seu WhatsApp *</Label>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
              placeholder="(85) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>📅 Data do evento *</Label>
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

          <div className="space-y-2">
            <Label>📍 Local do evento *</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Salão das Flores"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Bairro *</Label>
            <Input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Meireles"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>👥 Número estimado de convidados: ~{guestCount}</Label>
            <Slider
              min={50}
              max={500}
              step={10}
              value={[guestCount]}
              onValueChange={([v]) => setGuestCount(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50</span>
              <span>500+</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>🎂 Tipo de evento *</Label>
            <Select value={eventType} onValueChange={setEventType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
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
            <Label>💬 Observações adicionais</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Algum detalhe especial? Ex: tema, restrições alimentares..."
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Enviando..." : "📲 Solicitar Orçamento pelo WhatsApp"}
          </Button>
        </form>
      </div>
    </div>
  );
}
