"use client";

import { useState } from "react";
import { refreshPrices } from "@/app/inversiones/actions";
import type { PriceUpdateResult } from "@/lib/data/update-prices";

interface Props {
  lastUpdate: string | null; // DD-MM-YY
  lastHora: string | null;   // HH:MM (null if hora column not yet added)
  stale: boolean;
}

export default function RefreshPricesButton({ lastUpdate, lastHora, stale }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceUpdateResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [liveHora, setLiveHora] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await refreshPrices();
      setResult(res);
      // Show current Spain time as the "live" update time
      setLiveHora(
        new Date().toLocaleTimeString("es-ES", {
          timeZone: "Europe/Madrid",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  const displayHora = liveHora ?? lastHora;
  const isStale = stale && !result;
  const dotClass = isStale || err ? "price-dot price-dot-stale" : "price-dot price-dot-ok";

  return (
    <div className="price-status-bar">
      <div className="price-status-info">
        <span className={dotClass} />
        {lastUpdate ? (
          <span className="price-status-text">
            Precios: <strong>{lastUpdate}{displayHora ? ` ${displayHora}` : ""}</strong>
            {isStale && " · desactualizados"}
          </span>
        ) : (
          <span className="price-status-text">Sin precios guardados</span>
        )}
        {result && (
          <span className="price-status-ok">
            · {result.summary.ok} actualizados
            {result.summary.error > 0 && `, ${result.summary.error} con error`}
          </span>
        )}
        {err && <span className="price-status-err"> · Error al actualizar</span>}
      </div>

      <button
        className="btn btn-secondary btn-sm"
        onClick={handleRefresh}
        disabled={loading}
      >
        {loading ? "Actualizando…" : "Actualizar precios"}
      </button>
    </div>
  );
}
