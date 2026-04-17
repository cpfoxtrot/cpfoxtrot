import YahooFinance from "yahoo-finance2";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TICKER_CONFIG } from "@/lib/catalogs/ticker-config";
import { toStoredDate } from "@/lib/utils/format";

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
  // Instantiate inside the function — avoids module-level side effects
  // that break when this module is imported in a server component render.
  const yf = new YahooFinance();

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
