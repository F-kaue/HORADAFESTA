import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** Formato monetário BRL reconhecido pelo Excel (valores numéricos somáveis) */
const BRL_NUMBER_FORMAT = '"R$"#,##0.00';
const PLAIN_NUMBER_FORMAT = "#,##0";

export type ReportColumn<T> = {
  key: keyof T | string;
  header: string;
  /** Formatação para PDF / impressão (texto) */
  format?: (row: T) => string | number;
  /** Configuração da coluna no Excel */
  excel?: {
    type?: "number" | "text";
    /** Incluir linha TOTAL com fórmula SOMA */
    sum?: boolean;
    width?: number;
    /** Formato moeda BRL (padrão true para type number) */
    currency?: boolean;
  };
};

export type ReportBranding = {
  businessName: string;
  cnpj?: string | null;
  logoUrl?: string | null;
  subtitle?: string;
};

export type ReportFilterMeta = { label: string; value: string }[];

export type ExcelSummaryLine = {
  label: string;
  value: number | string;
  currency?: boolean;
};

export type ExcelExportOptions<T extends Record<string, unknown>> = {
  filename: string;
  sheetName?: string;
  title: string;
  branding?: ReportBranding;
  filters?: ReportFilterMeta;
  summaryLines?: ExcelSummaryLine[];
  columns: ReportColumn<T>[];
  rows: T[];
  /** Texto de ajuda no rodapé da planilha */
  footnote?: string;
  /** Abas extras (ex.: resultado por cliente) */
  extraSheets?: { name: string; columns: ReportColumn<Record<string, unknown>>[]; rows: Record<string, unknown>[] }[];
};

function cellValueDisplay<T extends Record<string, unknown>>(
  row: T,
  col: ReportColumn<T>
): string {
  if (col.format) return String(col.format(row));
  const v = row[col.key as keyof T];
  if (v == null) return "";
  return String(v);
}

