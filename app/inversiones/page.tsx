import { getPortfolioData } from "@/lib/data/portfolio";
import { fmtEUR } from "@/lib/utils/format";
import PortfolioChart from "@/components/inversiones/PortfolioChart";
import TickerTable from "@/components/inversiones/TickerTable";
import ActionBar from "@/components/inversiones/ActionBar";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  colored = false,
}: {
  label: string;
  value: number;
  colored?: boolean;
}) {
  const cls = colored ? (value >= 0 ? "stat-positive" : "stat-negative") : "";
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${cls}`}>{fmtEUR(value)}</p>
    </div>
  );
}

export default async function Inversiones() {
  const { stats, tickers, posiciones, openTickers } = await getPortfolioData();

  return (
    <div className="page">
      {/* ── Métricas globales ── */}
      <div className="stats-grid">
        <StatCard label="Valor de la cartera" value={stats.valorCartera} />
        <StatCard label="Bº No realizado"     value={stats.beneficioNoRealizado} colored />
        <StatCard label="Bº Realizado"         value={stats.beneficioRealizado}   colored />
        <StatCard label="Bº Total"             value={stats.beneficioTotal}       colored />
      </div>

      {/* ── Acciones ── */}
      <ActionBar posiciones={posiciones} openTickers={openTickers} />

      {tickers.length === 0 ? (
        <div className="empty-state">
          <p>No hay posiciones abiertas o no se pudieron cargar los datos.</p>
        </div>
      ) : (
        <section className="inv-section">
          <h2 className="inv-section-title">Posiciones abiertas</h2>
          <div className="chart-table-grid">
            <div className="chart-wrap">
              <PortfolioChart tickers={tickers} total={stats.valorCartera} />
            </div>
            <TickerTable data={tickers} />
          </div>
        </section>
      )}
    </div>
  );
}
