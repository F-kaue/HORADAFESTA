"use client";

import { Calendar, MapPin, Users, MessageCircle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, timeAgo } from "@/lib/utils";
import { formatSlotsLabel, type SlotType } from "@/lib/slots";
import { LEAD_STATUS_CONFIG, type Lead } from "@/types/database";
import { KANBAN_CARD_ACCENT, KANBAN_COLUMN_STYLES } from "./kanban-styles";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  onOpen: (lead: Lead) => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onOpen, isDragging }: LeadCardProps) {
  const status = LEAD_STATUS_CONFIG[lead.status];
  const badgeStyle = KANBAN_COLUMN_STYLES[lead.status].badge;

  const clientWa = buildWhatsAppUrl(
    lead.whatsapp,
    `Olá ${lead.name}! Aqui é da Hora da Festa 🎉`
  );

  return (
    <div
      className={cn(
        "group cursor-grab rounded-xl border border-border/80 bg-card shadow-card transition-all duration-200",
        KANBAN_CARD_ACCENT[lead.status],
        "hover:shadow-elevated hover:-translate-y-0.5",
        isDragging && "shadow-elevated ring-2 ring-primary/40",
        "active:cursor-grabbing"
      )}
      onClick={() => onOpen(lead)}
    >
      <div className="flex items-start gap-2 p-4 pb-2">
        <GripVertical
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-base font-bold text-foreground">{lead.name}</p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold",
                badgeStyle
              )}
            >
              {status.label}
            </span>
          </div>
          {lead.event_type && (
            <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
              {lead.event_type}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 px-4 pb-3 text-sm font-medium text-foreground/85">
        {lead.event_date && (
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {formatDate(lead.event_date)}
              {formatSlotsLabel(lead.slot_types as SlotType[] | null, lead.slot_type) && (
                <span className="text-muted-foreground">
                  {" "}
                  · {formatSlotsLabel(lead.slot_types as SlotType[] | null, lead.slot_type)}
                </span>
              )}
            </span>
          </p>
        )}
        {lead.guest_count != null && lead.guest_count > 0 && (
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-primary" />~{lead.guest_count} pessoas
          </p>
        )}
        {lead.neighborhood && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {lead.neighborhood}
          </p>
        )}
        <p className="text-xs font-semibold text-muted-foreground">
          Chegou {timeAgo(lead.arrived_at)}
        </p>
      </div>

      <div
        className="flex gap-2 border-t border-border/60 bg-muted/30 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="h-10 flex-1 border-2 font-semibold"
          onClick={() => onOpen(lead)}
        >
          Ver detalhes
        </Button>
        <Button variant="secondary" size="sm" className="h-10 w-10 shrink-0 p-0" asChild>
          <a href={clientWa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
