import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { CalendarCheck, CircleDollarSign, ClipboardList, TrendingUp } from "lucide-react";

interface MetricsCardsProps {
  eventsThisMonth: number;
  revenueThisMonth: number;
  openLeads: number;
  conversionRate: number;
}

export function MetricsCards({
  eventsThisMonth,
  revenueThisMonth,
  openLeads,
  conversionRate,
}: MetricsCardsProps) {
  const cards = [
    {
      icon: CalendarCheck,
      label: "Eventos este mês",
      value: String(eventsThisMonth),
      accent: "text-primary",
    },
    {
      icon: CircleDollarSign,
      label: "Receita do mês",
      value: formatCurrency(revenueThisMonth),
      accent: "text-success",
    },
    {
      icon: ClipboardList,
      label: "Leads em aberto",
      value: String(openLeads),
      accent: "text-secondary",
    },
    {
      icon: TrendingUp,
      label: "Taxa de conversão",
      value: `${conversionRate}%`,
      accent: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <c.icon className={cn("h-5 w-5", c.accent)} aria-hidden />
            <p className="stat-label mt-3">{c.label}</p>
            <p className="stat-value mt-1 text-xl sm:text-2xl">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
