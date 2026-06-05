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

export interface PaymentAllocation {
  record_id: string;
  amount: number;
}

export interface PaymentTransactionRow {
  id: string;
  payment_id: string;
  amount: number;
  paid_date: string;
  notes: string | null;
  allocations: PaymentAllocation[];
  created_at: string;
}

export interface PaymentRecordRow {
  id: string;
  payment_id: string;
  installment_number: number;
  record_kind: "entrada" | "parcela";
  due_date: string | null;
  paid_date: string | null;
  value: number;
  is_paid: boolean;
}

/** Quanto já foi recebido em cada parcela/entrada */
export function getPaidPerRecord(
  transactions: PaymentTransactionRow[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const tx of transactions) {
    for (const a of tx.allocations ?? []) {
      map[a.record_id] = roundMoney((map[a.record_id] ?? 0) + a.amount);
    }
  }
  return map;
}

export function getTotalReceived(transactions: PaymentTransactionRow[]): number {
  return roundMoney(transactions.reduce((s, t) => s + Number(t.amount), 0));
}

/** Rateio automático: entrada primeiro, depois parcelas em ordem */
export function allocatePayment(
  records: PaymentRecordRow[],
  paidPerRecord: Record<string, number>,
  amount: number,
  targetRecordId?: string | null
): PaymentAllocation[] {
  const left = roundMoney(amount);
  if (left <= 0) return [];

  if (targetRecordId) {
    const record = records.find((r) => r.id === targetRecordId);
    if (!record) return [];
    return [{ record_id: targetRecordId, amount: left }];
  }

  const sorted = [...records].sort(
    (a, b) => a.installment_number - b.installment_number
  );
  const allocations: PaymentAllocation[] = [];
  let remaining = left;

  for (const record of sorted) {
    if (remaining <= 0) break;
    const already = paidPerRecord[record.id] ?? 0;
    const need = roundMoney(Number(record.value) - already);
    if (need <= 0) continue;
    const apply = roundMoney(Math.min(remaining, need));
    allocations.push({ record_id: record.id, amount: apply });
    remaining = roundMoney(remaining - apply);
  }

  if (remaining > 0 && sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    const existing = allocations.find((a) => a.record_id === last.id);
    if (existing) {
      existing.amount = roundMoney(existing.amount + remaining);
    } else {
      allocations.push({ record_id: last.id, amount: remaining });
    }
  }

  return allocations;
}

export function describeAllocations(
  allocations: PaymentAllocation[],
  records: PaymentRecordRow[]
): string {
  if (!allocations.length) return "—";
  return allocations
    .map((a) => {
      const r = records.find((rec) => rec.id === a.record_id);
      const name = r
        ? recordLabel(r.record_kind, r.installment_number)
        : "Item";
      return `${name}: ${formatAllocationAmount(a.amount)}`;
    })
    .join(" · ");
}

function formatAllocationAmount(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function buildRecordSyncUpdates(
  records: PaymentRecordRow[],
  transactions: PaymentTransactionRow[]
): { id: string; is_paid: boolean; paid_date: string | null }[] {
  const paidPerRecord = getPaidPerRecord(transactions);
  const lastPaidDateByRecord: Record<string, string> = {};

  for (const tx of transactions) {
    for (const a of tx.allocations ?? []) {
      if (!lastPaidDateByRecord[a.record_id] || tx.paid_date > lastPaidDateByRecord[a.record_id]) {
        lastPaidDateByRecord[a.record_id] = tx.paid_date;
      }
    }
  }

  return records.map((r) => {
    const paid = paidPerRecord[r.id] ?? 0;
    const full = paid >= Number(r.value) - 0.009;
    return {
      id: r.id,
      is_paid: full,
      paid_date: full ? lastPaidDateByRecord[r.id] ?? null : null,
    };
  });
}
