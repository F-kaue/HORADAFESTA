"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { FinancePeriodRange } from "@/lib/finance-period";

type FinanceDateRangeFilterProps = {
  range: FinancePeriodRange;
  onChange: (range: FinancePeriodRange) => void;
};

export function FinanceDateRangeFilter({
  range,
  onChange,
}: FinanceDateRangeFilterProps) {
  const updateFrom = (from: string) => {
    if (!from) return;
    const to = from > range.to ? from : range.to;
    onChange({ from, to });
  };

  const updateTo = (to: string) => {
    if (!to) return;
    const from = to < range.from ? to : range.from;
    onChange({ from, to });
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="finance-period-from">De</Label>
        <Input
          id="finance-period-from"
          type="date"
          value={range.from}
          max={range.to}
          onChange={(e) => updateFrom(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="finance-period-to">{"At\u00e9"}</Label>
        <Input
          id="finance-period-to"
          type="date"
          value={range.to}
          min={range.from}
          onChange={(e) => updateTo(e.target.value)}
        />
      </div>
    </>
  );
}
