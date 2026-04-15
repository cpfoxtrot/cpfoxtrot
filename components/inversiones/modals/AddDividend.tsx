"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { FormField } from "../Modal";
import { addDividend, reconcileDividend } from "@/app/inversiones/actions";
import { todayISO, toStoredDate } from "@/lib/utils/format";

export default function AddDividend({
  openTickers,
  onClose,
}: {
  openTickers: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(withReconcile: boolean) {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    setLoading(true);
    setError("");
    const fd = new FormData(form);
    const ticker = fd.get("ticker") as string;
    const fecha = toStoredDate(fd.get("fecha") as string);
    const importe = parseFloat(fd.get("importe") as string);
    try {
      await addDividend({ ticker, fecha, importe });
      if (withReconcile) {
        const result = await reconcileDividend(ticker, fecha, importe);
        if (result.updated === 0) {
          setError("Dividendo guardado, pero sin posiciones abiertas en esa fecha.");
          setLoading(false);
          return;
        }
      }
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <Modal title="Añadir dividendo" onClose={onClose}>
      <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
        <div className="modal-body">
          <div className="form-grid-2">
            <FormField label="Ticker">
              <select name="ticker" className="form-input" required defaultValue="">
                <option value="" disabled>— Selecciona —</option>
                {openTickers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Fecha">
              <input name="fecha" type="date" className="form-input" defaultValue={todayISO()} required />
            </FormField>
            <FormField label="Importe total (€)">
              <input name="importe" type="number" step="0.01" className="form-input" required placeholder="0.00" />
            </FormField>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => handleAction(true)}
          >
            {loading ? "Guardando…" : "Añadir y distribuir"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => handleAction(false)}
          >
            {loading ? "Guardando…" : "Añadir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
