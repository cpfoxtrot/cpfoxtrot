import { supabase } from "@/lib/supabase";

export interface PortfolioStats {
  valorCartera: number;
  beneficioNoRealizado: number;
  beneficioRealizado: number;
  beneficioTotal: number;
  cagr: number | null;
  winRate: number | null;
  winCount: number;
  totalCerradas: number;
}

export interface TickerSummary {
  ticker: string;
  valorCoste: number;
  valorActual: number;
  otros: number;
  beneficioNoRealizado: number;
  beneficioRealizado: number;
  beneficioTotal: number;
  rentabilidad: number;
}

export interface PosicionRow {
  id: number;
  ticker: string;
  cantidad: number;
  precio_compra: number;
  fecha_compra: string | null;
  com_compra: number;
  tc_compra: number | null;
  precio_venta: number | null;
  fecha_venta: string | null;
  com_venta: number | null;
  dividendos: number;
  incentivos: number;
  impuesto: number;
  estado: string;
}

export interface PortfolioData {
  stats: PortfolioStats;
  tickers: TickerSummary[];
  posiciones: PosicionRow[];
  openTickers: string[];
}

interface Posicion {
  ticker: string;
  cantidad: number;
  precio_compra: number;
  precio_venta: number | null;
  com_compra: number;
  com_venta: number | null;
  dividendos: number;
  incentivos: number;
  impuesto: number;
  estado: string;
}

/** "DD-MM-YY" → YYYYMMDD integer, safe for chronological comparison */
function ddmmyyToNum(s: string | null): number {
  if (!s) return 0;
  const [d, m, yy] = s.split("-");
  if (!d || !m || !yy) return 0;
  return parseInt(`20${yy}${m.padStart(2, "0")}${d.padStart(2, "0")}`);
}

function storedToDate(s: string | null): Date | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const [d, m, yy] = parts;
  return new Date(`20${yy}-${m}-${d}`);
}

const empty: PortfolioData = {
  stats: { valorCartera: 0, beneficioNoRealizado: 0, beneficioRealizado: 0, beneficioTotal: 0, cagr: null, winRate: null, winCount: 0, totalCerradas: 0 },
  tickers: [],
  posiciones: [],
  openTickers: [],
};

