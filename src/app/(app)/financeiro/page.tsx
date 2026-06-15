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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-6">
      <PageHeader
        title="Fluxo de caixa"
        description="Visão consolidada de entradas, saídas e saldo disponível"
        action={
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
              Receita disponível
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(data?.receivables.availableTotal ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/50 dark:bg-sky-950/20">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-sky-800 dark:text-sky-300">
              Recebido retido
            </p>
            <p className="mt-1 text-xl font-bold text-sky-900 dark:text-sky-100">
              {formatCurrency(data?.receivables.heldTotal ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
              A receber
            </p>
            <p className="mt-1 text-xl font-bold text-amber-900 dark:text-amber-100">
              {formatCurrency(data?.receivables.pendingTotal ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-rose-800 dark:text-rose-300">
              Despesas pendentes
            </p>
            <p className="mt-1 text-xl font-bold text-rose-900 dark:text-rose-100">
              {formatCurrency(data?.payables.pendingTotal ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">Entradas no mês</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(data?.monthReceivedIn ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">Saídas no mês</p>
            <p className="text-lg font-bold text-danger">
              {formatCurrency(data?.monthPaidOut ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">Resultado do mês</p>
            <p
              className={`text-lg font-bold ${
                (data?.monthBalance ?? 0) >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatCurrency(data?.monthBalance ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entradas x Saídas (últimos meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="Entradas" fill="#2ECC71" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Saídas" fill="#E74C3C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

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
