"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  PAYABLE_CATEGORIES,
  PAYMENT_METHODS,
  type AccountPayable,
  type PayableStatus,
} from "@/lib/payables";
import {
  formatCurrencyInput,
  parseCurrencyBRL,
} from "@/lib/utils";
import { toast } from "sonner";

interface PayableEditDialogProps {
  item: AccountPayable | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PayableEditDialog({
  item,
  open,
  onClose,
  onSaved,
}: PayableEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState<string>(PAYABLE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [holder, setHolder] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<PayableStatus>("pendente");
  const [paidDate, setPaidDate] = useState("");

  useEffect(() => {
    if (!item || !open) return;
    setDescription(item.description);
    setSupplier(item.supplier ?? "");
    setCategory(item.category);
    setAmount(formatCurrencyInput(Number(item.amount)));
    setDueDate(item.due_date);
    setHolder(item.holder ?? "");
    setPaymentMethod(item.payment_method ?? PAYMENT_METHODS[0]);
    setNotes(item.notes ?? "");
    setStatus(item.status === "cancelado" ? "pendente" : item.status);
    setPaidDate(
      item.paid_date ?? new Date().toISOString().slice(0, 10)
    );
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const value = parseCurrencyBRL(amount);
    if (!description.trim() || value <= 0 || !dueDate) {
      toast.error("Preencha descrição, valor e vencimento");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/accounts-payable/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          supplier: supplier.trim() || null,
          category,
          amount: value,
          due_date: dueDate,
          holder: holder.trim() || null,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
          status,
          paid_date: status === "pago" ? paidDate : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success("Despesa atualizada");
      onClose();
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 font-display text-xl font-bold">
          <Pencil className="h-5 w-5 text-primary" />
          Editar despesa
        </DialogTitle>
        <DialogDescription>
          Atualize os dados desta conta a pagar.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYABLE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor *</Label>
              <CurrencyInput value={amount} onValueChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Portador</Label>
              <Input value={holder} onChange={(e) => setHolder(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PayableStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === "pago" && (
              <div className="space-y-2">
                <Label>Data do pagamento</Label>
                <Input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
