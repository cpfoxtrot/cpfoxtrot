import type { TickerSummary } from "@/lib/data/portfolio";

const fmt = (v: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(v);

const color = (v: number) =>
  v > 0 ? "stat-positive" : v < 0 ? "stat-negative" : "";

export default function TickerTable({ data }: { data: TickerSummary[] }) {
  if (data.length === 0) return null;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Ticker</th>
            <th>Valor Coste</th>
            <th>Valor Actual</th>
            <th>Otros</th>
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
              <td>{fmt(row.valorCoste)}</td>
              <td>{fmt(row.valorActual)}</td>
              <td className={color(row.otros)}>{fmt(row.otros)}</td>
              <td className={color(row.beneficioNoRealizado)}>
                {fmt(row.beneficioNoRealizado)}
              </td>
              <td className={color(row.beneficioRealizado)}>
                {fmt(row.beneficioRealizado)}
              </td>
              <td className={color(row.beneficioTotal)}>
                {fmt(row.beneficioTotal)}
              </td>
              <td className={color(row.rentabilidad)}>
                {row.rentabilidad.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
