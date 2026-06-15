export const PAYABLE_CATEGORIES = [
  "Fornecedor",
  "Salário",
  "Aluguel",
  "Insumos",
  "Impostos",
  "Marketing",
  "Equipamento",
  "Outro",
] as const;

export const PAYMENT_METHODS = [
  "PIX",
  "Dinheiro",
  "Cartão",
  "Boleto",
  "Transferência",
  "Outro",
] as const;

export type PayableStatus = "pendente" | "pago" | "cancelado";

export type AccountPayable = {
  id: string;
  user_id: string;
  description: string;
  supplier: string | null;
  category: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: PayableStatus;
  holder: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PayablesSummary = {
  pendingTotal: number;
  paidTotal: number;
  overdueTotal: number;
  count: number;
};

export function summarizePayables(
  items: AccountPayable[],
  today = new Date().toISOString().slice(0, 10)
): PayablesSummary {
  let pendingTotal = 0;
  let paidTotal = 0;
  let overdueTotal = 0;

  for (const item of items) {
    const amount = Number(item.amount);
    if (item.status === "pago") {
      paidTotal += amount;
    } else if (item.status === "pendente") {
      pendingTotal += amount;
      if (item.due_date < today) overdueTotal += amount;
    }
  }

  return {
    pendingTotal,
    paidTotal,
    overdueTotal,
    count: items.length,
  };
}
