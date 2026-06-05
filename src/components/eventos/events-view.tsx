"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Link2Off,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EventCard } from "./event-card";
import { EventDetailDialog } from "./event-detail-dialog";
import { MonthGrid, monthRange } from "./month-grid";
import { LeadModal } from "@/components/leads/lead-modal";
import type { AgendaEvent } from "@/lib/events";
import type { Lead } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PeriodFilter = "upcoming" | "past" | "all";

export function EventsView() {
  const supabase = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("upcoming");
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const { start, end } = monthRange(month);
    try {
      const res = await fetch(`/api/events?from=${start}&to=${end}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao carregar eventos");
        return;
      }
      setEvents(data.events ?? []);
      setGoogleConnected(data.googleConnected ?? false);
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventDates = useMemo(
    () => new Set(events.map((e) => e.eventDate)),
    [events]
  );

  const filteredEvents = useMemo(() => {
    let list = events;
    if (selectedDate) {
      list = list.filter((e) => e.eventDate === selectedDate);
    }
    if (periodFilter === "upcoming") {
      list = list.filter(
        (e) =>
          isAfter(parseISO(`${e.eventDate}T12:00:00`), startOfDay(new Date())) ||
          e.eventDate === today
      );
    } else if (periodFilter === "past") {
      list = list.filter((e) =>
        isBefore(parseISO(`${e.eventDate}T12:00:00`), startOfDay(new Date()))
      );
    }
    return list;
  }, [events, selectedDate, periodFilter, today]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, AgendaEvent[]>();
    for (const ev of filteredEvents) {
      const arr = groups.get(ev.eventDate) ?? [];
      arr.push(ev);
      groups.set(ev.eventDate, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  const openLead = async (leadId: string) => {
    const { data } = await supabase.from("leads").select("*").eq("id", leadId).single();
    if (data) {
      setSelectedEvent(null);
      setSelectedLead(data as Lead);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda de Eventos"
        description="Apenas eventos confirmados ativos — finalizados ficam no Kanban."
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-2 font-semibold"
            disabled={loading}
            onClick={() => loadEvents()}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      {!googleConnected && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link2Off className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Google Calendar não conectado
              </p>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                Conecte em Configurações para sincronizar título, horários e links dos
                eventos.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 font-semibold">
            <Link href="/configuracoes">Conectar Google</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-2"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[10rem] text-center">
            <p className="font-display text-lg font-bold capitalize text-foreground">
              {format(month, "MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-2"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold"
            onClick={() => {
              setMonth(new Date());
              setSelectedDate(null);
            }}
          >
            Hoje
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "upcoming", label: "Próximos" },
              { id: "past", label: "Já passaram" },
              { id: "all", label: "Todos" },
            ] as const
          ).map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={periodFilter === f.id ? "default" : "outline"}
              className="font-semibold"
              onClick={() => setPeriodFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
        <MonthGrid
          month={month}
          selectedDate={selectedDate}
          eventDates={eventDates}
          onSelectDate={setSelectedDate}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selectedDate
                ? format(parseISO(`${selectedDate}T12:00:00`), "d 'de' MMMM", {
                    locale: ptBR,
                  })
                : periodFilter === "upcoming"
                  ? "Próximos eventos"
                  : periodFilter === "past"
                    ? "Eventos realizados"
                    : "Todos os eventos"}
            </h2>
            <span className="text-sm font-semibold text-muted-foreground">
              {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-semibold text-foreground">
                Nenhum evento neste período
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Eventos aparecem aqui quando um lead é confirmado no Kanban.
              </p>
            </div>
          ) : selectedDate ? (
            <div className="space-y-3">
              {filteredEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} onOpen={setSelectedEvent} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByDate.map(([date, dayEvents]) => (
                <section key={date}>
                  <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    {format(parseISO(`${date}T12:00:00`), "EEEE, d 'de' MMMM", {
                      locale: ptBR,
                    })}
                  </p>
                  <div className="space-y-3">
                    {dayEvents.map((ev) => (
                      <EventCard key={ev.id} event={ev} onOpen={setSelectedEvent} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onOpenLead={openLead}
      />

      <LeadModal
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={loadEvents}
      />
    </div>
  );
}
