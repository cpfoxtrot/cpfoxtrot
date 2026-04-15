export interface PortfolioStats {
  valorCartera: number;
  beneficioNoRealizado: number;
  beneficioRealizado: number;
  beneficioTotal: number;
}

// TODO: conectar a Supabase
// Las posiciones abiertas y operaciones cerradas vendrán de la base de datos.
// - valorCartera:          suma de (precio_actual * cantidad) de posiciones abiertas
// - beneficioNoRealizado:  suma de (precio_actual - precio_medio) * cantidad
// - beneficioRealizado:    suma de beneficios de operaciones ya cerradas
// - beneficioTotal:        beneficioRealizado + beneficioNoRealizado
export async function getPortfolioStats(): Promise<PortfolioStats> {
  return {
    valorCartera: 0,
    beneficioNoRealizado: 0,
    beneficioRealizado: 0,
    beneficioTotal: 0,
  };
}
