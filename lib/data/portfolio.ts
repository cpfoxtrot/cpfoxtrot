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
  beneficioNoRealizado: number;
  beneficioRealizado: number;
  beneficioTotal: number;
  rentabilidad: number;
}

export interface DesglosePLRow {
  ticker: string;
  comisiones: number;
  impuestos: number;
  dividendos: number;
  incentivos: number;
  efectoDivisa: number;
  efectoPrecio: number;
  plTotal: number;
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
  tickers: TickerSummary[];       // open positions only (Resumen tab)
  tickersAll: TickerSummary[];    // all positions per ticker (Por ticker tab)
  desglosePL: DesglosePLRow[];    // P/L breakdown per ticker
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
  tc_compra: number | null;
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
  tickersAll: [],
  desglosePL: [],
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

  const tickersAbiertos = [...new Set(posAbiertas.map((p: Posicion) => p.ticker))] as string[];
  const allDistinctTickers = [...new Set(posiciones.map((p: Posicion) => p.ticker))] as string[];

  // Fetch latest price for open tickers + USD/EUR rate.
  // DD-MM-YY doesn't sort as string — pick max in JS.
  const preciosMap: Record<string, number> = {};
  const priceTickers = [...tickersAbiertos, "USD/EUR"];
  if (priceTickers.length > 0) {
    const { data: allPrices } = await supabase
      .from("precios")
      .select("ticker, fecha, precio")
      .in("ticker", priceTickers);

    const latestDateNum: Record<string, number> = {};
    (allPrices ?? []).forEach((row: { ticker: string; fecha: string; precio: number }) => {
      const n = ddmmyyToNum(row.fecha);
      if (!latestDateNum[row.ticker] || n > latestDateNum[row.ticker]) {
        latestDateNum[row.ticker] = n;
        preciosMap[row.ticker] = row.precio;
      }
    });
  }

  const tcActual = preciosMap["USD/EUR"] ?? 1;

