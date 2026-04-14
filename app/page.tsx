import Link from "next/link";
import { routes } from "@/lib/catalogs/routes";

export default function Home() {
  const sections = routes.filter((r) => r.path !== "/");

  return (
    <div className="page">
      <section className="hero">
        <span className="hero-eyebrow">Plataforma financiera</span>
        <h1>Bienvenido a<br />Mi Proyecto</h1>
        <p className="hero-description">
          Gestiona tus inversiones y finanzas desde un solo lugar.
        </p>
        <Link href="/inversiones" className="btn btn-primary">
          Ver inversiones
        </Link>
      </section>

      <div className="card-grid">
        {sections.map((route) => (
          <Link key={route.path} href={route.path} style={{ textDecoration: "none" }}>
            <div className="card">
              <h3 style={{ marginBottom: "var(--space-2)" }}>{route.label}</h3>
              <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
                {route.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
