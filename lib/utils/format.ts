/**
 * Formatea un número como moneda EUR con punto de miles y coma decimal.
 * Implementación propia para evitar diferencias de ICU en Node.js/Vercel.
 * Ejemplo: 4977.64 → "4.977,64 €"
 */
export const fmtEUR = (v: number): string => {
  const sign = v < 0 ? "-" : "";
  const [integer, decimal] = Math.abs(v).toFixed(2).split(".");
  const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${intFormatted},${decimal} €`;
};

/** "2026-02-11" → "11-02-26" */
export const toStoredDate = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y.slice(2)}`;
};

/** "11-02-26" → "2026-02-11" */
export const toInputDate = (stored: string): string => {
  const parts = stored.split("-");
  if (parts.length !== 3) return "";
  const [d, m, yy] = parts;
  return `20${yy}-${m}-${d}`;
};

/** Today as "YYYY-MM-DD" for <input type="date"> */
export const todayISO = (): string => new Date().toISOString().split("T")[0];

/** "DD-MM-YY" → YYYYMMDD integer, safe for chronological comparison */
export function ddmmyyToNum(s: string | null): number {
  if (!s) return 0;
  const [d, m, yy] = s.split("-");
  if (!d || !m || !yy) return 0;
  return parseInt(`20${yy}${m.padStart(2, "0")}${d.padStart(2, "0")}`);
}

/** CSS class for positive/negative P&L values */
export const plColor = (v: number): string =>
  v > 0 ? "stat-positive" : v < 0 ? "stat-negative" : "";
