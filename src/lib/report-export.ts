import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportColumn<T> = {
  key: keyof T | string;
  header: string;
  format?: (row: T) => string | number;
};

export type ReportBranding = {
  businessName: string;
  cnpj?: string | null;
  logoUrl?: string | null;
  subtitle?: string;
};

export type ReportFilterMeta = { label: string; value: string }[];

function cellValue<T extends Record<string, unknown>>(
  row: T,
  col: ReportColumn<T>
): string {
  if (col.format) return String(col.format(row));
  const v = row[col.key as keyof T];
  if (v == null) return "";
  return String(v);
}

export function exportToExcel<T extends Record<string, unknown>>(
  filename: string,
  columns: ReportColumn<T>[],
  rows: T[]
) {
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    columns.forEach((col) => {
      obj[col.header] = cellValue(row, col);
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToPdf<T extends Record<string, unknown>>(options: {
  filename: string;
  title: string;
  branding: ReportBranding;
  filters?: ReportFilterMeta;
  columns: ReportColumn<T>[];
  rows: T[];
  summaryLines?: string[];
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  if (options.branding.logoUrl) {
    try {
      const img = await loadImage(options.branding.logoUrl);
      doc.addImage(img, "PNG", 40, 28, 48, 48);
      y = 90;
    } catch {
      // logo opcional
    }
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(options.branding.businessName || "Hora da Festa", 100, 44);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (options.branding.cnpj) {
    doc.text(`CNPJ: ${options.branding.cnpj}`, 100, 60);
  }
  doc.text(options.title, 100, options.branding.cnpj ? 76 : 60);
  if (options.branding.subtitle) {
    doc.text(options.branding.subtitle, 100, options.branding.cnpj ? 92 : 76);
  }

  y = Math.max(y, options.branding.cnpj ? 108 : 92);

  if (options.filters?.length) {
    doc.setFontSize(9);
    const filterText = options.filters.map((f) => `${f.label}: ${f.value}`).join("  ·  ");
    doc.text(filterText, 40, y, { maxWidth: pageWidth - 80 });
    y += 20;
  }

  if (options.summaryLines?.length) {
    doc.setFontSize(9);
    options.summaryLines.forEach((line) => {
      doc.text(line, 40, y);
      y += 14;
    });
    y += 6;
  }

  autoTable(doc, {
    startY: y,
    head: [options.columns.map((c) => c.header)],
    body: options.rows.map((row) =>
      options.columns.map((col) => cellValue(row, col))
    ),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [232, 97, 44] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${options.filename}.pdf`);
}

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function printReport(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html><head>
      <title>Relatório</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a2e; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
        th { background: #E8612C; color: white; }
        .no-print { display: none; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
