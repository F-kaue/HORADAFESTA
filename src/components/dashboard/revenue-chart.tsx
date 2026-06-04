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
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0e6df" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) =>
              new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(v)
            }
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Receita"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #f0e6df" }}
          />
          <Bar dataKey="revenue" fill="#E8612C" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
