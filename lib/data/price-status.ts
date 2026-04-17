import { supabaseAdmin } from "@/lib/supabase-admin";
import { ddmmyyToNum } from "@/lib/utils/format";

/** Returns the most recent price update date + hour from the precios table */
export async function getLastPriceUpdate(): Promise<{ fecha: string | null; hora: string | null }> {
  // Try with hora column; gracefully handle if it doesn't exist yet
  const { data, error } = await supabaseAdmin.from("precios").select("fecha, hora");

  let rows: Array<{ fecha: string; hora?: string | null }>;
  if (error) {
    const { data: fallback } = await supabaseAdmin.from("precios").select("fecha");
    rows = fallback ?? [];
  } else {
    rows = data ?? [];
  }

  if (rows.length === 0) return { fecha: null, hora: null };

  let maxNum = 0;
  let result: { fecha: string | null; hora: string | null } = { fecha: null, hora: null };
  for (const row of rows) {
    const n = ddmmyyToNum(row.fecha);
    if (n > maxNum) {
      maxNum = n;
      result = { fecha: row.fecha, hora: (row as { hora?: string | null }).hora ?? null };
    }
  }
  return result;
}

/** Business days (Mon–Fri) elapsed since the given DD-MM-YY date */
export function businessDaysSince(ddmmyy: string): number {
  const [d, m, yy] = ddmmyy.split("-");
  if (!d || !m || !yy) return 999;

  const lastUpdate = new Date(`20${yy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  lastUpdate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lastUpdate >= today) return 0;

  let count = 0;
  const cursor = new Date(lastUpdate);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= today) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
