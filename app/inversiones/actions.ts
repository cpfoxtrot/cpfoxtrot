"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

// ── Posiciones ────────────────────────────────────────────────────────────────

export async function addPosition(data: {
  ticker: string;
  fecha_compra: string;
  cantidad: number;
  precio_compra: number;
  com_compra?: number;
  tc_compra?: number | null;
}) {
  const { error } = await supabaseAdmin.from("posiciones").insert({
    ...data,
    estado: "ABIERTA",
    precio_venta: null,
    fecha_venta: null,
    com_venta: null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/inversiones");
}

export async function editPosition(
  id: number,
  data: {
    ticker: string;
    fecha_compra: string;
    cantidad: number;
    precio_compra: number;
    com_compra: number;
    tc_compra: number | null;
    incentivos: number;
    dividendos: number;
    impuesto: number;
  }
) {
  const { error } = await supabaseAdmin.from("posiciones").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inversiones");
}

export async function closePosition(
  id: number,
  data: { precio_venta: number; fecha_venta: string; com_venta: number }
) {
  const { error } = await supabaseAdmin
    .from("posiciones")
    .update({ ...data, estado: "CERRADA" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inversiones");
}

export async function deletePosition(id: number) {
  const { error } = await supabaseAdmin.from("posiciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inversiones");
}

// ── Precios ───────────────────────────────────────────────────────────────────

export async function upsertPrices(
  fecha: string,
  prices: Record<string, number>
) {
  const rows = Object.entries(prices)
    .filter(([, v]) => !isNaN(v) && v > 0)
    .map(([ticker, precio]) => ({ ticker, fecha, precio }));

  if (rows.length === 0) return;

  const { error } = await supabaseAdmin
    .from("precios")
    .upsert(rows, { onConflict: "ticker,fecha" });
  if (error) throw new Error(error.message);
  revalidatePath("/inversiones");
}

// ── Dividendos ────────────────────────────────────────────────────────────────

export async function addDividend(data: {
  ticker: string;
  fecha: string;
  importe: number;
}) {
  const { error } = await supabaseAdmin.from("dividendos").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/inversiones");
}

/** Convert "DD-MM-YY" to YYYYMMDD int for comparison */
function ddmmyyToNum(s: string | null): number {
  if (!s) return 0;
  const [d, m, yy] = s.split("-");
  if (!d || !m || !yy) return 0;
  return parseInt(`20${yy}${m.padStart(2, "0")}${d.padStart(2, "0")}`);
}

export async function reconcileDividend(
  ticker: string,
  fecha: string,
  importe: number
): Promise<{ updated: number }> {
  const { data: positions, error } = await supabaseAdmin
    .from("posiciones")
    .select("id, cantidad, fecha_compra, fecha_venta, estado, dividendos")
    .eq("ticker", ticker);

  if (error) throw new Error(error.message);
  if (!positions || positions.length === 0) return { updated: 0 };

  const fechaNum = ddmmyyToNum(fecha);

  const openOnDate = positions.filter((p: {
    fecha_compra: string | null;
    fecha_venta: string | null;
    estado: string;
  }) => {
    const compraNum = ddmmyyToNum(p.fecha_compra);
    if (!compraNum || compraNum > fechaNum) return false;
    if (p.estado?.toUpperCase() === "ABIERTA") return true;
    return ddmmyyToNum(p.fecha_venta) >= fechaNum;
  });

  const totalCantidad: number = openOnDate.reduce(
    (s: number, p: { cantidad: number }) => s + p.cantidad,
    0
  );
  if (totalCantidad === 0) return { updated: 0 };

  await Promise.all(
    openOnDate.map((p: { id: number; cantidad: number; dividendos: number }) => {
      const share = (p.cantidad / totalCantidad) * importe;
      return supabaseAdmin
        .from("posiciones")
        .update({ dividendos: (p.dividendos ?? 0) + share })
        .eq("id", p.id);
    })
  );

  revalidatePath("/inversiones");
  revalidatePath("/inversiones/posiciones");
  return { updated: openOnDate.length };
}
