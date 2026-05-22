import jsPDF from "jspdf";
import { invoke } from "@tauri-apps/api/core";

/**
 * Converts simple Markdown blocks into flat text lines with spacing
 * for jsPDF rendering (which works in plain text / manual layout mode).
 */
function parseMarkdownLines(text: string): Array<{ text: string; style: "h1" | "h2" | "h3" | "body" | "gap" }> {
  const blocks = text.split(/\n\s*\n/);
  const lines: Array<{ text: string; style: "h1" | "h2" | "h3" | "body" | "gap" }> = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) {
      lines.push({ text: "", style: "gap" });
      continue;
    }

    if (trimmed.startsWith("# ")) {
      lines.push({ text: trimmed.slice(2), style: "h1" });
    } else if (trimmed.startsWith("## ")) {
      lines.push({ text: trimmed.slice(3), style: "h2" });
    } else if (trimmed.startsWith("### ")) {
      lines.push({ text: trimmed.slice(4), style: "h3" });
    } else {
      // Treat each block as a paragraph — split by newlines for list items
      const subLines = trimmed.split("\n");
      for (const sub of subLines) {
        const sl = sub.trim();
        if (sl) lines.push({ text: sl, style: "body" });
      }
    }

    lines.push({ text: "", style: "gap" });
  }

  return lines;
}

export async function exportToPDF(fileName: string, text: string): Promise<void> {
  const isArabic = /[\u0600-\u06FF]/.test(text.slice(0, 300));

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const marginY = 20;
  const contentWidth = pageW - marginX * 2;

  let y = marginY;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - marginY) {
      doc.addPage();
      y = marginY;
    }
  };

  const parsedLines = parseMarkdownLines(text);

  for (const line of parsedLines) {
    if (line.style === "gap") {
      y += 4;
      continue;
    }

    let fontSize = 12;
    let isBold = false;

    if (line.style === "h1") { fontSize = 20; isBold = true; }
    else if (line.style === "h2") { fontSize = 16; isBold = true; }
    else if (line.style === "h3") { fontSize = 13; isBold = true; }

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");

    // Wrap long lines to fit contentWidth
    const wrapped = doc.splitTextToSize(line.text, contentWidth);

    const lineHeight = fontSize * 0.45; // approx mm per pt
    const blockHeight = wrapped.length * lineHeight + (isBold ? 3 : 1);

    ensureSpace(blockHeight + 4);

    const xPos = isArabic ? pageW - marginX : marginX;
    const align = isArabic ? "right" : "left";

    doc.text(wrapped, xPos, y, { align } as Parameters<typeof doc.text>[3]);

    if (line.style === "h1") {
      y += lineHeight * wrapped.length + 2;
      doc.setDrawColor(200, 195, 185);
      doc.setLineWidth(0.4);
      doc.line(marginX, y, pageW - marginX, y);
      y += 5;
    } else {
      y += lineHeight * wrapped.length + (isBold ? 4 : 3);
    }
  }

  const uint8 = new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
  const byteArray = Array.from(uint8);

  const baseName = fileName.replace(/\.[^/.]+$/, "");

  try {
    await invoke<string>("save_pdf", {
      fileName: baseName,
      pdfBytes: byteArray,
    });
  } catch (err) {
    // "cancelled" means user closed the dialog — not an error
    if (err !== "cancelled") {
      throw new Error(`PDF save failed: ${err}`);
    }
  }
}
