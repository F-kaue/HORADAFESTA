"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Search, Inbox, RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { LeadCard } from "./lead-card";
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

const LeadModal = dynamic(
  () => import("./lead-modal").then((m) => m.LeadModal),
  { ssr: false }
);

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
              <Inbox className="h-8 w-8 text-foreground/40" strokeWidth={1.5} />
              <p className="text-sm font-bold text-foreground">
                {highlighted ? "Solte o card aqui" : "Nenhum lead"}
              </p>
              <p className="text-xs font-semibold text-foreground/70">
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

function formatLastSync(date: Date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 10) return "agora";
  if (sec < 60) return `há ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min}min`;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function KanbanBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [mobileColumn, setMobileColumn] = useState<LeadStatus>("novo");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<LeadStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const applyLeadChange = useCallback((payload: {
    eventType: string;
    new: Lead | Record<string, unknown>;
    old: Lead | Record<string, unknown>;
  }) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as Lead)?.id;
        if (id) setLeads((prev) => prev.filter((l) => l.id !== id));
        return;
      }
      const row = payload.new as Lead;
      if (!row?.id) return;
      setLeads((prev) => {
        const idx = prev.findIndex((l) => l.id === row.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = row;
          return next;
        }
        return [row, ...prev];
      });
    },
    []
  );

  const loadLeads = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setRefreshing(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("arrived_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar leads");
      } else if (data) {
        setLeads(data as Lead[]);
        setLastSync(new Date());
      }
      setRefreshing(false);
    },
    [supabase]
  );

  useEffect(() => {
    loadLeads({ silent: true });

    const channel = supabase
      .channel("leads-kanban-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          applyLeadChange(payload);
          setLastSync(new Date());
        }
      )
      .subscribe((status) => {
        setRealtimeOn(status === "SUBSCRIBED");
      });

    const onFocus = () => loadLeads({ silent: true });
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [supabase, loadLeads, applyLeadChange]);

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
      loadLeads({ silent: true });
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
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {realtimeOn && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-2xs font-bold text-emerald-800">
              <Radio className="h-3 w-3" aria-hidden />
              Ao vivo
            </span>
          )}
          {lastSync && (
            <span className="text-2xs font-semibold text-muted-foreground sm:text-xs">
              {formatLastSync(lastSync)}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-2 font-semibold"
            disabled={refreshing}
            onClick={() => loadLeads()}
            aria-label="Atualizar leads"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <span className="text-xs font-bold text-foreground">
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
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
