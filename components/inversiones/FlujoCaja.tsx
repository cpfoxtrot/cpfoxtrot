"use client";

import { useState } from "react";
import { Fragment } from "react";
import type { FlujoCajaRow } from "@/lib/data/analytics";
import { fmtEUR, plColor as col } from "@/lib/utils/format";

export default function FlujoCaja({ data }: { data: FlujoCajaRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (year: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay datos de flujo de caja.</p>
      </div>
    );
  }

  const totals = data.reduce(
    (acc, r) => ({
      compras: acc.compras + r.compras,
      ventas: acc.ventas + r.ventas,
      dividendos: acc.dividendos + r.dividendos,
      impuestos: acc.impuestos + r.impuestos,
      neto: acc.neto + r.neto,
    }),
    { compras: 0, ventas: 0, dividendos: 0, impuestos: 0, neto: 0 }
  );

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Periodo</th>
            <th>Compras</th>
            <th>Ventas</th>
            <th>Dividendos</th>
            <th>Impuestos</th>
            <th>Neto</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <Fragment key={row.year}>
              {/* Year row */}
              <tr
                onClick={() => row.months.length > 0 && toggle(row.year)}
                style={{
                  cursor: row.months.length > 0 ? "pointer" : "default",
                  fontWeight: "var(--font-semibold)",
                }}
              >
                <td className="ticker-cell">
                  {row.months.length > 0 && (
                    <span style={{ marginRight: "var(--space-2)", fontSize: "var(--text-xs)", opacity: 0.5 }}>
                      {expanded.has(row.year) ? "▼" : "▶"}
                    </span>
                  )}
                  {row.year}
                </td>
                <td className="stat-negative">{fmtEUR(-row.compras)}</td>
                <td>{row.ventas > 0 ? <span className="stat-positive">{fmtEUR(row.ventas)}</span> : "—"}</td>
                <td>{row.dividendos > 0 ? <span className="stat-positive">{fmtEUR(row.dividendos)}</span> : "—"}</td>
                <td>{row.impuestos > 0 ? <span className="stat-negative">{fmtEUR(-row.impuestos)}</span> : "—"}</td>
                <td className={col(row.neto)}>{fmtEUR(row.neto)}</td>
              </tr>

              {/* Month sub-rows */}
              {expanded.has(row.year) &&
                row.months.map((m) => (
                  <tr key={m.key} style={{ background: "var(--color-surface)" }}>
                    <td style={{ textAlign: "left", paddingLeft: "var(--space-8)", color: "var(--color-muted)", fontStyle: "italic" }}>
                      {m.label}
                    </td>
                    <td className="stat-negative">{fmtEUR(-m.compras)}</td>
                    <td>{m.ventas > 0 ? <span className="stat-positive">{fmtEUR(m.ventas)}</span> : "—"}</td>
                    <td>{m.dividendos > 0 ? <span className="stat-positive">{fmtEUR(m.dividendos)}</span> : "—"}</td>
                    <td>{m.impuestos > 0 ? <span className="stat-negative">{fmtEUR(-m.impuestos)}</span> : "—"}</td>
                    <td className={col(m.neto)}>{fmtEUR(m.neto)}</td>
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: "var(--font-semibold)" }}>
            <td className="ticker-cell" style={{ borderTop: "2px solid var(--color-border)" }}>Total</td>
            <td className="stat-negative" style={{ borderTop: "2px solid var(--color-border)" }}>{fmtEUR(-totals.compras)}</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{totals.ventas > 0 ? <span className="stat-positive">{fmtEUR(totals.ventas)}</span> : "—"}</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{totals.dividendos > 0 ? <span className="stat-positive">{fmtEUR(totals.dividendos)}</span> : "—"}</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{totals.impuestos > 0 ? <span className="stat-negative">{fmtEUR(-totals.impuestos)}</span> : "—"}</td>
            <td className={col(totals.neto)} style={{ borderTop: "2px solid var(--color-border)" }}>{fmtEUR(totals.neto)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
