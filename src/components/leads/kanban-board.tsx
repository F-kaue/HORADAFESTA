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
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, Inbox } from "lucide-react";
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
import { KANBAN_COLUMN_STYLES } from "./kanban-styles";
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
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onOpen={onOpen} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({
  status,
  leads,
  onOpen,
  isOver,
}: {
  status: LeadStatus;
  leads: Lead[];
  onOpen: (l: Lead) => void;
  isOver?: boolean;
}) {
  const config = LEAD_STATUS_CONFIG[status];
  const styles = KANBAN_COLUMN_STYLES[status];
  const { setNodeRef, isOver: dropOver } = useDroppable({ id: status });

  const highlighted = isOver || dropOver;

  return (
    <div className="flex w-[min(300px,85vw)] shrink-0 flex-col sm:w-[300px]">
      <div
        className={cn(
          "mb-3 flex items-center gap-2.5 rounded-xl px-4 py-3",
          styles.header
        )}
      >
        <span className="text-lg leading-none" aria-hidden>
          {config.emoji}
        </span>
        <span className="text-sm font-bold tracking-tight">{config.label}</span>
        <span className="ml-auto flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-white/25 px-2 text-xs font-bold">
          {leads.length}
        </span>
      </div>

      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          data-status={status}
          className={cn(
            "flex min-h-[200px] flex-col gap-3 rounded-2xl p-3 transition-all duration-200",
            styles.body,
            highlighted && "border-primary bg-primary/5 ring-2 ring-primary/30"
          )}
        >
          {leads.length === 0 ? (
            <div
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-2 rounded-xl px-4 py-10 text-center",
                highlighted ? "opacity-100" : "opacity-70"
              )}
            >
              <Inbox className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-foreground/80">
                {highlighted ? "Solte o card aqui" : "Nenhum lead"}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Arraste cards para esta coluna
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <SortableLeadCard key={lead.id} lead={lead} onOpen={onOpen} />
            ))
          )}
        </div>
      </SortableContext>
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
  const [overColumnId, setOverColumnId] = useState<LeadStatus | null>(null);

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

  const handleDragOver = (e: DragOverEvent) => {
    const overId = e.over?.id;
    if (!overId) {
      setOverColumnId(null);
      return;
    }
    const id = String(overId);
    if (COLUMNS.includes(id as LeadStatus)) {
      setOverColumnId(id as LeadStatus);
      return;
    }
    const overLead = leads.find((l) => l.id === id);
    setOverColumnId(overLead?.status ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    setOverColumnId(null);
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
    } else {
      toast.success(
        `Movido para ${LEAD_STATUS_CONFIG[newStatus].label}`
      );
    }
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:p-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 pl-10 font-medium"
          />
        </div>
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-full border-2 font-medium sm:w-[220px]">
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
        <p className="text-xs font-semibold text-muted-foreground sm:ml-auto">
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {COLUMNS.map((col) => {
            const config = LEAD_STATUS_CONFIG[col];
            const styles = KANBAN_COLUMN_STYLES[col];
            const count = filtered.filter((l) => l.status === col).length;
            const active = mobileColumn === col;
            return (
              <button
                key={col}
                type="button"
                onClick={() => setMobileColumn(col)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1 rounded-xl px-4 py-3 min-h-[56px] min-w-[5.5rem] transition-all",
                  active ? styles.tabActive : styles.tabInactive
                )}
              >
                <span className="text-base leading-none">{config.emoji}</span>
                <span className="text-xs font-bold leading-tight">{config.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-2xs font-bold",
                    active ? "bg-white/25" : "bg-black/5"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className={cn(
            "mt-3 space-y-3 rounded-2xl p-3",
            KANBAN_COLUMN_STYLES[mobileColumn].body
          )}
        >
          {filtered.filter((l) => l.status === mobileColumn).length === 0 ? (
            <p className="py-12 text-center text-sm font-semibold text-muted-foreground">
              Nenhum lead nesta etapa
            </p>
          ) : (
            filtered
              .filter((l) => l.status === mobileColumn)
              .map((lead) => (
                <LeadCard key={lead.id} lead={lead} onOpen={setSelectedLead} />
              ))
          )}
        </div>
      </div>

      {/* Desktop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setOverColumnId(null);
        }}
      >
        <div className="hidden lg:flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={filtered.filter((l) => l.status === status)}
              onOpen={setSelectedLead}
              isOver={overColumnId === status}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeLead ? (
            <div className="rotate-2 scale-[1.02] cursor-grabbing">
              <LeadCard lead={activeLead} onOpen={() => {}} isDragging />
            </div>
          ) : null}
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
