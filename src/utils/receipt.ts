export interface ReceiptData {
  amount: number | null;
  title: string;
  date: string | null; // yyyy-MM-dd
  raw: string;
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function toISO(y: string, m: string, d: string): string | null {
  const yy = y.length === 2 ? `20${y}` : y;
  const mm = m.padStart(2, '0');
  const dd = d.padStart(2, '0');
  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) return null;
  return `${yy}-${mm}-${dd}`;
}

/** Extract a date from OCR text. Supports dd/mm/yyyy, dd-mm-yy, "12 Oct 2026". */
export function extractReceiptDate(text: string): string | null {
  let m = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    // Assume day-first (common on receipts in PK); sanity: if first > 12 it must be the day.
    const iso = toISO(m[3], m[2], m[1]) ?? toISO(m[3], m[1], m[2]);
    if (iso) return iso;
  }
  m = text.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{2,4})/i);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon) return toISO(m[3], mon, m[1]);
  }
  return null;
}

/** Find the total: prefer lines mentioning total/amount/net, else the largest money-like number. */
export function extractReceiptAmount(text: string): number | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const moneyRe = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})|\d+(?:\.\d{1,2}))/g;

  const pickFromLine = (line: string): number | null => {
    const nums = [...line.matchAll(moneyRe)]
      .map((x) => Number(x[1].replace(/[,\s]/g, '')))
      .filter((n) => Number.isFinite(n) && n > 0 && n < 100_000_000);
    if (nums.length === 0) return null;
    return Math.max(...nums);
  };

  // 1) lines with total-ish keywords, scanned bottom-up (total is usually near the end)
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/total|amount due|net amount|grand total|balance due|to pay/i.test(lines[i])) {
      const v = pickFromLine(lines[i]);
      if (v !== null) return Math.round(v * 100) / 100;
    }
  }
  // 2) fallback: largest number in the whole receipt
  let best: number | null = null;
  for (const line of lines) {
    const v = pickFromLine(line);
    if (v !== null && (best === null || v > best)) best = v;
  }
  return best === null ? null : Math.round(best * 100) / 100;
}

/** Merchant = first meaningful line (skip pure numbers / tiny fragments). */
export function extractReceiptMerchant(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const alpha = line.replace(/[^a-zA-Z]/g, '');
    if (alpha.length >= 3 && !/^\d[\d\s,.\/:-]*$/.test(line)) {
      return line.slice(0, 60);
    }
  }
  return '';
}

export function parseReceiptText(text: string): ReceiptData {
  const clean = text.replace(/[ \t]+/g, ' ').trim();
  return {
    amount: extractReceiptAmount(clean),
    title: extractReceiptMerchant(clean),
    date: extractReceiptDate(clean),
    raw: text.trim(),
  };
}
