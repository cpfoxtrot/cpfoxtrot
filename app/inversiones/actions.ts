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
