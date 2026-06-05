"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  formatCurrencyInput,
  formatDate,
  parseCurrencyBRL,
} from "@/lib/utils";
import { recordLabel, roundMoney, splitAmount } from "@/lib/payments";
import type { Lead, Payment, PaymentRecord } from "@/types/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeadFinancialProps {
  lead: Lead;
  onUpdate: () => void;
}

export function LeadFinancial({ lead, onUpdate }: LeadFinancialProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [totalValue, setTotalValue] = useState(
    lead.total_value ? formatCurrencyInput(Number(lead.total_value)) : ""
  );
  const [downPayment, setDownPayment] = useState("");
  const [installments, setInstallments] = useState("3");
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
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/payments?lead_id=${lead.id}`);
    const data = await res.json();
    if (data.payment) {
      setPayment(data.payment);
      setRecords(data.records ?? []);
    } else {
      setPayment(null);
      setRecords([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const total = payment
    ? Number(payment.total_value)
    : parseCurrencyBRL(totalValue);
  const entrada = payment
    ? Number(payment.down_payment ?? 0)
    : parseCurrencyBRL(downPayment);
  const remaining = roundMoney(Math.max(0, total - entrada));

  const preview = useMemo(() => {
    if (total <= 0) return null;
    const parcelCount = paymentType === "avista" ? 1 : Math.max(1, parseInt(installments, 10) || 1);
    const parcelValues =
      remaining > 0 ? splitAmount(remaining, parcelCount) : [];
    return { parcelCount, parcelValues, remaining, entrada };
  }, [total, entrada, remaining, paymentType, installments]);

  const paidTotal = records
    .filter((r) => r.is_paid)
    .reduce((s, r) => s + Number(r.value), 0);
  const pendingTotal = roundMoney(total - paidTotal);
  const progress = total > 0 ? Math.min(100, (paidTotal / total) * 100) : 0;

  const paymentStatus = (() => {
    if (!payment) return { label: "Sem plano de pagamento", tone: "muted" as const };
    if (paidTotal >= total) return { label: "Quitado", tone: "success" as const };
    const entradaRecord = records.find((r) => r.record_kind === "entrada");
    if (entradaRecord && !entradaRecord.is_paid)
      return { label: "Entrada pendente", tone: "warning" as const };
    if (paidTotal > 0) return { label: "Parcialmente pago", tone: "warning" as const };
    return { label: "Nenhum pagamento registrado", tone: "danger" as const };
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
    if (paymentType === "parcelado" && remaining > 0) {
      const n = parseInt(installments, 10);
      if (n < 1) {
        toast.error("Informe o número de parcelas");
        return;
      }
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
    toast.success("Plano de pagamento criado");
    load();
    onUpdate();
  };

  const markPaid = async (recordId: string) => {
    const res = await fetch(`/api/payments/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_paid: true, paid_date: payDate }),
    });
    if (!res.ok) {
      toast.error("Erro ao registrar pagamento");
      return;
    }
    toast.success("Pagamento registrado");
    setPayingId(null);
    load();
    onUpdate();
  };

  const unmarkPaid = async (recordId: string) => {
    const res = await fetch(`/api/payments/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_paid: false, paid_date: null }),
    });
    if (!res.ok) {
      toast.error("Erro ao desfazer");
      return;
    }
    toast.success("Pagamento desmarcado");
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
            Monte o plano: valor total, entrada e parcelas do saldo.
          </p>

          <div>
            <Label>Valor total do evento *</Label>
            <CurrencyInput
              value={totalValue}
              onValueChange={setTotalValue}
              placeholder="R$ 5.000,00"
            />
          </div>

          <div>
            <Label>Entrada (sinal)</Label>
            <CurrencyInput
              value={downPayment}
              onValueChange={setDownPayment}
              placeholder="R$ 0,00 — deixe vazio se não houver"
            />
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Valor pago no fechamento ou antes do evento
            </p>
          </div>

          {entrada > 0 && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={downPaymentPaid}
                  onChange={(e) => setDownPaymentPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-semibold text-foreground">
                  Entrada já recebida
                </span>
              </label>
              {downPaymentPaid && (
                <div>
                  <Label>Data em que recebeu a entrada</Label>
                  <Input
                    type="date"
                    value={downPaymentPaidDate}
                    onChange={(e) => setDownPaymentPaidDate(e.target.value)}
                  />
                </div>
              )}
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

          {paymentType === "parcelado" && remaining > 0 && (
            <>
              <div>
                <Label>Quantas parcelas do saldo?</Label>
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

          {paymentType === "avista" && remaining > 0 && (
            <div>
              <Label>Saldo restante vence em</Label>
              <Input
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
              />
            </div>
          )}

          {preview && total > 0 && (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-bold text-foreground">Resumo do plano</p>
              <ul className="mt-2 space-y-1 font-medium text-foreground/90">
                <li>Total: {formatCurrency(total)}</li>
                {preview.entrada > 0 && (
                  <li>
                    Entrada: {formatCurrency(preview.entrada)}
                    {downPaymentPaid ? " (já recebida)" : " (a receber)"}
                  </li>
                )}
                <li>Saldo: {formatCurrency(preview.remaining)}</li>
                {preview.parcelValues.length > 0 && (
                  <li>
                    {paymentType === "parcelado"
                      ? `${preview.parcelCount} parcelas de ${formatCurrency(preview.parcelValues[0])}${preview.parcelCount > 1 ? " (aprox.)" : ""}`
                      : `1 pagamento de ${formatCurrency(preview.remaining)}`}
                  </li>
                )}
              </ul>
            </div>
          )}

          <Button
            onClick={handleCreatePayment}
            className="w-full"
            disabled={creating}
          >
            {creating ? "Criando..." : "Criar plano de pagamento"}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-2xs font-bold uppercase text-muted-foreground">Total</p>
              <p className="font-display text-lg font-bold">{formatCurrency(total)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-2xs font-bold uppercase text-muted-foreground">Entrada</p>
              <p className="font-display text-lg font-bold">
                {formatCurrency(Number(payment.down_payment ?? 0))}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-2xs font-bold uppercase text-muted-foreground">Pago</p>
              <p className="font-display text-lg font-bold text-emerald-600">
                {formatCurrency(paidTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-2xs font-bold uppercase text-muted-foreground">Falta</p>
              <p className="font-display text-lg font-bold text-amber-700">
                {formatCurrency(pendingTotal)}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {formatCurrency(paidTotal)} abatidos de {formatCurrency(total)}
            </p>
          </div>

          <div className="space-y-2">
            {records.map((r) => {
              const kind = (r.record_kind ?? "parcela") as "entrada" | "parcela";
              const label = recordLabel(kind, r.installment_number);
              const isPaying = payingId === r.id;

              return (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-xl border-2 p-4 transition-colors",
                    r.is_paid
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground">{label}</p>
                      <p className="text-lg font-display font-bold text-primary">
                        {formatCurrency(Number(r.value))}
                      </p>
                    </div>
                    {r.is_paid ? (
                      <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                        Pago
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                        Pendente
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                    {r.due_date && !r.is_paid && (
                      <span>Vence: {formatDate(r.due_date)}</span>
                    )}
                    {r.is_paid && r.paid_date && (
                      <span className="text-emerald-800">
                        Pago em: {formatDate(r.paid_date)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {!r.is_paid && !isPaying && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setPayingId(r.id);
                          setPayDate(new Date().toISOString().slice(0, 10));
                        }}
                      >
                        Registrar pagamento
                      </Button>
                    )}
                    {isPaying && (
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <Label className="text-xs">Data do pagamento</Label>
                          <Input
                            type="date"
                            value={payDate}
                            onChange={(e) => setPayDate(e.target.value)}
                          />
                        </div>
                        <Button size="sm" onClick={() => markPaid(r.id)}>
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPayingId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                    {r.is_paid && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unmarkPaid(r.id)}
                      >
                        Desfazer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
