import type { TickerEvolutionRow } from "@/lib/data/portfolio";
import { fmtEUR, plColor as col } from "@/lib/utils/format";

function Cell({ v }: { v: number | null }) {
  if (v === null) return <td style={{ textAlign: "right", color: "var(--color-muted)" }}>—</td>;
  return <td style={{ textAlign: "right" }} className={col(v)}>{fmtEUR(v)}</td>;
}

export default function PLEvolution({ data }: { data: TickerEvolutionRow[] }) {
  if (data.length === 0) return null;

  return (
    <div className="data-table-wrap" style={{ marginTop: "var(--space-5)" }}>
      <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-2)" }}>
        Evolución Bº No Realizado
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Ticker</th>
            <th style={{ textAlign: "right" }}>Hoy</th>
            <th style={{ textAlign: "right" }}>Ayer</th>
            <th style={{ textAlign: "right" }}>Hace 1 sem.</th>
            <th style={{ textAlign: "right" }}>Hace 1 mes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.ticker}>
              <td className="ticker-cell">{row.ticker}</td>
              <Cell v={row.plHoy} />
              <Cell v={row.plAyer} />
              <Cell v={row.plSemana} />
              <Cell v={row.plMes} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
