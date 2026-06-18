"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Search, Inbox, RefreshCw, Radio, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LeadCard } from "./lead-card";
import { LeadModal } from "./lead-modal";
import { AddLeadButton } from "./add-lead-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KANBAN_COLUMN_STYLES } from "./kanban-styles";
import type { LeadPaymentSummary } from "@/lib/payment-status";
import { LEAD_STATUS_CONFIG, EVENT_TYPES, type Lead, type LeadStatus } from "@/types/database";

type PaymentFilter = "all" | "paid" | "owing";
type ArchiveFilter = "active" | "archived" | "all";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ALL_COLUMNS: LeadStatus[] = [
  "novo",
  "em_conversa",
  "aguardando",
  "confirmado",
  "finalizado",
  "nao_convertido",
];

function SortableLeadCard({
  lead,
  onOpen,
  paymentSummary,
  onArchive,
  onUnarchive,
  onFinalize,
  onDelete,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
  paymentSummary?: LeadPaymentSummary | null;
  onArchive: (l: Lead) => void;
  onUnarchive: (l: Lead) => void;
  onFinalize: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <LeadCard
        lead={lead}
        onOpen={onOpen}
        isDragging={isDragging}
        paymentSummary={paymentSummary}
        dragHandleProps={listeners}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onFinalize={onFinalize}
        onDelete={onDelete}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  leads,
  onOpen,
  isOver,
  paymentSummaries,
  onArchive,
  onUnarchive,
  onFinalize,
  onDelete,
}: {
  status: LeadStatus;
  leads: Lead[];
  onOpen: (l: Lead) => void;
  isOver?: boolean;
  paymentSummaries: Record<string, LeadPaymentSummary>;
  onArchive: (l: Lead) => void;
  onUnarchive: (l: Lead) => void;
  onFinalize: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}) {
  const config = LEAD_STATUS_CONFIG[status];
  const styles = KANBAN_COLUMN_STYLES[status];
  const { setNodeRef, isOver: dropOver } = useDroppable({ id: status });

  const highlighted = isOver || dropOver;

  return (
    <div className="flex h-full w-[min(340px,88vw)] shrink-0 flex-col sm:w-[340px]">
      <div
        className={cn(
          "mb-3 flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3",
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
            "kanban-col-scroll flex min-h-[120px] flex-1 flex-col gap-3 rounded-2xl p-3 transition-all duration-200",
            styles.body,
            highlighted && "border-primary bg-primary/5 ring-2 ring-primary/30 dark:bg-primary/15"
          )}
        >
          {leads.length === 0 ? (
            <div
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-2 rounded-xl px-4 py-10 text-center",
                highlighted ? "opacity-100" : "opacity-70"
              )}
            >
              <Inbox className={cn("h-8 w-8", styles.emptyIcon)} strokeWidth={1.5} />
              <p className={cn("text-sm font-bold", styles.emptyTitle)}>
                {highlighted ? "Solte o card aqui" : "Nenhum lead"}
              </p>
              <p className={cn("text-xs font-semibold", styles.emptySubtitle)}>
                Arraste cards para esta coluna
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onOpen={onOpen}
                paymentSummary={paymentSummaries[lead.id]}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                onFinalize={onFinalize}
                onDelete={onDelete}
              />
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

export function KanbanBoard({ className }: { className?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("active");
  const [showFinalized, setShowFinalized] = useState(false);
  const [paymentSummaries, setPaymentSummaries] = useState<
    Record<string, LeadPaymentSummary>
  >({});

  const visibleColumns = useMemo(
    () =>
      showFinalized
        ? ALL_COLUMNS
        : ALL_COLUMNS.filter((c) => c !== "finalizado"),
    [showFinalized]
  );

  const updateBoardScroll = useCallback(() => {
    const el = boardScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollBoard = useCallback((direction: "left" | "right") => {
    boardScrollRef.current?.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const el = boardScrollRef.current;
    if (!el) return;

    updateBoardScroll();
    el.addEventListener("scroll", updateBoardScroll, { passive: true });

    const ro = new ResizeObserver(updateBoardScroll);
    ro.observe(el);

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) && !e.shiftKey) return;
      el.scrollLeft += e.shiftKey ? e.deltaY : e.deltaX;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", updateBoardScroll);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, [updateBoardScroll, visibleColumns.length]);

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
      const [leadsRes, payRes] = await Promise.all([
        supabase.from("leads").select("*").order("arrived_at", { ascending: false }),
        fetch("/api/payments/summary", { cache: "no-store" }),
      ]);

      if (leadsRes.error) {
        toast.error("Erro ao carregar leads");
      } else if (leadsRes.data) {
        setLeads(leadsRes.data as Lead[]);
        setLastSync(new Date());
      }

      if (payRes.ok) {
        const payData = await payRes.json();
        setPaymentSummaries(payData.by_lead ?? {});
      }

      fetch("/api/payments/sync-calendar", { method: "POST" }).catch(() => {});

      const finRes = await fetch("/api/leads/finalize-past", { method: "POST" });
      if (finRes.ok) {
        const finData = await finRes.json();
        if (finData.finalized > 0) {
          const { data: refreshed } = await supabase
            .from("leads")
            .select("*")
            .order("arrived_at", { ascending: false });
          if (refreshed) setLeads(refreshed as Lead[]);
          toast.info(
            `${finData.finalized} evento(s) movido(s) para Finalizado`,
            { duration: 4000 }
          );
        }
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

    if (archiveFilter === "active" && l.archived_at) return false;
    if (archiveFilter === "archived" && !l.archived_at) return false;

    if (!showFinalized && l.status === "finalizado") return false;

    const pay = paymentSummaries[l.id];
    if (paymentFilter === "paid") {
      if (pay?.status !== "paid") return false;
    }
    if (paymentFilter === "owing") {
      if (l.status !== "confirmado" && l.status !== "finalizado") return false;
      if (!pay || pay.status === "paid" || pay.status === "none") return false;
    }

    return true;
  });

  const patchLead = async (leadId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Erro ao atualizar");
    return res.json() as Promise<Lead>;
  };

  const handleArchive = async (lead: Lead) => {
    try {
      const updated = await patchLead(lead.id, { archived_at: new Date().toISOString() });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
      toast.success(`${lead.name} arquivado`);
    } catch {
      toast.error("Erro ao arquivar");
    }
  };

  const handleUnarchive = async (lead: Lead) => {
    try {
      const updated = await patchLead(lead.id, { archived_at: null });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
      toast.success(`${lead.name} desarquivado`);
    } catch {
      toast.error("Erro ao desarquivar");
    }
  };

  const handleFinalize = async (lead: Lead) => {
    try {
      const updated = await patchLead(lead.id, {
        status: "finalizado",
        finalized_at: new Date().toISOString(),
      });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
      toast.success(`${lead.name} marcado como finalizado`);
    } catch {
      toast.error("Erro ao finalizar");
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`Excluir permanentemente o lead "${lead.name}"?`)) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      toast.success(`${lead.name} excluído`);
    } catch {
      toast.error("Erro ao excluir");
    }
  };

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
    if (ALL_COLUMNS.includes(id as LeadStatus)) {
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

    if (!ALL_COLUMNS.includes(newStatus)) {
      const overLead = leads.find((l) => l.id === over.id);
      if (overLead) newStatus = overLead.status;
      else return;
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const patch: Record<string, unknown> = { status: newStatus };
    if (newStatus === "finalizado") {
      patch.finalized_at = new Date().toISOString();
    }

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status: newStatus, finalized_at: patch.finalized_at as string | undefined ?? l.finalized_at }
          : l
      )
    );

    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
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
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border-2 border-border bg-card p-3 shadow-card sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1 xl:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-2 pl-10 font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:flex-wrap xl:items-center">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-full border-2 font-medium xl:w-[180px]">
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
            <Select
              value={paymentFilter}
              onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}
            >
              <SelectTrigger className="w-full border-2 font-medium xl:w-[160px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos pagamentos</SelectItem>
                <SelectItem value="paid">✅ Quitados</SelectItem>
                <SelectItem value="owing">⏳ Falta receber</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={archiveFilter}
              onValueChange={(v) => setArchiveFilter(v as ArchiveFilter)}
            >
              <SelectTrigger className="w-full border-2 font-medium xl:w-[140px]">
                <SelectValue placeholder="Arquivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="archived">📦 Arquivados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={showFinalized ? "secondary" : "outline"}
              size="sm"
              className="col-span-2 border-2 font-semibold sm:col-span-1 xl:col-span-auto"
              onClick={() => setShowFinalized((v) => !v)}
            >
              🏁 {showFinalized ? "Ocultar finalizados" : "Ver finalizados"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddLeadButton onCreated={() => loadLeads()} />
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
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {visibleColumns.map((col) => {
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
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onOpen={setSelectedLead}
                  paymentSummary={paymentSummaries[lead.id]}
                  onArchive={handleArchive}
                  onUnarchive={handleUnarchive}
                  onFinalize={handleFinalize}
                  onDelete={handleDelete}
                />
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
        <div className="relative hidden min-h-0 flex-1 flex-col lg:flex">
          <div className="mb-2 flex shrink-0 items-center gap-2">
            <p className="mr-auto hidden text-xs font-medium text-muted-foreground xl:block">
              Role horizontalmente na barra abaixo ou use as setas para ver mais colunas
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 border-2"
              disabled={!canScrollLeft}
              onClick={() => scrollBoard("left")}
              aria-label="Colunas anteriores"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 border-2"
              disabled={!canScrollRight}
              onClick={() => scrollBoard("right")}
              aria-label="Próximas colunas"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div
            ref={boardScrollRef}
            className="kanban-h-scroll flex min-h-0 flex-1 gap-4 pb-1 pt-0.5"
          >
            {visibleColumns.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={filtered.filter((l) => l.status === status)}
                onOpen={setSelectedLead}
                isOver={overColumnId === status}
                paymentSummaries={paymentSummaries}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onFinalize={handleFinalize}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeLead ? (
            <div className="rotate-2 scale-[1.02] cursor-grabbing">
              <LeadCard
                lead={activeLead}
                onOpen={() => {}}
                isDragging
                paymentSummary={paymentSummaries[activeLead.id]}
              />
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
