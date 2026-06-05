"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { LeadCard } from "./lead-card";
import { LeadModal } from "./lead-modal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUS_CONFIG, EVENT_TYPES, type Lead, type LeadStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLUMNS: LeadStatus[] = [
  "novo",
  "em_conversa",
  "aguardando",
  "confirmado",
  "nao_convertido",
];

function SortableLeadCard({
  lead,
  onOpen,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onOpen={onOpen} />
    </div>
  );
}

export function KanbanBoard() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [mobileColumn, setMobileColumn] = useState<LeadStatus>("novo");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("arrived_at", { ascending: false });
    if (data) setLeads(data as Lead[]);
  }, [supabase]);

  useEffect(() => {
    loadLeads();

    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => loadLeads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadLeads]);

  const filtered = leads.filter((l) => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (eventTypeFilter !== "all" && l.event_type !== eventTypeFilter) return false;
    return true;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const leadId = String(active.id);
    let newStatus = over.id as LeadStatus;

    if (!COLUMNS.includes(newStatus)) {
      const overLead = leads.find((l) => l.id === over.id);
      if (overLead) newStatus = overLead.status;
      else return;
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      toast.error("Erro ao atualizar status");
      loadLeads();
    }
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const ColumnContent = ({ status }: { status: LeadStatus }) => {
    const columnLeads = filtered.filter((l) => l.status === status);
    const config = LEAD_STATUS_CONFIG[status];

    return (
      <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
        <div
          className={cn(
            "mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white",
            config.color
          )}
        >
          {config.emoji} {config.label}
          <span className="ml-auto rounded-full bg-white/20 px-2 text-xs">
            {columnLeads.length}
          </span>
        </div>
        <SortableContext
          items={columnLeads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className="flex flex-col gap-3 min-h-[120px] rounded-xl bg-muted/50 p-2"
            data-status={status}
          >
            {columnLeads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onOpen={setSelectedLead}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-full sm:max-w-[220px]">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: tabs por coluna */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {COLUMNS.map((col) => {
            const config = LEAD_STATUS_CONFIG[col];
            const count = filtered.filter((l) => l.status === col).length;
            return (
              <button
                key={col}
                type="button"
                onClick={() => setMobileColumn(col)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 min-h-[52px] min-w-[4.5rem] text-center transition-colors",
                  mobileColumn === col
                    ? "bg-primary text-primary-foreground shadow-warm"
                    : "border border-border bg-card text-muted-foreground"
                )}
              >
                <span className="text-base leading-none">{config.emoji}</span>
                <span className="text-2xs font-bold leading-tight sm:text-xs">
                  {config.label}
                </span>
                <span
                  className={cn(
                    "text-2xs font-semibold",
                    mobileColumn === col ? "text-white/80" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="space-y-3 mt-2">
          {filtered
            .filter((l) => l.status === mobileColumn)
            .map((lead) => (
              <LeadCard key={lead.id} lead={lead} onOpen={setSelectedLead} />
            ))}
        </div>
      </div>

      {/* Desktop: kanban com drag */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="hidden lg:flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <div key={status} id={status}>
              <ColumnContent status={status} />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} onOpen={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <LeadModal
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={loadLeads}
      />
    </div>
  );
}
