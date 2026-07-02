"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Plus,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  RECEIVABLE_BUCKET_LABELS,
  type ReceivableBucket,
  type ReceivableLeadRow,
  type ReceivablesSummary,
} from "@/lib/receivables";
import { FinancePageHeader, FinancePanel } from "@/components/finance/finance-page-header";
import { FinanceListFilters } from "@/components/finance/finance-list-filters";
import { FinancePeriodSelector } from "@/components/finance/finance-period-selector";
import { ClientProfitPanel } from "@/components/finance/client-profit-panel";
import { ReceivableContractCell } from "@/components/finance/receivable-contract-cell";
import { useFinancePeriod } from "@/components/finance/use-finance-period";
import { FinanceStatCard } from "@/components/finance/finance-stat-card";
import { ManualReceivableDialog } from "@/components/finance/manual-receivable-dialog";
import { ReceivableDetailPanel } from "@/components/finance/receivable-detail-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ReportToolbar } from "@/components/finance/report-toolbar";
import { useReportBranding } from "@/components/finance/use-report-branding";
import { exportToExcel, exportToPdf, printReport } from "@/lib/report-export";
import { matchesSearch } from "@/lib/search-text";
import { formatPeriodLabel, getDefaultPeriodRange } from "@/lib/finance-period";
import { buildClientProfitRows } from "@/lib/client-profit";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PageConfirm =
  | { kind: "release"; row: ReceivableLeadRow }
  | { kind: "hold"; row: ReceivableLeadRow }
  | { kind: "delete"; id: string; clientName: string };

const RECEBER_SITUACAO_SHEET_COLUMNS = [
  { key: "situacao", header: "Situação", excel: { type: "text" as const, width: 22 } },
  { key: "qtd", header: "Qtd. clientes", excel: { type: "number" as const, sum: true, width: 14, currency: false } },
  { key: "contrato", header: "Contrato (R$)", excel: { type: "number" as const, sum: true, width: 16 } },
  { key: "recebido", header: "Recebido (R$)", excel: { type: "number" as const, sum: true, width: 16 } },
  { key: "aReceber", header: "A receber (R$)", excel: { type: "number" as const, sum: true, width: 16 } },
  { key: "retido", header: "Retido (R$)", excel: { type: "number" as const, sum: true, width: 16 } },
  { key: "disponivel", header: "Disponível (R$)", excel: { type: "number" as const, sum: true, width: 16 } },
];

const RECEBER_CLIENT_SHEET_COLUMNS = [
  { key: "cliente", header: "Cliente", excel: { type: "text" as const, width: 28 } },
  { key: "recebido", header: "Recebido no período (R$)", excel: { type: "number" as const, sum: true, width: 22 } },
  { key: "despesas", header: "Despesas no período (R$)", excel: { type: "number" as const, sum: true, width: 22 } },
  { key: "resultado", header: "Resultado (R$)", excel: { type: "number" as const, sum: true, width: 18 } },
];

