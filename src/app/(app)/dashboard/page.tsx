import { createClient } from "@/lib/supabase/server";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { WeekAgenda } from "@/components/dashboard/week-agenda";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SLOT_LABELS, type SlotType } from "@/lib/slots";
import { startOfMonth, endOfMonth, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().slice(0, 10);
  const monthEnd = endOfMonth(now).toISOString().slice(0, 10);

  const { data: confirmedLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "confirmado")
    .gte("event_date", monthStart)
    .lte("event_date", monthEnd);

  const { data: allLeads } = await supabase.from("leads").select("status, total_value");
  const { data: payments } = await supabase
    .from("payment_records")
    .select("value, is_paid, paid_date");

  const eventsThisMonth = confirmedLeads?.length ?? 0;
  const paidThisMonth =
    payments
      ?.filter(
        (p) =>
          p.is_paid &&
          p.paid_date &&
          p.paid_date >= monthStart &&
          p.paid_date <= monthEnd
      )
      .reduce((s, p) => s + Number(p.value), 0) ?? 0;

  const openLeads =
    allLeads?.filter(
      (l) => !["confirmado", "finalizado", "nao_convertido"].includes(l.status)
    ).length ?? 0;

  const total = allLeads?.length ?? 0;
  const converted =
    allLeads?.filter((l) => ["confirmado", "finalizado"].includes(l.status))
      .length ?? 0;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  const { data: upcoming } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "confirmado")
    .gte("event_date", now.toISOString().slice(0, 10))
    .order("event_date")
    .limit(5);

  const { data: eventSlots } = await supabase
    .from("event_slots")
    .select("event_date, slot_type, lead_id")
    .gte("event_date", now.toISOString().slice(0, 10))
    .lte("event_date", addDays(now, 6).toISOString().slice(0, 10));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const daySlots = (eventSlots ?? [])
      .filter((s) => s.event_date === dateStr)
      .map((s) => s.slot_type as SlotType);
    return {
      date: dateStr,
      label: format(d, "EEE", { locale: ptBR }),
      slots: daySlots,
      leadIds: (eventSlots ?? [])
        .filter((s) => s.event_date === dateStr && s.lead_id)
        .map((s) => s.lead_id as string),
    };
  });

  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = startOfMonth(d).toISOString().slice(0, 10);
    const mEnd = endOfMonth(d).toISOString().slice(0, 10);
    const rev =
      payments
        ?.filter(
          (p) => p.is_paid && p.paid_date && p.paid_date >= mStart && p.paid_date <= mEnd
        )
        .reduce((s, p) => s + Number(p.value), 0) ?? 0;
    revenueByMonth.push({
      month: format(d, "MMM", { locale: ptBR }),
      revenue: rev,
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu negócio e próximos eventos"
      />

      <MetricsCards
        eventsThisMonth={eventsThisMonth}
        revenueThisMonth={paidThisMonth}
        openLeads={openLeads}
        conversionRate={conversionRate}
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agenda da semana</CardTitle>
          </CardHeader>
          <CardContent>
            <WeekAgenda days={weekDays} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita — últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByMonth} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos eventos confirmados</CardTitle>
        </CardHeader>
        <CardContent>
          {!upcoming?.length ? (
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum evento próximo
            </p>
          ) : (
            <ul className="divide-y divide-border/80">
              {upcoming.map((lead) => (
                <li
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{lead.name}</p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {lead.event_date && formatDate(lead.event_date)}
                      {lead.slot_type &&
                        ` · ${SLOT_LABELS[lead.slot_type as SlotType]}`}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-base font-bold text-primary sm:text-lg">
                    {lead.total_value
                      ? formatCurrency(Number(lead.total_value))
                      : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
