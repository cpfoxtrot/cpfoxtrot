export interface Route {
  path: string;
  label: string;
  description: string;
}

export const routes: Route[] = [
  {
    path: "/",
    label: "Inicio",
    description: "Página principal",
  },
  {
    path: "/inversiones",
    label: "Inversiones",
    description: "Gestión y seguimiento de inversiones",
  },
    {
    path: "/vuelos",
    label: "Vuelos",
    description: "Seguimientos de vuelos",
  },
];
