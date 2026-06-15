"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/payables";
import { parseCurrencyBRL } from "@/lib/utils";
import { toast } from "sonner";

interface ManualReceivableDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ManualReceivableDialog({
  open,
  onClose,
  onCreated,
}: ManualReceivableDialogProps) {
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [contractTotal, setContractTotal] = useState("");
  const [receivedTotal, setReceivedTotal] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [markAvailable, setMarkAvailable] = useState(false);

  const reset = () => {
    setClientName("");
    setDescription("");
    setEventDate("");
    setEventType("");
    setContractTotal("");
    setReceivedTotal("");
    setReceivedDate("");
    setPaymentMethod(PAYMENT_METHODS[0]);
    setNotes("");
    setMarkAvailable(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contract = parseCurrencyBRL(contractTotal);
    const received = receivedTotal ? parseCurrencyBRL(receivedTotal) : 0;

    if (!clientName.trim() || contract <= 0) {
      toast.error("Informe cliente e valor do contrato");
      return;
    }
    if (received > contract) {
      toast.error("Recebido não pode ser maior que o contrato");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/finance/manual-receivables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName.trim(),
          description: description.trim() || undefined,
          event_date: eventDate || undefined,
          event_type: eventType.trim() || undefined,
          contract_total: contract,
          received_total: received,
          received_date: receivedDate || undefined,
          payment_method: paymentMethod,
          notes: notes.trim() || undefined,
          mark_available: markAvailable && received > 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar");
        return;
      }
      toast.success("Recebível cadastrado");
      reset();
      onClose();
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="font-display text-xl font-bold">
          Cadastrar recebível
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          Use para lançamentos retroativos que não vieram de um evento no CRM.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Festa corporativa 2024"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data do evento</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de evento</Label>
              <Input
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="Aniversário, etc."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor do contrato *</Label>
              <CurrencyInput value={contractTotal} onValueChange={setContractTotal} />
            </div>
            <div className="space-y-2">
              <Label>Já recebido</Label>
              <CurrencyInput value={receivedTotal} onValueChange={setReceivedTotal} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data do recebimento</Label>
              <Input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
              />
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
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={markAvailable}
              onChange={(e) => setMarkAvailable(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Saldo já disponível (não retido)
          </label>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={saving}>
            <Plus className="h-4 w-4" />
            {saving ? "Salvando..." : "Cadastrar recebível"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
