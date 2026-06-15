"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileUp,
  Printer,
  Save,
  Send,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ContractPreview } from "@/components/contracts/contract-preview";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  buildContractVariables,
  CONTRACT_PLACEHOLDERS,
  CONTRACT_STATUS_LABELS,
  DEFAULT_CONTRACT_TEMPLATE,
  type ContractRecord,
} from "@/lib/contracts/template";
import {
  buildPdfBody,
  exportContractPdf,
  printContractElement,
} from "@/lib/contracts/pdf";
import {
  formatCurrencyInput,
  formatDate,
  maskCPF,
  maskPhoneBR,
  parseCurrencyBRL,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ContractDetail = ContractRecord & { template_body: string | null };

export default function ContratoDetailPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [templateBody, setTemplateBody] = useState(DEFAULT_CONTRACT_TEMPLATE);
  const [useCustomBody, setUseCustomBody] = useState(false);
  const [customBody, setCustomBody] = useState("");
  const [branding, setBranding] = useState({
    businessName: "Hora da Festa",
    cnpj: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [contratanteName, setContratanteName] = useState("");
  const [contratanteCpf, setContratanteCpf] = useState("");
  const [contratantePhone, setContratantePhone] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [signatureCity, setSignatureCity] = useState("Fortaleza/CE");
  const [signatureDay, setSignatureDay] = useState("");
  const [signatureMonth, setSignatureMonth] = useState("");
  const [signatureYear, setSignatureYear] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/contracts/${params.id}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Contrato não encontrado");
      setLoading(false);
      return;
    }
    setContract(data);
    setTemplateBody(data.template_body ?? DEFAULT_CONTRACT_TEMPLATE);
    setUseCustomBody(Boolean(data.body_override));
    setCustomBody(data.body_override ?? "");
    setContratanteName(data.contratante_name ?? "");
    setContratanteCpf(maskCPF(data.contratante_cpf ?? ""));
    setContratantePhone(maskPhoneBR(data.contratante_phone ?? ""));
    setEventAddress(data.event_address ?? "");
    setEventDate(data.event_date ?? "");
    setEventTime(data.event_time ?? "");
    setPackageDescription(data.package_description ?? "");
    setContractValue(
      data.contract_value ? formatCurrencyInput(Number(data.contract_value)) : ""
    );
    setSignatureCity(data.signature_city ?? "Fortaleza/CE");
    setSignatureDay(data.signature_day ?? "");
    setSignatureMonth(data.signature_month ?? "");
    setSignatureYear(data.signature_year ?? "");
    setNotes(data.notes ?? "");
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("business_name, cnpj")
      .single()
      .then(({ data }) => {
        if (data) {
          setBranding({
            businessName: data.business_name || "Hora da Festa",
            cnpj: data.cnpj,
          });
        }
      });
  }, [load]);

  const variables = useMemo(
    () =>
      buildContractVariables({
        businessName: branding.businessName,
        cnpj: branding.cnpj,
        contratante_name: contratanteName,
        contratante_cpf: contratanteCpf,
        contratante_phone: contratantePhone,
        event_address: eventAddress,
        event_date: eventDate || null,
        event_time: eventTime,
        package_description: packageDescription,
        contract_value: contractValue ? parseCurrencyBRL(contractValue) : null,
        signature_city: signatureCity,
        signature_day: signatureDay,
        signature_month: signatureMonth,
        signature_year: signatureYear,
      }),
    [
      branding,
      contratanteName,
      contratanteCpf,
      contratantePhone,
      eventAddress,
      eventDate,
      eventTime,
      packageDescription,
      contractValue,
      signatureCity,
      signatureDay,
      signatureMonth,
      signatureYear,
    ]
  );

  const activeTemplate = useCustomBody ? customBody : templateBody;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/contracts/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contratante_name: contratanteName || null,
          contratante_cpf: contratanteCpf || null,
          contratante_phone: contratantePhone || null,
          event_address: eventAddress || null,
          event_date: eventDate || null,
          event_time: eventTime || null,
          package_description: packageDescription || null,
          contract_value: contractValue ? parseCurrencyBRL(contractValue) : null,
          body_override: useCustomBody ? customBody : null,
          signature_city: signatureCity,
          signature_day: signatureDay || null,
          signature_month: signatureMonth || null,
          signature_year: signatureYear || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao salvar");
        return;
      }
      toast.success("Contrato salvo");
      load();
    } finally {
      setSaving(false);
    }
  };

  const markSent = async () => {
    const res = await fetch(`/api/contracts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "enviado" }),
    });
    if (!res.ok) {
      toast.error("Erro ao atualizar");
      return;
    }
    toast.success("Marcado como enviado");
    load();
  };

  const downloadPdf = async () => {
    const body = buildPdfBody(activeTemplate, variables);
    await exportContractPdf({
      filename: `contrato-${contratanteName || "cliente"}`.replace(/\s+/g, "-").toLowerCase(),
      businessName: branding.businessName,
      cnpj: branding.cnpj,
      logoUrl: "/logo.png",
      body,
    });
  };

  const uploadSigned = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/contracts/${params.id}/signed`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro no upload");
        return;
      }
      toast.success("Contrato assinado anexado!");
      load();
    } finally {
      setUploading(false);
    }
  };

  const openSigned = async () => {
    const res = await fetch(`/api/contracts/${params.id}/signed`);
    const data = await res.json();
    if (!res.ok) {
      toast.error("Erro ao abrir arquivo");
      return;
    }
    window.open(data.url, "_blank");
  };

  const saveTemplateDefault = async () => {
    const res = await fetch("/api/contract-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: templateBody }),
    });
    if (!res.ok) {
      toast.error("Erro ao salvar modelo padrão");
      return;
    }
    toast.success("Modelo padrão atualizado para novos contratos");
  };

  const cancelContract = async () => {
    const res = await fetch(`/api/contracts/${params.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao cancelar");
      return;
    }
    toast.success("Contrato cancelado");
    window.location.href = "/contratos";
  };

  if (loading || !contract) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Carregando contrato...
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/contratos"
            className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos contratos
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {contratanteName || "Contrato sem nome"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-2xs font-bold",
                CONTRACT_STATUS_LABELS[contract.status].color
              )}
            >
              {CONTRACT_STATUS_LABELS[contract.status].label}
            </span>
            {contract.sent_at && (
              <span className="text-xs text-muted-foreground">
                Enviado {formatDate(contract.sent_at.slice(0, 10))}
              </span>
            )}
            {contract.signed_at && (
              <span className="text-xs text-emerald-700">
                Assinado {formatDate(contract.signed_at.slice(0, 10))}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1" onClick={() => printContractElement("contract-preview")}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" className="gap-1" onClick={downloadPdf}>
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
          {contract.status === "rascunho" && (
            <Button className="gap-1" onClick={markSent}>
              <Send className="h-4 w-4" />
              Marcar enviado
            </Button>
          )}
          <Button className="gap-1" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Tabs defaultValue="dados" className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="texto">Texto</TabsTrigger>
              <TabsTrigger value="anexo">Anexo</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Contratante *</Label>
                <Input value={contratanteName} onChange={(e) => setContratanteName(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={contratanteCpf}
                    onChange={(e) => setContratanteCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={contratantePhone}
                    onChange={(e) => setContratantePhone(maskPhoneBR(e.target.value))}
                    placeholder="(85) 99999-9999"
                    inputMode="tel"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço do evento</Label>
                <Input value={eventAddress} onChange={(e) => setEventAddress(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data do evento</Label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input value={eventTime} onChange={(e) => setEventTime(e.target.value)} placeholder="14:00 às 18:00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pacote / serviço</Label>
                <Input value={packageDescription} onChange={(e) => setPackageDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor do contrato</Label>
                <CurrencyInput value={contractValue} onValueChange={setContractValue} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Cidade assinatura</Label>
                  <Input value={signatureCity} onChange={(e) => setSignatureCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Dia</Label>
                  <Input value={signatureDay} onChange={(e) => setSignatureDay(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input value={signatureYear} onChange={(e) => setSignatureYear(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mês (por extenso)</Label>
                <Input value={signatureMonth} onChange={(e) => setSignatureMonth(e.target.value)} placeholder="junho" />
              </div>
              <div className="space-y-2">
                <Label>Observações internas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </TabsContent>

            <TabsContent value="texto" className="mt-4 space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={useCustomBody}
                  onChange={(e) => setUseCustomBody(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Personalizar texto só deste contrato
              </label>
              <Textarea
                value={useCustomBody ? customBody : templateBody}
                onChange={(e) =>
                  useCustomBody
                    ? setCustomBody(e.target.value)
                    : setTemplateBody(e.target.value)
                }
                rows={16}
                className="font-mono text-xs leading-relaxed"
              />
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-bold text-foreground">Campos dinâmicos</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use no texto para preenchimento automático:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CONTRACT_PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className="rounded-md bg-card px-2 py-0.5 font-mono text-2xs text-primary hover:bg-primary/10"
                      onClick={() => {
                        const tag = `{{${p.key}}}`;
                        navigator.clipboard.writeText(tag);
                        toast.message(`Copiado: ${tag}`);
                      }}
                    >
                      {`{{${p.key}}}`}
                    </button>
                  ))}
                </div>
              </div>
              {!useCustomBody && (
                <Button type="button" variant="outline" size="sm" onClick={saveTemplateDefault}>
                  Salvar como modelo padrão
                </Button>
              )}
            </TabsContent>

            <TabsContent value="anexo" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">Acompanhamento</p>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className={cn(contract.status !== "rascunho" && "text-foreground")}>
                    1. Revise o contrato e baixe o PDF
                  </li>
                  <li className={cn(contract.status === "enviado" || contract.status === "assinado" ? "text-foreground" : "")}>
                    2. Envie ao cliente para assinar (Gov.br ou impresso)
                  </li>
                  <li className={cn(contract.status === "assinado" && "text-emerald-700 font-semibold")}>
                    3. Anexe o contrato assinado de volta aqui
                  </li>
                </ol>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadSigned(f);
                  e.target.value = "";
                }}
              />

              {contract.signed_file_name ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="font-semibold text-emerald-900">Documento assinado</p>
                  <p className="mt-1 text-sm text-emerald-800">{contract.signed_file_name}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={openSigned}>
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      <FileUp className="h-4 w-4" />
                      Substituir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Anexar contrato assinado (PDF ou foto)"}
                </Button>
              )}

              {contract.status !== "cancelado" && (
                <Button
                  variant="ghost"
                  className="gap-1 text-danger"
                  onClick={() => setShowCancel(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Cancelar contrato
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </p>
          <ContractPreview
            template={activeTemplate}
            variables={variables}
            businessName={branding.businessName}
            cnpj={branding.cnpj}
          />
        </div>
      </div>

      <ConfirmDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        variant="danger"
        title="Cancelar contrato?"
        description="O contrato será marcado como cancelado. Você pode criar outro depois se precisar."
        confirmLabel="Sim, cancelar"
        onConfirm={cancelContract}
      />
    </div>
  );
}
