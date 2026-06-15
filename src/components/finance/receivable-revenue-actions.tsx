"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  RECEIVABLE_BUCKET_LABELS,
  type ReceivableLeadRow,
} from "@/lib/receivables";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ReceivableRevenueActionsProps = {
  row: ReceivableLeadRow;
  onUpdated: () => void;
  compact?: boolean;
};

export function ReceivableRevenueActions({
  row,
  onUpdated,
  compact,
}: ReceivableRevenueActionsProps) {
  const releaseUrl = `/api/finance/receivables/${row.leadId}/release${
    row.source === "manual" ? "?source=manual" : ""
  }`;

  const release = async () => {
    if (
      !confirm(
        `Confirmar que o saldo recebido de ${row.clientName} já pode contar como receita disponível?`
      )
    ) {
      return;
    }
    const res = await fetch(releaseUrl, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Erro ao liberar saldo");
      return;
    }
    toast.success("Saldo confirmado como disponível");
    onUpdated();
  };

  const hold = async () => {
    if (!confirm(`Voltar o saldo de ${row.clientName} para recebido retido?`)) return;
    const res = await fetch(releaseUrl, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Erro ao atualizar");
      return;
    }
    toast.success("Saldo voltou para retido");
    onUpdated();
  };

  if (row.received <= 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-muted/30 p-3",
        compact && "p-2.5"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">
            Reconhecimento de receita
          </p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full border px-2 py-0.5 text-2xs font-bold",
              RECEIVABLE_BUCKET_LABELS[row.bucket].color
            )}
          >
            {RECEIVABLE_BUCKET_LABELS[row.bucket].label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-right text-xs tabular-nums">
          {row.held > 0 && (
            <span className="font-semibold text-sky-700">
              Retido {formatCurrency(row.held)}
            </span>
          )}
          {row.available > 0 && (
            <span className="font-semibold text-emerald-700">
              Disponível {formatCurrency(row.available)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {row.held > 0 && (
          <Button size="sm" variant="outline" className="gap-1" onClick={release}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirmar saldo
          </Button>
        )}
        {row.manuallyReleased && row.held === 0 && (
          <Button size="sm" variant="ghost" className="gap-1" onClick={hold}>
            <RotateCcw className="h-3.5 w-3.5" />
            Voltar para retido
          </Button>
        )}
      </div>
    </div>
  );
}
