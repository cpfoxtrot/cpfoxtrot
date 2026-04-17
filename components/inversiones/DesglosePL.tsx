import type { DesglosePLRow } from "@/lib/data/portfolio";
import { fmtEUR, plColor as col } from "@/lib/utils/format";

export default function DesglosePL({ data }: { data: DesglosePLRow[] }) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay datos de desglose P/L.</p>
      </div>
    );
  }

  const totals = data.reduce(
    (acc, r) => ({
      comisiones: acc.comisiones + r.comisiones,
      impuestos:  acc.impuestos  + r.impuestos,
      dividendos: acc.dividendos + r.dividendos,
      incentivos: acc.incentivos + r.incentivos,
      efectoDivisa: acc.efectoDivisa + r.efectoDivisa,
      efectoPrecio: acc.efectoPrecio + r.efectoPrecio,
      plTotal: acc.plTotal + r.plTotal,
    }),
    { comisiones: 0, impuestos: 0, dividendos: 0, incentivos: 0, efectoDivisa: 0, efectoPrecio: 0, plTotal: 0 }
  );

  const fmt = fmtEUR;
  const dash = (v: number) => v === 0 ? <span style={{ color: "var(--color-muted)" }}>—</span> : <span className={col(v)}>{fmt(v)}</span>;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Ticker</th>
            <th>Comisiones</th>
            <th>Impuestos</th>
            <th>Dividendos</th>
            <th>Incentivos</th>
            <th>Ef. Divisa</th>
            <th>Ef. Precio</th>
            <th>P/L Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.ticker}>
              <td className="ticker-cell">{row.ticker}</td>
              <td>{dash(row.comisiones)}</td>
              <td>{dash(row.impuestos)}</td>
              <td>{dash(row.dividendos)}</td>
              <td>{dash(row.incentivos)}</td>
              <td>{dash(row.efectoDivisa)}</td>
              <td className={col(row.efectoPrecio)}>{fmt(row.efectoPrecio)}</td>
              <td className={col(row.plTotal)}><strong>{fmt(row.plTotal)}</strong></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: "var(--font-semibold)" }}>
            <td className="ticker-cell" style={{ borderTop: "2px solid var(--color-border)" }}>Total</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{dash(totals.comisiones)}</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{dash(totals.impuestos)}</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{dash(totals.dividendos)}</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{dash(totals.incentivos)}</td>
            <td style={{ borderTop: "2px solid var(--color-border)" }}>{dash(totals.efectoDivisa)}</td>
            <td className={col(totals.efectoPrecio)} style={{ borderTop: "2px solid var(--color-border)" }}>{fmt(totals.efectoPrecio)}</td>
            <td className={col(totals.plTotal)} style={{ borderTop: "2px solid var(--color-border)" }}><strong>{fmt(totals.plTotal)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
