import Link from "next/link";
import { getPortfolioData } from "@/lib/data/portfolio";
import { calcPLByYear, calcFlujoCaja } from "@/lib/data/analytics";
import type { DividendRow } from "@/lib/data/analytics";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fmtEUR } from "@/lib/utils/format";
import PortfolioChart from "@/components/inversiones/PortfolioChart";
import TickerTable from "@/components/inversiones/TickerTable";
import ActionBar from "@/components/inversiones/ActionBar";
import TabsContainer from "@/components/inversiones/TabsContainer";
import PLByYear from "@/components/inversiones/PLByYear";
import FlujoCaja from "@/components/inversiones/FlujoCaja";

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

function StatCardPct({
  label,
  value,
  subtitle,
  colored = false,
}: {
  label: string;
  value: number | null;
  subtitle?: string;
  colored?: boolean;
}) {
  const cls = colored && value !== null ? (value >= 0 ? "stat-positive" : "stat-negative") : "";
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${cls}`}>
        {value === null ? "—" : `${value.toFixed(1)}%`}
      </p>
      {subtitle && (
        <p className="stat-label" style={{ marginTop: "var(--space-1)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default async function Inversiones() {
  const [{ stats, tickers, posiciones, openTickers }, divResult] = await Promise.all([
    getPortfolioData(),
    supabaseAdmin.from("dividendos").select("ticker, fecha, importe"),
  ]);

  const dividendos: DividendRow[] = (divResult.data ?? []) as DividendRow[];
  const plByYear = calcPLByYear(posiciones);
  const flujoCaja = calcFlujoCaja(posiciones, dividendos);

  return (
    <div className="page">
      {/* ── Métricas globales ── */}
      <div className="stats-grid">
        <StatCard label="Valor de la cartera" value={stats.valorCartera} />
        <StatCard label="Bº No realizado"     value={stats.beneficioNoRealizado} colored />
        <StatCard label="Bº Realizado"         value={stats.beneficioRealizado}   colored />
        <StatCard label="Bº Total"             value={stats.beneficioTotal}       colored />
        <StatCardPct label="CAGR" value={stats.cagr} colored subtitle="Rentabilidad anualizada" />
        <StatCardPct
          label="Win Rate"
          value={stats.winRate}
          subtitle={stats.totalCerradas > 0 ? `${stats.winCount} de ${stats.totalCerradas} ops.` : "Sin operaciones cerradas"}
        />
      </div>

      {/* ── Acciones ── */}
      <ActionBar posiciones={posiciones} openTickers={openTickers} />

      {/* ── Portfolio ── */}
      <section className="inv-section">
        <div className="inv-section-header">
          <h2 className="inv-section-title">Portfolio</h2>
          <Link href="/inversiones/posiciones" className="btn btn-secondary btn-sm">
            Ver todas las posiciones →
          </Link>
        </div>

        <TabsContainer
          tabs={[
            {
              id: "resumen",
              label: "Resumen",
              content:
                tickers.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay posiciones abiertas o no se pudieron cargar los datos.</p>
                  </div>
                ) : (
                  <div className="chart-table-grid">
                    <div className="chart-wrap">
                      <PortfolioChart tickers={tickers} total={stats.valorCartera} />
                    </div>
                    <TickerTable data={tickers} />
                  </div>
                ),
            },
            {
              id: "pl-anio",
              label: "P/L por Año",
              content: <PLByYear data={plByYear} />,
            },
            {
              id: "flujo",
              label: "Flujo de Caja",
              content: <FlujoCaja data={flujoCaja} />,
            },
          ]}
        />
      </section>
    </div>
  );
}