export default function ContasAReceberPage() {
  const branding = useReportBranding();
  const { mode, range, setMode, setRange } = useFinancePeriod("week");
  const [data, setData] = useState<ReceivablesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [bucket, setBucket] = useState<ReceivableBucket | "all">("all");
  const [eventType, setEventType] = useState("all");
  const [search, setSearch] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [selected, setSelected] = useState<ReceivableLeadRow | null>(null);
  const [pageConfirm, setPageConfirm] = useState<PageConfirm | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("from", range.from);
    params.set("to", range.to);
    if (bucket !== "all") params.set("bucket", bucket);
    if (eventType !== "all") params.set("event_type", eventType);
    const res = await fetch(`/api/finance/receivables?${params}`, {
      cache: "no-store",
    });
    const json = await res.json();
    setData(json);
    setEventTypes(json.eventTypes ?? []);
    setSelected((prev) => {
      if (!prev) return null;
      return (
        (json.rows as ReceivableLeadRow[] | undefined)?.find(
          (r) => r.source === prev.source && r.leadId === prev.leadId
        ) ?? null
      );
    });
    setLoading(false);
  }, [range.from, range.to, bucket, eventType]);

  useEffect(() => {
    load();
  }, [load]);

  const clearFilters = () => {
    setRange(getDefaultPeriodRange(mode));
    setBucket("all");
    setEventType("all");
    setSearch("");
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    bucket !== "all" ||
    eventType !== "all" ||
    range.from !== getDefaultPeriodRange(mode).from ||
    range.to !== getDefaultPeriodRange(mode).to;

  const periodLabel = formatPeriodLabel(range, mode);

  const filteredRows = useMemo(() => {
    const rows = data?.rows ?? [];
    if (!search.trim()) return rows;
    return rows.filter((r) =>
      matchesSearch(search, r.clientName, r.eventType ?? undefined)
    );
  }, [data?.rows, search]);

  const openDetail = (r: ReceivableLeadRow) => setSelected(r);

  const releaseUrl = (id: string, source: "lead" | "manual") =>
    `/api/finance/receivables/${id}/release${source === "manual" ? "?source=manual" : ""}`;

  const executePageConfirm = async () => {
    if (!pageConfirm) return;
    setConfirmLoading(true);
    try {
      if (pageConfirm.kind === "release" || pageConfirm.kind === "hold") {
        const { row } = pageConfirm;
        setReleasingId(row.leadId);
        const res = await fetch(releaseUrl(row.leadId, row.source), {
          method: pageConfirm.kind === "release" ? "POST" : "DELETE",
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error || "Erro ao atualizar saldo");
          return;
        }
        toast.success(
          pageConfirm.kind === "release"
            ? "Saldo confirmado como disponível"
            : "Saldo voltou para retido"
        );
      } else {
        const res = await fetch(
          `/api/finance/manual-receivables/${pageConfirm.id}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          toast.error("Erro ao remover");
          return;
        }
        toast.success("Recebível removido");
      }
      setPageConfirm(null);
      load();
    } finally {
      setConfirmLoading(false);
      setReleasingId(null);
    }
  };

  const askRelease = (row: ReceivableLeadRow) =>
    setPageConfirm({ kind: "release", row });
  const askHold = (row: ReceivableLeadRow) =>
    setPageConfirm({ kind: "hold", row });
  const askDeleteManual = (id: string, clientName: string) =>
    setPageConfirm({ kind: "delete", id, clientName });

  const clientProfitRows = useMemo(
    () =>
      buildClientProfitRows(
        filteredRows
          .filter((r) => (r.receivedInPeriod ?? 0) > 0)
          .map((r) => ({
            leadId: r.source === "lead" ? r.leadId : null,
            clientName: r.clientName,
            amount: r.receivedInPeriod ?? 0,
          })),
        filteredRows
          .filter((r) => (r.expensesInPeriod ?? 0) > 0 && r.source === "lead")
          .map((r) => ({
            leadId: r.leadId,
            clientName: r.clientName,
            amount: r.expensesInPeriod ?? 0,
          }))
      ),
    [filteredRows]
  );

  const exportRows = filteredRows.map((r) => ({
    origem: r.source === "manual" ? "Manual" : "Evento CRM",
    cliente: r.clientName,
    data: r.eventDate ? formatDate(r.eventDate) : "—",
    recebidoPeriodo: r.receivedInPeriod ?? 0,
    despesasPeriodo: r.expensesInPeriod ?? 0,
    resultadoPeriodo: r.profitInPeriod ?? 0,
    tipo: r.eventType ?? "—",
    contrato: r.contractTotal,
    recebido: r.received,
    aReceber: r.pending,
    retido: r.held,
    disponivel: r.available,
    situacao: RECEIVABLE_BUCKET_LABELS[r.bucket].label,
  }));

  const situacaoSummaryRows = useMemo(() => {
    type Acc = {
      situacao: string;
      qtd: number;
      contrato: number;
      recebido: number;
      aReceber: number;
      retido: number;
      disponivel: number;
    };
    const map = new Map<string, Acc>();
    for (const row of exportRows) {
      const cur = map.get(row.situacao) ?? {
        situacao: row.situacao,
        qtd: 0,
        contrato: 0,
        recebido: 0,
        aReceber: 0,
        retido: 0,
        disponivel: 0,
      };
      cur.qtd += 1;
      cur.contrato += row.contrato;
      cur.recebido += row.recebido;
      cur.aReceber += row.aReceber;
      cur.retido += row.retido;
      cur.disponivel += row.disponivel;
      map.set(row.situacao, cur);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.situacao.localeCompare(b.situacao, "pt-BR")
    );
  }, [exportRows]);

  const columns = [
    { key: "origem", header: "Origem", excel: { type: "text" as const, width: 14 } },
    { key: "cliente", header: "Cliente", excel: { type: "text" as const, width: 28 } },
    { key: "data", header: "Data evento", excel: { type: "text" as const, width: 14 } },
    { key: "tipo", header: "Tipo de evento", excel: { type: "text" as const, width: 18 } },
    { key: "situacao", header: "Situação", excel: { type: "text" as const, width: 18 } },
    {
      key: "contrato",
      header: "Contrato (R$)",
      excel: { type: "number" as const, sum: true, width: 16 },
      format: (r: { contrato: number }) => formatCurrency(r.contrato),
    },
    {
      key: "recebido",
      header: "Recebido (R$)",
      excel: { type: "number" as const, sum: true, width: 16 },
      format: (r: { recebido: number }) => formatCurrency(r.recebido),
    },
    {
      key: "aReceber",
      header: "A receber (R$)",
      excel: { type: "number" as const, sum: true, width: 16 },
      format: (r: { aReceber: number }) => formatCurrency(r.aReceber),
    },
    {
      key: "retido",
      header: "Retido (R$)",
      excel: { type: "number" as const, sum: true, width: 16 },
      format: (r: { retido: number }) => formatCurrency(r.retido),
    },
    {
      key: "disponivel",
      header: "Disponível (R$)",
      excel: { type: "number" as const, sum: true, width: 16 },
      format: (r: { disponivel: number }) => formatCurrency(r.disponivel),
    },
    {
      key: "recebidoPeriodo",
      header: "Recebido no período (R$)",
      excel: { type: "number" as const, sum: true, width: 22 },
      format: (r: { recebidoPeriodo: number }) => formatCurrency(r.recebidoPeriodo),
    },
    {
      key: "despesasPeriodo",
      header: "Despesas no período (R$)",
      excel: { type: "number" as const, sum: true, width: 22 },
      format: (r: { despesasPeriodo: number }) => formatCurrency(r.despesasPeriodo),
    },
    {
      key: "resultadoPeriodo",
      header: "Resultado no período (R$)",
      excel: { type: "number" as const, sum: true, width: 22 },
      format: (r: { resultadoPeriodo: number }) => formatCurrency(r.resultadoPeriodo),
    },
  ];

  const filterMeta = [
    { label: "Período", value: periodLabel },
    { label: "De", value: formatDate(range.from) },
    { label: "Até", value: formatDate(range.to) },
    ...(bucket !== "all"
      ? [{ label: "Situação", value: RECEIVABLE_BUCKET_LABELS[bucket].label }]
      : []),
    ...(eventType !== "all" ? [{ label: "Tipo", value: eventType }] : []),
    ...(search.trim() ? [{ label: "Busca", value: search.trim() }] : []),
  ];

  const excelExtraSheets = useMemo(() => {
    const sheets: {
      name: string;
      columns: typeof RECEBER_SITUACAO_SHEET_COLUMNS;
      rows: Record<string, unknown>[];
    }[] = [];
    if (situacaoSummaryRows.length) {
      sheets.push({
        name: "Por situação",
        columns: RECEBER_SITUACAO_SHEET_COLUMNS,
        rows: situacaoSummaryRows,
      });
    }
    if (clientProfitRows.length) {
      sheets.push({
        name: "Por cliente",
        columns: RECEBER_CLIENT_SHEET_COLUMNS,
        rows: clientProfitRows.map((r) => ({
          cliente: r.clientName,
          recebido: r.receivedInPeriod,
          despesas: r.expensesInPeriod,
          resultado: r.profit,
        })),
      });
    }
    return sheets.length ? sheets : undefined;
  }, [situacaoSummaryRows, clientProfitRows]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <FinancePageHeader
        title="Contas a receber"
        description="Recebimentos dos eventos confirmados no CRM e lançamentos manuais retroativos. Confirme quando o saldo retido puder ser usado."
        actions={
          <div className="flex flex-wrap gap-2">
            <ReportToolbar
              disabled={!filteredRows.length}
              onExportExcel={() =>
                exportToExcel({
                  filename: "contas-a-receber",
                  sheetName: "Recebíveis",
                  title: "Contas a Receber",
                  branding,
                  filters: filterMeta,
                  summaryLines: data
                    ? [
                        {
                          label: "Saldo disponível",
                          value: data.netAvailableBalance ?? 0,
                        },
                        {
                          label: "Recebido no período",
                          value: data.receivedInPeriodTotal ?? 0,
                        },
                        {
                          label: "Recebido retido",
                          value: data.heldTotal ?? 0,
                        },
                        {
                          label: "Resultado do período",
                          value: data.profitInPeriodTotal ?? 0,
                        },
                        {
                          label: "Total a receber (lista)",
                          value: data.pendingTotal ?? 0,
                        },
                      ]
                    : [],
                  columns,
                  rows: exportRows,
                  footnote:
                    "Colunas em R$ são valores numéricos (pode usar =SOMA, =MÉDIA etc.). A linha TOTAL GERAL soma automaticamente. Use os filtros do Excel no cabeçalho da tabela.",
                  extraSheets: excelExtraSheets,
                })
              }
              onExportPdf={() =>
                exportToPdf({
                  filename: "contas-a-receber",
                  title: "Contas a Receber",
                  branding,
                  filters: filterMeta,
                  summaryLines: data
                    ? [
                        `A receber: ${formatCurrency(data.pendingTotal)}`,
                        `Recebido retido: ${formatCurrency(data.heldTotal)}`,
                        `Receita disponível: ${formatCurrency(data.availableTotal)}`,
                      ]
                    : [],
                  columns,
                  rows: exportRows,
                })
              }
              onPrint={() => printReport("receivables-report")}
            />
            <Button className="gap-2" onClick={() => setShowManual(true)}>
              <Plus className="h-4 w-4" />
              Novo recebível
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-card to-sky-500/5 p-4 sm:p-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Retido:</strong> já entrou na conta,
              mas ainda não liberado para uso.
            </p>
            <p>
              <strong className="text-foreground">Disponível:</strong> liberado
              quando você confirma o saldo ou após o evento ser finalizado.
            </p>
          </div>
        </div>
      </div>

      <FinancePeriodSelector
        mode={mode}
        range={range}
        onModeChange={setMode}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard
          label="Saldo disponível"
          value={formatCurrency(data?.netAvailableBalance ?? 0)}
          icon={Wallet}
          tone="emerald"
          hint="Receita liberada menos despesas pagas"
        />
        <FinanceStatCard
          label="Recebido no período"
          value={formatCurrency(data?.receivedInPeriodTotal ?? 0)}
          icon={ArrowDownCircle}
          tone="emerald"
          hint={`Eventos com data em ${periodLabel.toLowerCase()}`}
        />
        <FinanceStatCard
          label="Recebido retido"
          value={formatCurrency(data?.heldTotal ?? 0)}
          icon={Banknote}
          tone="sky"
          hint="Retido dos eventos deste período"
        />
        <FinanceStatCard
          label="Resultado do período"
          value={formatCurrency(data?.profitInPeriodTotal ?? 0)}
          icon={Clock}
          tone={(data?.profitInPeriodTotal ?? 0) >= 0 ? "emerald" : "rose"}
          hint="Recebido dos eventos menos despesas vinculadas"
        />
      </div>

      <FinanceListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por cliente ou tipo de evento..."
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        description="Busque por cliente e refine a lista do período selecionado"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Situação</Label>
            <Select
              value={bucket}
              onValueChange={(v) => setBucket(v as ReceivableBucket | "all")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">A receber</SelectItem>
                <SelectItem value="held">Recebido retido</SelectItem>
                <SelectItem value="available">Receita disponível</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de evento</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {eventTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FinanceListFilters>

      <ClientProfitPanel
        rows={clientProfitRows}
        periodLabel={periodLabel}
        loading={loading}
      />

      <FinancePanel
        title="Recebíveis"
        description="Eventos com data no período selecionado — pagamentos antecipados de outras datas não entram aqui"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Carregando recebíveis...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ArrowDownCircle className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "Nenhum recebível encontrado com estes filtros."
                : "Nenhum recebível cadastrado."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowManual(true)}>
                Cadastrar recebível manual
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {filteredRows.map((r) => (
                <article
                  key={`${r.source}-${r.leadId}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(r)}
                  onKeyDown={(e) => e.key === "Enter" && openDetail(r)}
                  className="cursor-pointer rounded-xl border border-border/80 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{r.clientName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.eventDate ? formatDate(r.eventDate) : "Sem data"} ·{" "}
                        {r.source === "manual" ? "Manual" : "Evento CRM"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-2xs font-bold",
                        RECEIVABLE_BUCKET_LABELS[r.bucket].color
                      )}
                    >
                      {RECEIVABLE_BUCKET_LABELS[r.bucket].label}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Contrato</dt>
                      <dd className="font-semibold">
                        <ReceivableContractCell row={r} onUpdated={load} compact />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Recebido</dt>
                      <dd className="font-semibold">{formatCurrency(r.received)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">A receber</dt>
                      <dd className="font-semibold text-amber-700">
                        {formatCurrency(r.pending)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Disponível</dt>
                      <dd className="font-semibold text-emerald-700">
                        {formatCurrency(r.available)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => openDetail(r)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Acompanhar
                    </Button>
                    {r.held > 0 && r.received > 0 && (
                      <Button
                        size="sm"
                        className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-600/90"
                        disabled={releasingId === r.leadId}
                        onClick={() => askRelease(r)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Liberar
                      </Button>
                    )}
                    {r.manuallyReleased && r.received > 0 && r.held === 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs border-sky-300 bg-sky-50 text-sky-900"
                        disabled={releasingId === r.leadId}
                        onClick={() => askHold(r)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retido
                      </Button>
                    )}
                    {r.source === "manual" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger hover:bg-rose-50"
                        onClick={() => askDeleteManual(r.leadId, r.clientName)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-3">Cliente</th>
                    <th className="pb-3 pr-3">Origem</th>
                    <th className="pb-3 pr-3">Data</th>
                    <th className="pb-3 pr-3 text-right">Recebido período</th>
                    <th className="pb-3 pr-3 text-right">Despesas</th>
                    <th className="pb-3 pr-3 text-right">Resultado</th>
                    <th className="pb-3 pr-3 text-right">Contrato</th>
                    <th className="pb-3 pr-3 text-right">Recebido</th>
                    <th className="pb-3 pr-3 text-right">A receber</th>
                    <th className="pb-3 pr-3 text-right">Retido</th>
                    <th className="pb-3 pr-3 text-right">Disponível</th>
                    <th className="pb-3 pr-3">Situação</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr
                      key={`${r.source}-${r.leadId}`}
                      className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                      onClick={() => openDetail(r)}
                    >
                      <td className="py-3.5 pr-3 font-medium">{r.clientName}</td>
                      <td className="py-3.5 pr-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-2xs font-bold",
                            r.source === "manual"
                              ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {r.source === "manual" ? "Manual" : "CRM"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-muted-foreground">
                        {r.eventDate ? formatDate(r.eventDate) : "—"}
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums text-emerald-700">
                        {formatCurrency(r.receivedInPeriod ?? 0)}
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums text-rose-700">
                        {formatCurrency(r.expensesInPeriod ?? 0)}
                      </td>
                      <td
                        className={cn(
                          "py-3.5 pr-3 text-right tabular-nums font-semibold",
                          (r.profitInPeriod ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"
                        )}
                      >
                        {formatCurrency(r.profitInPeriod ?? 0)}
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums">
                        <ReceivableContractCell row={r} onUpdated={load} compact />
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums">
                        {formatCurrency(r.received)}
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums text-amber-700">
                        {formatCurrency(r.pending)}
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums text-sky-700">
                        {formatCurrency(r.held)}
                      </td>
                      <td className="py-3.5 pr-3 text-right tabular-nums text-emerald-700">
                        {formatCurrency(r.available)}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-2xs font-bold",
                            RECEIVABLE_BUCKET_LABELS[r.bucket].color
                          )}
                        >
                          {RECEIVABLE_BUCKET_LABELS[r.bucket].label}
                        </span>
                      </td>
                      <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => openDetail(r)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Acompanhar
                          </Button>
                          {r.held > 0 && r.received > 0 && (
                            <Button
                              size="sm"
                              className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-600/90"
                              disabled={releasingId === r.leadId}
                              onClick={() => askRelease(r)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Liberar
                            </Button>
                          )}
                          {r.manuallyReleased && r.received > 0 && r.held === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs border-sky-300 bg-sky-50 text-sky-900"
                              disabled={releasingId === r.leadId}
                              onClick={() => askHold(r)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Retido
                            </Button>
                          )}
                          {r.source === "manual" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-danger hover:bg-rose-50"
                              onClick={() => askDeleteManual(r.leadId, r.clientName)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </FinancePanel>

      <div id="receivables-report" className="hidden print:block">
        <h1>{branding.businessName}</h1>
        {branding.cnpj && <p>CNPJ: {branding.cnpj}</p>}
        <h2>Contas a Receber</h2>
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exportRows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.header}>
                    {c.format ? c.format(r as never) : String(r[c.key as keyof typeof r])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pageConfirm?.kind === "release"}
        onOpenChange={(open) => !open && setPageConfirm(null)}
        variant="success"
        title="Liberar saldo recebido?"
        description={
          pageConfirm?.kind === "release" ? (
            <>
              O valor recebido de <strong>{pageConfirm.row.clientName}</strong> passará
              a contar como <strong>receita disponível</strong>.
              {pageConfirm.row.held > 0 && (
                <>
                  {" "}
                  Serão liberados{" "}
                  <strong>{formatCurrency(pageConfirm.row.held)}</strong>.
                </>
              )}
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Sim, liberar"
        loading={confirmLoading}
        onConfirm={executePageConfirm}
      />

      <ConfirmDialog
        open={pageConfirm?.kind === "hold"}
        onOpenChange={(open) => !open && setPageConfirm(null)}
        variant="warning"
        title="Marcar saldo como retido?"
        description={
          pageConfirm?.kind === "hold" ? (
            <>
              O saldo de <strong>{pageConfirm.row.clientName}</strong> voltará para{" "}
              <strong>recebido retido</strong> e deixará de contar como receita
              disponível.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Sim, marcar retido"
        loading={confirmLoading}
        onConfirm={executePageConfirm}
      />

      <ConfirmDialog
        open={pageConfirm?.kind === "delete"}
        onOpenChange={(open) => !open && setPageConfirm(null)}
        variant="danger"
        title="Remover recebível manual?"
        description={
          pageConfirm?.kind === "delete" ? (
            <>
              O cadastro manual de <strong>{pageConfirm.clientName}</strong> será
              removido da lista. Essa ação não pode ser desfeita.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Sim, remover"
        loading={confirmLoading}
        onConfirm={executePageConfirm}
      />

      <ReceivableDetailPanel
        row={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onUpdated={load}
      />

      <ManualReceivableDialog
        open={showManual}
        onClose={() => setShowManual(false)}
        onCreated={load}
      />
    </div>
  );
}