function cellValueExcel<T extends Record<string, unknown>>(
  row: T,
  col: ReportColumn<T>
): string | number {
  const v = row[col.key as keyof T];
  if (col.excel?.type === "number") {
    if (typeof v === "number") return v;
    if (v == null || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (v == null) return "";
  return String(v);
}

function numberFormatForColumn(currency?: boolean) {
  return currency === false ? PLAIN_NUMBER_FORMAT : BRL_NUMBER_FORMAT;
}

function applyNumberFormat(
  ws: XLSX.WorkSheet,
  row: number,
  col: number,
  currency = true
) {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[addr];
  if (!cell) return;
  cell.t = "n";
  cell.z = numberFormatForColumn(currency);
}

function setFormulaSum(
  ws: XLSX.WorkSheet,
  row: number,
  col: number,
  firstDataExcelRow: number,
  lastDataExcelRow: number,
  currency = true
) {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const colLetter = XLSX.utils.encode_col(col);
  ws[addr] = {
    t: "n",
    f: `SUM(${colLetter}${firstDataExcelRow}:${colLetter}${lastDataExcelRow})`,
    z: numberFormatForColumn(currency),
  };
}

export function exportToExcel<T extends Record<string, unknown>>(
  filenameOrOptions: string | ExcelExportOptions<T>,
  legacyColumns?: ReportColumn<T>[],
  legacyRows?: T[]
) {
  const options: ExcelExportOptions<T> =
    typeof filenameOrOptions === "string"
      ? {
          filename: filenameOrOptions,
          title: "Relatório",
          columns: legacyColumns ?? [],
          rows: legacyRows ?? [],
        }
      : filenameOrOptions;

  const {
    filename,
    sheetName = "Relatório",
    title,
    branding,
    filters,
    summaryLines,
    columns,
    rows,
    footnote,
    extraSheets,
  } = options;

  const aoa: (string | number)[][] = [];
  const colCount = Math.max(columns.length, 4);

  const padRow = (cells: (string | number)[]) => {
    while (cells.length < colCount) cells.push("");
    return cells;
  };

  if (branding?.businessName) {
    aoa.push(padRow([branding.businessName.toUpperCase()]));
    if (branding.cnpj) aoa.push(padRow([`CNPJ: ${branding.cnpj}`]));
  }

  aoa.push(padRow([title]));
  aoa.push(padRow([`Gerado em: ${new Date().toLocaleString("pt-BR")}`]));

  if (filters?.length) {
    aoa.push(padRow([filters.map((f) => `${f.label}: ${f.value}`).join("  ·  ")]));
  }

  aoa.push(padRow([""]));

  let summaryStartRow = -1;
  if (summaryLines?.length) {
    aoa.push(padRow(["RESUMO DO PERÍODO"]));
    summaryStartRow = aoa.length;
    for (const line of summaryLines) {
      aoa.push(
        padRow([
          line.label,
          typeof line.value === "number" ? line.value : line.value,
        ])
      );
    }
    aoa.push(padRow([""]));
  }

  const headerRowIndex = aoa.length;
  aoa.push(columns.map((c) => c.header));

  const dataStartIndex = aoa.length;
  for (const row of rows) {
    aoa.push(columns.map((col) => cellValueExcel(row, col)));
  }

  const hasTotals = columns.some((c) => c.excel?.sum);
  let totalsRowIndex = -1;
  if (hasTotals && rows.length > 0) {
    totalsRowIndex = aoa.length;
    aoa.push(
      columns.map((col, i) => {
        if (i === 0) return "TOTAL GERAL";
        if (col.excel?.sum) return 0;
        return "";
      })
    );
  }

  if (footnote) {
    aoa.push(padRow([""]));
    aoa.push(padRow([footnote]));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const firstDataExcelRow = dataStartIndex + 1;
  const lastDataExcelRow = dataStartIndex + rows.length;

  columns.forEach((col, cIdx) => {
    const currency = col.excel?.currency !== false;
    if (col.excel?.type === "number") {
      for (let r = 0; r < rows.length; r++) {
        applyNumberFormat(ws, dataStartIndex + r, cIdx, currency);
      }
    }
    if (col.excel?.sum && totalsRowIndex >= 0) {
      setFormulaSum(
        ws,
        totalsRowIndex,
        cIdx,
        firstDataExcelRow,
        lastDataExcelRow,
        currency
      );
    }
  });

  if (summaryStartRow >= 0 && summaryLines) {
    summaryLines.forEach((line, i) => {
      if (typeof line.value === "number" && line.currency !== false) {
        applyNumberFormat(ws, summaryStartRow + i, 1, true);
      }
    });
  }

  ws["!cols"] = columns.map((col) => ({
    wch: col.excel?.width ?? Math.max(col.header.length + 2, 14),
  }));

  if (rows.length > 0) {
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: dataStartIndex + rows.length - 1, c: columns.length - 1 },
      }),
    };
    ws["!views"] = [{ state: "frozen", ySplit: headerRowIndex + 1, activeCell: "A1" }];
  }

  if (branding?.businessName) {
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    ];
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  for (const extra of extraSheets ?? []) {
    const extraWs = buildSimpleDataSheet(extra.columns, extra.rows);
    XLSX.utils.book_append_sheet(wb, extraWs, extra.name.slice(0, 31));
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function buildSimpleDataSheet(
  columns: ReportColumn<Record<string, unknown>>[],
  rows: Record<string, unknown>[]
) {
  const aoa: (string | number)[][] = [columns.map((c) => c.header)];
  const dataStart = 1;
  for (const row of rows) {
    aoa.push(columns.map((col) => cellValueExcel(row, col)));
  }

  const hasTotals = columns.some((c) => c.excel?.sum);
  let totalsRow = -1;
  if (hasTotals && rows.length > 0) {
    totalsRow = aoa.length;
    aoa.push(
      columns.map((col, i) => (i === 0 ? "TOTAL" : col.excel?.sum ? 0 : ""))
    );
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  columns.forEach((col, cIdx) => {
    const currency = col.excel?.currency !== false;
    if (col.excel?.type === "number") {
      for (let r = 0; r < rows.length; r++) {
        applyNumberFormat(ws, dataStart + r, cIdx, currency);
      }
    }
    if (col.excel?.sum && totalsRow >= 0) {
      setFormulaSum(ws, totalsRow, cIdx, dataStart + 1, dataStart + rows.length, currency);
    }
  });

  ws["!cols"] = columns.map((col) => ({
    wch: col.excel?.width ?? Math.max(col.header.length + 2, 14),
  }));

  if (rows.length > 0) {
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: rows.length, c: columns.length - 1 },
      }),
    };
  }

  return ws;
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
      options.columns.map((col) => cellValueDisplay(row, col))
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
