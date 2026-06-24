"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

type LeadOption = {
  id: string;
  name: string;
  status: string;
  event_date: string | null;
};

type LeadSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  allowNone?: boolean;
};

export function LeadSelect({
  value,
  onValueChange,
  placeholder = "Selecione o cliente",
  allowNone = true,
}: LeadSelectProps) {
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads-for-contracts", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setLeads(json.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select value={value || "none"} onValueChange={onValueChange} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Carregando clientes..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="none">Sem vínculo</SelectItem>}
        {leads.map((lead) => (
          <SelectItem key={lead.id} value={lead.id}>
            {lead.name}
            {lead.event_date ? ` · ${formatDate(lead.event_date)}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
