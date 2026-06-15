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
import { Input } from "@/components/ui/input";
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
import { FinanceStatCard } from "@/components/finance/finance-stat-card";
import { ManualReceivableDialog } from "@/components/finance/manual-receivable-dialog";
import { ReceivableDetailPanel } from "@/components/finance/receivable-detail-panel";
import { ReportToolbar } from "@/components/finance/report-toolbar";
import { useReportBranding } from "@/components/finance/use-report-branding";
import { exportToExcel, exportToPdf, printReport } from "@/lib/report-export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ContasAReceberPage() {
  const branding = useReportBranding();
  const [data, setData] = useState<ReceivablesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bucket, setBucket] = useState<ReceivableBucket | "all">("all");
  const [eventType, setEventType] = useState("all");
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [selected, setSelected] = useState<ReceivableLeadRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (bucket !== "all") params.set("bucket", bucket);
    if (eventType !== "all") params.set("event_type", eventType);
    const res = await fetch(`/api/finance/receivables?${params}`, {
      cache: "no-store",
    });
    const json = await res.json();
    setData(json);
    setSelected((prev) => {
      if (!prev) return null;
      return (
        (json.rows as ReceivableLeadRow[] | undefined)?.find(
          (r) => r.source === prev.source && r.leadId === prev.leadId
        ) ?? null
      );
    });
    setLoading(false);
  }, [from, to, bucket, eventType]);

  useEffect(() => {
    load();
  }, [load]);

  const eventTypes = useMemo(() => {
    const set = new Set((data?.rows ?? []).map((r) => r.eventType).filter(Boolean));
    return Array.from(set) as string[];
  }, [data]);

  const openDetail = (r: ReceivableLeadRow) => setSelected(r);

  const releaseUrl = (id: string, source: "lead" | "manual") =>
    `/api/finance/receivables/${id}/release${source === "manual" ? "?source=manual" : ""}`;

  const releaseRevenue = async (
    id: string,
    source: "lead" | "manual",
    clientName: string
  ) => {
    if (
      !confirm(
        `Confirmar que o saldo recebido de ${clientName} já pode contar como receita disponível?`
      )
    ) {
      return;
    }
    setReleasingId(id);
    try {
      const res = await fetch(releaseUrl(id, source), { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao liberar saldo");
        return;
      }
      toast.success("Saldo confirmado como disponível");
      load();
    } finally {
      setReleasingId(null);
    }
  };

  const holdRevenue = async (
    id: string,
    source: "lead" | "manual",
    clientName: string
  ) => {
    if (
      !confirm(`Voltar o saldo de ${clientName} para recebido retido?`)
    ) {
      return;
    }
    setReleasingId(id);
    try {
      const res = await fetch(releaseUrl(id, source), { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao atualizar");
        return;
      }
      toast.success("Saldo voltou para retido");
      load();
    } finally {
      setReleasingId(null);
    }
  };

  const removeManual = async (id: string, clientName: string) => {
    if (!confirm(`Remover o recebível manual de ${clientName}?`)) return;
    const res = await fetch(`/api/finance/manual-receivables/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Recebível removido");
    load();
  };

  const exportRows = (data?.rows ?? []).map((r) => ({
    origem: r.source === "manual" ? "Manual" : "Evento CRM",
    cliente: r.clientName,
    data: r.eventDate ? formatDate(r.eventDate) : "—",
    tipo: r.eventType ?? "—",
    contrato: r.contractTotal,
    recebido: r.received,
    aReceber: r.pending,
    retido: r.held,
    disponivel: r.available,
    situacao: RECEIVABLE_BUCKET_LABELS[r.bucket].label,
  }));

  const columns = [
    { key: "origem", header: "Origem" },
    { key: "cliente", header: "Cliente" },
    { key: "data", header: "Data evento" },
    { key: "tipo", header: "Tipo" },
    {
      key: "contrato",
      header: "Contrato",
      format: (r: { contrato: number }) => formatCurrency(r.contrato),
    },
    {
      key: "recebido",
      header: "Recebido",
      format: (r: { recebido: number }) => formatCurrency(r.recebido),
    },
    {
      key: "aReceber",
      header: "A receber",
      format: (r: { aReceber: number }) => formatCurrency(r.aReceber),
    },
    {
      key: "retido",
      header: "Retido",
      format: (r: { retido: number }) => formatCurrency(r.retido),
    },
    {
      key: "disponivel",
      header: "Disponível",
      format: (r: { disponivel: number }) => formatCurrency(r.disponivel),
    },
    { key: "situacao", header: "Situação" },
  ];

  const filterMeta = [
    ...(from ? [{ label: "De", value: formatDate(from) }] : []),
    ...(to ? [{ label: "Até", value: formatDate(to) }] : []),
    ...(bucket !== "all"
      ? [{ label: "Situação", value: RECEIVABLE_BUCKET_LABELS[bucket].label }]
      : []),
    ...(eventType !== "all" ? [{ label: "Tipo", value: eventType }] : []),
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <FinancePageHeader
        title="Contas a receber"
        description="Recebimentos dos eventos confirmados no CRM e lançamentos manuais retroativos. Confirme quando o saldo retido puder ser usado."
        actions={
          <div className="flex flex-wrap gap-2">
            <ReportToolbar
              disabled={!data?.rows.length}
              onExportExcel={() =>
                exportToExcel("contas-a-receber", columns, exportRows)
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
              <strong className="text-foreground">Disponível:</strong> liberado na
              semana do evento ou quando você confirma o saldo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label="A receber"
          value={formatCurrency(data?.pendingTotal ?? 0)}
          icon={Clock}
          tone="amber"
        />
        <FinanceStatCard
          label="Recebido retido"
          value={formatCurrency(data?.heldTotal ?? 0)}
          icon={Banknote}
          tone="sky"
        />
        <FinanceStatCard
          label="Receita disponível"
          value={formatCurrency(data?.availableTotal ?? 0)}
          icon={Wallet}
          tone="emerald"
        />
      </div>

      <FinancePanel title="Filtros" description="Refine a lista de recebíveis">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Data evento — de</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data evento — até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
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
      </FinancePanel>

      <FinancePanel
        title="Recebíveis"
        description="Clique em um cliente para acompanhar pagamentos e registrar recebimentos"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Carregando recebíveis...
          </div>
        ) : (data?.rows ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ArrowDownCircle className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum recebível com estes filtros.</p>
            <Button variant="outline" onClick={() => setShowManual(true)}>
              Cadastrar recebível manual
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {(data?.rows ?? []).map((r) => (
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
                      <dd className="font-semibold">{formatCurrency(r.contractTotal)}</dd>
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
                        variant="outline"
                        className="gap-1 text-xs"
                        disabled={releasingId === r.leadId}
                        onClick={() =>
                          releaseRevenue(r.leadId, r.source, r.clientName)
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirmar saldo
                      </Button>
                    )}
                    {r.source === "manual" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        onClick={() => removeManual(r.leadId, r.clientName)}
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
                  {(data?.rows ?? []).map((r) => (
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
                      <td className="py-3.5 pr-3 text-right tabular-nums">
                        {formatCurrency(r.contractTotal)}
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
                              variant="outline"
                              className="h-8 gap-1 text-xs"
                              disabled={releasingId === r.leadId}
                              onClick={() =>
                                releaseRevenue(r.leadId, r.source, r.clientName)
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Confirmar
                            </Button>
                          )}
                          {r.manuallyReleased && r.received > 0 && r.held === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs"
                              disabled={releasingId === r.leadId}
                              onClick={() =>
                                holdRevenue(r.leadId, r.source, r.clientName)
                              }
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {r.source === "manual" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-danger"
                              onClick={() => removeManual(r.leadId, r.clientName)}
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
