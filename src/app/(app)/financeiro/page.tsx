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

      const { data: records } = await supabase
        .from("payment_records")
        .select("value, is_paid, paid_date, due_date");

      let rec = 0;
      let pen = 0;
      const monthly: Record<string, number> = {};

      (records ?? []).forEach((r) => {
        const v = Number(r.value);
        if (r.is_paid) {
          rec += v;
          if (r.paid_date) {
            const m = r.paid_date.slice(0, 7);
            monthly[m] = (monthly[m] || 0) + v;
          }
        } else {
          pen += v;
        }
      });

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-secondary">
          Financeiro
        </h1>
        <Button variant="outline" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Valor médio / evento</p>
            <p className="font-display text-xl font-bold">
              {formatCurrency(avgValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total recebido</p>
            <p className="font-display text-xl font-bold text-success">
              {formatCurrency(received)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">A receber</p>
            <p className="font-display text-xl font-bold text-warning">
              {formatCurrency(pending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Eventos confirmados</p>
            <p className="font-display text-xl font-bold">{leads.length}</p>
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
                <Bar dataKey="revenue" fill="#E8612C" radius={[8, 8, 0, 0]} />
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
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Valor total</th>
                <th className="py-2">Status</th>
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
