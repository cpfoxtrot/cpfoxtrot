import { getPortfolioStats } from "@/lib/data/portfolio";

function formatEUR(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface StatCardProps {
  label: string;
  value: number;
  colored?: boolean;
}

function StatCard({ label, value, colored = false }: StatCardProps) {
  const colorClass = colored
    ? value >= 0
      ? "stat-positive"
      : "stat-negative"
    : "";

  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${colorClass}`}>{formatEUR(value)}</p>
    </div>
  );
}

export default async function Inversiones() {
  const stats = await getPortfolioStats();

  return (
    <div className="page">
      {/* ── Resumen de cartera ── */}
      <div className="stats-grid">
        <StatCard label="Valor de la cartera" value={stats.valorCartera} />
        <StatCard label="Bº No realizado" value={stats.beneficioNoRealizado} colored />
        <StatCard label="Bº Realizado" value={stats.beneficioRealizado} colored />
        <StatCard label="Bº Total" value={stats.beneficioTotal} colored />
      </div>

      {/* ── Secciones futuras ── */}
      <div className="page-header">
        <h1>Inversiones</h1>
        <p>Gestión y seguimiento de tu cartera</p>
      </div>

      <div className="empty-state">
        <p>Las posiciones aparecerán aquí una vez conectada la base de datos.</p>
      </div>
    </div>
  );
}
