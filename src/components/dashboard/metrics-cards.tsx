import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
    { emoji: "🎉", label: "Eventos este mês", value: String(eventsThisMonth) },
    { emoji: "💰", label: "Receita do mês", value: formatCurrency(revenueThisMonth) },
    { emoji: "📋", label: "Leads em aberto", value: String(openLeads) },
    { emoji: "✅", label: "Taxa de conversão", value: `${conversionRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-5">
            <span className="text-2xl">{c.emoji}</span>
            <p className="mt-2 text-xs text-muted-foreground">{c.label}</p>
            <p className="font-display text-xl font-bold text-secondary mt-1">
              {c.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
