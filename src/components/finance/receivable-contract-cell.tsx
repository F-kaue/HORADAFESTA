"use client";

import { EditableContractTotal } from "@/components/finance/editable-contract-total";
import type { ReceivableLeadRow } from "@/lib/receivables";
import { toast } from "sonner";

type ReceivableContractCellProps = {
  row: ReceivableLeadRow;
  onUpdated: () => void;
  compact?: boolean;
};

export function ReceivableContractCell({
  row,
  onUpdated,
  compact,
}: ReceivableContractCellProps) {
  const save = async (newValue: number) => {
    const res = await fetch(
      row.source === "lead"
        ? "/api/payments"
        : `/api/finance/manual-receivables/${row.leadId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          row.source === "lead"
            ? { lead_id: row.leadId, total_value: newValue }
            : { contract_total: newValue }
        ),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erro ao atualizar contrato");
      return false;
    }
    toast.success("Valor do contrato atualizado");
    onUpdated();
    return true;
  };

  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <EditableContractTotal
        value={row.contractTotal}
        onSave={save}
        compact={compact}
      />
    </div>
  );
}
