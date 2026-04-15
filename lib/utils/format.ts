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

export const fmtEUR = (v: number): string =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
