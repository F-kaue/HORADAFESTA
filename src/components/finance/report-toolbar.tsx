"use client";

import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportToolbarProps = {
  onExportExcel: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  disabled?: boolean;
};

export function ReportToolbar({
  onExportExcel,
  onExportPdf,
  onPrint,
  disabled,
}: ReportToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 min-h-[40px]"
        onClick={onExportExcel}
        disabled={disabled}
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span className="hidden xs:inline">Excel</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 min-h-[40px]"
        onClick={onExportPdf}
        disabled={disabled}
      >
        <FileText className="h-4 w-4" />
        <span className="hidden xs:inline">PDF</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 min-h-[40px]"
        onClick={onPrint}
        disabled={disabled}
      >
        <Printer className="h-4 w-4" />
        <span className="hidden xs:inline">Imprimir</span>
      </Button>
    </div>
  );
}
