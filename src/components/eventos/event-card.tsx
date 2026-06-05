"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AgendaEvent } from "@/lib/events";
import { LEAD_STATUS_CONFIG } from "@/types/database";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: AgendaEvent;
  onOpen: (event: AgendaEvent) => void;
  compact?: boolean;
}

export function EventCard({ event, onOpen, compact }: EventCardProps) {
  const statusConfig = event.status ? LEAD_STATUS_CONFIG[event.status] : null;
  const timeLabel = event.isAllDay
    ? "Dia todo"
    : event.startTime && event.endTime
      ? `${event.startTime} – ${event.endTime}`
      : event.slotsLabel ?? event.startTime ?? "—";

  return (
    <article
      className={cn(
        "group rounded-2xl border border-border/80 bg-card shadow-card transition-all hover:shadow-elevated",
        event.isPaid && "ring-1 ring-emerald-200/60 dark:ring-emerald-800/60",
        compact ? "p-3" : "p-4 sm:p-5"
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 text-center",
            event.status === "finalizado"
              ? "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100"
              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
          )}
        >
          <span className="text-2xs font-bold uppercase">
            {format(parseISO(`${event.eventDate}T12:00:00`), "EEE", { locale: ptBR })}
          </span>
          <span className="font-display text-2xl font-bold leading-none">
            {event.eventDate.slice(8, 10)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-foreground sm:text-lg">
                {event.clientName}
              </h3>
              {event.eventType && (
                <p className="text-sm font-semibold text-muted-foreground">
                  {event.eventType}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {statusConfig && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-2xs font-bold",
                    statusConfig.color === "bg-success"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100"
                      : "bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100"
                  )}
                >
                  {statusConfig.label}
                </span>
              )}
              {event.isPaid && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Quitado
                </span>
              )}
              {event.paymentSummary?.status === "partial" && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                  Falta {formatCurrency(event.paymentSummary.remaining)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-sm font-medium text-foreground/85">
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              {formatDate(event.eventDate)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              {timeLabel}
            </p>
            {(event.location || event.neighborhood) && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">
                  {[event.location, event.neighborhood].filter(Boolean).join(" · ")}
                </span>
              </p>
            )}
            {event.guestCount != null && event.guestCount > 0 && (
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-primary" />~{event.guestCount}{" "}
                pessoas
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="font-semibold"
              onClick={() => onOpen(event)}
            >
              Ver detalhes
            </Button>
            {event.htmlLink && (
              <Button size="sm" variant="outline" className="gap-1.5 font-semibold" asChild>
                <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Google Agenda
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
