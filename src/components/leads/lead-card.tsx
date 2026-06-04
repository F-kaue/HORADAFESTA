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
      className="cursor-grab rounded-xl border bg-white p-4 shadow-card transition-all duration-200 hover:shadow-warm active:cursor-grabbing"
      onClick={() => onOpen(lead)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-sm truncate">👤 {lead.name}</p>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {status.emoji} {status.label.toUpperCase()}
        </Badge>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        {lead.event_date && (
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(lead.event_date)}
            {lead.slot_type && ` · ${SLOT_LABELS[lead.slot_type as SlotType]}`}
          </p>
        )}
        {lead.guest_count && (
          <p className="flex items-center gap-1">
            <Users className="h-3 w-3" />~{lead.guest_count} pessoas
          </p>
        )}
        {lead.neighborhood && (
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {lead.neighborhood}
          </p>
        )}
        <p>⏰ Chegou {timeAgo(lead.arrived_at)}</p>
      </div>
      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpen(lead)}>
          Ver detalhes
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={clientWa} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
