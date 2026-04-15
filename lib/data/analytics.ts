import type { PosicionRow } from "./portfolio";

export interface PLByYearRow {
  year: string;
  beneficioRealizado: number;
  numOperaciones: number;
}

export interface FlujoCajaRow {
  year: string;
  compras: number;
  ventas: number;
  dividendos: number;
  impuestos: number;
  neto: number;
}

export interface DividendRow {
  ticker: string;
  fecha: string;
  importe: number;
}

function storedToYear(s: string | null): string | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  return `20${parts[2]}`;
}

export function calcPLByYear(posiciones: PosicionRow[]): PLByYearRow[] {
  const map: Record<string, { beneficioRealizado: number; numOperaciones: number }> = {};

  posiciones
    .filter((p) => p.estado?.toUpperCase() === "CERRADA" && p.fecha_venta)
    .forEach((p) => {
      const year = storedToYear(p.fecha_venta) ?? "—";
      const pl =
        ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad -
        (p.com_compra ?? 0) -
        (p.com_venta ?? 0) +
        (p.dividendos ?? 0) +
        (p.incentivos ?? 0) -
        (p.impuesto ?? 0);

      if (!map[year]) map[year] = { beneficioRealizado: 0, numOperaciones: 0 };
      map[year].beneficioRealizado += pl;
      map[year].numOperaciones++;
    });

  return Object.entries(map)
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

export function calcFlujoCaja(
  posiciones: PosicionRow[],
  dividendos: DividendRow[]
): FlujoCajaRow[] {
  const map: Record<
    string,
    { compras: number; ventas: number; dividendos: number; impuestos: number }
  > = {};

  const ensure = (y: string) => {
    if (!map[y]) map[y] = { compras: 0, ventas: 0, dividendos: 0, impuestos: 0 };
  };

  // Buys
  posiciones.forEach((p) => {
    const y = storedToYear(p.fecha_compra);
    if (!y) return;
    ensure(y);
    map[y].compras += p.precio_compra * p.cantidad + (p.com_compra ?? 0);
  });

  // Sells + taxes (closed positions)
  posiciones
    .filter((p) => p.estado?.toUpperCase() === "CERRADA" && p.fecha_venta)
    .forEach((p) => {
      const y = storedToYear(p.fecha_venta)!;
      ensure(y);
      map[y].ventas += (p.precio_venta ?? 0) * p.cantidad - (p.com_venta ?? 0);
      map[y].impuestos += p.impuesto ?? 0;
    });

  // Dividends from dividendos table (have individual dates)
  dividendos.forEach((d) => {
    const y = storedToYear(d.fecha);
    if (!y) return;
    ensure(y);
    map[y].dividendos += d.importe;
  });

  return Object.entries(map)
    .map(([year, v]) => ({
      year,
      ...v,
      neto: v.ventas + v.dividendos - v.compras - v.impuestos,
    }))
    .sort((a, b) => a.year.localeCompare(b.year));
}
