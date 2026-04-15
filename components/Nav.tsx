"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/lib/catalogs/routes";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          Mi Proyecto
        </Link>
        <ul className="nav-links">
          {routes.map((route) => (
            <li key={route.path}>
              <Link
                href={route.path}
                className={`nav-link${pathname === route.path ? " active" : ""}`}
              >
                {route.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          style={{ marginLeft: "auto" }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
