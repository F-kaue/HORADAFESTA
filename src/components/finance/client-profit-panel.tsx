"use client";

import { TrendingDown, TrendingUp, Users } from "lucide-react";
import { FinancePanel } from "@/components/finance/finance-page-header";
import { formatCurrency } from "@/lib/utils";
import type { ClientProfitRow } from "@/lib/client-profit";
import { cn } from "@/lib/utils";

type ClientProfitPanelProps = {
  rows: ClientProfitRow[];
  periodLabel: string;
  loading?: boolean;
  reportId?: string;
};

export function ClientProfitPanel({
  rows,
  periodLabel,
  loading,
  reportId,
}: ClientProfitPanelProps) {
  const totalReceived = rows.reduce((s, r) => s + r.receivedInPeriod, 0);
  const totalExpenses = rows.reduce((s, r) => s + r.expensesInPeriod, 0);
  const totalProfit = totalReceived - totalExpenses;

  return (
    <FinancePanel
      title="Resultado por cliente"
      description={`Quanto entrou e quanto foi gasto por cliente em ${periodLabel}`}
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <Users className="h-8 w-8 opacity-40" />
          <p>Nenhum movimento vinculado a clientes neste período.</p>
          <p className="text-xs">
            Vincule despesas a um cliente em Contas a pagar para ver o lucro por evento.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <SummaryChip
              label="Recebido no período"
              value={formatCurrency(totalReceived)}
              tone="emerald"
            />
            <SummaryChip
              label="Despesas no período"
              value={formatCurrency(totalExpenses)}
              tone="rose"
            />
            <SummaryChip
              label="Resultado"
              value={formatCurrency(totalProfit)}
              tone={totalProfit >= 0 ? "emerald" : "rose"}
              icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
            />
          </div>

          <div className="overflow-x-auto" id={reportId}>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/80 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-3">Cliente</th>
                  <th className="pb-3 pr-3 text-right">Recebido</th>
                  <th className="pb-3 pr-3 text-right">Despesas</th>
                  <th className="pb-3 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="py-3 pr-3 font-medium">{row.clientName}</td>
                    <td className="py-3 pr-3 text-right tabular-nums text-emerald-700">
                      {formatCurrency(row.receivedInPeriod)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-rose-700">
                      {formatCurrency(row.expensesInPeriod)}
                    </td>
                    <td
                      className={cn(
                        "py-3 text-right font-bold tabular-nums",
                        row.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                      )}
                    >
                      {formatCurrency(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </FinancePanel>
  );
}

function SummaryChip({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose";
  icon?: typeof TrendingUp;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "emerald"
          ? "border-emerald-200/80 bg-emerald-50/60"
          : "border-rose-200/80 bg-rose-50/60"
      )}
    >
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums text-foreground">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {value}
      </p>
    </div>
  );
}
