"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type LeadOption = {
  id: string;
  name: string;
  status: string;
  event_date: string | null;
};

interface ContractCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ContractCreateDialog({ open, onClose }: ContractCreateDialogProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [leadId, setLeadId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/leads-for-contracts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLeads(d.items ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadId ? { lead_id: leadId } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar contrato");
        return;
      }
      toast.success("Contrato criado");
      onClose();
      router.push(`/contratos/${data.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="font-display text-xl font-bold">
          Novo contrato
        </DialogTitle>
        <DialogDescription>
          Selecione um cliente do CRM para preencher os dados automaticamente, ou
          crie em branco e preencha depois.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Cliente (opcional)</Label>
            <Select value={leadId || "none"} onValueChange={(v) => setLeadId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione o cliente"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente — preencher manualmente</SelectItem>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                    {l.event_date ? ` · ${l.event_date.split("-").reverse().join("/")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full gap-2" onClick={handleCreate} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? "Criando..." : "Criar contrato"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
