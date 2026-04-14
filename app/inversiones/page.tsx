export default function Inversiones() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Inversiones</h1>
        <p>Gestión y seguimiento de tus inversiones</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <span className="badge badge-success" style={{ marginBottom: "var(--space-3)" }}>
            Activo
          </span>
          <h3 style={{ marginBottom: "var(--space-2)" }}>Cartera de acciones</h3>
          <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
            Seguimiento de posiciones en renta variable.
          </p>
        </div>

        <div className="card">
          <span className="badge badge-primary" style={{ marginBottom: "var(--space-3)" }}>
            En seguimiento
          </span>
          <h3 style={{ marginBottom: "var(--space-2)" }}>Fondos indexados</h3>
          <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
            Posiciones en ETFs y fondos de inversión.
          </p>
        </div>

        <div className="card">
          <span className="badge badge-warning" style={{ marginBottom: "var(--space-3)" }}>
            Pendiente
          </span>
          <h3 style={{ marginBottom: "var(--space-2)" }}>Renta fija</h3>
          <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
            Bonos y depósitos a plazo fijo.
          </p>
        </div>
      </div>
    </div>
  );
}
