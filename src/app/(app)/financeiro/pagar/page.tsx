"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle, Clock, Wallet, Pencil } from "lucide-react";
import { FinancePageHeader, FinancePanel } from "@/components/finance/finance-page-header";
import { FinanceListFilters } from "@/components/finance/finance-list-filters";
import { FinancePeriodSelector } from "@/components/finance/finance-period-selector";
import { ClientProfitPanel } from "@/components/finance/client-profit-panel";
import { LeadSelect } from "@/components/finance/lead-select";
import { useFinancePeriod } from "@/components/finance/use-finance-period";
import { FinanceStatCard } from "@/components/finance/finance-stat-card";
import { PayableEditDialog } from "@/components/finance/payable-edit-dialog";
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
import { matchesSearch } from "@/lib/search-text";
import { formatPeriodLabel, getDefaultPeriodRange } from "@/lib/finance-period";
import type { ClientProfitRow } from "@/lib/client-profit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export default function ContasAPagarPage() {
  const branding = useReportBranding();
  const { mode, range, setMode, setRange } = useFinancePeriod("week");
  const [items, setItems] = useState<AccountPayable[]>([]);
  const [clientProfit, setClientProfit] = useState<ClientProfitRow[]>([]);
  const [periodPaidOut, setPeriodPaidOut] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [holderFilter, setHolderFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [holders, setHolders] = useState<string[]>([]);

  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState<string>(PAYABLE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [holder, setHolder] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [leadId, setLeadId] = useState("none");
  const [markPaid, setMarkPaid] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [editing, setEditing] = useState<AccountPayable | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      from: range.from,
      to: range.to,
    });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (holderFilter !== "all") params.set("holder", holderFilter);
    if (methodFilter !== "all") params.set("payment_method", methodFilter);

    const [payablesRes, cashflowRes] = await Promise.all([
      fetch(`/api/accounts-payable?${params}`, { cache: "no-store" }),
      fetch(
        `/api/finance/cashflow?from=${range.from}&to=${range.to}&mode=${mode}`,
        { cache: "no-store" }
      ),
    ]);
    const json = await payablesRes.json();
    const cashflow = await cashflowRes.json();
    setItems(json.items ?? []);
    setHolders(json.holders ?? []);
    setPeriodPaidOut(json.periodPaidOut ?? 0);
    setClientProfit(cashflow.clientProfit ?? []);
    setLoading(false);
  }, [
    range.from,
    range.to,
    mode,
    statusFilter,
    categoryFilter,
    holderFilter,
    methodFilter,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const clearFilters = () => {
    setRange(getDefaultPeriodRange(mode));
    setStatusFilter("all");
    setCategoryFilter("all");
    setHolderFilter("all");
    setMethodFilter("all");
    setSearch("");
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    holderFilter !== "all" ||
    methodFilter !== "all" ||
    range.from !== getDefaultPeriodRange(mode).from ||
    range.to !== getDefaultPeriodRange(mode).to;

  const periodLabel = formatPeriodLabel(range, mode);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((item) =>
      matchesSearch(
        search,
        item.description,
        item.supplier ?? undefined,
        item.client_name ?? undefined,
        item.category,
        item.holder ?? undefined,
        item.payment_method ?? undefined,
        item.notes ?? undefined
      )
    );
  }, [items, search]);

  const summary = summarizePayables(items);

  const resetForm = () => {
    setDescription("");
    setSupplier("");
    setCategory(PAYABLE_CATEGORIES[0]);
    setAmount("");
    setDueDate("");
    setHolder("");
    setPaymentMethod(PAYMENT_METHODS[0]);
    setNotes("");
    setLeadId("none");
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
        lead_id: leadId !== "none" ? leadId : null,
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
        toast.error("Erro ao excluir");
        return;
      }
      toast.success("Despesa excluída");
      setCancelId(null);
      load();
    } finally {
      setCancelLoading(false);
    }
  };

  const exportRows = filteredItems.map((i) => ({
    descricao: i.description,
    cliente: i.client_name ?? "—",
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
    { key: "cliente", header: "Cliente" },
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
    { label: "Período", value: periodLabel },
    { label: "De", value: formatDate(range.from) },
    { label: "Até", value: formatDate(range.to) },
    ...(statusFilter !== "all"
      ? [{ label: "Status", value: STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS] }]
      : []),
    ...(categoryFilter !== "all" ? [{ label: "Categoria", value: categoryFilter }] : []),
    ...(holderFilter !== "all" ? [{ label: "Portador", value: holderFilter }] : []),
    ...(methodFilter !== "all" ? [{ label: "Forma", value: methodFilter }] : []),
    ...(search.trim() ? [{ label: "Busca", value: search.trim() }] : []),
  ];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5 sm:space-y-6">
      <FinancePageHeader
        title="Contas a pagar"
        description="Despesas pagas abatem da receita disponível. Vincule ao cliente para ver lucro por evento."
        actions={
          <div className="flex flex-wrap gap-2">
            <ReportToolbar
              disabled={!filteredItems.length}
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

      <FinancePeriodSelector
        mode={mode}
        range={range}
        onModeChange={setMode}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label="Pagas no período"
          value={formatCurrency(periodPaidOut)}
          icon={Wallet}
          tone="rose"
          hint={`Saídas em ${periodLabel}`}
        />
        <FinanceStatCard
          label="Pendentes no período"
          value={formatCurrency(summary.pendingTotal)}
          icon={Clock}
          tone="amber"
          hint="Ainda não abatem do saldo disponível"
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
                <Label>Cliente / evento</Label>
                <LeadSelect value={leadId} onValueChange={setLeadId} />
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

      <FinanceListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por descrição, fornecedor ou portador..."
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        description="Busque despesas do período selecionado e refine por status e categoria"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </FinanceListFilters>

      <ClientProfitPanel
        rows={clientProfit}
        periodLabel={periodLabel}
        loading={loading}
      />

      <FinancePanel title="Despesas" description={`Listagem do período: ${periodLabel}`}>
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
          {!loading && filteredItems.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Nenhuma despesa encontrada com estes filtros."
                  : "Nenhuma despesa cadastrada."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
          {filteredItems.map((item) => {
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
                    {item.client_name && (
                      <span className="font-semibold text-primary">{item.client_name} · </span>
                    )}
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
                        : item.status === "cancelado"
                          ? "bg-muted text-muted-foreground"
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
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.status !== "cancelado" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setEditing(item)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                  )}
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => setCancelId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </FinancePanel>

      <PayableEditDialog
        item={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(cancelId)}
        onOpenChange={(open) => !open && setCancelId(null)}
        variant="danger"
        title="Excluir despesa?"
        description="O registro será apagado permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Sim, excluir"
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
