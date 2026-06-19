"use client";

import {
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  GripVertical,
  CheckCircle2,
  CircleDollarSign,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import { formatTimeRange } from "@/lib/event-time";
import { formatSlotsLabel } from "@/lib/slots";
import type { LeadPaymentSummary } from "@/lib/payment-status";
import { LEAD_STATUS_CONFIG, type Lead, type LeadStatus } from "@/types/database";
import { KANBAN_CARD_ACCENT, KANBAN_COLUMN_STYLES } from "./kanban-styles";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { LeadActionsMenu } from "./lead-actions-menu";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  onOpen: (lead: Lead) => void;
  isDragging?: boolean;
  paymentSummary?: LeadPaymentSummary | null;
  dragHandleProps?: Record<string, unknown>;
  onArchive?: (lead: Lead) => void;
  onUnarchive?: (lead: Lead) => void;
  onFinalize?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

function PaymentBadge({ summary }: { summary: LeadPaymentSummary }) {
  if (summary.status === "none") return null;

  if (summary.status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-700">
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
        Quitado
      </span>
    );
  }

  if (summary.status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200">
        <CircleDollarSign className="h-3 w-3 shrink-0" aria-hidden />
        Falta {formatCurrency(summary.remaining)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-2xs font-bold text-orange-900 ring-1 ring-orange-200 dark:bg-orange-900/40 dark:text-orange-200">
      <CircleDollarSign className="h-3 w-3 shrink-0" aria-hidden />
      A receber
    </span>
  );
}

export function LeadCard({
  lead,
  onOpen,
  isDragging,
  paymentSummary,
  dragHandleProps,
  onArchive,
  onUnarchive,
  onFinalize,
  onDelete,
}: LeadCardProps) {
  const statusKey = lead.status in LEAD_STATUS_CONFIG ? lead.status : "novo";
  const status = LEAD_STATUS_CONFIG[statusKey as LeadStatus];
  const badgeStyle = KANBAN_COLUMN_STYLES[statusKey as LeadStatus].badge;
  const showPayment =
    (lead.status === "confirmado" || lead.status === "finalizado") &&
    paymentSummary &&
    paymentSummary.status !== "none";

  const clientWa = buildWhatsAppUrl(
    lead.whatsapp,
    `Olá ${lead.name}! Aqui é da Hora da Festa 🎉`
  );

  const hasActions = onArchive && onUnarchive && onFinalize && onDelete;

  return (
    <div
      className={cn(
        "group rounded-xl border border-border/80 bg-card shadow-card transition-all duration-200",
        KANBAN_CARD_ACCENT[statusKey as LeadStatus],
        paymentSummary?.status === "paid" && "ring-1 ring-emerald-200/80",
        lead.archived_at && "opacity-75",
        "hover:shadow-elevated hover:-translate-y-0.5",
        isDragging && "shadow-elevated ring-2 ring-primary/40",
        dragHandleProps && "cursor-default"
      )}
      onClick={() => onOpen(lead)}
    >
      <div className="flex items-start gap-1.5 p-3 pb-1.5">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Arrastar card"
          onClick={(e) => e.stopPropagation()}
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-foreground">{lead.name}</p>
            <div className="flex shrink-0 items-start gap-1">
              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-2xs font-bold",
                    badgeStyle
                  )}
                >
                  {status.label}
                </span>
                {showPayment && paymentSummary && (
                  <PaymentBadge summary={paymentSummary} />
                )}
                {lead.archived_at && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs font-bold text-muted-foreground">
                    <Archive className="h-3 w-3" />
                    Arquivado
                  </span>
                )}
              </div>
              {hasActions && (
                <LeadActionsMenu
                  lead={lead}
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
                  onFinalize={onFinalize}
                  onDelete={onDelete}
                />
              )}
            </div>
          </div>
          {lead.event_type && (
            <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
              {lead.event_type}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 px-3 pb-2 text-xs font-medium text-foreground/85">
        {lead.event_date && (
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              {formatDate(lead.event_date)}
              {(formatTimeRange(lead.event_start_time, lead.event_end_time) ||
                formatSlotsLabel(lead.slot_types, lead.slot_type)) && (
                <span className="text-muted-foreground">
                  {" "}
                  ·{" "}
                  {formatTimeRange(lead.event_start_time, lead.event_end_time) ||
                    formatSlotsLabel(lead.slot_types, lead.slot_type)}
                </span>
              )}
            </span>
          </p>
        )}
        {lead.guest_count != null && lead.guest_count > 0 && (
          <p className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary" />~{lead.guest_count} pessoas
          </p>
        )}
        {lead.neighborhood && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            {lead.neighborhood}
          </p>
        )}
        <p className="text-xs font-semibold text-muted-foreground">
          Chegou {timeAgo(lead.arrived_at)}
        </p>
      </div>

      <div
        className="flex gap-1.5 border-t border-border/60 bg-muted/30 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1 border-2 text-xs font-semibold"
          onClick={() => onOpen(lead)}
        >
          Ver detalhes
        </Button>
        <Button variant="secondary" size="sm" className="h-8 w-8 shrink-0 p-0" asChild>
          <a href={clientWa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
