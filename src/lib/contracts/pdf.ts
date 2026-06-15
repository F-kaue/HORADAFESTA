import jsPDF from "jspdf";
import type { ContractVariables } from "./template";
import { renderContractBody } from "./template";

async function loadImage(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * 13;
}

export async function exportContractPdf(options: {
  filename: string;
  businessName: string;
  cnpj?: string | null;
  logoUrl?: string | null;
  body: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  if (options.logoUrl) {
    try {
      const img = await loadImage(options.logoUrl);
      doc.addImage(img, "PNG", margin, y - 8, 44, 44);
    } catch {
      // logo opcional
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(options.businessName, margin + 52, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (options.cnpj) {
    doc.text(`CNPJ: ${options.cnpj}`, margin + 52, y + 22);
  }
  y += 52;

  doc.setDrawColor(217, 78, 31);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(40, 40, 40);

  const paragraphs = options.body.split("\n");
  for (const paragraph of paragraphs) {
    const line = paragraph.trim() === "⸻" ? "—".repeat(48) : paragraph;
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    if (line.startsWith("CLÁUSULA") || line.startsWith("CONTRATO DE")) {
      doc.setFont("helvetica", "bold");
      y = wrapText(doc, line, margin, y, maxWidth) + 4;
      doc.setFont("helvetica", "normal");
    } else if (line.startsWith("CONTRATADA:") || line.startsWith("CONTRATANTE:")) {
      doc.setFont("helvetica", "bold");
      y = wrapText(doc, line, margin, y, maxWidth) + 2;
      doc.setFont("helvetica", "normal");
    } else {
      y = wrapText(doc, line, margin, y, maxWidth) + (line === "" ? 6 : 2);
    }
  }

  doc.save(`${options.filename}.pdf`);
}

export function buildPdfBody(template: string, variables: ContractVariables) {
  return renderContractBody(template, variables);
}

export function printContractElement(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html><head>
      <title>Contrato</title>
      <style>
        body { font-family: Georgia, 'Times New Roman', serif; padding: 48px; color: #1a1a2e; line-height: 1.65; font-size: 12pt; }
        h1 { text-align: center; font-size: 14pt; letter-spacing: 0.05em; margin-bottom: 8px; }
        .brand { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #D94E1F; }
        .brand img { height: 48px; margin-bottom: 8px; }
        .clause { font-weight: bold; margin-top: 20px; }
        .divider { text-align: center; color: #999; margin: 16px 0; letter-spacing: 0.2em; }
        .signature { margin-top: 32px; }
        pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
      </style>
    </head><body>${el.innerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 400);
}
