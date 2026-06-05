/** Divide valor em N partes; última parcela absorve centavos de arredondamento */
export function splitAmount(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  if (parts === 1) return [roundMoney(total)];

  const base = Math.floor((total / parts) * 100) / 100;
  const amounts = Array.from({ length: parts }, () => base);
  const sum = roundMoney(base * (parts - 1));
  amounts[parts - 1] = roundMoney(total - sum);
  return amounts;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export interface BuildPaymentRecordsInput {
  paymentId: string;
  totalValue: number;
  downPayment: number;
  installments: number;
  paymentType: "avista" | "parcelado";
  downPaymentPaid: boolean;
  downPaymentPaidDate?: string;
  downPaymentDueDate?: string;
  firstInstallmentDueDate?: string;
}

export interface PaymentRecordDraft {
  payment_id: string;
  installment_number: number;
  record_kind: "entrada" | "parcela";
  due_date: string | null;
  paid_date: string | null;
  value: number;
  is_paid: boolean;
}

export function buildPaymentRecords(input: BuildPaymentRecordsInput): PaymentRecordDraft[] {
  const {
    paymentId,
    totalValue,
    downPayment,
    installments,
    paymentType,
    downPaymentPaid,
    downPaymentPaidDate,
    downPaymentDueDate,
    firstInstallmentDueDate,
  } = input;

  const entrada = roundMoney(Math.min(downPayment, totalValue));
  const remaining = roundMoney(totalValue - entrada);
  const records: PaymentRecordDraft[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const firstDue = firstInstallmentDueDate || today;

  if (entrada > 0) {
    records.push({
      payment_id: paymentId,
      installment_number: 0,
      record_kind: "entrada",
      due_date: downPaymentDueDate || today,
      paid_date: downPaymentPaid ? downPaymentPaidDate || today : null,
      value: entrada,
      is_paid: downPaymentPaid,
    });
  }

  if (remaining <= 0) return records;

  const parcelCount =
    paymentType === "avista" ? 1 : Math.max(1, installments);

  const parcelValues = splitAmount(remaining, parcelCount);

  parcelValues.forEach((value, index) => {
    records.push({
      payment_id: paymentId,
      installment_number: index + 1,
      record_kind: "parcela",
      due_date:
        paymentType === "avista"
          ? firstDue
          : addMonths(firstDue, index),
      paid_date: null,
      value,
      is_paid: false,
    });
  });

  return records;
}

export function recordLabel(
  kind: "entrada" | "parcela",
  installmentNumber: number
): string {
  if (kind === "entrada") return "Entrada";
  return `Parcela ${installmentNumber}`;
}
