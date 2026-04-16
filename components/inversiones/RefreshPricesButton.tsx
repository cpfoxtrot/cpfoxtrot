"use client";

import { useState } from "react";
import { refreshPrices } from "@/app/inversiones/actions";
import type { PriceUpdateResult } from "@/lib/data/update-prices";

interface Props {
  lastUpdate: string | null; // DD-MM-YY or null
  stale: boolean;            // true if >1 business day since last update
}

export default function RefreshPricesButton({ lastUpdate, stale }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceUpdateResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await refreshPrices();
      setResult(res);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  const dotClass = stale || err ? "price-dot price-dot-stale" : "price-dot price-dot-ok";

  return (
    <div className="price-status-bar">
      <div className="price-status-info">
        <span className={dotClass} />
        {lastUpdate ? (
          <span className="price-status-text">
            Precios: <strong>{lastUpdate}</strong>
            {stale && !result && " · desactualizados"}
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
        {err && <span className="price-status-err">· Error al actualizar</span>}
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
