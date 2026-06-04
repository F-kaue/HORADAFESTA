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
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const status = dayStatus(day.slots);
        return (
          <div
            key={day.date}
            className="rounded-xl border bg-white p-2 text-center"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {day.label}
            </p>
            <p className="text-sm font-semibold">{day.date.slice(8)}</p>
            <div
              className={cn(
                "mx-auto mt-2 h-3 w-3 rounded-full",
                statusColors[status]
              )}
            />
            {day.leadIds.length > 0 && (
              <Link
                href="/leads"
                className="mt-1 block text-[10px] text-primary hover:underline"
              >
                {day.leadIds.length} evento(s)
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
