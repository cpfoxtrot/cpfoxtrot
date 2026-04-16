import YahooFinance from "yahoo-finance2";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TICKER_CONFIG } from "@/lib/catalogs/ticker-config";
import { toStoredDate } from "@/lib/utils/format";

const yf = new YahooFinance();

export interface PriceUpdateLog {
  ticker: string;
  yahoo: string | null;
  price: number | null;
  status: string;
}

export interface PriceUpdateResult {
  date: string;
  usdEurRate: number;
  summary: { ok: number; skip: number; error: number };
  log: PriceUpdateLog[];
}

export async function runPriceUpdate(): Promise<PriceUpdateResult> {
  const today = toStoredDate(new Date().toISOString().split("T")[0]);
  const hora = new Date().toLocaleTimeString("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // 1. USD/EUR rate
  const fx = await yf.quote("USDEUR=X");
  const usdEurRate = fx.regularMarketPrice ?? 0;
  if (!usdEurRate) throw new Error("No se pudo obtener el tipo USD/EUR (precio 0)");

  // 2. Open tickers from Supabase
  const { data: posiciones, error: posError } = await supabaseAdmin
    .from("posiciones")
    .select("ticker, estado");
  if (posError) throw new Error(posError.message);

  const openTickers = [
    ...new Set(
      (posiciones ?? [])
        .filter((p: { estado: string }) => p.estado?.toUpperCase() === "ABIERTA")
        .map((p: { ticker: string }) => p.ticker)
        .filter((t: string) => t !== "USD/EUR")
    ),
  ] as string[];

  // 3. Fetch prices in parallel (never throws per item)
  type FetchResult =
    | { ticker: string; yahoo: string; priceEur: number; status: "ok" }
    | { ticker: string; yahoo: string | null; priceEur: null; status: string };

  const fetched: FetchResult[] = await Promise.all(
    openTickers.map(async (ticker): Promise<FetchResult> => {
      const config = TICKER_CONFIG[ticker];
      if (!config) return { ticker, yahoo: null, priceEur: null, status: "sin-config: añade a ticker-config.ts" };
      if (config.yahoo === null) return { ticker, yahoo: null, priceEur: null, status: "manual (skipped)" };

      try {
        const quote = await yf.quote(config.yahoo);
        const raw = quote.regularMarketPrice ?? 0;
        if (!raw) return { ticker, yahoo: config.yahoo, priceEur: null, status: "error: precio 0" };
        const priceEur = config.currency === "USD" ? +(raw * usdEurRate).toFixed(4) : +raw.toFixed(4);
        return { ticker, yahoo: config.yahoo, priceEur, status: "ok" };
      } catch (e) {
        return { ticker, yahoo: config.yahoo, priceEur: null, status: `error: ${e}` };
      }
    })
  );

  // 4. Batch upsert — try with hora column, fallback without (in case column not yet added)
  const rows = [
    { ticker: "USD/EUR", fecha: today, precio: +usdEurRate.toFixed(6) },
    ...fetched
      .filter((r): r is Extract<FetchResult, { status: "ok" }> => r.status === "ok")
      .map((r) => ({ ticker: r.ticker, fecha: today, precio: r.priceEur })),
  ];

  let { error: upsertError } = await supabaseAdmin
    .from("precios")
    .upsert(rows.map((r) => ({ ...r, hora })), { onConflict: "ticker,fecha" });

  if (upsertError?.message?.includes("column")) {
    // hora column not yet added — retry without it
    ({ error: upsertError } = await supabaseAdmin
      .from("precios")
      .upsert(rows, { onConflict: "ticker,fecha" }));
  }
  if (upsertError) throw new Error(upsertError.message);

  const log: PriceUpdateLog[] = [
    { ticker: "USD/EUR", yahoo: "USDEUR=X", price: usdEurRate, status: "ok" },
    ...fetched.map((r) => ({ ticker: r.ticker, yahoo: r.yahoo, price: r.priceEur, status: r.status })),
  ];

  const ok    = log.filter((r) => r.status === "ok").length;
  const skip  = log.filter((r) => r.status.startsWith("manual")).length;
  const error = log.filter((r) => r.status.startsWith("error") || r.status.startsWith("sin")).length;

  return { date: today, usdEurRate, summary: { ok, skip, error }, log };
}

/** Returns the most recent price update date + hour from the precios table */
export async function getLastPriceUpdate(): Promise<{ fecha: string | null; hora: string | null }> {
  // Try with hora column first; gracefully handle if it doesn't exist yet
  const { data, error } = await supabaseAdmin.from("precios").select("fecha, hora");

  let rows: Array<{ fecha: string; hora?: string | null }>;
  if (error) {
    const { data: fallback } = await supabaseAdmin.from("precios").select("fecha");
    rows = fallback ?? [];
  } else {
    rows = data ?? [];
  }

  if (rows.length === 0) return { fecha: null, hora: null };

  const toNum = (s: string) => {
    const [d, m, yy] = s.split("-");
    if (!d || !m || !yy) return 0;
    return parseInt(`20${yy}${m.padStart(2, "0")}${d.padStart(2, "0")}`);
  };

  let maxNum = 0;
  let result: { fecha: string | null; hora: string | null } = { fecha: null, hora: null };
  for (const row of rows) {
    const n = toNum(row.fecha);
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
