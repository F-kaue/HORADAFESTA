"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatCurrencyInput,
  formatDate,
  parseCurrencyBRL,
} from "@/lib/utils";
import { describeAllocations, recordLabel, roundMoney, splitAmount } from "@/lib/payments";
import type {
  Lead,
  Payment,
  PaymentRecordWithProgress,
  PaymentTransaction,
} from "@/types/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeadFinancialProps {
  lead: Lead;
  onUpdate: () => void;
}

interface Summary {
  total: number;
  received: number;
  remaining: number;
}

export function LeadFinancial({ lead, onUpdate }: LeadFinancialProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [records, setRecords] = useState<PaymentRecordWithProgress[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, received: 0, remaining: 0 });

  const [totalValue, setTotalValue] = useState(
    lead.total_value ? formatCurrencyInput(Number(lead.total_value)) : ""
  );
  const [downPayment, setDownPayment] = useState("");
  const [installments, setInstallments] = useState("5");
  const [paymentType, setPaymentType] = useState<"avista" | "parcelado">("parcelado");
  const [downPaymentPaid, setDownPaymentPaid] = useState(false);
  const [downPaymentPaidDate, setDownPaymentPaidDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [firstDueDate, setFirstDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [creating, setCreating] = useState(false);

  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiptTarget, setReceiptTarget] = useState<string>("auto");
  const [savingReceipt, setSavingReceipt] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/payments?lead_id=${lead.id}`);
    const data = await res.json();
    if (data.payment) {
      setPayment(data.payment);
      setRecords(data.records ?? []);
      setTransactions(data.transactions ?? []);
      setSummary(data.summary ?? { total: 0, received: 0, remaining: 0 });
    } else {
      setPayment(null);
      setRecords([]);
      setTransactions([]);
      setSummary({ total: 0, received: 0, remaining: 0 });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const total = payment ? summary.total : parseCurrencyBRL(totalValue);
  const entrada = payment
    ? Number(payment.down_payment ?? 0)
    : parseCurrencyBRL(downPayment);
  const remainingPlan = roundMoney(Math.max(0, total - entrada));

  const preview = useMemo(() => {
    if (total <= 0) return null;
    const parcelCount =
      paymentType === "avista" ? 1 : Math.max(1, parseInt(installments, 10) || 1);
    const parcelValues =
      remainingPlan > 0 ? splitAmount(remainingPlan, parcelCount) : [];
    return { parcelCount, parcelValues, remaining: remainingPlan, entrada };
  }, [total, entrada, remainingPlan, paymentType, installments]);

  const { received, pendingTotal, progress } = {
    received: summary.received,
    pendingTotal: summary.remaining,
    progress:
      summary.total > 0
        ? Math.min(100, (summary.received / summary.total) * 100)
        : 0,
  };

  const paymentStatus = (() => {
    if (!payment) return { label: "Sem plano de pagamento", tone: "muted" as const };
    if (pendingTotal <= 0.009) return { label: "Quitado", tone: "success" as const };
    if (received > 0) return { label: "Parcialmente pago", tone: "warning" as const };
    return { label: "Aguardando pagamentos", tone: "danger" as const };
  })();

  const handleCreatePayment = async () => {
    const amount = parseCurrencyBRL(totalValue);
    const entradaAmount = parseCurrencyBRL(downPayment);
    if (amount <= 0) {
      toast.error("Informe o valor total do evento");
      return;
    }
    if (entradaAmount > amount) {
      toast.error("A entrada não pode ser maior que o total");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: lead.id,
        total_value: amount,
        down_payment: entradaAmount,
        installments: parseInt(installments, 10) || 1,
        payment_type: paymentType,
        down_payment_paid: entradaAmount > 0 ? downPaymentPaid : false,
        down_payment_paid_date: downPaymentPaid ? downPaymentPaidDate : undefined,
        first_installment_due_date: firstDueDate,
      }),
    });
    setCreating(false);

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro ao criar plano");
      return;
    }
    toast.success("Plano criado! Agora registre cada recebimento no extrato.");
    load();
    onUpdate();
  };

  const handleAddReceipt = async () => {
    if (!payment) return;
    const amount = parseCurrencyBRL(receiptAmount);
    if (amount <= 0) {
      toast.error("Informe o valor recebido");
      return;
    }
    if (amount > pendingTotal + 0.01) {
      toast.error(`O máximo em aberto é ${formatCurrency(pendingTotal)}`);
      return;
    }

    setSavingReceipt(true);
    const res = await fetch("/api/payments/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_id: payment.id,
        amount,
        paid_date: receiptDate,
        notes: receiptNotes || undefined,
        record_id: receiptTarget === "auto" ? null : receiptTarget,
      }),
    });
    setSavingReceipt(false);

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro ao registrar");
      return;
    }

    toast.success(
      `Recebido ${formatCurrency(amount)} · Falta ${formatCurrency(data.summary.remaining)}`
    );
    setReceiptAmount("");
    setReceiptNotes("");
    setShowReceiptForm(false);
    load();
    onUpdate();
  };

  const deleteReceipt = async (txId: string) => {
    if (!confirm("Remover este recebimento do extrato?")) return;
    const res = await fetch(`/api/payments/transactions/${txId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Recebimento removido");
    load();
    onUpdate();
  };

  if (lead.status !== "confirmado") {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        Confirme o evento primeiro para registrar pagamentos e entrada.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "inline-flex rounded-full px-3 py-1 text-xs font-bold",
          paymentStatus.tone === "success" && "bg-emerald-100 text-emerald-800",
          paymentStatus.tone === "warning" && "bg-amber-100 text-amber-900",
          paymentStatus.tone === "danger" && "bg-red-100 text-red-800",
          paymentStatus.tone === "muted" && "bg-muted text-muted-foreground"
        )}
      >
        {paymentStatus.label}
      </div>

      {!payment ? (
        <div className="space-y-4 rounded-2xl border-2 border-border bg-muted/30 p-4">
          <p className="text-sm font-semibold text-foreground">
            Defina o contrato: total, entrada e parcelas do saldo.
          </p>
          <div>
            <Label>Valor total do evento *</Label>
            <CurrencyInput value={totalValue} onValueChange={setTotalValue} />
          </div>
          <div>
            <Label>Entrada (sinal)</Label>
            <CurrencyInput value={downPayment} onValueChange={setDownPayment} />
          </div>
          {entrada > 0 && (
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={downPaymentPaid}
                onChange={(e) => setDownPaymentPaid(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Entrada já recebida
            </label>
          )}
          {downPaymentPaid && entrada > 0 && (
            <div>
              <Label>Data da entrada</Label>
              <Input
                type="date"
                value={downPaymentPaidDate}
                onChange={(e) => setDownPaymentPaidDate(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={paymentType === "avista" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setPaymentType("avista")}
            >
              Saldo à vista
            </Button>
            <Button
              type="button"
              variant={paymentType === "parcelado" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setPaymentType("parcelado")}
            >
              Saldo parcelado
            </Button>
          </div>
          {paymentType === "parcelado" && remainingPlan > 0 && (
            <>
              <div>
                <Label>Parcelas do saldo</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                />
              </div>
              <div>
                <Label>1ª parcela vence em</Label>
                <Input
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                />
              </div>
            </>
          )}
          {preview && total > 0 && (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-3 text-sm font-medium">
              <p className="font-bold">Resumo</p>
              <p>Total {formatCurrency(total)} · Entrada {formatCurrency(preview.entrada)}</p>
              <p>
                Saldo {formatCurrency(preview.remaining)} em{" "}
                {paymentType === "parcelado"
                  ? `${preview.parcelCount}x`
                  : "1 pagamento"}
              </p>
            </div>
          )}
          <Button onClick={handleCreatePayment} className="w-full" disabled={creating}>
            {creating ? "Criando..." : "Criar plano de pagamento"}
          </Button>
        </div>
      ) : (
        <>
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
                {formatCurrency(received)}
              </p>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
              <p className="text-2xs font-bold uppercase text-amber-900">Falta</p>
              <p className="font-display text-base font-bold text-amber-800 sm:text-lg">
                {formatCurrency(pendingTotal)}
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

          {/* Registrar recebimento */}
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
            {!showReceiptForm ? (
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setShowReceiptForm(true);
                  setReceiptDate(new Date().toISOString().slice(0, 10));
                }}
                disabled={pendingTotal <= 0}
              >
                <Plus className="h-4 w-4" />
                Registrar recebimento (ex: R$ 500,00 no dia…)
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Wallet className="h-4 w-4 text-primary" />
                  Novo recebimento
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  Em aberto: <strong>{formatCurrency(pendingTotal)}</strong>
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
                  <Label>Aplicar em</Label>
                  <Select value={receiptTarget} onValueChange={setReceiptTarget}>
                    <SelectTrigger className="border-2 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        Automático (entrada → parcelas em ordem)
                      </SelectItem>
                      {records.map((r) => {
                        const kind = (r.record_kind ?? "parcela") as "entrada" | "parcela";
                        const rem = r.remaining_amount ?? 0;
                        if (rem <= 0) return null;
                        return (
                          <SelectItem key={r.id} value={r.id}>
                            {recordLabel(kind, r.installment_number)} — falta{" "}
                            {formatCurrency(rem)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
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

          {/* Extrato */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-foreground">Extrato de recebimentos</h3>
            {transactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm font-medium text-muted-foreground">
                Nenhum recebimento lançado ainda. Use o botão acima cada vez que o cliente
                pagar (valor + data).
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
                          +{formatCurrency(Number(tx.amount))}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatDate(tx.paid_date)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {describeAllocations(tx.allocations ?? [], records)}
                      </p>
                      {tx.notes && (
                        <p className="mt-0.5 text-xs text-foreground/80">{tx.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-danger"
                      onClick={() => deleteReceipt(tx.id)}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cronograma */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-foreground">Cronograma</h3>
            <div className="space-y-2">
              {records.map((r) => {
                const kind = (r.record_kind ?? "parcela") as "entrada" | "parcela";
                const label = recordLabel(kind, r.installment_number);
                const previsto = Number(r.value);
                const pago = Number(r.paid_amount ?? 0);
                const falta = Number(r.remaining_amount ?? previsto - pago);
                const pct = previsto > 0 ? (pago / previsto) * 100 : 0;
                const quitado = falta <= 0.009;

                return (
                  <div
                    key={r.id}
                    className={cn(
                      "rounded-xl border-2 p-4",
                      quitado
                        ? "border-emerald-200 bg-emerald-50/60"
                        : pago > 0
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-border bg-card"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-bold text-foreground">{label}</p>
                      {quitado ? (
                        <span className="text-xs font-bold text-emerald-700">Quitado</span>
                      ) : pago > 0 ? (
                        <span className="text-xs font-bold text-amber-800">Parcial</span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          Pendente
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold uppercase text-muted-foreground">Previsto</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(previsto)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-emerald-700">Recebido</p>
                        <p className="font-semibold text-emerald-800">
                          {formatCurrency(pago)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold uppercase text-amber-800">Falta</p>
                        <p className="font-semibold text-amber-900">
                          {formatCurrency(falta)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full transition-all",
                          quitado ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {r.due_date && !quitado && (
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        Vencimento: {formatDate(r.due_date)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
