import { supabaseAdmin } from "@/lib/supabase-admin";
import type { PosicionRow } from "./portfolio";

export interface PositionDetail extends PosicionRow {
  precioActual: number | null;
  valorActual: number;
  efectoPrecio: number;
  efectoDivisa: number;
  beneficioNoRealizado: number;
  beneficioTotal: number;
  rentabilidad: number;
}

/** Convert "DD-MM-YY" to YYYYMMDD integer for date comparison */
function ddmmyyToNum(s: string | null): number {
  if (!s) return 0;
  const [d, m, yy] = s.split("-");
  if (!d || !m || !yy) return 0;
  return parseInt(`20${yy}${m.padStart(2, "0")}${d.padStart(2, "0")}`);
}

export function isOpenOn(
  p: { fecha_compra: string | null; fecha_venta: string | null; estado: string },
  fecha: string
): boolean {
  const compraNum = ddmmyyToNum(p.fecha_compra);
  const fechaNum = ddmmyyToNum(fecha);
  if (!compraNum || compraNum > fechaNum) return false;
  if (p.estado?.toUpperCase() === "ABIERTA") return true;
  const ventaNum = ddmmyyToNum(p.fecha_venta);
  return ventaNum >= fechaNum;
}

export async function getAllPositionsData(): Promise<PositionDetail[]> {
  const { data: posiciones, error } = await supabaseAdmin
    .from("posiciones")
    .select(
      "id, ticker, cantidad, precio_compra, precio_venta, fecha_compra, fecha_venta, com_compra, com_venta, tc_compra, dividendos, incentivos, impuesto, estado"
    )
    .order("id", { ascending: true });

  if (error || !posiciones) return [];

  const abiertas = posiciones.filter(
    (p: PosicionRow) => p.estado?.toUpperCase() === "ABIERTA"
  );
  const tickersAbiertos = [...new Set(abiertas.map((p: PosicionRow) => p.ticker))] as string[];

  // Fetch latest price for each open ticker + USD/EUR rate
  const preciosMap: Record<string, number> = {};
  const allTickers = [...tickersAbiertos, "USD/EUR"];

  await Promise.all(
    allTickers.map(async (ticker) => {
      const { data } = await supabaseAdmin
        .from("precios")
        .select("precio")
        .eq("ticker", ticker)
        .order("fecha", { ascending: false })
        .limit(1)
        .single();
      if (data) preciosMap[ticker] = data.precio;
    })
  );

  const tcActual = preciosMap["USD/EUR"] ?? 1;

  return posiciones.map((p: PosicionRow): PositionDetail => {
    const isOpen = p.estado?.toUpperCase() === "ABIERTA";
    const precioActual = isOpen ? (preciosMap[p.ticker] ?? null) : null;
    const tc = p.tc_compra && p.tc_compra !== 1 ? p.tc_compra : null;

    let valorActual = 0;
    let efectoPrecio = 0;
    let efectoDivisa = 0;
    let beneficioNoRealizado = 0;
    let beneficioTotal = 0;
    let rentabilidad = 0;

    if (isOpen && precioActual !== null) {
      if (tc) {
        // USD position
        valorActual = p.cantidad * precioActual * tcActual;
        const valorCosteEUR = p.cantidad * p.precio_compra * tc;
        efectoPrecio = p.cantidad * (precioActual - p.precio_compra) * tc;
        efectoDivisa = p.cantidad * precioActual * (tcActual - tc);
        beneficioNoRealizado = valorActual - valorCosteEUR;
        const otros = -(p.com_compra ?? 0) + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0);
        beneficioTotal = beneficioNoRealizado + otros;
        rentabilidad = valorCosteEUR > 0 ? (beneficioTotal / valorCosteEUR) * 100 : 0;
      } else {
        // EUR position
        valorActual = p.cantidad * precioActual;
        const valorCoste = p.cantidad * p.precio_compra;
        efectoPrecio = valorActual - valorCoste;
        beneficioNoRealizado = efectoPrecio;
        const otros = -(p.com_compra ?? 0) + (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0);
        beneficioTotal = beneficioNoRealizado + otros;
        rentabilidad = valorCoste > 0 ? (beneficioTotal / valorCoste) * 100 : 0;
      }
    } else if (!isOpen) {
      // Closed position
      const ventaBruta = (p.precio_venta ?? 0) * p.cantidad;
      const compraBruta = p.precio_compra * p.cantidad;
      beneficioTotal =
        ventaBruta - compraBruta -
        (p.com_compra ?? 0) - (p.com_venta ?? 0) +
        (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0);
      rentabilidad = compraBruta > 0 ? (beneficioTotal / compraBruta) * 100 : 0;
    }

    return {
      ...p,
      precioActual,
      valorActual,
      efectoPrecio,
      efectoDivisa,
      beneficioNoRealizado,
      beneficioTotal,
      rentabilidad,
    };
  });
}
