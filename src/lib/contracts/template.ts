export const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

{{CONTRATADA_NOME}}

Pelo presente instrumento particular, as partes abaixo identificadas:

CONTRATADA: {{CONTRATADA_NOME}}, empresa especializada em buffet móvel para eventos.{{CONTRATADA_CNPJ_LINHA}}

CONTRATANTE: {{CONTRATANTE_NOME}}
CPF: {{CONTRATANTE_CPF}}
Telefone: {{CONTRATANTE_TELEFONE}}
Endereço do Evento: {{EVENTO_ENDERECO}}
Data do Evento: {{EVENTO_DATA}}
Horário do Evento: {{EVENTO_HORARIO}}

Firmam o presente contrato de prestação de serviços mediante as cláusulas abaixo:

⸻

CLÁUSULA 1 — DO OBJETO

O presente contrato tem como objetivo a prestação de serviços de buffet móvel para eventos, conforme pacote contratado entre as partes.{{PACOTE_LINHA}}

⸻

CLÁUSULA 2 — DO PAGAMENTO

2.1. O valor restante do evento deverá estar quitado integralmente até 05 (cinco) dias antes da data do evento.{{VALOR_LINHA}}

2.2. O não pagamento dentro do prazo poderá ocasionar o cancelamento da prestação do serviço.

⸻

CLÁUSULA 3 — CANCELAMENTO E DESISTÊNCIA

3.1. Em caso de desistência por parte do CONTRATANTE, os valores pagos não serão devolvidos.

3.2. Em caso de cancelamento, o cliente poderá utilizar o valor pago como crédito pelo prazo de até 03 (três) meses, contados a partir da data do cancelamento.

3.3. Caso o cancelamento aconteça com prazo inferior a 07 (sete) dias da realização do evento, não haverá crédito ao cliente, considerando que os valores já terão sido destinados aos custos de produção, organização e logística do evento.

⸻

CLÁUSULA 4 — DAS CONDIÇÕES DO EVENTO

4.1. A CONTRATADA não se responsabiliza por falhas, quedas ou ausência de energia elétrica no local do evento.

4.2. A CONTRATADA não realiza atendimento exposto diretamente ao sol ou chuva, visando a segurança da equipe, equipamentos e qualidade dos produtos.

4.3. É de responsabilidade do CONTRATANTE garantir um local adequado, coberto e com estrutura mínima necessária para a execução do serviço.

⸻

CLÁUSULA 5 — ALTERAÇÕES NO PACOTE

5.1. Após a contratação, não será permitida a diminuição de itens ou redução do pacote contratado.

5.2. Será permitido apenas acréscimo de itens, mediante disponibilidade e ajuste de valores.

⸻

CLÁUSULA 6 — SOBRE AS BEBIDAS

6.1. Os serviços de barraquinhas não incluem refrigerante.

6.2. Refrigerantes estarão inclusos apenas nos pacotes classificados como Buffet Completo, conforme acordado previamente.

⸻

CLÁUSULA 7 — HORÁRIO E HORA EXTRA

7.1. O serviço será realizado no horário previamente acordado entre as partes.

7.2. Caso o evento ultrapasse o horário contratado por motivos alheios à vontade da CONTRATADA, será cobrada taxa adicional referente à hora extra da equipe presente no evento.

⸻

CLÁUSULA 8 — DISPOSIÇÕES FINAIS

8.1. Ao efetuar o pagamento do sinal/entrada, o CONTRATANTE declara estar de acordo com todas as cláusulas presentes neste contrato.

8.2. O presente contrato passa a ter validade a partir da confirmação do pagamento inicial.

⸻

{{CIDADE_ASSINATURA}}, {{DATA_ASSINATURA_DIA}} de {{DATA_ASSINATURA_MES}} de {{DATA_ASSINATURA_ANO}}.

⸻

CONTRATANTE
{{CONTRATANTE_NOME}}

⸻

