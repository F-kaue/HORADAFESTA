"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Lead } from "@/types/database";

const COLORS = ["#E8612C", "#F9C846", "#1A1A2E", "#2ECC71", "#F39C12", "#E74C3C"];

export default function FinanceiroPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [received, setReceived] = useState(0);
  const [pending, setPending] = useState(0);
  const [byType, setByType] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: confirmed } = await supabase
        .from("leads")
        .select("*")
        .eq("status", "confirmado");

      setLeads((confirmed as Lead[]) ?? []);

      const typeCount: Record<string, number> = {};
      (confirmed ?? []).forEach((l) => {
        const t = l.event_type || "Outro";
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
      setByType(
        Object.entries(typeCount).map(([name, value]) => ({ name, value }))
      );

      const { data: allPayments } = await supabase
        .from("payments")
        .select("id, total_value");

      const { data: txs } = await supabase
        .from("payment_transactions")
        .select("amount, paid_date");

      let rec = 0;
      const monthly: Record<string, number> = {};

      (txs ?? []).forEach((t) => {
        const v = Number(t.amount);
        rec += v;
        if (t.paid_date) {
          const m = t.paid_date.slice(0, 7);
          monthly[m] = (monthly[m] || 0) + v;
        }
      });

      const contractTotal = (allPayments ?? []).reduce(
        (s, p) => s + Number(p.total_value),
        0
      );
      const pen = Math.max(0, contractTotal - rec);

      setReceived(rec);
      setPending(pen);

      const months = Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([m, revenue]) => ({
          month: new Date(m + "-01").toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          }),
          revenue,
        }));
      setMonthlyRevenue(months);
    };
    load();
  }, [supabase]);

  const exportCsv = () => {
    const headers = ["Cliente", "Data", "Valor Total", "Status"];
    const rows = leads.map((l) => [
      l.name,
      l.event_date ?? "",
      l.total_value ?? 0,
      l.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eventos-horadafesta.csv";
    a.click();
  };

  const avgValue =
    leads.length > 0
      ? leads.reduce((s, l) => s + (Number(l.total_value) || 0), 0) / leads.length
      : 0;

  const donutData = [
    { name: "Recebido", value: received },
    { name: "A receber", value: pending },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Financeiro"
        description="Receitas, pendências e exportação de dados"
        action={
          <Button variant="outline" onClick={exportCsv} className="w-full sm:w-auto">
            Exportar CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="stat-label">Valor médio / evento</p>
            <p className="stat-value mt-1 text-lg sm:text-xl">{formatCurrency(avgValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="stat-label">Total recebido</p>
            <p className="stat-value mt-1 text-lg text-success sm:text-xl">
              {formatCurrency(received)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="stat-label">A receber</p>
            <p className="stat-value mt-1 text-lg text-warning sm:text-xl">
              {formatCurrency(pending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="stat-label">Eventos confirmados</p>
            <p className="stat-value mt-1 text-lg sm:text-xl">{leads.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita por mês</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e6df" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#D94E1F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recebido vs. a receber</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Eventos por tipo</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" outerRadius={80}>
                  {byType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos confirmados</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="py-3 pr-4">Cliente</th>
                <th className="py-3 pr-4">Data</th>
                <th className="py-3 pr-4">Valor total</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="py-3 pr-4 font-medium">{l.name}</td>
                  <td className="py-3 pr-4">
                    {l.event_date ? formatDate(l.event_date) : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {l.total_value ? formatCurrency(Number(l.total_value)) : "—"}
                  </td>
                  <td className="py-3">Confirmado</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
