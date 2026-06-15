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
import { formatCurrency } from "@/lib/utils";
import { ReportToolbar } from "@/components/finance/report-toolbar";
import { useReportBranding } from "@/components/finance/use-report-branding";
import { exportToExcel, exportToPdf, printReport } from "@/lib/report-export";

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
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CHART.entradas }}
            />
            Entradas
          </span>
          <span className="font-bold tabular-nums">{formatCurrency(Number(entradas))}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 font-medium text-rose-700">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CHART.saidas }}
            />
            Saídas
          </span>
          <span className="font-bold tabular-nums">{formatCurrency(Number(saidas))}</span>
        </div>
        <div className="border-t border-border/60 pt-1.5 flex items-center justify-between gap-4">
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

function CashflowLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold">
      <span className="inline-flex items-center gap-2 text-emerald-800">
        <span
          className="h-3 w-3 rounded-md"
          style={{ backgroundColor: CHART.entradas }}
        />
        Entradas
      </span>
      <span className="inline-flex items-center gap-2 text-rose-800">
        <span
          className="h-3 w-3 rounded-md"
          style={{ backgroundColor: CHART.saidas }}
        />
        Saídas
      </span>
    </div>
  );
}

type CashflowData = {
  receivables: {
    pendingTotal: number;
    heldTotal: number;
    availableTotal: number;
    receivedTotal: number;
  };
  payables: { pendingTotal: number; paidTotal: number; overdueTotal: number };
  monthReceivedIn: number;
  monthPaidOut: number;
  monthBalance: number;
  availableBalance: number;
  monthlyFlow: { month: string; in: number; out: number; balance: number }[];
};

export default function FluxoDeCaixaPage() {
  const branding = useReportBranding();
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/cashflow", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = (data?.monthlyFlow ?? []).map((m) => ({
    month: new Date(`${m.month}-01`).toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    }),
    Entradas: m.in,
    Saídas: m.out,
    Saldo: m.balance,
  }));

  const exportRows =
    data?.monthlyFlow.map((m) => ({
      mes: m.month,
      entradas: m.in,
      saidas: m.out,
      saldo: m.balance,
    })) ?? [];

  const columns = [
    { key: "mes", header: "Mês" },
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

  return (
    <div className="space-y-5 sm:space-y-6">
      <FinancePageHeader
        title="Fluxo de caixa"
        description="Visão consolidada de entradas, saídas e saldo disponível — incluindo eventos do CRM e recebíveis manuais."
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
                summaryLines: data
                  ? [
                      `Receita disponível: ${formatCurrency(data.receivables.availableTotal)}`,
                      `Recebido retido: ${formatCurrency(data.receivables.heldTotal)}`,
                      `A receber: ${formatCurrency(data.receivables.pendingTotal)}`,
                      `Despesas pendentes: ${formatCurrency(data.payables.pendingTotal)}`,
                      `Saldo do mês: ${formatCurrency(data.monthBalance)}`,
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceStatCard
          label="Receita disponível"
          value={formatCurrency(data?.receivables.availableTotal ?? 0)}
          icon={Wallet}
          tone="emerald"
        />
        <FinanceStatCard
          label="Recebido retido"
          value={formatCurrency(data?.receivables.heldTotal ?? 0)}
          icon={Clock}
          tone="sky"
        />
        <FinanceStatCard
          label="A receber"
          value={formatCurrency(data?.receivables.pendingTotal ?? 0)}
          icon={TrendingUp}
          tone="amber"
        />
        <FinanceStatCard
          label="Despesas pendentes"
          value={formatCurrency(data?.payables.pendingTotal ?? 0)}
          icon={ArrowUpRight}
          tone="rose"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label="Entradas no mês"
          value={formatCurrency(data?.monthReceivedIn ?? 0)}
          icon={ArrowDownLeft}
          tone="emerald"
          hint="Pagamentos recebidos neste mês"
        />
        <FinanceStatCard
          label="Saídas no mês"
          value={formatCurrency(data?.monthPaidOut ?? 0)}
          icon={ArrowUpRight}
          tone="rose"
          hint="Despesas pagas neste mês"
        />
        <FinanceStatCard
          label="Resultado do mês"
          value={formatCurrency(data?.monthBalance ?? 0)}
          icon={TrendingUp}
          tone={(data?.monthBalance ?? 0) >= 0 ? "emerald" : "rose"}
          hint="Entradas menos saídas"
        />
      </div>

      <FinancePanel
        title="Entradas x Saídas"
        description="Últimos 6 meses — verde = recebimentos, vermelho = despesas pagas"
      >
        {!loading && chartData.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
            <p className="font-semibold">Sem movimentação nos últimos meses</p>
            <p className="mt-1 text-xs">Os dados aparecerão quando houver recebimentos ou pagamentos.</p>
          </div>
        ) : (
          <>
            <CashflowLegend />
            <div className="h-72 rounded-xl bg-gradient-to-b from-muted/20 to-transparent p-2 sm:p-3">
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Carregando gráfico...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    barGap={4}
                    barCategoryGap="24%"
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={CHART.grid}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
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
                    <Tooltip
                      content={<CashflowTooltip />}
                      cursor={{ fill: "rgba(217, 78, 31, 0.06)" }}
                    />
                    <Bar
                      dataKey="Entradas"
                      name="Entradas"
                      fill={CHART.entradas}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="Saídas"
                      name="Saídas"
                      fill={CHART.saidas}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </FinancePanel>

      <div id="cashflow-report" className="hidden print:block">
        <h1>{branding.businessName}</h1>
        {branding.cnpj && <p>CNPJ: {branding.cnpj}</p>}
        <h2>Fluxo de Caixa</h2>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Entradas</th>
              <th>Saídas</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {exportRows.map((r) => (
              <tr key={r.mes}>
                <td>{r.mes}</td>
                <td>{formatCurrency(r.entradas)}</td>
                <td>{formatCurrency(r.saidas)}</td>
                <td>{formatCurrency(r.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
