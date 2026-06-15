"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadFinancial } from "@/components/leads/lead-financial";
import { ManualReceivableFinancial } from "@/components/finance/manual-receivable-financial";
import { ReceivableRevenueActions } from "@/components/finance/receivable-revenue-actions";
import {
  RECEIVABLE_BUCKET_LABELS,
  type ReceivableLeadRow,
} from "@/lib/receivables";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/types/database";
import { cn } from "@/lib/utils";

interface ReceivableDetailPanelProps {
  row: ReceivableLeadRow | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function ReceivableDetailPanel({
  row,
  open,
  onClose,
  onUpdated,
}: ReceivableDetailPanelProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loadingLead, setLoadingLead] = useState(false);

  const loadLead = useCallback(async (leadId: string) => {
    setLoadingLead(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setLead(data);
      else setLead(null);
    } finally {
      setLoadingLead(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !row || row.source !== "lead") {
      setLead(null);
      return;
    }
    loadLead(row.leadId);
  }, [open, row, loadLead]);

  const handleUpdated = () => {
    onUpdated();
    if (row?.source === "lead") {
      loadLead(row.leadId);
    }
  };

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        side="right"
        className="flex max-w-xl flex-col overflow-hidden sm:max-w-xl"
      >
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-6 sm:px-6">
          <div className="pr-10">
            <DialogTitle className="font-display text-xl font-bold sm:text-2xl">
              {row.clientName}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm">
              {row.eventDate ? (
                <>Evento em {formatDate(row.eventDate)}</>
              ) : (
                "Sem data de evento"
              )}
              {row.eventType && <> · {row.eventType}</>}
            </DialogDescription>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-2xs font-bold",
                row.source === "manual"
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {row.source === "manual" ? "Cadastro manual" : "Evento CRM"}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-2xs font-bold",
                RECEIVABLE_BUCKET_LABELS[row.bucket].color
              )}
            >
              {RECEIVABLE_BUCKET_LABELS[row.bucket].label}
            </span>
            {row.source === "lead" && (
              <Link
                href="/leads"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                onClick={onClose}
              >
                Ver no CRM
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="mt-4">
            <ReceivableRevenueActions row={row} onUpdated={onUpdated} compact />
          </div>

          <div className="mt-6 border-t border-border/60 pt-6">
            {row.source === "lead" ? (
              loadingLead ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Carregando pagamentos...
                </div>
              ) : lead ? (
                <LeadFinancial lead={lead} onUpdate={handleUpdated} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar os dados do evento.
                </p>
              )
            ) : (
              <ManualReceivableFinancial
                receivableId={row.leadId}
                onUpdate={() => {
                  onUpdated();
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
