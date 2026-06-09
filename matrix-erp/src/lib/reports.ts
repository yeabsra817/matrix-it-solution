import { jsPDF } from "jspdf";

export function buildPdfReport(title: string, rows: string[][]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  let y = 32;
  for (const row of rows) {
    doc.text(row.join(" | "), 14, y);
    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  }
  return doc.output("arraybuffer");
}

export function buildCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
