"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { parseEventDescription, type AgendaEvent } from "@/lib/events";
import { LEAD_STATUS_CONFIG } from "@/types/database";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface EventDetailDialogProps {
  event: AgendaEvent | null;
  open: boolean;
  onClose: () => void;
  onOpenLead?: (leadId: string) => void;
}

export function EventDetailDialog({
  event,
  open,
  onClose,
  onOpenLead,
}: EventDetailDialogProps) {
  if (!event) return null;

  const parsed = parseEventDescription(event.description);
  const statusConfig = event.status ? LEAD_STATUS_CONFIG[event.status] : null;
  const waUrl = event.whatsapp
    ? buildWhatsAppUrl(event.whatsapp, `Olá ${event.clientName}! Aqui é da Hora da Festa 🎉`)
    : null;

  const timeLabel = event.isAllDay
    ? "Dia todo"
    : event.startTime && event.endTime
      ? `${event.startTime} – ${event.endTime}`
      : event.slotsLabel ?? event.startTime ?? "—";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="font-display text-xl font-bold">
          {event.title}
        </DialogTitle>

        <div className="flex flex-wrap gap-2">
          {statusConfig && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
              {statusConfig.emoji} {statusConfig.label}
            </span>
          )}
          {event.isPaid && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Quitado
            </span>
          )}
          {event.paymentSummary?.status === "partial" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
              Falta {formatCurrency(event.paymentSummary.remaining)}
            </span>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            {formatDate(event.eventDate)}
          </p>
          <p className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-primary" />
            {timeLabel}
          </p>
          {(event.location || event.neighborhood) && (
            <p className="flex items-center gap-2 font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              {[event.location, event.neighborhood].filter(Boolean).join(" · ")}
            </p>
          )}
          {event.guestCount != null && event.guestCount > 0 && (
            <p className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-primary" />~{event.guestCount} convidados
            </p>
          )}
        </div>

        {(parsed.Cliente ||
          parsed.WhatsApp ||
          parsed.Local ||
          parsed["💰 Pagamento"] ||
          event.description) && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Informações do evento
            </p>
            <div className="space-y-1.5 rounded-xl border border-border/80 bg-card p-4 text-sm">
              {Object.entries(parsed).map(([key, val]) => (
                <p key={key}>
                  <span className="font-semibold text-foreground">{key}:</span>{" "}
                  <span className="text-muted-foreground">{val}</span>
                </p>
              ))}
              {!Object.keys(parsed).length && event.description && (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        )}

        {event.paymentSummary && event.paymentSummary.status !== "none" && (
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/80 bg-card p-3 text-center">
            <div>
              <p className="text-2xs font-bold uppercase text-muted-foreground">Contrato</p>
              <p className="font-bold">{formatCurrency(event.paymentSummary.total)}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase text-muted-foreground">Recebido</p>
              <p className="font-bold text-emerald-600">
                {formatCurrency(event.paymentSummary.received)}
              </p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase text-muted-foreground">Falta</p>
              <p className="font-bold text-amber-700">
                {formatCurrency(event.paymentSummary.remaining)}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {event.leadId && onOpenLead && (
            <Button className="font-semibold" onClick={() => onOpenLead(event.leadId!)}>
              Abrir no CRM
            </Button>
          )}
          {event.htmlLink && (
            <Button variant="outline" className="gap-2 font-semibold" asChild>
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Google Agenda
              </a>
            </Button>
          )}
          {waUrl && (
            <Button variant="secondary" className="gap-2 font-semibold" asChild>
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
