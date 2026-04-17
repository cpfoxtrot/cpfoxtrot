"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import type { PriceUpdateResult } from "@/lib/data/update-prices";

export async function refreshPrices(): Promise<PriceUpdateResult> {
  // Dynamic import keeps yahoo-finance2 out of the module graph at render time
  const { runPriceUpdate } = await import("@/lib/data/update-prices");
  const result = await runPriceUpdate();
  revalidatePath("/inversiones");
  return result;
}

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

function ddmmyyToNum(s: string | null): number {
  if (!s) return 0;
  const [d, m, yy] = s.split("-");
  if (!d || !m || !yy) return 0;
  return parseInt(`20${yy}${m.padStart(2, "0")}${d.padStart(2, "0")}`);
}

export async function addAndDistributeDividend(data: {
  ticker: string;
  fecha: string;   // DD-MM-YY
  importe: number;
}): Promise<{ distributed: number }> {
  const { ticker, fecha, importe } = data;

  // 1. Insert into dividendos table
  const { error: insertError } = await supabaseAdmin
    .from("dividendos")
    .insert({ ticker, fecha, importe });
  if (insertError) throw new Error(`Error al guardar dividendo: ${insertError.message}`);

  // 2. Fetch all positions for this ticker
  const { data: positions, error: fetchError } = await supabaseAdmin
    .from("posiciones")
    .select("id, cantidad, fecha_compra, fecha_venta, estado, dividendos")
    .eq("ticker", ticker);
  if (fetchError) throw new Error(`Error al leer posiciones: ${fetchError.message}`);
  if (!positions || positions.length === 0) {
    revalidatePath("/inversiones");
    return { distributed: 0 };
  }

  // 3. Find positions that were open on the dividend date
  const fechaNum = ddmmyyToNum(fecha);
  type Pos = { id: number; cantidad: number; fecha_compra: string | null; fecha_venta: string | null; estado: string; dividendos: number };

  const openOnDate = (positions as Pos[]).filter((p) => {
    const compraNum = ddmmyyToNum(p.fecha_compra);
    if (!compraNum || compraNum > fechaNum) return false;
    if (p.estado?.toUpperCase() === "ABIERTA") return true;
    // Closed but wasn't yet sold on the dividend date
    return ddmmyyToNum(p.fecha_venta) >= fechaNum;
  });

  // 4. Distribute proportionally by cantidad
  const totalCantidad = openOnDate.reduce((s, p) => s + p.cantidad, 0);
  if (totalCantidad > 0) {
    await Promise.all(
      openOnDate.map((p) => {
        const share = (p.cantidad / totalCantidad) * importe;
        return supabaseAdmin
          .from("posiciones")
          .update({ dividendos: (p.dividendos ?? 0) + share })
          .eq("id", p.id);
      })
    );
  }

  revalidatePath("/inversiones");
  revalidatePath("/inversiones/posiciones");
  return { distributed: openOnDate.length };
}
