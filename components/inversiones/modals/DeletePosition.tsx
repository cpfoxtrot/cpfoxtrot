"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { FormField } from "../Modal";
import { deletePosition } from "@/app/inversiones/actions";
import type { PosicionRow } from "@/lib/data/portfolio";

export default function DeletePosition({
  posiciones,
  onClose,
}: {
  posiciones: PosicionRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PosicionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await deletePosition(selected.id);
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <Modal title="Eliminar posición" onClose={onClose}>
      <div className="modal-body">
        <FormField label="Selecciona posición">
          <select
            className="form-input"
            onChange={(e) => setSelected(posiciones.find((p) => p.id === parseInt(e.target.value)) ?? null)}
            defaultValue=""
          >
            <option value="" disabled>— Elige posición —</option>
            {posiciones.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} · {p.ticker} · {p.cantidad} acc. · {p.estado}
              </option>
            ))}
          </select>
        </FormField>

        {selected && (
          <div className="delete-confirm">
            <p>
              ¿Eliminar la posición <strong>#{selected.id} {selected.ticker}</strong> ({selected.cantidad} acciones)?
              Esta acción no se puede deshacer.
            </p>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={!selected || loading}
        >
          {loading ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}
