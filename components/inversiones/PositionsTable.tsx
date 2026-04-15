"use client";

import { useState } from "react";
import type { PositionDetail } from "@/lib/data/positions";
import { fmtEUR } from "@/lib/utils/format";

type Tab = "abiertas" | "cerradas" | "todas";

const col = (v: number) =>
  v > 0 ? "stat-positive" : v < 0 ? "stat-negative" : "";

export default function PositionsTable({ data }: { data: PositionDetail[] }) {
  const [tab, setTab] = useState<Tab>("abiertas");

  const abiertas = data.filter((p) => p.estado?.toUpperCase() === "ABIERTA");
  const cerradas = data.filter((p) => p.estado?.toUpperCase() === "CERRADA");
  const rows = tab === "abiertas" ? abiertas : tab === "cerradas" ? cerradas : data;

  return (
    <div>
      <div className="tabs-bar" style={{ marginBottom: "var(--space-5)" }}>
        {(["abiertas", "cerradas", "todas"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn${tab === t ? " tab-btn-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{ marginLeft: "var(--space-2)", opacity: 0.6, fontSize: "var(--text-xs)" }}>
              {t === "abiertas" ? abiertas.length : t === "cerradas" ? cerradas.length : data.length}
            </span>
          </button>
        ))}
      </div>

      <div className="data-table-wrap">
        {tab === "abiertas" && (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>#</th>
                <th style={{ textAlign: "left" }}>Ticker</th>
                <th>F. Compra</th>
                <th>Cantidad</th>
                <th>P. Compra</th>
                <th>P. Actual</th>
                <th>Valor Coste</th>
                <th>Valor Actual</th>
                <th>Ef. Precio</th>
                <th>Ef. Divisa</th>
                <th>B/N Real.</th>
                <th>Rentab.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "left", color: "var(--color-muted)" }}>{p.id}</td>
                  <td className="ticker-cell">{p.ticker}</td>
                  <td>{p.fecha_compra ?? "—"}</td>
                  <td>{p.cantidad}</td>
                  <td>{fmtEUR(p.precio_compra)}</td>
                  <td>{p.precioActual !== null ? fmtEUR(p.precioActual) : "—"}</td>
                  <td>{fmtEUR(p.precio_compra * p.cantidad)}</td>
                  <td>{fmtEUR(p.valorActual)}</td>
                  <td className={col(p.efectoPrecio)}>{fmtEUR(p.efectoPrecio)}</td>
                  <td className={col(p.efectoDivisa)}>{fmtEUR(p.efectoDivisa)}</td>
                  <td className={col(p.beneficioNoRealizado)}>{fmtEUR(p.beneficioNoRealizado)}</td>
                  <td className={col(p.rentabilidad)}>{p.rentabilidad.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "cerradas" && (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>#</th>
                <th style={{ textAlign: "left" }}>Ticker</th>
                <th>F. Compra</th>
                <th>F. Venta</th>
                <th>Cantidad</th>
                <th>P. Compra</th>
                <th>P. Venta</th>
                <th>Dividendos</th>
                <th>Incentivos</th>
                <th>Comisiones</th>
                <th>Impuesto</th>
                <th>B/Total</th>
                <th>Rentab.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "left", color: "var(--color-muted)" }}>{p.id}</td>
                  <td className="ticker-cell">{p.ticker}</td>
                  <td>{p.fecha_compra ?? "—"}</td>
                  <td>{p.fecha_venta ?? "—"}</td>
                  <td>{p.cantidad}</td>
                  <td>{fmtEUR(p.precio_compra)}</td>
                  <td>{fmtEUR(p.precio_venta ?? 0)}</td>
                  <td className="stat-positive">{fmtEUR(p.dividendos)}</td>
                  <td className="stat-positive">{fmtEUR(p.incentivos)}</td>
                  <td className="stat-negative">{fmtEUR(-(p.com_compra + (p.com_venta ?? 0)))}</td>
                  <td className="stat-negative">{fmtEUR(-p.impuesto)}</td>
                  <td className={col(p.beneficioTotal)}>{fmtEUR(p.beneficioTotal)}</td>
                  <td className={col(p.rentabilidad)}>{p.rentabilidad.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "todas" && (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>#</th>
                <th style={{ textAlign: "left" }}>Ticker</th>
                <th style={{ textAlign: "left" }}>Estado</th>
                <th>F. Compra</th>
                <th>F. Venta</th>
                <th>Cantidad</th>
                <th>P. Compra</th>
                <th>B/Total</th>
                <th>Rentab.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "left", color: "var(--color-muted)" }}>{p.id}</td>
                  <td className="ticker-cell">{p.ticker}</td>
                  <td>
                    <span
                      className={p.estado?.toUpperCase() === "ABIERTA" ? "badge badge-success" : "badge badge-muted"}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td>{p.fecha_compra ?? "—"}</td>
                  <td>{p.fecha_venta ?? "—"}</td>
                  <td>{p.cantidad}</td>
                  <td>{fmtEUR(p.precio_compra)}</td>
                  <td className={col(p.beneficioTotal)}>{fmtEUR(p.beneficioTotal)}</td>
                  <td className={col(p.rentabilidad)}>{p.rentabilidad.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
