"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal, { FormField } from "../Modal";
import { addDividend } from "@/app/inversiones/actions";
import { todayISO, toStoredDate } from "@/lib/utils/format";

export default function AddDividend({
  openTickers,
  onClose,
}: {
  openTickers: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await addDividend({
        ticker: fd.get("ticker") as string,
        fecha: toStoredDate(fd.get("fecha") as string),
        importe: parseFloat(fd.get("importe") as string),
      });
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <Modal title="Añadir dividendo" onClose={onClose}>
      <form onSubmit={handleSubmit}>
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
            <FormField label="Importe (€)">
              <input name="importe" type="number" step="0.01" className="form-input" required placeholder="0.00" />
            </FormField>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando…" : "Añadir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
