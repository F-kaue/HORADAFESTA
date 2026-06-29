"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency, formatCurrencyInput, parseCurrencyBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EditableContractTotalProps = {
  value: number;
  onSave: (newValue: number) => Promise<boolean>;
  className?: string;
  compact?: boolean;
};

export function EditableContractTotal({
  value,
  onSave,
  className,
  compact = false,
}: EditableContractTotalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatCurrencyInput(value));
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(formatCurrencyInput(value));
    setEditing(true);
  };

  const cancel = () => {
    setDraft(formatCurrencyInput(value));
    setEditing(false);
  };

  const save = async () => {
    const parsed = parseCurrencyBRL(draft);
    if (parsed <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (Math.abs(parsed - value) < 0.009) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave(parsed);
      if (ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className={cn("space-y-2", className)}>
        <CurrencyInput value={draft} onValueChange={setDraft} />
        <div className="flex gap-1">
          <Button size="sm" className="h-8 gap-1" onClick={save} disabled={saving}>
            <Check className="h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={cancel} disabled={saving}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start justify-between gap-2", className)}>
      <p
        className={cn(
          "font-display font-bold tabular-nums text-foreground",
          compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
        )}
      >
        {formatCurrency(value)}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
        onClick={startEdit}
        aria-label="Editar valor do contrato"
      >
        <Pencil className="h-3.5 w-3.5" />
        {!compact && "Editar"}
      </Button>
    </div>
  );
}
