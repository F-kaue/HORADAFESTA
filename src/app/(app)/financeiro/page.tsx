"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { FinancePageHeader, FinancePanel } from "@/components/finance/finance-page-header";
import { FinanceStatCard } from "@/components/finance/finance-stat-card";
import { FinancePeriodSelector } from "@/components/finance/finance-period-selector";
import { ClientProfitPanel } from "@/components/finance/client-profit-panel";
import { useFinancePeriod } from "@/components/finance/use-finance-period";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatPeriodLabel } from "@/lib/finance-period";
import { ReportToolbar } from "@/components/finance/report-toolbar";
import { useReportBranding } from "@/components/finance/use-report-branding";
import { exportToExcel, exportToPdf, printReport } from "@/lib/report-export";
import type { ClientProfitRow } from "@/lib/client-profit";

const CHART = {
  entradas: "#16A34A",
  saidas: "#DC2626",
  grid: "#E8E4DE",
  axis: "#6B7280",
} as const;

function formatAxisCurrency(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)}k`;
  return formatCurrency(value);
}

type TooltipPayload = { name?: string; value?: number; color?: string };

function CashflowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const entradas = payload.find((p) => p.name === "Entradas")?.value ?? 0;
  const saidas = payload.find((p) => p.name === "Saídas")?.value ?? 0;
  const saldo = Number(entradas) - Number(saidas);

  return (
    <div className="min-w-[10rem] rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-elevated">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-emerald-700">Entradas</span>
          <span className="font-bold tabular-nums">{formatCurrency(Number(entradas))}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-rose-700">Saídas</span>
          <span className="font-bold tabular-nums">{formatCurrency(Number(saidas))}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-1.5">
          <span className="font-semibold text-foreground">Saldo</span>
          <span
            className={`font-bold tabular-nums ${saldo >= 0 ? "text-emerald-700" : "text-rose-700"}`}
          >
            {formatCurrency(saldo)}
          </span>
        </div>
      </div>
    </div>
  );
}

type CashflowData = {
  receivables: {
    pendingTotal: number;
    heldTotal: number;
    availableTotal: number;
  };
  payables: { pendingTotal: number };
  periodReceivedIn: number;
  periodPaidOut: number;
  periodBalance: number;
  netAvailableBalance: number;
  totalPaidPayables: number;
  clientProfit: ClientProfitRow[];
  periodFlow: { key: string; label: string; in: number; out: number; balance: number }[];
};

export default function FluxoDeCaixaPage() {
  const branding = useReportBranding();
  const { mode, range, setMode, setRange } = useFinancePeriod("week");
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);

  const periodLabel = formatPeriodLabel(range, mode);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: range.from,
        to: range.to,
        mode,
      });
      const res = await fetch(`/api/finance/cashflow?${params}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = (data?.periodFlow ?? []).map((m) => ({
    label: m.label,
    Entradas: m.in,
    Saídas: m.out,
    Saldo: m.balance,
  }));

  const exportRows =
    data?.periodFlow.map((m) => ({
      periodo: m.label,
      entradas: m.in,
      saidas: m.out,
      saldo: m.balance,
    })) ?? [];

  const clientExportRows =
    data?.clientProfit.map((r) => ({
      cliente: r.clientName,
      recebido: r.receivedInPeriod,
      despesas: r.expensesInPeriod,
      resultado: r.profit,
    })) ?? [];

  const columns = [
    { key: "periodo", header: "Período" },
    {
      key: "entradas",
      header: "Entradas",
      format: (r: { entradas: number }) => formatCurrency(r.entradas),
    },
    {
      key: "saidas",
      header: "Saídas",
      format: (r: { saidas: number }) => formatCurrency(r.saidas),
    },
    {
      key: "saldo",
      header: "Saldo",
      format: (r: { saldo: number }) => formatCurrency(r.saldo),
    },
  ];

  const filterMeta = [
    { label: "Período", value: periodLabel },
    { label: "De", value: formatDate(range.from) },
    { label: "Até", value: formatDate(range.to) },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <FinancePageHeader
        title="Fluxo de caixa"
        description="Acompanhe quanto entrou, quanto saiu e o lucro por cliente — despesas pagas abatem da receita disponível, nunca do retido."
        actions={
          <ReportToolbar
            disabled={!data || loading}
            onExportExcel={() =>
              exportToExcel("fluxo-de-caixa", columns, exportRows)
            }
            onExportPdf={() =>
              exportToPdf({
                filename: "fluxo-de-caixa",
                title: "Fluxo de Caixa",
                branding,
                filters: filterMeta,
                summaryLines: data
                  ? [
                      `Saldo disponível: ${formatCurrency(data.netAvailableBalance)}`,
                      `Recebido retido: ${formatCurrency(data.receivables.heldTotal)}`,
                      `Entradas no período: ${formatCurrency(data.periodReceivedIn)}`,
                      `Saídas no período: ${formatCurrency(data.periodPaidOut)}`,
                      `Resultado do período: ${formatCurrency(data.periodBalance)}`,
                    ]
                  : [],
                columns,
                rows: exportRows,
              })
            }
            onPrint={() => printReport("cashflow-report")}
          />
        }
      />

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
          hint="Receita liberada menos despesas já pagas"
        />
        <FinanceStatCard
          label="Recebido retido"
          value={formatCurrency(data?.receivables.heldTotal ?? 0)}
          icon={Clock}
          tone="sky"
          hint="Não é afetado por despesas"
        />
        <FinanceStatCard
          label="Entradas no período"
          value={formatCurrency(data?.periodReceivedIn ?? 0)}
          icon={ArrowDownLeft}
          tone="emerald"
          hint={`Recebimentos em ${periodLabel}`}
        />
        <FinanceStatCard
          label="Saídas no período"
          value={formatCurrency(data?.periodPaidOut ?? 0)}
          icon={ArrowUpRight}
          tone="rose"
          hint={`Despesas pagas em ${periodLabel}`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label="Resultado do período"
          value={formatCurrency(data?.periodBalance ?? 0)}
          icon={TrendingUp}
          tone={(data?.periodBalance ?? 0) >= 0 ? "emerald" : "rose"}
          hint="Entradas menos saídas no período"
        />
        <FinanceStatCard
          label="Receita liberada (bruta)"
          value={formatCurrency(data?.receivables.availableTotal ?? 0)}
          icon={Wallet}
          tone="emerald"
          hint="Antes de descontar despesas pagas"
        />
        <FinanceStatCard
          label="Despesas pendentes"
          value={formatCurrency(data?.payables.pendingTotal ?? 0)}
          icon={ArrowUpRight}
          tone="amber"
          hint="Ainda não pagas — não reduzem o saldo disponível"
        />
      </div>

      <FinancePanel
        title="Entradas x Saídas"
        description={
          mode === "week"
            ? "Movimentação diária da semana selecionada"
            : "Movimentação semanal do mês selecionado"
        }
      >
        {!loading && chartData.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
            <p className="font-semibold">Sem movimentação neste período</p>
          </div>
        ) : (
          <div className="h-72 rounded-xl bg-gradient-to-b from-muted/20 to-transparent p-2 sm:p-3">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Carregando gráfico...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: CHART.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatAxisCurrency}
                    width={56}
                  />
                  <Tooltip content={<CashflowTooltip />} />
                  <Bar dataKey="Entradas" fill={CHART.entradas} radius={[8, 8, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="Saídas" fill={CHART.saidas} radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </FinancePanel>

      <ClientProfitPanel
        rows={data?.clientProfit ?? []}
        periodLabel={periodLabel}
        loading={loading}
        reportId="client-profit-report"
      />

      <div id="cashflow-report" className="hidden print:block">
        <h1>{branding.businessName}</h1>
        {branding.cnpj && <p>CNPJ: {branding.cnpj}</p>}
        <h2>Fluxo de Caixa — {periodLabel}</h2>
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exportRows.map((r) => (
              <tr key={r.periodo}>
                <td>{r.periodo}</td>
                <td>{formatCurrency(r.entradas)}</td>
                <td>{formatCurrency(r.saidas)}</td>
                <td>{formatCurrency(r.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientExportRows.length > 0 && (
          <>
            <h3>Resultado por cliente</h3>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Recebido</th>
                  <th>Despesas</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {clientExportRows.map((r) => (
                  <tr key={r.cliente}>
                    <td>{r.cliente}</td>
                    <td>{formatCurrency(r.recebido)}</td>
                    <td>{formatCurrency(r.despesas)}</td>
                    <td>{formatCurrency(r.resultado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
