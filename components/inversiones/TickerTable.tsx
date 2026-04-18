import type { TickerSummary } from "@/lib/data/portfolio";
import { fmtEUR, plColor as color } from "@/lib/utils/format";

export default function TickerTable({ data }: { data: TickerSummary[] }) {
  if (data.length === 0) return null;

  const totals = data.reduce(
    (acc, r) => ({
      valorCoste:           acc.valorCoste           + r.valorCoste,
      valorActual:          acc.valorActual           + r.valorActual,
      beneficioNoRealizado: acc.beneficioNoRealizado  + r.beneficioNoRealizado,
      beneficioRealizado:   acc.beneficioRealizado    + r.beneficioRealizado,
      beneficioTotal:       acc.beneficioTotal        + r.beneficioTotal,
    }),
    { valorCoste: 0, valorActual: 0, beneficioNoRealizado: 0, beneficioRealizado: 0, beneficioTotal: 0 }
  );
  const rentabilidadTotal =
    totals.valorCoste > 0 ? (totals.beneficioTotal / totals.valorCoste) * 100 : 0;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Ticker</th>
            <th>Valor Actual</th>
            <th>Bº No Real.</th>
            <th>Bº Realizado</th>
            <th>Bº Total</th>
            <th>Rentabilidad</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.ticker}>
              <td className="ticker-cell">{row.ticker}</td>
              <td>{fmtEUR(row.valorActual)}</td>
              <td className={color(row.beneficioNoRealizado)}>
                {fmtEUR(row.beneficioNoRealizado)}
              </td>
              <td className={color(row.beneficioRealizado)}>
                {fmtEUR(row.beneficioRealizado)}
              </td>
              <td className={color(row.beneficioTotal)}>
                {fmtEUR(row.beneficioTotal)}
              </td>
              <td className={color(row.rentabilidad)}>
                {row.rentabilidad.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="ticker-cell">Total</td>
            <td>{fmtEUR(totals.valorActual)}</td>
            <td className={color(totals.beneficioNoRealizado)}>
              {fmtEUR(totals.beneficioNoRealizado)}
            </td>
            <td className={color(totals.beneficioRealizado)}>
              {fmtEUR(totals.beneficioRealizado)}
            </td>
            <td className={color(totals.beneficioTotal)}>
              {fmtEUR(totals.beneficioTotal)}
            </td>
            <td className={color(rentabilidadTotal)}>
              {rentabilidadTotal.toFixed(2)}%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
