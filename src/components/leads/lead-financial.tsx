"use client";

import { useEffect, useState } from "react";
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
import type { Lead, Payment, PaymentRecord } from "@/types/database";
import { toast } from "sonner";

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
  const [installments, setInstallments] = useState("1");
  const [paymentType, setPaymentType] = useState<"avista" | "parcelado">("avista");

  const load = async () => {
    const res = await fetch(`/api/payments?lead_id=${lead.id}`);
    const data = await res.json();
    if (data.payment) {
      setPayment(data.payment);
      setRecords(data.records ?? []);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const paidTotal = records
    .filter((r) => r.is_paid)
    .reduce((s, r) => s + Number(r.value), 0);
  const total = payment
    ? Number(payment.total_value)
    : parseCurrencyBRL(totalValue);
  const progress = total > 0 ? (paidTotal / total) * 100 : 0;

  const paymentStatus =
    paidTotal === 0
      ? "🔴 Sem entrada"
      : paidTotal >= total
        ? "🟢 Quitado"
        : "🟡 Parcialmente pago";

  const handleCreatePayment = async () => {
    const amount = parseCurrencyBRL(totalValue);
    if (amount <= 0) {
      toast.error("Informe o valor total");
      return;
    }
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: lead.id,
        total_value: amount,
        installments: parseInt(installments, 10),
        payment_type: paymentType,
      }),
    });
    if (!res.ok) {
      toast.error("Erro ao criar pagamento");
      return;
    }
    toast.success("Plano de pagamento criado");
    load();
    onUpdate();
  };

  const markPaid = async (recordId: string) => {
    await fetch(`/api/payments/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_paid: true, paid_date: new Date().toISOString().slice(0, 10) }),
    });
    toast.success("Pagamento registrado");
    load();
    onUpdate();
  };

  if (lead.status !== "confirmado") {
    return (
      <p className="text-sm text-muted-foreground">
        Confirme o evento primeiro para registrar pagamentos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">{paymentStatus}</p>

      {!payment ? (
        <div className="space-y-3">
          <div>
            <Label>Valor total</Label>
            <CurrencyInput
              value={totalValue}
              onValueChange={setTotalValue}
              placeholder="R$ 5.000,00"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={paymentType === "avista" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentType("avista")}
            >
              À vista
            </Button>
            <Button
              type="button"
              variant={paymentType === "parcelado" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentType("parcelado")}
            >
              Parcelado
            </Button>
          </div>
          {paymentType === "parcelado" && (
            <div>
              <Label>Parcelas</Label>
              <Input
                type="number"
                min={2}
                max={12}
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
            </div>
          )}
          <Button onClick={handleCreatePayment} className="w-full">
            Criar plano de pagamento
          </Button>
        </div>
      ) : (
        <>
          <p className="text-lg font-display font-semibold">
            {formatCurrency(total)}
          </p>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(paidTotal)} de {formatCurrency(total)} pagos ({Math.round(progress)}%)
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Parcela</th>
                <th>Valor</th>
                <th>Venc.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.installment_number}</td>
                  <td>{formatCurrency(Number(r.value))}</td>
                  <td>{r.due_date ? formatDate(r.due_date) : "—"}</td>
                  <td>
                    {r.is_paid ? (
                      <span className="text-success">✅ Pago</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => markPaid(r.id)}>
                        Registrar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
