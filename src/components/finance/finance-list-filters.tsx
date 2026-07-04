"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { FinancePanel } from "@/components/finance/finance-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FinancePeriodRange } from "@/lib/finance-period";
import { FinanceDateRangeFilter } from "@/components/finance/finance-date-range-filter";

type FinanceListFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onClear: () => void;
  hasActiveFilters: boolean;
  description?: string;
  periodRange?: FinancePeriodRange;
  onPeriodRangeChange?: (range: FinancePeriodRange) => void;
  children: ReactNode;
};

export function FinanceListFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  onClear,
  hasActiveFilters,
  description = "Use a busca e os filtros para encontrar registros",
  periodRange,
  onPeriodRangeChange,
  children,
}: FinanceListFiltersProps) {
  return (
    <FinancePanel
      title="Filtros"
      description={description}
      actions={
        hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem_10rem]">
          <div className="space-y-2">
            <Label htmlFor="finance-search">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="finance-search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          </div>
          {periodRange && onPeriodRangeChange ? (
            <FinanceDateRangeFilter
              range={periodRange}
              onChange={onPeriodRangeChange}
            />
          ) : null}
        </div>
        {children}
      </div>
    </FinancePanel>
  );
}
