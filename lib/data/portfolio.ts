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
}

export async function getPortfolioStats(): Promise<PortfolioStats> {
  const empty = { valorCartera: 0, beneficioNoRealizado: 0, beneficioRealizado: 0, beneficioTotal: 0 };

  const { data: posiciones, error } = await supabase
    .from("posiciones")
    .select(
      "ticker, cantidad, precio_compra, precio_venta, com_compra, com_venta, dividendos, incentivos, impuesto, estado"
    );

  if (error) {
    console.error("[portfolio] Error al leer posiciones:", error.message, error.details);
    return empty;
  }

  if (!posiciones || posiciones.length === 0) {
    console.warn("[portfolio] La tabla posiciones está vacía o no es accesible");
    return empty;
  }

  console.log(`[portfolio] ${posiciones.length} posiciones cargadas`);

  const posAbiertas = posiciones.filter((p: Posicion) => p.estado === "Abierta");
  const posCerradas = posiciones.filter((p: Posicion) => p.estado === "Cerrada");

  console.log(`[portfolio] Abiertas: ${posAbiertas.length} | Cerradas: ${posCerradas.length}`);

  // Último precio disponible por ticker para posiciones abiertas
  const tickersAbiertos = [...new Set(posAbiertas.map((p: Posicion) => p.ticker))];
  const preciosMap: Record<string, number> = {};

  await Promise.all(
    tickersAbiertos.map(async (ticker) => {
      const { data, error: precioError } = await supabase
        .from("precios")
        .select("precio")
        .eq("ticker", ticker)
        .order("fecha", { ascending: false })
        .limit(1)
        .single();

      if (precioError) {
        console.error(`[portfolio] Sin precio para ${ticker}:`, precioError.message);
      }

      preciosMap[ticker as string] = data?.precio ?? 0;
      console.log(`[portfolio] ${ticker} → precio actual: ${preciosMap[ticker as string]}`);
    })
  );

  // Valor de la cartera = Σ (precio_actual × cantidad) — posiciones abiertas
  const valorCartera = posAbiertas.reduce((sum: number, p: Posicion) => {
    return sum + (preciosMap[p.ticker] ?? 0) * p.cantidad;
  }, 0);

  // Bº No Realizado = Σ (precio_actual − precio_compra) × cantidad
  // Las comisiones, dividendos, incentivos e impuestos solo cuentan en el realizado
  const beneficioNoRealizado = posAbiertas.reduce((sum: number, p: Posicion) => {
    const precioActual = preciosMap[p.ticker] ?? 0;
    return sum + (precioActual - p.precio_compra) * p.cantidad;
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

  console.log(`[portfolio] valorCartera: ${valorCartera} | BNR: ${beneficioNoRealizado} | BR: ${beneficioRealizado}`);

  return {
    valorCartera,
    beneficioNoRealizado,
    beneficioRealizado,
    beneficioTotal: beneficioRealizado + beneficioNoRealizado,
  };
}