{{CONTRATADA_NOME}} — CONTRATADA`;

export const CONTRACT_PLACEHOLDERS = [
  { key: "CONTRATADA_NOME", label: "Nome da contratada", example: "Hora da Festa" },
  { key: "CONTRATADA_CNPJ_LINHA", label: "Linha CNPJ (automática)", example: " CNPJ: 00.000.000/0001-00" },
  { key: "CONTRATANTE_NOME", label: "Nome do contratante", example: "Maria Silva" },
  { key: "CONTRATANTE_CPF", label: "CPF do contratante", example: "000.000.000-00" },
  { key: "CONTRATANTE_TELEFONE", label: "Telefone", example: "(85) 99999-9999" },
  { key: "EVENTO_ENDERECO", label: "Endereço do evento", example: "Rua X, Bairro Y" },
  { key: "EVENTO_DATA", label: "Data do evento", example: "15/08/2026" },
  { key: "EVENTO_HORARIO", label: "Horário do evento", example: "14:00 às 18:00" },
  { key: "PACOTE_LINHA", label: "Linha do pacote (automática)", example: " Pacote: Aniversário" },
  { key: "VALOR_LINHA", label: "Linha do valor (automática)", example: " Valor: R$ 10.000,00" },
  { key: "CIDADE_ASSINATURA", label: "Cidade da assinatura", example: "Fortaleza/CE" },
  { key: "DATA_ASSINATURA_DIA", label: "Dia da assinatura", example: "04" },
  { key: "DATA_ASSINATURA_MES", label: "Mês da assinatura", example: "junho" },
  { key: "DATA_ASSINATURA_ANO", label: "Ano da assinatura", example: "2026" },
] as const;

export type ContractStatus = "rascunho" | "enviado" | "assinado" | "cancelado";

export type ContractRecord = {
  id: string;
  user_id: string;
  lead_id: string | null;
  status: ContractStatus;
  contratante_name: string | null;
  contratante_cpf: string | null;
  contratante_phone: string | null;
  event_address: string | null;
  event_date: string | null;
  event_time: string | null;
  package_description: string | null;
  contract_value: number | null;
  body_override: string | null;
  signature_city: string | null;
  signature_day: string | null;
  signature_month: string | null;
  signature_year: string | null;
  signed_file_path: string | null;
  signed_file_name: string | null;
  signed_at: string | null;
  sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: { id: string; name: string; status: string } | null;
};

export const CONTRACT_STATUS_LABELS: Record<
  ContractStatus,
  { label: string; color: string }
> = {
  rascunho: {
    label: "Rascunho",
    color: "bg-muted text-muted-foreground border-border",
  },
  enviado: {
    label: "Enviado",
    color: "bg-sky-100 text-sky-800 border-sky-200",
  },
  assinado: {
    label: "Assinado",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function blankLine(label: string) {
  return "_".repeat(Math.max(24, label.length + 8));
}

export type ContractVariables = {
  CONTRATADA_NOME: string;
  CONTRATADA_CNPJ_LINHA: string;
  CONTRATANTE_NOME: string;
  CONTRATANTE_CPF: string;
  CONTRATANTE_TELEFONE: string;
  EVENTO_ENDERECO: string;
  EVENTO_DATA: string;
  EVENTO_HORARIO: string;
  PACOTE_LINHA: string;
  VALOR_LINHA: string;
  CIDADE_ASSINATURA: string;
  DATA_ASSINATURA_DIA: string;
  DATA_ASSINATURA_MES: string;
  DATA_ASSINATURA_ANO: string;
};

export function buildContractVariables(input: {
  businessName: string;
  cnpj?: string | null;
  contratante_name?: string | null;
  contratante_cpf?: string | null;
  contratante_phone?: string | null;
  event_address?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  package_description?: string | null;
  contract_value?: number | null;
  signature_city?: string | null;
  signature_day?: string | null;
  signature_month?: string | null;
  signature_year?: string | null;
}): ContractVariables {
  const now = new Date();
  const day = input.signature_day || String(now.getDate()).padStart(2, "0");
  const month = input.signature_month || MONTHS_PT[now.getMonth()];
  const year = input.signature_year || String(now.getFullYear());

  const formatDate = (d?: string | null) => {
    if (!d) return blankLine("data");
    const [y, m, dd] = d.split("-");
    if (!y || !m || !dd) return d;
    return `${dd}/${m}/${y}`;
  };

  const formatCurrency = (v?: number | null) => {
    if (v == null || v <= 0) return "";
    return ` Valor do contrato: R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`;
  };

  return {
    CONTRATADA_NOME: input.businessName || "Hora da Festa",
    CONTRATADA_CNPJ_LINHA: input.cnpj ? ` CNPJ: ${input.cnpj}.` : "",
    CONTRATANTE_NOME: input.contratante_name?.trim() || blankLine("nome"),
    CONTRATANTE_CPF: input.contratante_cpf?.trim() || blankLine("cpf"),
    CONTRATANTE_TELEFONE: input.contratante_phone?.trim() || blankLine("telefone"),
    EVENTO_ENDERECO: input.event_address?.trim() || blankLine("endereço"),
    EVENTO_DATA: formatDate(input.event_date),
    EVENTO_HORARIO: input.event_time?.trim() || blankLine("horário"),
    PACOTE_LINHA: input.package_description?.trim()
      ? `\n\nPacote contratado: ${input.package_description.trim()}.`
      : "",
    VALOR_LINHA: formatCurrency(input.contract_value),
    CIDADE_ASSINATURA: input.signature_city?.trim() || "Fortaleza/CE",
    DATA_ASSINATURA_DIA: day,
    DATA_ASSINATURA_MES: month,
    DATA_ASSINATURA_ANO: year,
  };
}

export function renderContractBody(
  template: string,
  variables: ContractVariables
): string {
  let body = template;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replaceAll(`{{${key}}}`, value);
  }
  return body.replace(/\{\{[A-Z_]+\}\}/g, "_______________");
}

export function leadToContractFields(lead: {
  name: string;
  whatsapp: string;
  location: string | null;
  neighborhood: string | null;
  event_date: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  service_type: string | null;
  event_type: string | null;
  total_value: number | null;
}) {
  const address = [lead.location, lead.neighborhood].filter(Boolean).join(", ");
  const time =
    lead.event_start_time && lead.event_end_time
      ? `${lead.event_start_time.slice(0, 5)} às ${lead.event_end_time.slice(0, 5)}`
      : lead.event_start_time?.slice(0, 5) ?? "";
  const pkg = [lead.event_type, lead.service_type].filter(Boolean).join(" — ");

  return {
    contratante_name: lead.name,
    contratante_phone: lead.whatsapp,
    event_address: address || "",
    event_date: lead.event_date,
    event_time: time,
    package_description: pkg || "",
    contract_value: lead.total_value ? Number(lead.total_value) : null,
  };
}
