import type { PosicionRow } from "./portfolio";

export interface PLByYearRow {
  year: string;
  beneficioRealizado: number;
  numOperaciones: number;
}

export interface FlujoCajaMesRow {
  key: string;   // "202604" — sortable
  label: string; // "Abr 2026"
  compras: number;
  ventas: number;
  dividendos: number;
  impuestos: number;
  neto: number;
}

export interface FlujoCajaRow {
  year: string;
  compras: number;
  ventas: number;
  dividendos: number;
  impuestos: number;
  neto: number;
  months: FlujoCajaMesRow[];
}

export interface DividendRow {
  ticker: string;
  fecha: string;
  importe: number;
}

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function storedToYear(s: string | null): string | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  return `20${parts[2]}`;
}

function storedToYearMonth(s: string | null): { year: string; key: string; label: string } | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const [, m, yy] = parts;
  const mNum = parseInt(m);
  if (isNaN(mNum) || mNum < 1 || mNum > 12) return null;
  return {
    year: `20${yy}`,
    key: `20${yy}${m.padStart(2, "0")}`,
    label: `${MONTH_NAMES[mNum - 1]} 20${yy}`,
  };
}

export function calcPLByYear(posiciones: PosicionRow[]): PLByYearRow[] {
  const map: Record<string, { beneficioRealizado: number; numOperaciones: number }> = {};

  posiciones
    .filter((p) => p.estado?.toUpperCase() === "CERRADA" && p.fecha_venta)
    .forEach((p) => {
      const year = storedToYear(p.fecha_venta) ?? "—";
      const pl =
        ((p.precio_venta ?? 0) - p.precio_compra) * p.cantidad -
        (p.com_compra ?? 0) - (p.com_venta ?? 0) +
        (p.dividendos ?? 0) + (p.incentivos ?? 0) - (p.impuesto ?? 0);

      if (!map[year]) map[year] = { beneficioRealizado: 0, numOperaciones: 0 };
      map[year].beneficioRealizado += pl;
      map[year].numOperaciones++;
    });

  return Object.entries(map)
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

type Period = { compras: number; ventas: number; dividendos: number; impuestos: number };

export function calcFlujoCaja(
  posiciones: PosicionRow[],
  dividendos: DividendRow[]
): FlujoCajaRow[] {
  const yearMap: Record<string, Period> = {};
  const monthMap: Record<string, { meta: { year: string; key: string; label: string } } & Period> = {};

  const ensureYear = (y: string) => {
    if (!yearMap[y]) yearMap[y] = { compras: 0, ventas: 0, dividendos: 0, impuestos: 0 };
  };
  const ensureMonth = (m: { year: string; key: string; label: string }) => {
    if (!monthMap[m.key]) {
      monthMap[m.key] = { meta: m, compras: 0, ventas: 0, dividendos: 0, impuestos: 0 };
    }
  };

  // Buys
  posiciones.forEach((p) => {
    const ym = storedToYearMonth(p.fecha_compra);
    if (!ym) return;
    ensureYear(ym.year);
    ensureMonth(ym);
    const amount = p.precio_compra * p.cantidad + (p.com_compra ?? 0);
    yearMap[ym.year].compras += amount;
    monthMap[ym.key].compras += amount;
  });

  // Sells + taxes (closed positions)
  posiciones
    .filter((p) => p.estado?.toUpperCase() === "CERRADA" && p.fecha_venta)
    .forEach((p) => {
      const ym = storedToYearMonth(p.fecha_venta);
      if (!ym) return;
      ensureYear(ym.year);
      ensureMonth(ym);
      const sale = (p.precio_venta ?? 0) * p.cantidad - (p.com_venta ?? 0);
      const tax = p.impuesto ?? 0;
      yearMap[ym.year].ventas += sale;
      yearMap[ym.year].impuestos += tax;
      monthMap[ym.key].ventas += sale;
      monthMap[ym.key].impuestos += tax;
    });

  // Dividends from dividendos table
  dividendos.forEach((d) => {
    const ym = storedToYearMonth(d.fecha);
    if (!ym) return;
    ensureYear(ym.year);
    ensureMonth(ym);
    yearMap[ym.year].dividendos += d.importe;
    monthMap[ym.key].dividendos += d.importe;
  });

  // Group months by year
  const monthsByYear: Record<string, FlujoCajaMesRow[]> = {};
  Object.values(monthMap).forEach(({ meta, ...v }) => {
    if (!monthsByYear[meta.year]) monthsByYear[meta.year] = [];
    monthsByYear[meta.year].push({
      key: meta.key,
      label: meta.label,
      ...v,
      neto: v.ventas + v.dividendos - v.compras - v.impuestos,
    });
  });
  Object.values(monthsByYear).forEach((arr) => arr.sort((a, b) => a.key.localeCompare(b.key)));

  return Object.entries(yearMap)
    .map(([year, v]) => ({
      year,
      ...v,
      neto: v.ventas + v.dividendos - v.compras - v.impuestos,
      months: monthsByYear[year] ?? [],
    }))
    .sort((a, b) => a.year.localeCompare(b.year));
}
