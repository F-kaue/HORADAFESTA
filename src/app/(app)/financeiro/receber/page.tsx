"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
  type ReceivablesSummary,
} from "@/lib/receivables";
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
    setLoading(false);
  }, [from, to, bucket, eventType]);

  useEffect(() => {
    load();
  }, [load]);

  const releaseRevenue = async (leadId: string, clientName: string) => {
    if (
      !confirm(
        `Confirmar que o saldo recebido de ${clientName} já pode contar como receita disponível?`
      )
    ) {
      return;
    }
    setReleasingId(leadId);
    try {
      const res = await fetch(`/api/finance/receivables/${leadId}/release`, {
        method: "POST",
      });
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

  const holdRevenue = async (leadId: string, clientName: string) => {
    if (
      !confirm(
        `Voltar o saldo de ${clientName} para recebido retido? (só liberações manuais)`
      )
    ) {
      return;
    }
    setReleasingId(leadId);
    try {
      const res = await fetch(`/api/finance/receivables/${leadId}/release`, {
        method: "DELETE",
      });
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

  const eventTypes = useMemo(() => {
    const set = new Set((data?.rows ?? []).map((r) => r.eventType).filter(Boolean));
    return Array.from(set) as string[];
  }, [data]);

  const exportRows = (data?.rows ?? []).map((r) => ({
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
    <div className="space-y-6">
      <PageHeader
        title="Contas a receber"
        description="Recebimentos automáticos dos eventos confirmados"
        action={
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
        }
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4 text-sm">
          <Info className="h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1 text-muted-foreground">
            <p>
              <strong className="text-foreground">Recebido retido:</strong> valor
              que já entrou, mas o evento ainda não está na semana do evento. Use
              &quot;Confirmar saldo&quot; quando decidir que já pode usar esse valor.
            </p>
            <p>
              <strong className="text-foreground">Receita disponível:</strong>{" "}
              liberada automaticamente na semana do evento ou quando você confirma
              manualmente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["pending", "held", "available"] as ReceivableBucket[]).map((b) => (
          <Card key={b} className={cn("border", RECEIVABLE_BUCKET_LABELS[b].color)}>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase">
                {RECEIVABLE_BUCKET_LABELS[b].label}
              </p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(
                  b === "pending"
                    ? data?.pendingTotal ?? 0
                    : b === "held"
                      ? data?.heldTotal ?? 0
                      : data?.availableTotal ?? 0
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recebíveis por evento</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="py-3 pr-3">Cliente</th>
                  <th className="py-3 pr-3">Data</th>
                  <th className="py-3 pr-3">Contrato</th>
                  <th className="py-3 pr-3">Recebido</th>
                  <th className="py-3 pr-3">A receber</th>
                  <th className="py-3 pr-3">Retido</th>
                  <th className="py-3 pr-3">Disponível</th>
                  <th className="py-3 pr-3">Situação</th>
                  <th className="py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows ?? []).map((r) => (
                  <tr key={r.leadId} className="border-b">
                    <td className="py-3 pr-3 font-medium">{r.clientName}</td>
                    <td className="py-3 pr-3">
                      {r.eventDate ? formatDate(r.eventDate) : "—"}
                    </td>
                    <td className="py-3 pr-3">{formatCurrency(r.contractTotal)}</td>
                    <td className="py-3 pr-3">{formatCurrency(r.received)}</td>
                    <td className="py-3 pr-3 text-amber-700">
                      {formatCurrency(r.pending)}
                    </td>
                    <td className="py-3 pr-3 text-sky-700">
                      {formatCurrency(r.held)}
                    </td>
                    <td className="py-3 pr-3 text-emerald-700">
                      {formatCurrency(r.available)}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-full border px-2 py-0.5 text-2xs font-bold",
                            RECEIVABLE_BUCKET_LABELS[r.bucket].color
                          )}
                        >
                          {RECEIVABLE_BUCKET_LABELS[r.bucket].label}
                        </span>
                        {r.manuallyReleased && r.revenueRecognizedAt && (
                          <span className="text-2xs text-muted-foreground">
                            Confirmado em{" "}
                            {new Date(r.revenueRecognizedAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {r.held > 0 && r.received > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1 whitespace-nowrap text-xs"
                          disabled={releasingId === r.leadId}
                          onClick={() => releaseRevenue(r.leadId, r.clientName)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirmar saldo
                        </Button>
                      )}
                      {r.manuallyReleased && r.received > 0 && r.held === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-1 whitespace-nowrap text-xs text-muted-foreground"
                          disabled={releasingId === r.leadId}
                          onClick={() => holdRevenue(r.leadId, r.clientName)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Voltar a retido
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.rows.length && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      Nenhum recebível encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
