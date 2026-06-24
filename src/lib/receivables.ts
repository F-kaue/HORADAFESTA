export type ReceivableBucket = "pending" | "held" | "available";

export type ReceivableSource = "lead" | "manual";

export type ReceivableLeadRow = {
  leadId: string;
  source: ReceivableSource;
  clientName: string;
  eventDate: string | null;
  eventType: string | null;
  status: string;
  contractTotal: number;
  received: number;
  pending: number;
  held: number;
  available: number;
  bucket: ReceivableBucket;
  revenueRecognizedAt: string | null;
  manuallyReleased: boolean;
  autoReleased: boolean;
  receivedInPeriod?: number;
  expensesInPeriod?: number;
  profitInPeriod?: number;
};

export type ReceivablesSummary = {
  contractTotal: number;
  receivedTotal: number;
  pendingTotal: number;
  heldTotal: number;
  availableTotal: number;
  rows: ReceivableLeadRow[];
  eventTypes?: string[];
  receivedInPeriodTotal?: number;
  expensesInPeriodTotal?: number;
  profitInPeriodTotal?: number;
  netAvailableBalance?: number;
  paidPayablesTotal?: number;
};

/** Saldo só vira receita disponível quando liberado manualmente ou evento finalizado */
export function isRevenueRecognized(
  _eventDate: string | null | undefined,
  leadStatus: string,
  revenueRecognizedAt?: string | null
): boolean {
  if (revenueRecognizedAt) return true;
  if (leadStatus === "finalizado") return true;
  return false;
}

export function classifyReceivableRow(input: {
  leadId: string;
  source?: ReceivableSource;
  clientName: string;
  eventDate: string | null;
  eventType: string | null;
  status: string;
  contractTotal: number;
  received: number;
  revenueRecognizedAt?: string | null;
}): ReceivableLeadRow {
  const pending = Math.max(0, input.contractTotal - input.received);
  const manuallyReleased = Boolean(input.revenueRecognizedAt);
  const recognized = isRevenueRecognized(
    input.eventDate,
    input.status,
    input.revenueRecognizedAt
  );
  const autoReleased =
    recognized && !manuallyReleased && input.received > 0;
  const held = recognized ? 0 : input.received;
  const available = recognized ? input.received : 0;

  let bucket: ReceivableBucket = "pending";
  if (held > 0) bucket = "held";
  else if (pending > 0) bucket = "pending";
  else if (available > 0) bucket = "available";

  return {
    leadId: input.leadId,
    source: input.source ?? "lead",
    clientName: input.clientName,
    eventDate: input.eventDate,
    eventType: input.eventType,
    status: input.status,
    contractTotal: input.contractTotal,
    received: input.received,
    pending,
    held,
    available,
    bucket,
    revenueRecognizedAt: input.revenueRecognizedAt ?? null,
    manuallyReleased,
    autoReleased,
  };
}

export function buildReceivablesSummary(
  rows: ReceivableLeadRow[]
): ReceivablesSummary {
  return {
    contractTotal: rows.reduce((s, r) => s + r.contractTotal, 0),
    receivedTotal: rows.reduce((s, r) => s + r.received, 0),
    pendingTotal: rows.reduce((s, r) => s + r.pending, 0),
    heldTotal: rows.reduce((s, r) => s + r.held, 0),
    availableTotal: rows.reduce((s, r) => s + r.available, 0),
    rows,
  };
}

export const RECEIVABLE_BUCKET_LABELS: Record<
  ReceivableBucket,
  { label: string; description: string; color: string }
> = {
  pending: {
    label: "A receber",
    description: "Valor ainda não recebido do cliente",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  held: {
    label: "Recebido retido",
    description:
      "Já entrou na conta — confirme em Contas a receber quando puder usar o saldo",
    color: "text-sky-700 bg-sky-50 border-sky-200",
  },
  available: {
    label: "Receita disponível",
    description:
      "Valor recebido e liberado para uso (confirmado por você ou evento finalizado)",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
};
