export type ClientProfitRow = {
  key: string;
  leadId: string | null;
  clientName: string;
  receivedInPeriod: number;
  expensesInPeriod: number;
  profit: number;
  eventCount: number;
};

export function buildClientProfitRows(
  entries: {
    leadId: string | null;
    clientName: string;
    amount: number;
  }[],
  expenses: {
    leadId: string | null;
    clientName: string | null;
    amount: number;
  }[]
): ClientProfitRow[] {
  const map = new Map<string, ClientProfitRow>();

  const ensure = (leadId: string | null, clientName: string) => {
    const key = leadId ?? `manual:${clientName.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) return existing;
    const row: ClientProfitRow = {
      key,
      leadId,
      clientName,
      receivedInPeriod: 0,
      expensesInPeriod: 0,
      profit: 0,
      eventCount: 0,
    };
    map.set(key, row);
    return row;
  };

  for (const entry of entries) {
    const row = ensure(entry.leadId, entry.clientName);
    row.receivedInPeriod += entry.amount;
    row.eventCount += 1;
  }

  for (const expense of expenses) {
    if (!expense.leadId && !expense.clientName) continue;
    const name = expense.clientName ?? "Sem cliente";
    const row = ensure(expense.leadId, name);
    row.expensesInPeriod += expense.amount;
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      profit: row.receivedInPeriod - row.expensesInPeriod,
    }))
    .filter(
      (row) => row.receivedInPeriod > 0 || row.expensesInPeriod > 0
    )
    .sort((a, b) => b.profit - a.profit || a.clientName.localeCompare(b.clientName));
}
