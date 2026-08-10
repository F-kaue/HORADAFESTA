"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AccountPayable } from "@/lib/payables";

interface PayablePayDialogProps {
  item: AccountPayable | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string, paidDate: string) => Promise<void> | void;
}

export function PayablePayDialog({
  item,
  open,
  onClose,
  onConfirm,
}: PayablePayDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [paidDate, setPaidDate] = useState(today);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item && open) {
      setPaidDate(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, open]);

  const handleConfirm = async () => {
    if (!item || !paidDate) return;
    setSaving(true);
    try {
      await onConfirm(item.id, paidDate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2 font-display text-xl font-bold">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Dar baixa na despesa
        </DialogTitle>
        <DialogDescription>
          Confirme quando esta despesa foi realmente paga.
        </DialogDescription>

        {item && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="font-semibold text-foreground">{item.description}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.category}
                {item.supplier ? ` · ${item.supplier}` : ""} · Vence{" "}
                {formatDate(item.due_date)}
              </p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {formatCurrency(Number(item.amount))}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-emerald-800 dark:text-emerald-300">
                Data do pagamento *
              </Label>
              <Input
                type="date"
                value={paidDate}
                max={today}
                onChange={(e) => setPaidDate(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                A despesa vai entrar no fluxo de caixa da semana desse dia. Se você
                pagou em outra data, ajuste aqui para não bagunçar a semana atual.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 gap-1"
                disabled={saving || !paidDate}
                onClick={handleConfirm}
              >
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "Salvando..." : "Confirmar baixa"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
