import { supabase } from "@/lib/supabase";

export interface PortfolioStats {
  valorCartera: number;
  beneficioNoRealizado: number;
  beneficioRealizado: number;
  beneficioTotal: number;
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
  // TODO: tc_compra — necesario si los precios de compra están en divisa extranjera
}

export async function getPortfolioStats(): Promise<PortfolioStats> {
  const { data: posiciones, error } = await supabase
    .from("posiciones")
    .select(
      "ticker, cantidad, precio_compra, precio_venta, com_compra, com_venta, dividendos, incentivos, impuesto, estado"
    );

  if (error || !posiciones || posiciones.length === 0) {
    return { valorCartera: 0, beneficioNoRealizado: 0, beneficioRealizado: 0, beneficioTotal: 0 };
  }

  const posAbiertas = posiciones.filter((p: Posicion) => p.estado === "Abierta");
  const posCerradas = posiciones.filter((p: Posicion) => p.estado === "Cerrada");

  // Precio más reciente por ticker para posiciones abiertas
  const tickersAbiertos = [...new Set(posAbiertas.map((p: Posicion) => p.ticker))];

  const preciosMap: Record<string, number> = {};
  await Promise.all(
    tickersAbiertos.map(async (ticker) => {
      const { data } = await supabase
        .from("precios")
        .select("precio")
        .eq("ticker", ticker)
        .order("fecha", { ascending: false })
        .limit(1)
        .single();
      preciosMap[ticker as string] = data?.precio ?? 0;
    })
  );

  // Valor de la cartera = Σ (precio_actual × cantidad) — posiciones abiertas
  const valorCartera = posAbiertas.reduce((sum: number, p: Posicion) => {
    return sum + (preciosMap[p.ticker] ?? 0) * p.cantidad;
  }, 0);

  // Bº No Realizado = Σ [(precio_actual − precio_compra) × cantidad − com_compra + dividendos + incentivos − impuesto]
  const beneficioNoRealizado = posAbiertas.reduce((sum: number, p: Posicion) => {
    const precioActual = preciosMap[p.ticker] ?? 0;
    return (
      sum +
      (precioActual - p.precio_compra) * p.cantidad -
      (p.com_compra ?? 0) +
      (p.dividendos ?? 0) +
      (p.incentivos ?? 0) -
      (p.impuesto ?? 0)
    );
  }, 0);

  // Bº Realizado = Σ [(precio_venta − precio_compra) × cantidad − com_compra − com_venta + dividendos + incentivos − impuesto]
  const beneficioRealizado = posCerradas.reduce((sum: number, p: Posicion) => {
    return (
      sum +
      ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad -
      (p.com_compra ?? 0) -
      (p.com_venta ?? 0) +
      (p.dividendos ?? 0) +
      (p.incentivos ?? 0) -
      (p.impuesto ?? 0)
    );
  }, 0);

  return {
    valorCartera,
    beneficioNoRealizado,
    beneficioRealizado,
    beneficioTotal: beneficioRealizado + beneficioNoRealizado,
  };
}
