import { getPortfolioData } from "@/lib/data/portfolio";
import PortfolioChart from "@/components/inversiones/PortfolioChart";
import TickerTable from "@/components/inversiones/TickerTable";

export const dynamic = "force-dynamic";

const fmt = (v: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(v);

interface StatCardProps {
  label: string;
  value: number;
  colored?: boolean;
}

function StatCard({ label, value, colored = false }: StatCardProps) {
  const cls = colored ? (value >= 0 ? "stat-positive" : "stat-negative") : "";
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${cls}`}>{fmt(value)}</p>
    </div>
  );
}

export default async function Inversiones() {
  const { stats, tickers } = await getPortfolioData();

  return (
    <div className="page">
      {/* ── Métricas globales ── */}
      <div className="stats-grid">
        <StatCard label="Valor de la cartera" value={stats.valorCartera} />
        <StatCard label="Bº No realizado" value={stats.beneficioNoRealizado} colored />
        <StatCard label="Bº Realizado"     value={stats.beneficioRealizado} colored />
        <StatCard label="Bº Total"         value={stats.beneficioTotal}     colored />
      </div>

      {tickers.length === 0 ? (
        <div className="empty-state">
          <p>No hay posiciones abiertas o no se pudieron cargar los datos.</p>
        </div>
      ) : (
        <>
          {/* ── Distribución de la cartera ── */}
          <section className="inv-section">
            <h2 className="inv-section-title">Distribución de la cartera</h2>
            <div className="chart-wrap">
              <PortfolioChart tickers={tickers} total={stats.valorCartera} />
            </div>
          </section>

          {/* ── Tabla por ticker ── */}
          <section className="inv-section">
            <h2 className="inv-section-title">Posiciones abiertas por ticker</h2>
            <TickerTable data={tickers} />
          </section>
        </>
      )}
    </div>
  );
}
