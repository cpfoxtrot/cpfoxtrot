/**
 * Cron route: GET /api/cron/update-prices
 *
 * Vercel lo llama automáticamente según el schedule en vercel.json.
 * También se puede invocar manualmente con:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://tu-dominio.vercel.app/api/cron/update-prices
 *
 * Variables de entorno necesarias en Vercel:
 *   CRON_SECRET  — cadena aleatoria para proteger el endpoint (añádela en
 *                  Vercel → Settings → Environment Variables)
 */

import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TICKER_CONFIG } from "@/lib/catalogs/ticker-config";
import { toStoredDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

// ── Autenticación ──────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Sin secret configurado → abierto (solo para dev)
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = toStoredDate(new Date().toISOString().split("T")[0]);

  // 1. Obtener el tipo de cambio USD/EUR (siempre, se necesita para conversiones)
  let usdEurRate: number;
  try {
    const fx = await yahooFinance.quote("USDEUR=X");
    usdEurRate = fx.regularMarketPrice ?? 0;
    if (!usdEurRate) throw new Error("regularMarketPrice vacío");
  } catch (e) {
    return NextResponse.json(
      { error: `No se pudo obtener el tipo USD/EUR: ${e}` },
      { status: 500 }
    );
  }

  // 2. Obtener todos los tickers con posición ABIERTA
  const { data: posiciones, error: posError } = await supabaseAdmin
    .from("posiciones")
    .select("ticker, estado");

  if (posError) {
    return NextResponse.json({ error: posError.message }, { status: 500 });
  }

  const openTickers = [
    ...new Set(
      (posiciones ?? [])
        .filter((p: { estado: string }) => p.estado?.toUpperCase() === "ABIERTA")
        .map((p: { ticker: string }) => p.ticker)
        .filter((t: string) => t !== "USD/EUR") // se guarda aparte
    ),
  ] as string[];

  // 3. Buscar precios en Yahoo Finance en paralelo (sin lanzar excepciones)
  type FetchResult =
    | { ticker: string; yahoo: string; priceEur: number; status: "ok" }
    | { ticker: string; yahoo: string | null; priceEur: null; status: string };

  const fetched: FetchResult[] = await Promise.all(
    openTickers.map(async (ticker): Promise<FetchResult> => {
      const config = TICKER_CONFIG[ticker];

      if (!config) {
        // Ticker nuevo no configurado — añádelo a ticker-config.ts
        return { ticker, yahoo: null, priceEur: null, status: "sin-config: añade a ticker-config.ts" };
      }
      if (config.yahoo === null) {
        return { ticker, yahoo: null, priceEur: null, status: "manual (skipped)" };
      }

      try {
        const quote = await yahooFinance.quote(config.yahoo);
        const raw = quote.regularMarketPrice ?? 0;
        if (!raw) return { ticker, yahoo: config.yahoo, priceEur: null, status: "error: precio 0" };

        const priceEur = config.currency === "USD" ? +(raw * usdEurRate).toFixed(4) : +raw.toFixed(4);
        return { ticker, yahoo: config.yahoo, priceEur, status: "ok" };
      } catch (e) {
        return { ticker, yahoo: config.yahoo, priceEur: null, status: `error: ${e}` };
      }
    })
  );

  // 4. Guardar en Supabase (batch upsert de un solo viaje)
  const rows = [
    { ticker: "USD/EUR", fecha: today, precio: +usdEurRate.toFixed(6) },
    ...fetched
      .filter((r): r is Extract<FetchResult, { status: "ok" }> => r.status === "ok")
      .map((r) => ({ ticker: r.ticker, fecha: today, precio: r.priceEur })),
  ];

  const { error: upsertError } = await supabaseAdmin
    .from("precios")
    .upsert(rows, { onConflict: "ticker,fecha" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // 5. Respuesta con log completo
  const log = [
    { ticker: "USD/EUR", yahoo: "USDEUR=X", price: usdEurRate, status: "ok" },
    ...fetched.map((r) => ({
      ticker: r.ticker,
      yahoo: r.yahoo,
      price: r.priceEur,
      status: r.status,
    })),
  ];

  const ok    = log.filter((r) => r.status === "ok").length;
  const skip  = log.filter((r) => r.status.startsWith("manual")).length;
  const error = log.filter((r) => r.status.startsWith("error") || r.status.startsWith("sin")).length;

  return NextResponse.json({ date: today, usdEurRate, summary: { ok, skip, error }, log });
}
