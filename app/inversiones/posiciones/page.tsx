import Link from "next/link";
import { getAllPositionsData } from "@/lib/data/positions";
import PositionsTable from "@/components/inversiones/PositionsTable";

export const dynamic = "force-dynamic";

export default async function PosicionesPage() {
  const data = await getAllPositionsData();

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <Link href="/inversiones" className="btn btn-secondary" style={{ fontSize: "var(--text-sm)" }}>
          ← Inversiones
        </Link>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)" }}>
          Todas las posiciones
        </h1>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <p>No hay posiciones registradas.</p>
        </div>
      ) : (
        <PositionsTable data={data} />
      )}
    </div>
  );
}
