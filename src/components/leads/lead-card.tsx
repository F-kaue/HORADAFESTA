"use client";

import { Calendar, MapPin, Users, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, timeAgo } from "@/lib/utils";
import { SLOT_LABELS, type SlotType } from "@/lib/slots";
import { LEAD_STATUS_CONFIG, type Lead } from "@/types/database";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface LeadCardProps {
  lead: Lead;
  onOpen: (lead: Lead) => void;
}

export function LeadCard({ lead, onOpen }: LeadCardProps) {
  const status = LEAD_STATUS_CONFIG[lead.status];

  const clientWa = buildWhatsAppUrl(
    lead.whatsapp,
    `Olá ${lead.name}! Aqui é da Hora da Festa 🎉`
  );

  return (
    <div
      className="cursor-grab rounded-2xl border border-border/80 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-warm active:cursor-grabbing"
      onClick={() => onOpen(lead)}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="truncate font-semibold text-foreground">{lead.name}</p>
        <Badge variant="secondary" className="shrink-0 text-2xs font-bold">
          {status.label}
        </Badge>
      </div>
      <div className="space-y-1.5 text-sm font-medium text-muted-foreground">
        {lead.event_date && (
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
            {formatDate(lead.event_date)}
            {lead.slot_type && ` · ${SLOT_LABELS[lead.slot_type as SlotType]}`}
          </p>
        )}
        {lead.guest_count && (
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-primary/70" />~{lead.guest_count}{" "}
            pessoas
          </p>
        )}
        {lead.neighborhood && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
            {lead.neighborhood}
          </p>
        )}
        <p className="text-xs">Chegou {timeAgo(lead.arrived_at)}</p>
      </div>
      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpen(lead)}>
          Ver detalhes
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={clientWa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
