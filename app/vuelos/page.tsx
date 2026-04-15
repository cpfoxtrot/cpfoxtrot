export default function Vuelos() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Vuelos</h1>
        <p>Seguimiento de tus vuelos</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <span className="badge badge-success" style={{ marginBottom: "var(--space-3)" }}>
            Activo
          </span>
          <h3 style={{ marginBottom: "var(--space-2)" }}>Historico</h3>
          <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
            Vuelos ya hechos
          </p>
        </div>

        <div className="card">
          <span className="badge badge-primary" style={{ marginBottom: "var(--space-3)" }}>
            En seguimiento
          </span>
          <h3 style={{ marginBottom: "var(--space-2)" }}>Pendientes</h3>
          <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
            Vuelos planeados.
          </p>
        </div>

        <div className="card">
          <span className="badge badge-warning" style={{ marginBottom: "var(--space-3)" }}>
            Pendiente
          </span>
          <h3 style={{ marginBottom: "var(--space-2)" }}>Errores</h3>
          <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
            Vuelos con datos no completos.
          </p>
        </div>
      </div>
    </div>
  );
}
