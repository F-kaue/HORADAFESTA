"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/types/database";
import { cn } from "@/lib/utils";

interface LeadActionsMenuProps {
  lead: Lead;
  onArchive: (lead: Lead) => void;
  onUnarchive: (lead: Lead) => void;
  onFinalize: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  className?: string;
}

export function LeadActionsMenu({
  lead,
  onArchive,
  onUnarchive,
  onFinalize,
  onDelete,
  className,
}: LeadActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const isArchived = Boolean(lead.archived_at);

  return (
    <div ref={ref} className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label="Ações do lead"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-50 min-w-[11rem] rounded-xl border border-border bg-card py-1 shadow-elevated">
          {lead.status === "confirmado" && !isArchived && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted"
              onClick={() => {
                setOpen(false);
                onFinalize(lead);
              }}
            >
              <CheckCircle2 className="h-4 w-4 text-violet-600" />
              Marcar finalizado
            </button>
          )}
          {isArchived ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted"
              onClick={() => {
                setOpen(false);
                onUnarchive(lead);
              }}
            >
              <ArchiveRestore className="h-4 w-4" />
              Desarquivar
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted"
              onClick={() => {
                setOpen(false);
                onArchive(lead);
              }}
            >
              <Archive className="h-4 w-4" />
              Arquivar
            </button>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10"
            onClick={() => {
              setOpen(false);
              onDelete(lead);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
