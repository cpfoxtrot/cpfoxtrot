import type { FlujoCajaRow } from "@/lib/data/analytics";
import { fmtEUR } from "@/lib/utils/format";

const color = (v: number) =>
  v > 0 ? "stat-positive" : v < 0 ? "stat-negative" : "";

export default function FlujoCaja({ data }: { data: FlujoCajaRow[] }) {
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
            <th style={{ textAlign: "left" }}>Año</th>
            <th>Compras</th>
            <th>Ventas</th>
            <th>Dividendos</th>
            <th>Impuestos</th>
            <th>Neto</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.year}>
              <td className="ticker-cell">{row.year}</td>
              <td className="stat-negative">{fmtEUR(-row.compras)}</td>
              <td className="stat-positive">{fmtEUR(row.ventas)}</td>
              <td className="stat-positive">{fmtEUR(row.dividendos)}</td>
              <td className="stat-negative">{fmtEUR(-row.impuestos)}</td>
              <td className={color(row.neto)}>{fmtEUR(row.neto)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: "var(--font-semibold)", borderTop: "2px solid var(--color-border)" }}>
            <td className="ticker-cell">Total</td>
            <td className="stat-negative">{fmtEUR(-totals.compras)}</td>
            <td className="stat-positive">{fmtEUR(totals.ventas)}</td>
            <td className="stat-positive">{fmtEUR(totals.dividendos)}</td>
            <td className="stat-negative">{fmtEUR(-totals.impuestos)}</td>
            <td className={color(totals.neto)}>{fmtEUR(totals.neto)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
