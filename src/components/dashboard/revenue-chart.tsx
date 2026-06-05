"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 18% 86%)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "hsl(234 14% 32%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(234 14% 32%)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(v)
            }
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(30 18% 86%)",
              fontSize: 13,
              fontWeight: 600,
            }}
            labelStyle={{ color: "hsl(234 32% 12%)" }}
          />
          <Bar dataKey="revenue" fill="#D94E1F" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
