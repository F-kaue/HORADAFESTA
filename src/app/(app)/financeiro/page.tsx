"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
        description="Últimos 6 meses"
      >
        <div className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Carregando gráfico...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="Entradas" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Saídas" fill="hsl(var(--danger))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
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
