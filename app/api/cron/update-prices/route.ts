/**
 * Cron route: GET /api/cron/update-prices
 *
 * Vercel lo llama automáticamente según el schedule en vercel.json.
 * También se puede invocar manualmente con:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://tu-dominio.vercel.app/api/cron/update-prices
 *
 * Variables de entorno necesarias en Vercel:
 *   CRON_SECRET  — cadena aleatoria para proteger el endpoint (añádela en
 *                  Vercel → Settings → Environment Variables)
 */

import { NextResponse } from "next/server";
import { runPriceUpdate } from "@/lib/data/update-prices";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Sin secret configurado → abierto (solo para dev)
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPriceUpdate();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
