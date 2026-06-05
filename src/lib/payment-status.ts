import { roundMoney } from "@/lib/payments";
import { formatCurrency } from "@/lib/utils";

export type LeadPaymentStatus = "none" | "pending" | "partial" | "paid";

export type LeadPaymentSummary = {
  status: LeadPaymentStatus;
  total: number;
  received: number;
  remaining: number;
};

export function computeLeadPaymentStatus(
  total: number,
  received: number
): LeadPaymentStatus {
  if (total <= 0) return "none";
  const remaining = roundMoney(total - received);
  if (remaining <= 0.009) return received > 0 ? "paid" : "pending";
  if (received <= 0.009) return "pending";
  return "partial";
}

export function buildPaymentSummary(
  total: number,
  received: number
): LeadPaymentSummary {
  const remaining = roundMoney(Math.max(0, total - received));
  return {
    status: computeLeadPaymentStatus(total, received),
    total,
    received: roundMoney(received),
    remaining,
  };
}

export const PAYMENT_STATUS_LABELS: Record<
  Exclude<LeadPaymentStatus, "none">,
  string
> = {
  paid: "Quitado",
  partial: "Parcial",
  pending: "A receber",
};

export function paymentStatusShortLabel(summary: LeadPaymentSummary): string {
  if (summary.status === "paid") return "Quitado";
  if (summary.status === "partial") {
    return `Falta ${formatCurrency(summary.remaining)}`;
  }
  if (summary.status === "pending") return "A receber";
  return "";
}
