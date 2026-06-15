"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

type PendingAction = "release" | "hold" | null;

export function ReceivableRevenueActions({
  row,
  onUpdated,
  compact,
}: ReceivableRevenueActionsProps) {
  const [pending, setPending] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(false);

  const releaseUrl = `/api/finance/receivables/${row.leadId}/release${
    row.source === "manual" ? "?source=manual" : ""
  }`;

  const execute = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      const res = await fetch(releaseUrl, {
        method: pending === "release" ? "POST" : "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao atualizar saldo");
        return;
      }
      toast.success(
        pending === "release"
          ? "Saldo confirmado como disponível"
          : "Saldo voltou para recebido retido"
      );
      setPending(null);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  if (row.received <= 0) return null;

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border/80 bg-gradient-to-br from-muted/40 to-card p-3 shadow-sm",
          compact && "p-2.5"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Reconhecimento de receita
            </p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-2xs font-bold",
                RECEIVABLE_BUCKET_LABELS[row.bucket].color
              )}
            >
              {RECEIVABLE_BUCKET_LABELS[row.bucket].label}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-right text-xs tabular-nums">
            {row.held > 0 && (
              <span className="rounded-lg bg-sky-100 px-2 py-1 font-semibold text-sky-800">
                Retido {formatCurrency(row.held)}
              </span>
            )}
            {row.available > 0 && (
              <span className="rounded-lg bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                Disponível {formatCurrency(row.available)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {row.held > 0 && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-600/90"
              onClick={() => setPending("release")}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Liberar saldo
            </Button>
          )}
          {row.manuallyReleased && row.held === 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100"
              onClick={() => setPending("hold")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Marcar como retido
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pending === "release"}
        onOpenChange={(open) => !open && setPending(null)}
        variant="success"
        title="Liberar saldo recebido?"
        description={
          <>
            O valor recebido de <strong>{row.clientName}</strong> passará a contar
            como <strong>receita disponível</strong> para uso imediato.
            {row.held > 0 && (
              <>
                {" "}
                Serão liberados{" "}
                <strong>{formatCurrency(row.held)}</strong>.
              </>
            )}
          </>
        }
        confirmLabel="Sim, liberar"
        loading={loading}
        onConfirm={execute}
      />

      <ConfirmDialog
        open={pending === "hold"}
        onOpenChange={(open) => !open && setPending(null)}
        variant="warning"
        title="Marcar saldo como retido?"
        description={
          <>
            O saldo de <strong>{row.clientName}</strong> voltará para{" "}
            <strong>recebido retido</strong> e deixará de contar como receita
            disponível até você confirmar novamente.
          </>
        }
        confirmLabel="Sim, marcar retido"
        loading={loading}
        onConfirm={execute}
      />
    </>
  );
}
