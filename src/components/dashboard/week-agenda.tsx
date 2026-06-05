import { cn } from "@/lib/utils";
import { dayStatus, type SlotType } from "@/lib/slots";
import Link from "next/link";

interface WeekAgendaProps {
  days: {
    date: string;
    label: string;
    slots: SlotType[];
    leadIds: string[];
  }[];
}

const statusColors = {
  available: "bg-success",
  partial: "bg-accent",
  full: "bg-danger",
};

export function WeekAgenda({ days }: WeekAgendaProps) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="grid min-w-[320px] grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const status = dayStatus(day.slots);
          return (
            <div
              key={day.date}
              className="rounded-xl border border-border/80 bg-muted/40 p-2 text-center sm:p-2.5"
            >
              <p className="text-2xs font-bold uppercase tracking-wide text-muted-foreground sm:text-xs">
                {day.label}
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {day.date.slice(8)}
              </p>
              <div
                className={cn(
                  "mx-auto mt-2 h-3 w-3 rounded-full",
                  statusColors[status]
                )}
              />
              {day.leadIds.length > 0 && (
                <Link
                  href="/leads"
                  className="mt-1.5 block text-2xs font-semibold text-primary hover:underline sm:text-xs"
                >
                  {day.leadIds.length} evento(s)
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
