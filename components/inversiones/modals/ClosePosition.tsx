"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal, { FormField } from "../Modal";
import { closePosition } from "@/app/inversiones/actions";
import { todayISO, toStoredDate } from "@/lib/utils/format";
import type { PosicionRow } from "@/lib/data/portfolio";

export default function ClosePosition({
  posiciones,
  onClose,
}: {
  posiciones: PosicionRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const open = posiciones.filter((p) => p.estado?.toUpperCase() === "ABIERTA");
  const [selected, setSelected] = useState<PosicionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await closePosition(selected.id, {
        precio_venta: parseFloat(fd.get("precio_venta") as string),
        fecha_venta: toStoredDate(fd.get("fecha_venta") as string),
        com_venta: parseFloat((fd.get("com_venta") as string) || "0"),
      });
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <Modal title="Cerrar posición" onClose={onClose}>
      <div className="modal-body">
        <FormField label="Selecciona posición abierta">
          <select
            className="form-input"
            onChange={(e) => setSelected(open.find((p) => p.id === parseInt(e.target.value)) ?? null)}
            defaultValue=""
          >
            <option value="" disabled>— Elige posición —</option>
            {open.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} · {p.ticker} · {p.cantidad} acc. @ {p.precio_compra}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {selected && (
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ paddingTop: 0 }}>
            <div className="form-grid-2">
              <FormField label="Precio venta">
                <input name="precio_venta" type="number" step="0.0001" className="form-input" required placeholder="0.00" />
              </FormField>
              <FormField label="Fecha venta">
                <input name="fecha_venta" type="date" className="form-input" defaultValue={todayISO()} required />
              </FormField>
              <FormField label="Comisión venta">
                <input name="com_venta" type="number" step="0.01" className="form-input" defaultValue="0" />
              </FormField>
            </div>
            {error && <p className="form-error">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Cerrando…" : "Cerrar posición"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
