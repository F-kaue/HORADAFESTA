"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle, Clock, Wallet } from "lucide-react";
import { FinancePageHeader, FinancePanel } from "@/components/finance/finance-page-header";
import { FinanceStatCard } from "@/components/finance/finance-stat-card";
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
import { formatCurrency, formatDate, parseCurrencyBRL } from "@/lib/utils";
import {
  PAYABLE_CATEGORIES,
  PAYMENT_METHODS,
  summarizePayables,
  type AccountPayable,
} from "@/lib/payables";
import { ReportToolbar } from "@/components/finance/report-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useReportBranding } from "@/components/finance/use-report-branding";
import { exportToExcel, exportToPdf, printReport } from "@/lib/report-export";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export default function ContasAPagarPage() {
  const branding = useReportBranding();
  const [items, setItems] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [holderFilter, setHolderFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState<string>(PAYABLE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [holder, setHolder] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [markPaid, setMarkPaid] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (holderFilter !== "all") params.set("holder", holderFilter);
    if (methodFilter !== "all") params.set("payment_method", methodFilter);

    const res = await fetch(`/api/accounts-payable?${params}`, { cache: "no-store" });
    const json = await res.json();
    setItems(json.items ?? []);
    setLoading(false);
  }, [from, to, statusFilter, categoryFilter, holderFilter, methodFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = summarizePayables(items);
  const holders = Array.from(
    new Set(items.map((i) => i.holder).filter(Boolean))
  ) as string[];

  const resetForm = () => {
    setDescription("");
    setSupplier("");
    setCategory(PAYABLE_CATEGORIES[0]);
    setAmount("");
    setDueDate("");
    setHolder("");
    setPaymentMethod(PAYMENT_METHODS[0]);
    setNotes("");
    setMarkPaid(false);
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseCurrencyBRL(amount);
    if (!description || value <= 0 || !dueDate) {
      toast.error("Preencha descrição, valor e vencimento");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/accounts-payable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        supplier: supplier || undefined,
        category,
        amount: value,
        due_date: dueDate,
        status: markPaid ? "pago" : "pendente",
        holder: holder || undefined,
        payment_method: paymentMethod,
        notes: notes || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Erro ao salvar");
      return;
    }
    toast.success("Despesa cadastrada");
    resetForm();
    load();
  };

  const markAsPaid = async (id: string) => {
    const res = await fetch(`/api/accounts-payable/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago" }),
    });
    if (!res.ok) {
      toast.error("Erro ao marcar como pago");
      return;
    }
    toast.success("Despesa paga");
    load();
  };

  const removeItem = async () => {
    if (!cancelId) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/accounts-payable/${cancelId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Erro ao cancelar");
        return;
      }
      toast.success("Despesa cancelada");
      setCancelId(null);
      load();
    } finally {
      setCancelLoading(false);
    }
  };

  const exportRows = items.map((i) => ({
    descricao: i.description,
    fornecedor: i.supplier ?? "—",
    categoria: i.category,
    valor: i.amount,
    vencimento: formatDate(i.due_date),
    pagamento: i.paid_date ? formatDate(i.paid_date) : "—",
    status: STATUS_LABELS[i.status],
    portador: i.holder ?? "—",
    forma: i.payment_method ?? "—",
  }));

  const columns = [
    { key: "descricao", header: "Descrição" },
    { key: "fornecedor", header: "Fornecedor" },
    { key: "categoria", header: "Categoria" },
    {
      key: "valor",
      header: "Valor",
      format: (r: { valor: number }) => formatCurrency(r.valor),
    },
    { key: "vencimento", header: "Vencimento" },
    { key: "pagamento", header: "Pagamento" },
    { key: "status", header: "Status" },
    { key: "portador", header: "Portador" },
    { key: "forma", header: "Forma" },
  ];

  const filterMeta = [
    ...(from ? [{ label: "De", value: formatDate(from) }] : []),
    ...(to ? [{ label: "Até", value: formatDate(to) }] : []),
    ...(statusFilter !== "all"
      ? [{ label: "Status", value: STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS] }]
      : []),
    ...(categoryFilter !== "all" ? [{ label: "Categoria", value: categoryFilter }] : []),
    ...(holderFilter !== "all" ? [{ label: "Portador", value: holderFilter }] : []),
    ...(methodFilter !== "all" ? [{ label: "Forma", value: methodFilter }] : []),
  ];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5 sm:space-y-6">
      <FinancePageHeader
        title="Contas a pagar"
        description="Cadastre despesas, acompanhe vencimentos e controle portador e forma de pagamento."
        actions={
          <div className="flex flex-wrap gap-2">
            <ReportToolbar
              disabled={!items.length}
              onExportExcel={() => exportToExcel("contas-a-pagar", columns, exportRows)}
              onExportPdf={() =>
                exportToPdf({
                  filename: "contas-a-pagar",
                  title: "Contas a Pagar",
                  branding,
                  filters: filterMeta,
                  summaryLines: [
                    `Pendentes: ${formatCurrency(summary.pendingTotal)}`,
                    `Pagas: ${formatCurrency(summary.paidTotal)}`,
                    `Vencidas: ${formatCurrency(summary.overdueTotal)}`,
                  ],
                  columns,
                  rows: exportRows,
                })
              }
              onPrint={() => printReport("payables-report")}
            />
            <Button className="gap-2" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" />
              Nova despesa
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label="Pendentes"
          value={formatCurrency(summary.pendingTotal)}
          icon={Clock}
          tone="amber"
        />
        <FinanceStatCard
          label="Pagas"
          value={formatCurrency(summary.paidTotal)}
          icon={Wallet}
          tone="emerald"
        />
        <FinanceStatCard
          label="Vencidas"
          value={formatCurrency(summary.overdueTotal)}
          icon={AlertCircle}
          tone="rose"
        />
      </div>

      {showForm && (
        <FinancePanel title="Nova despesa" description="Preencha os dados da despesa">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição *</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: Compra de insumos"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Nome do fornecedor"
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
              <div className="space-y-2">
                <Label>Portador</Label>
                <Input
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  placeholder="Ex.: Conta Nubank, Caixa"
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
                <input
                  type="checkbox"
                  checked={markPaid}
                  onChange={(e) => setMarkPaid(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Já foi paga
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar despesa"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
        </FinancePanel>
      )}

      <FinancePanel title="Filtros" description="Refine a lista de despesas">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Vencimento — de</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Vencimento — até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {PAYABLE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Portador</Label>
            <Select value={holderFilter} onValueChange={setHolderFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {holders.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FinancePanel>

      <FinancePanel title="Despesas" description="Todas as contas cadastradas">
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
          {!loading && items.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Nenhuma despesa encontrada.
            </p>
          )}
          {items.map((item) => {
            const overdue =
              item.status === "pendente" && item.due_date < today;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                  overdue && "border-rose-300 bg-rose-50/50 dark:bg-rose-950/20"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.supplier && `${item.supplier} · `}
                    {item.category} · Vence {formatDate(item.due_date)}
                    {item.holder && ` · ${item.holder}`}
                    {item.payment_method && ` · ${item.payment_method}`}
                  </p>
                  <p className="mt-2 text-lg font-bold text-foreground">
                    {formatCurrency(item.amount)}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-2xs font-bold",
                      item.status === "pago"
                        ? "bg-emerald-100 text-emerald-800"
                        : overdue
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {overdue && item.status === "pendente"
                      ? "Vencida"
                      : STATUS_LABELS[item.status]}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  {item.status === "pendente" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => markAsPaid(item.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Pagar
                    </Button>
                  )}
                  {item.status !== "cancelado" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      onClick={() => setCancelId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </FinancePanel>

      <ConfirmDialog
        open={Boolean(cancelId)}
        onOpenChange={(open) => !open && setCancelId(null)}
        variant="danger"
        title="Cancelar despesa?"
        description="A despesa será removida da lista de contas a pagar. Essa ação não pode ser desfeita."
        confirmLabel="Sim, cancelar"
        loading={cancelLoading}
        onConfirm={removeItem}
      />

      <div id="payables-report" className="hidden print:block">
        <h1>{branding.businessName}</h1>
        {branding.cnpj && <p>CNPJ: {branding.cnpj}</p>}
        <h2>Contas a Pagar</h2>
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exportRows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.header}>
                    {c.format ? c.format(r as never) : String(r[c.key as keyof typeof r])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
