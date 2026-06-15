"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, parseCurrencyBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ManualTransaction = {
  id: string;
  amount: number;
  paid_date: string;
  notes: string | null;
};

type ManualSummary = {
  total: number;
  received: number;
  remaining: number;
  held: number;
  available: number;
  bucket: string;
};

interface ManualReceivableFinancialProps {
  receivableId: string;
  onUpdate: () => void;
}

export function ManualReceivableFinancial({
  receivableId,
  onUpdate,
}: ManualReceivableFinancialProps) {
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [summary, setSummary] = useState<ManualSummary>({
    total: 0,
    received: 0,
    remaining: 0,
    held: 0,
    available: 0,
    bucket: "pending",
  });
  const [transactions, setTransactions] = useState<ManualTransaction[]>([]);

  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptNotes, setReceiptNotes] = useState("");
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [deletingTx, setDeletingTx] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/finance/manual-receivables/${receivableId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro ao carregar");
      setLoading(false);
      return;
    }
    setClientName(data.receivable.client_name);
    setDescription(data.receivable.description);
    setSummary(data.summary);
    setTransactions(
      (data.transactions ?? []).map((t: ManualTransaction & { amount: string | number }) => ({
        ...t,
        amount: Number(t.amount),
      }))
    );
    setLoading(false);
  }, [receivableId]);

  useEffect(() => {
    load();
  }, [load]);

  const progress =
    summary.total > 0 ? Math.min(100, (summary.received / summary.total) * 100) : 0;

  const paymentStatus = (() => {
    if (summary.remaining <= 0.009) return { label: "Quitado", tone: "success" as const };
    if (summary.received > 0) return { label: "Parcialmente pago", tone: "warning" as const };
    return { label: "Aguardando pagamentos", tone: "danger" as const };
  })();

  const handleAddReceipt = async () => {
    const amount = parseCurrencyBRL(receiptAmount);
    if (amount <= 0) {
      toast.error("Informe o valor recebido");
      return;
    }
    if (amount > summary.remaining + 0.01) {
      toast.error(`O máximo em aberto é ${formatCurrency(summary.remaining)}`);
      return;
    }

    setSavingReceipt(true);
    const res = await fetch(
      `/api/finance/manual-receivables/${receivableId}/transactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paid_date: receiptDate,
          notes: receiptNotes || undefined,
        }),
      }
    );
    setSavingReceipt(false);

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro ao registrar");
      return;
    }

    toast.success(
      `Recebido ${formatCurrency(amount)} · Falta ${formatCurrency(data.summary?.remaining ?? 0)}`
    );
    setReceiptAmount("");
    setReceiptNotes("");
    setShowReceiptForm(false);
    await load();
    onUpdate();
  };

  const deleteReceipt = async () => {
    if (!deleteTxId) return;
    setDeletingTx(true);
    try {
      const res = await fetch(
        `/api/finance/manual-receivables/${receivableId}/transactions/${deleteTxId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Erro ao remover");
        return;
      }
      toast.success("Recebimento removido");
      setDeleteTxId(null);
      load();
      onUpdate();
    } finally {
      setDeletingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Carregando financeiro...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div
        className={cn(
          "inline-flex rounded-full px-3 py-1 text-xs font-bold",
          paymentStatus.tone === "success" && "bg-emerald-100 text-emerald-800",
          paymentStatus.tone === "warning" && "bg-amber-100 text-amber-900",
          paymentStatus.tone === "danger" && "bg-red-100 text-red-800"
        )}
      >
        {paymentStatus.label}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border-2 border-border bg-card p-3">
          <p className="text-2xs font-bold uppercase text-muted-foreground">Contrato</p>
          <p className="font-display text-base font-bold sm:text-lg">
            {formatCurrency(summary.total)}
          </p>
        </div>
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
          <p className="text-2xs font-bold uppercase text-emerald-800">Recebido</p>
          <p className="font-display text-base font-bold text-emerald-700 sm:text-lg">
            {formatCurrency(summary.received)}
          </p>
        </div>
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
          <p className="text-2xs font-bold uppercase text-amber-900">Falta</p>
          <p className="font-display text-base font-bold text-amber-800 sm:text-lg">
            {formatCurrency(summary.remaining)}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs font-bold">
          <span>Progresso do contrato</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
        {!showReceiptForm ? (
          <Button
            className="w-full gap-2"
            onClick={() => {
              setShowReceiptForm(true);
              setReceiptDate(new Date().toISOString().slice(0, 10));
            }}
            disabled={summary.remaining <= 0}
          >
            <Plus className="h-4 w-4" />
            Registrar recebimento (ex: R$ 500,00 no dia…)
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              Novo recebimento — {clientName}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Em aberto: <strong>{formatCurrency(summary.remaining)}</strong>
            </p>
            <div>
              <Label>Quanto recebeu? *</Label>
              <CurrencyInput
                value={receiptAmount}
                onValueChange={setReceiptAmount}
                placeholder="R$ 500,00"
              />
            </div>
            <div>
              <Label>Data do pagamento *</Label>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Observação (opcional)</Label>
              <Input
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                placeholder="Ex: PIX, dinheiro…"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleAddReceipt}
                disabled={savingReceipt}
              >
                {savingReceipt ? "Salvando…" : "Confirmar recebimento"}
              </Button>
              <Button variant="ghost" onClick={() => setShowReceiptForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-foreground">Extrato de recebimentos</h3>
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm font-medium text-muted-foreground">
            Nenhum recebimento lançado ainda. Use o botão acima cada vez que o cliente pagar.
          </p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-lg font-bold text-emerald-700">
                      +{formatCurrency(tx.amount)}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(tx.paid_date)}
                    </span>
                  </div>
                  {tx.notes && (
                    <p className="mt-1 text-xs text-foreground/80">{tx.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1 text-muted-foreground hover:bg-rose-50 hover:text-danger"
                  onClick={() => setDeleteTxId(tx.id)}
                  aria-label="Excluir recebimento"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs font-semibold">Excluir</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTxId)}
        onOpenChange={(open) => !open && setDeleteTxId(null)}
        variant="danger"
        title="Remover recebimento?"
        description="Este lançamento será excluído do extrato e o total recebido será recalculado."
        confirmLabel="Sim, excluir"
        loading={deletingTx}
        onConfirm={deleteReceipt}
      />
    </div>
  );
}
