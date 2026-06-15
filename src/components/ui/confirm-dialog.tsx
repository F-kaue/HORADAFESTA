"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmDialogVariant = "success" | "warning" | "danger" | "default";

type VariantConfig = {
  icon: LucideIcon;
  iconWrap: string;
  gradient: string;
  confirmVariant: "default" | "danger" | "outline";
  confirmClass?: string;
};

const VARIANTS: Record<ConfirmDialogVariant, VariantConfig> = {
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
    gradient: "from-emerald-50/90 via-card to-card dark:from-emerald-950/30",
    confirmVariant: "default",
    confirmClass: "bg-emerald-600 hover:bg-emerald-600/90 shadow-sm",
  },
  warning: {
    icon: RotateCcw,
    iconWrap: "bg-sky-500/15 text-sky-700 ring-sky-500/20",
    gradient: "from-sky-50/90 via-card to-card dark:from-sky-950/30",
    confirmVariant: "outline",
    confirmClass:
      "border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100",
  },
  danger: {
    icon: Trash2,
    iconWrap: "bg-rose-500/15 text-rose-700 ring-rose-500/20",
    gradient: "from-rose-50/90 via-card to-card dark:from-rose-950/30",
    confirmVariant: "danger",
  },
  default: {
    icon: AlertTriangle,
    iconWrap: "bg-amber-500/15 text-amber-700 ring-amber-500/20",
    gradient: "from-amber-50/90 via-card to-card dark:from-amber-950/30",
    confirmVariant: "default",
  },
};

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const cfg = VARIANTS[variant];
  const Icon = cfg.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent
        side="center"
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <div
          className={cn(
            "bg-gradient-to-br px-6 pb-5 pt-6",
            cfg.gradient
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl ring-4",
              cfg.iconWrap
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <DialogTitle className="mt-4 font-display text-lg font-bold leading-snug text-foreground sm:text-xl">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-card p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="min-h-[44px] sm:min-w-[7rem]"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={cfg.confirmVariant}
            className={cn("min-h-[44px] sm:min-w-[7rem]", cfg.confirmClass)}
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Aguarde…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
