"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal, { FormField } from "../Modal";
import { editPosition } from "@/app/inversiones/actions";
import { toInputDate, toStoredDate } from "@/lib/utils/format";
import type { PosicionRow } from "@/lib/data/portfolio";

export default function EditPosition({
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await editPosition(selected.id, {
        ticker: (fd.get("ticker") as string).toUpperCase().trim(),
        fecha_compra: toStoredDate(fd.get("fecha_compra") as string),
        cantidad: parseFloat(fd.get("cantidad") as string),
        precio_compra: parseFloat(fd.get("precio_compra") as string),
        com_compra: parseFloat((fd.get("com_compra") as string) || "0"),
        tc_compra: fd.get("tc_compra") ? parseFloat(fd.get("tc_compra") as string) : null,
        incentivos: parseFloat((fd.get("incentivos") as string) || "0"),
        dividendos: parseFloat((fd.get("dividendos") as string) || "0"),
        impuesto: parseFloat((fd.get("impuesto") as string) || "0"),
      });
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <Modal title="Editar posición" onClose={onClose} wide>
      <div className="modal-body">
        <FormField label="Selecciona posición">
          <select
            className="form-input"
            onChange={(e) => {
              const pos = posiciones.find((p) => p.id === parseInt(e.target.value));
              setSelected(pos ?? null);
            }}
            defaultValue=""
          >
            <option value="" disabled>— Elige posición —</option>
            {posiciones.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} · {p.ticker} · {p.cantidad} acc. @ {p.precio_compra} · {p.estado}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {selected && (
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ paddingTop: 0 }}>
            <div className="form-grid-2">
              <FormField label="Ticker">
                <input name="ticker" className="form-input" defaultValue={selected.ticker} required style={{ textTransform: "uppercase" }} />
              </FormField>
              <FormField label="Fecha compra">
                <input name="fecha_compra" type="date" className="form-input" defaultValue={selected.fecha_compra ? toInputDate(selected.fecha_compra) : ""} required />
              </FormField>
              <FormField label="Cantidad">
                <input name="cantidad" type="number" step="0.000001" className="form-input" defaultValue={selected.cantidad} required />
              </FormField>
              <FormField label="Precio compra">
                <input name="precio_compra" type="number" step="0.0001" className="form-input" defaultValue={selected.precio_compra} required />
              </FormField>
              <FormField label="Comisión compra">
                <input name="com_compra" type="number" step="0.01" className="form-input" defaultValue={selected.com_compra ?? 0} />
              </FormField>
              <FormField label="TC compra">
                <input name="tc_compra" type="number" step="0.0001" className="form-input" defaultValue={selected.tc_compra ?? ""} placeholder="1.0000" />
              </FormField>
              <FormField label="Incentivos">
                <input name="incentivos" type="number" step="0.01" className="form-input" defaultValue={selected.incentivos ?? 0} />
              </FormField>
              <FormField label="Dividendos acumulados">
                <input name="dividendos" type="number" step="0.01" className="form-input" defaultValue={selected.dividendos ?? 0} />
              </FormField>
              <FormField label="Impuesto">
                <input name="impuesto" type="number" step="0.01" className="form-input" defaultValue={selected.impuesto ?? 0} />
              </FormField>
            </div>
            {error && <p className="form-error">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
