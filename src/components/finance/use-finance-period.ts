"use client";

import { useCallback, useState } from "react";
import {
  getDefaultPeriodRange,
  getPeriodRange,
  type FinancePeriodMode,
  type FinancePeriodRange,
} from "@/lib/finance-period";

export function useFinancePeriod(initialMode: FinancePeriodMode = "week") {
  const [mode, setModeState] = useState<FinancePeriodMode>(initialMode);
  const [range, setRange] = useState<FinancePeriodRange>(() =>
    getDefaultPeriodRange(initialMode)
  );

  const setMode = useCallback((next: FinancePeriodMode) => {
    setModeState(next);
    if (next !== "custom") {
      setRange(getPeriodRange(next));
    }
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    if (!from || !to || from > to) return;
    setModeState("custom");
    setRange({ from, to });
  }, []);

  return { mode, range, setMode, setRange, setCustomRange };
}