export async function getPortfolioData(): Promise<PortfolioData> {
  const { data: posiciones, error } = await supabase
    .from("posiciones")
    .select(
      "id, ticker, cantidad, precio_compra, precio_venta, fecha_compra, fecha_venta, com_compra, com_venta, tc_compra, dividendos, incentivos, impuesto, estado"
    )
    .order("id", { ascending: true });

  if (error) {
    console.error("[portfolio] Error al leer posiciones:", error.message);
    return empty;
  }
  if (!posiciones || posiciones.length === 0) return empty;

  const posAbiertas = posiciones.filter((p: Posicion) => p.estado?.toUpperCase() === "ABIERTA");
  const posCerradas = posiciones.filter((p: Posicion) => p.estado?.toUpperCase() === "CERRADA");

  // Precio más reciente por ticker (solo tickers con posición abierta)
  const tickersAbiertos = [...new Set(posAbiertas.map((p: Posicion) => p.ticker))] as string[];

  // Fetch all prices for open tickers in one query, then pick the latest in JS.
  // NOTE: dates are stored as "DD-MM-YY" which does NOT sort correctly as a string
  // (e.g. "20-03-26" > "15-04-26" alphabetically but March < April chronologically).
  const preciosMap: Record<string, number> = {};
  if (tickersAbiertos.length > 0) {
    const { data: allPrices } = await supabase
      .from("precios")
      .select("ticker, fecha, precio")
      .in("ticker", tickersAbiertos);

    const latestDateNum: Record<string, number> = {};
    (allPrices ?? []).forEach((row: { ticker: string; fecha: string; precio: number }) => {
      const n = ddmmyyToNum(row.fecha);
      if (!latestDateNum[row.ticker] || n > latestDateNum[row.ticker]) {
        latestDateNum[row.ticker] = n;
        preciosMap[row.ticker] = row.precio;
      }
    });
  }

  // Resumen por ticker
  const tickers: TickerSummary[] = tickersAbiertos
    .map((ticker) => {
      const abiertas = posAbiertas.filter((p: Posicion) => p.ticker === ticker);
      const cerradas = posCerradas.filter((p: Posicion) => p.ticker === ticker);
      const precioActual = preciosMap[ticker] ?? 0;

      // Valor coste = Σ(precio_compra × cantidad) posiciones abiertas
      const valorCoste = abiertas.reduce(
        (s: number, p: Posicion) => s + p.precio_compra * p.cantidad, 0
      );
      // Valor actual = Σ(precio_actual × cantidad) posiciones abiertas
      const valorActual = abiertas.reduce(
        (s: number, p: Posicion) => s + precioActual * p.cantidad, 0
      );
      // Otros = comisiones, dividendos, incentivos, impuesto de posiciones abiertas
      const otros = abiertas.reduce(
        (s: number, p: Posicion) =>
          s - (p.com_compra ?? 0) + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0),
        0
      );
      // Bº No Realizado = diferencia de precio pura (sin Otros)
      const beneficioNoRealizado = valorActual - valorCoste;
      // Bº Realizado = posiciones cerradas del mismo ticker (incluye todos los costes)
      const beneficioRealizado = cerradas.reduce(
        (s: number, p: Posicion) =>
          s +
          ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad -
          (p.com_compra ?? 0) -
          (p.com_venta ?? 0) +
          (p.dividendos ?? 0) +
          (p.incentivos ?? 0) -
          (p.impuesto ?? 0),
        0
      );
      const beneficioTotal = beneficioNoRealizado + beneficioRealizado + otros;
      const rentabilidad = valorCoste > 0 ? (beneficioTotal / valorCoste) * 100 : 0;

      return {
        ticker,
        valorCoste,
        valorActual,
        otros,
        beneficioNoRealizado,
        beneficioRealizado,
        beneficioTotal,
        rentabilidad,
      };
    })
    .sort((a, b) => b.valorActual - a.valorActual);

  // Stats globales
  const valorCartera = tickers.reduce((s, t) => s + t.valorActual, 0);
  const beneficioNoRealizado = tickers.reduce((s, t) => s + t.beneficioNoRealizado, 0);
  // Bº Realizado global = TODAS las posiciones cerradas (aunque el ticker ya no esté abierto)
  const beneficioRealizado = posCerradas.reduce(
    (s: number, p: Posicion) =>
      s +
      ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad -
      (p.com_compra ?? 0) -
      (p.com_venta ?? 0) +
      (p.dividendos ?? 0) +
      (p.incentivos ?? 0) -
      (p.impuesto ?? 0),
    0
  );

  // CAGR (annualised return on open positions)
  const allDates = (posiciones as PosicionRow[])
    .map((p) => storedToDate(p.fecha_compra))
    .filter((d): d is Date => d !== null);
  const earliest = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : null;
  const today = new Date();
  const years = earliest ? (today.getTime() - earliest.getTime()) / (365.25 * 24 * 3600 * 1000) : 0;
  const totalCosteAbiertas = posAbiertas.reduce((s: number, p: Posicion) => s + p.precio_compra * p.cantidad, 0);
  const cagr: number | null =
    years >= 0.1 && totalCosteAbiertas > 0 && valorCartera > 0
      ? (Math.pow(valorCartera / totalCosteAbiertas, 1 / years) - 1) * 100
      : null;

  // Win/Loss rate (closed positions)
  const totalCerradas = posCerradas.length;
  const winCount = posCerradas.filter((p: Posicion) => {
    const pl =
      ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad -
      (p.com_compra ?? 0) -
      (p.com_venta ?? 0) +
      (p.dividendos ?? 0) +
      (p.incentivos ?? 0) -
      (p.impuesto ?? 0);
    return pl > 0;
  }).length;
  const winRate: number | null = totalCerradas > 0 ? (winCount / totalCerradas) * 100 : null;

  return {
    stats: {
      valorCartera,
      beneficioNoRealizado,
      beneficioRealizado,
      beneficioTotal: beneficioRealizado + beneficioNoRealizado,
      cagr,
      winRate,
      winCount,
      totalCerradas,
    },
    tickers,
    posiciones: posiciones as PosicionRow[],
    openTickers: tickersAbiertos,
  };
}
