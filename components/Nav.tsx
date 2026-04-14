"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/catalogs/routes";

export default function Nav() {
  const pathname = usePathname();

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
      </div>
    </nav>
  );
}
