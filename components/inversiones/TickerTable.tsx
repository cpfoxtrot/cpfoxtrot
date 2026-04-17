import type { TickerSummary } from "@/lib/data/portfolio";
import { fmtEUR, plColor } from "@/lib/utils/format";

export default function TickerTable({ data }: { data: TickerSummary[] }) {
  if (data.length === 0) return null;

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
              <td className={plColor(row.beneficioNoRealizado)}>
                {fmtEUR(row.beneficioNoRealizado)}
              </td>
              <td className={plColor(row.beneficioRealizado)}>
                {fmtEUR(row.beneficioRealizado)}
              </td>
              <td className={plColor(row.beneficioTotal)}>
                {fmtEUR(row.beneficioTotal)}
              </td>
              <td className={plColor(row.rentabilidad)}>
                {row.rentabilidad.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