  // ── Resumen tab: open positions only ──────────────────────────────────────
  // beneficioRealizado = realized cash flows from open positions
  // (dividendos received, incentivos, minus commissions paid, minus impuestos)
  const tickers: TickerSummary[] = tickersAbiertos
    .map((ticker) => {
      const abiertas = posAbiertas.filter((p: Posicion) => p.ticker === ticker);
      const precioActual = preciosMap[ticker] ?? 0;

      const valorCoste = abiertas.reduce((s: number, p: Posicion) => s + p.precio_compra * p.cantidad, 0);
      const valorActual = abiertas.reduce((s: number, p: Posicion) => s + precioActual * p.cantidad, 0);
      const beneficioNoRealizado = valorActual - valorCoste;
      const beneficioRealizado = abiertas.reduce(
        (s: number, p: Posicion) =>
          s - (p.com_compra ?? 0) + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0),
        0
      );
      const beneficioTotal = beneficioNoRealizado + beneficioRealizado;
      const rentabilidad = valorCoste > 0 ? (beneficioTotal / valorCoste) * 100 : 0;

      return { ticker, valorCoste, valorActual, beneficioNoRealizado, beneficioRealizado, beneficioTotal, rentabilidad };
    })
    .sort((a, b) => b.valorActual - a.valorActual);

  // ── Por ticker tab: all positions (open + closed) ─────────────────────────
  const tickersAll: TickerSummary[] = allDistinctTickers
    .map((ticker) => {
      const abiertas = posAbiertas.filter((p: Posicion) => p.ticker === ticker);
      const cerradas = posCerradas.filter((p: Posicion) => p.ticker === ticker);
      const precioActual = preciosMap[ticker] ?? 0;

      const valorCoste = [...abiertas, ...cerradas].reduce(
        (s: number, p: Posicion) => s + p.precio_compra * p.cantidad, 0
      );
      const valorActual = abiertas.reduce((s: number, p: Posicion) => s + precioActual * p.cantidad, 0);
      const beneficioNoRealizado = abiertas.reduce(
        (s: number, p: Posicion) => s + (precioActual - p.precio_compra) * p.cantidad, 0
      );
      // Realized: P&L from closed positions + cash flows from open positions
      const beneficioRealizado =
        cerradas.reduce(
          (s: number, p: Posicion) =>
            s + ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad
              - (p.com_compra ?? 0) - (p.com_venta ?? 0)
              + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0),
          0
        ) +
        abiertas.reduce(
          (s: number, p: Posicion) =>
            s - (p.com_compra ?? 0) + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0),
          0
        );
      const beneficioTotal = beneficioNoRealizado + beneficioRealizado;
      const rentabilidad = valorCoste > 0 ? (beneficioTotal / valorCoste) * 100 : 0;

      return { ticker, valorCoste, valorActual, beneficioNoRealizado, beneficioRealizado, beneficioTotal, rentabilidad };
    })
    .sort((a, b) => b.valorActual - a.valorActual);

  // ── Desglose P/L ──────────────────────────────────────────────────────────
  const desglosePL: DesglosePLRow[] = allDistinctTickers.map((ticker) => {
    const rows = posiciones.filter((p: Posicion) => p.ticker === ticker);
    let comisiones = 0, impuestos = 0, dividendos = 0, incentivos = 0,
        efectoDivisa = 0, efectoPrecio = 0;

    for (const p of rows as Posicion[]) {
      comisiones -= (p.com_compra ?? 0) + (p.com_venta ?? 0);
      impuestos  -= (p.impuesto ?? 0);
      dividendos += (p.dividendos ?? 0);
      incentivos += (p.incentivos ?? 0);

      if (p.estado?.toUpperCase() === "ABIERTA") {
        const precioActual = preciosMap[p.ticker] ?? 0;
        const tc = p.tc_compra && p.tc_compra !== 1 ? p.tc_compra : null;
        if (tc) {
          // USD open position — separate price vs FX effect
          const precioActualUSD = precioActual / tcActual;
          const precioCompraUSD = p.precio_compra / tc;
          efectoPrecio += p.cantidad * (precioActualUSD - precioCompraUSD) * tc;
          efectoDivisa += p.cantidad * precioActualUSD * (tcActual - tc);
        } else {
          efectoPrecio += (precioActual - p.precio_compra) * p.cantidad;
        }
      } else {
        // Closed position — no tc_venta available, absorb full gain into efectoPrecio
        efectoPrecio += ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad;
      }
    }

    const plTotal = comisiones + impuestos + dividendos + incentivos + efectoDivisa + efectoPrecio;
    return { ticker, comisiones, impuestos, dividendos, incentivos, efectoDivisa, efectoPrecio, plTotal };
  }).sort((a, b) => Math.abs(b.plTotal) - Math.abs(a.plTotal));

  // ── Stats globales ────────────────────────────────────────────────────────
  const valorCartera = tickers.reduce((s, t) => s + t.valorActual, 0);
  const beneficioNoRealizado = tickers.reduce((s, t) => s + t.beneficioNoRealizado, 0);

  // Bº Realizado = P&L from closed positions + realized cash flows from ALL open positions
  const beneficioRealizado =
    posCerradas.reduce(
      (s: number, p: Posicion) =>
        s + ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad
          - (p.com_compra ?? 0) - (p.com_venta ?? 0)
          + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0),
      0
    ) +
    posAbiertas.reduce(
      (s: number, p: Posicion) =>
        s - (p.com_compra ?? 0) + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0),
      0
    );

  // CAGR
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

  // Win/Loss rate
  const totalCerradas = posCerradas.length;
  const winCount = posCerradas.filter((p: Posicion) => {
    const pl =
      ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad
        - (p.com_compra ?? 0) - (p.com_venta ?? 0)
        + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0);
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
    tickersAll,
    desglosePL,
    posiciones: posiciones as PosicionRow[],
    openTickers: tickersAbiertos,
  };
}
