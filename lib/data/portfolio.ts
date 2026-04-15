import { supabase } from "@/lib/supabase";

export interface PortfolioStats {
  valorCartera: number;
  beneficioNoRealizado: number;
  beneficioRealizado: number;
  beneficioTotal: number;
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

export interface PortfolioData {
  stats: PortfolioStats;
  tickers: TickerSummary[];
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

const empty: PortfolioData = {
  stats: { valorCartera: 0, beneficioNoRealizado: 0, beneficioRealizado: 0, beneficioTotal: 0 },
  tickers: [],
};

export async function getPortfolioData(): Promise<PortfolioData> {
  const { data: posiciones, error } = await supabase
    .from("posiciones")
    .select(
      "ticker, cantidad, precio_compra, precio_venta, com_compra, com_venta, dividendos, incentivos, impuesto, estado"
    );

  if (error) {
    console.error("[portfolio] Error al leer posiciones:", error.message);
    return empty;
  }
  if (!posiciones || posiciones.length === 0) return empty;

  const posAbiertas = posiciones.filter((p: Posicion) => p.estado?.toUpperCase() === "ABIERTA");
  const posCerradas = posiciones.filter((p: Posicion) => p.estado?.toUpperCase() === "CERRADA");

  // Precio más reciente por ticker (solo tickers con posición abierta)
  const tickersAbiertos = [...new Set(posAbiertas.map((p: Posicion) => p.ticker))] as string[];

  const preciosMap: Record<string, number> = {};
  await Promise.all(
    tickersAbiertos.map(async (ticker) => {
      const { data, error: e } = await supabase
        .from("precios")
        .select("precio")
        .eq("ticker", ticker)
        .order("fecha", { ascending: false })
        .limit(1)
        .single();
      if (e) console.error(`[portfolio] Sin precio para ${ticker}:`, e.message);
      preciosMap[ticker] = data?.precio ?? 0;
    })
  );

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

  return {
    stats: {
      valorCartera,
      beneficioNoRealizado,
      beneficioRealizado,
      beneficioTotal: beneficioRealizado + beneficioNoRealizado,
    },
    tickers,
  };
}
