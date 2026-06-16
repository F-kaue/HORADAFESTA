"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
} from "lucide-react";
import { FinancePageHeader, FinancePanel } from "@/components/finance/finance-page-header";
import { FinanceStatCard } from "@/components/finance/finance-stat-card";
import { ContractCreateDialog } from "@/components/contracts/contract-create-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTRACT_STATUS_LABELS,
  type ContractRecord,
  type ContractStatus,
} from "@/lib/contracts/template";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ContratosPage() {
  const [items, setItems] = useState<ContractRecord[]>([]);
  const [stats, setStats] = useState({ rascunho: 0, enviado: 0, assinado: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const [listRes, allRes] = await Promise.all([
      fetch(`/api/contracts?${params}`, { cache: "no-store" }),
      fetch("/api/contracts", { cache: "no-store" }),
    ]);
    const data = await listRes.json();
    const allData = await allRes.json();
    setItems(data.items ?? []);
    const all = (allData.items ?? []) as ContractRecord[];
    setStats({
      rascunho: all.filter((i) => i.status === "rascunho").length,
      enviado: all.filter((i) => i.status === "enviado").length,
      assinado: all.filter((i) => i.status === "assinado").length,
    });
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const removeContract = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/contracts/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erro ao excluir contrato");
        return;
      }
      toast.success("Contrato excluído");
      setDeleteId(null);
      load();
    } finally {
      setDeleteLoading(false);
    }
  };

  const counts = stats;

  return (
    <div className="space-y-5 sm:space-y-6">
      <FinancePageHeader
        title="Contratos"
        description="Gere contratos profissionais, baixe em PDF para envio e acompanhe a assinatura com anexo do documento retornado."
        actions={
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Novo contrato
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label="Rascunhos"
          value={String(counts.rascunho)}
          icon={Clock}
          tone="amber"
        />
        <FinanceStatCard
          label="Enviados"
          value={String(counts.enviado)}
          icon={Send}
          tone="sky"
        />
        <FinanceStatCard
          label="Assinados"
          value={String(counts.assinado)}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <FinancePanel title="Contratos" description="Lista e acompanhamento">
        <div className="mb-4 max-w-xs">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ContractStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="assinado">Assinado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum contrato ainda.</p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              Criar primeiro contrato
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {item.contratante_name || "Sem nome"}
                    </p>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-2xs font-bold",
                        CONTRACT_STATUS_LABELS[item.status].color
                      )}
                    >
                      {CONTRACT_STATUS_LABELS[item.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.event_date ? `Evento ${formatDate(item.event_date)}` : "Data não informada"}
                    {item.lead ? ` · CRM: ${item.lead.name}` : ""}
                  </p>
                  {item.signed_at && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Assinado em {formatDate(item.signed_at.slice(0, 10))}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <Link href={`/contratos/${item.id}`}>
                      <Eye className="h-4 w-4" />
                      Abrir
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </FinancePanel>

      <ContractCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        variant="danger"
        title="Excluir contrato?"
        description="O contrato e o anexo assinado (se houver) serão apagados permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Sim, excluir"
        loading={deleteLoading}
        onConfirm={removeContract}
      />
    </div>
  );
}
