"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal, { FormField } from "../Modal";
import { upsertPrices } from "@/app/inversiones/actions";
import { todayISO, toStoredDate } from "@/lib/utils/format";
import { supabase } from "@/lib/supabase";

const FIXED_TICKERS = ["USD/EUR"];

export default function UpdatePrice({
  openTickers,
  onClose,
}: {
  openTickers: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const allTickers = [...openTickers, ...FIXED_TICKERS.filter((t) => !openTickers.includes(t))];

  const [date, setDate] = useState(todayISO());
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar precios existentes al cambiar de fecha
  useEffect(() => {
    async function load() {
      setFetching(true);
      const storedDate = toStoredDate(date);
      const { data } = await supabase
        .from("precios")
        .select("ticker, precio")
        .eq("fecha", storedDate)
        .in("ticker", allTickers);

      const map: Record<string, string> = {};
      (data ?? []).forEach(({ ticker, precio }: { ticker: string; precio: number }) => {
        map[ticker] = String(precio);
      });
      setPrices(map);
      setFetching(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const numPrices: Record<string, number> = {};
      for (const [ticker, val] of Object.entries(prices)) {
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) numPrices[ticker] = n;
      }
      await upsertPrices(toStoredDate(date), numPrices);
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <Modal title="Actualizar cotización" onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <FormField label="Fecha">
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>

          {fetching ? (
            <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>Cargando precios…</p>
          ) : (
            <div className="form-grid-2">
              {allTickers.map((ticker) => (
                <FormField key={ticker} label={ticker}>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={prices[ticker] ?? ""}
                    onChange={(e) => setPrices((p) => ({ ...p, [ticker]: e.target.value }))}
                    placeholder="0.0000"
                  />
                </FormField>
              ))}
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading || fetching}>
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
