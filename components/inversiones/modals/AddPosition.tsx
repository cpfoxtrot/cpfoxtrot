"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal, { FormField } from "../Modal";
import { addPosition } from "@/app/inversiones/actions";
import { todayISO, toStoredDate } from "@/lib/utils/format";

export default function AddPosition({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await addPosition({
        ticker: (fd.get("ticker") as string).toUpperCase().trim(),
        fecha_compra: toStoredDate(fd.get("fecha_compra") as string),
        cantidad: parseFloat(fd.get("cantidad") as string),
        precio_compra: parseFloat(fd.get("precio_compra") as string),
        com_compra: parseFloat((fd.get("com_compra") as string) || "0"),
        tc_compra: fd.get("tc_compra") ? parseFloat(fd.get("tc_compra") as string) : null,
      });
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <Modal title="Añadir posición" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-grid-2">
            <FormField label="Ticker">
              <input name="ticker" className="form-input" required placeholder="AAPL" style={{ textTransform: "uppercase" }} />
            </FormField>
            <FormField label="Fecha compra">
              <input name="fecha_compra" type="date" className="form-input" defaultValue={todayISO()} required />
            </FormField>
            <FormField label="Cantidad">
              <input name="cantidad" type="number" step="0.000001" className="form-input" required placeholder="0" />
            </FormField>
            <FormField label="Precio compra">
              <input name="precio_compra" type="number" step="0.0001" className="form-input" required placeholder="0.00" />
            </FormField>
            <FormField label="Comisión compra">
              <input name="com_compra" type="number" step="0.01" className="form-input" defaultValue="0" placeholder="0.00" />
            </FormField>
            <FormField label="TC compra (opcional)">
              <input name="tc_compra" type="number" step="0.0001" className="form-input" placeholder="1.0000" />
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
