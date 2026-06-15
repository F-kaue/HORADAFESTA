"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
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
import { buildOrcamentoMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { addHoursToTime } from "@/lib/event-time";
import { EVENT_TYPES } from "@/types/database";
import { toast } from "sonner";

type CatalogEvent = { id: string; name: string };
type CatalogService = { id: string; name: string; duration_hours: number };

function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs font-medium text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function OrcamentoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<CatalogEvent[]>([]);
  const [serviceTypes, setServiceTypes] = useState<CatalogService[]>([]);

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

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch("/api/catalog", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Falha ao carregar catálogo");
        }
        setEventTypes(data.event_types ?? []);
        setServiceTypes(data.service_types ?? []);
      } catch {
        toast.error("Erro ao carregar opções do formulário");
      } finally {
        setCatalogLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const selectedService = useMemo(
    () => serviceTypes.find((s) => s.name === serviceType),
    [serviceTypes, serviceType]
  );

  const endTime = useMemo(() => {
    if (!startTime || !selectedService) return "";
    return addHoursToTime(startTime, selectedService.duration_hours);
  }, [startTime, selectedService]);

  const eventTypeOptions =
    eventTypes.length > 0 ? eventTypes.map((e) => e.name) : [...EVENT_TYPES];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !name ||
      !whatsapp ||
      !eventDate ||
      !serviceType ||
      !startTime ||
      !location ||
      !neighborhood ||
      !eventType
    ) {
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
          service_type: serviceType,
          event_start_time: startTime,
          event_end_time: endTime,
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
        startTime,
        endTime,
        serviceType,
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-4 py-10 safe-bottom">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-elevated sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-3xl">
            ✓
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Solicitação enviada!
          </h1>
          <p className="mt-3 text-readable text-muted-foreground">
            Em breve entraremos em contato. Se o WhatsApp não abriu, verifique se o
            aplicativo está instalado no seu celular.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="mx-auto w-full max-w-xl px-4 py-6 pb-32 sm:px-6 sm:py-10 sm:pb-16">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandLogo size="lg" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Bem-vindo(a)
          </p>
          <p className="mx-auto mt-4 max-w-sm text-readable text-muted-foreground">
            Preencha o formulário para recebermos sua solicitação e montarmos um
            orçamento sob medida para o seu evento.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="form-section">
            <p className="form-section-title mb-4">Seus dados</p>
            <div className="space-y-4">
              <FormField label="Nome completo *">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maria Silva"
                  required
                  autoComplete="name"
                />
              </FormField>
              <FormField label="WhatsApp *" hint="Com DDD — usamos para retornar o contato">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                  placeholder="(85) 99999-9999"
                  required
                  autoComplete="tel"
                />
              </FormField>
            </div>
          </section>

          <section className="form-section">
            <p className="form-section-title mb-4">Data e horário</p>
            <div className="space-y-4">
              <FormField label="Data do evento *">
                <AvailabilityCalendar
                  selectedDate={eventDate}
                  onSelectDate={setEventDate}
                />
              </FormField>

              <FormField label="Tipo de evento *">
                <Select
                  value={eventType}
                  onValueChange={setEventType}
                  required
                  disabled={catalogLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Tipo de serviço *">
                <Select
                  value={serviceType}
                  onValueChange={setServiceType}
                  disabled={catalogLoading}
                >
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
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Horário de início *">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Horário de fim" hint="Calculado pela duração do serviço">
                  <Input type="time" value={endTime} readOnly className="bg-muted/50" />
                </FormField>
              </div>
            </div>
          </section>

          <section className="form-section">
            <p className="form-section-title mb-4">Local do evento</p>
            <div className="space-y-4">
              <FormField label="Nome do local *">
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Salão das Flores"
                  required
                />
              </FormField>
              <FormField label="Bairro *">
                <Input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Meireles"
                  required
                />
              </FormField>
            </div>
          </section>

          <section className="form-section">
            <p className="form-section-title mb-4">Detalhes do evento</p>
            <div className="space-y-5">
              <GuestCountField value={guestCount} onChange={setGuestCount} />

              <FormField label="Observações" hint="Opcional — tema, restrições, preferências">
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Conte mais sobre o que você imagina para a festa..."
                />
              </FormField>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-4 border-t border-border/80 bg-white/95 px-4 py-4 backdrop-blur-md safe-bottom sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
              <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
              {loading ? "Enviando..." : "Solicitar orçamento no WhatsApp"}
            </Button>
            <p className="mt-2 text-center text-2xs font-medium text-muted-foreground sm:text-xs">
              Ao enviar, você será redirecionado(a) para o WhatsApp da equipe.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
