/**
 * CONFIGURACIÓN DE TICKERS — ACTUALIZACIÓN AUTOMÁTICA DE PRECIOS
 * ================================================================
 *
 * El cron (/api/cron/update-prices) se ejecuta cada día laborable a las
 * 22:30 h (hora española) y actualiza los precios de los tickers que
 * tengas con posición ABIERTA en ese momento.
 *
 * Todos los precios se guardan en EUR en la tabla `precios`.
 * Los tickers con currency: "USD" se convierten automáticamente usando
 * el tipo de cambio USD/EUR del mismo día.
 *
 *
 * CÓMO AÑADIR UN TICKER NUEVO
 * ----------------------------
 * 1. Busca el símbolo exacto en https://finance.yahoo.com
 *    (escribe el nombre de la empresa en la búsqueda y copia el símbolo)
 *
 * 2. Añade una línea en la sección correspondiente:
 *
 *    TICKER:  { yahoo: "SÍMBOLO_YAHOO",  currency: "EUR" },  // cotiza en EUR
 *    TICKER:  { yahoo: "SÍMBOLO_YAHOO",  currency: "USD" },  // cotiza en USD → se convierte
 *    TICKER:  { yahoo: null,              currency: "EUR" },  // sin Yahoo → actualización manual
 *
 * 3. Haz commit y push — el cron lo recoge automáticamente.
 *
 *
 * SUFIJOS DE MERCADO MÁS COMUNES
 * --------------------------------
 *   Sin sufijo  →  NYSE / NASDAQ          (USD)
 *   .MC         →  Bolsa de Madrid (BME)  (EUR)
 *   .PA         →  Euronext París         (EUR)
 *   .AS         →  Euronext Ámsterdam     (EUR)
 *   .DE         →  XETRA Frankfurt        (EUR)
 *   .L          →  London Stock Exchange  (verificar si devuelve USD o GBX)
 *   .MI         →  Borsa Italiana         (EUR)
 *
 * TIPO DE CAMBIO
 * ---------------
 * USD/EUR se actualiza siempre de forma automática (símbolo: USDEUR=X).
 * No hace falta añadirlo aquí.
 */

export interface TickerConfig {
  /** Símbolo en Yahoo Finance. null = no buscar, actualizar a mano. */
  yahoo: string | null;
  /** Divisa en la que Yahoo devuelve el precio.
   *  "USD" → el cron multiplica por el tipo USD/EUR del día antes de guardar. */
  currency: "EUR" | "USD";
}

export const TICKER_CONFIG: Record<string, TickerConfig> = {

  // ── Acciones españolas — Bolsa de Madrid (BME) ────────────────────────────
  AENA:  { yahoo: "AENA.MC",  currency: "EUR" },
  IAG:   { yahoo: "IAG.MC",   currency: "EUR" },
  AMS:   { yahoo: "AMS.MC",   currency: "EUR" },
  IDR:   { yahoo: "IDR.MC",   currency: "EUR" },
  CABK:  { yahoo: "CABK.MC",  currency: "EUR" },
  ITX:   { yahoo: "ITX.MC",   currency: "EUR" },
  ANE:   { yahoo: "ANE.MC",   currency: "EUR" },
  NXTE:  { yahoo: "NXT.MC",   currency: "EUR" },
  TEF:   { yahoo: "TEF.MC",   currency: "EUR" },
  REP:   { yahoo: "REP.MC",   currency: "EUR" },

  // ── Acciones americanas — NYSE / NASDAQ (USD → convertido a EUR) ──────────
  AAPL:  { yahoo: "AAPL",     currency: "USD" },
  NVDA:  { yahoo: "NVDA",     currency: "USD" },
  AMZN:  { yahoo: "AMZN",     currency: "USD" },
  NKE:   { yahoo: "NKE",      currency: "USD" },
  DAL:   { yahoo: "DAL",      currency: "USD" },

  // ── Otros mercados ────────────────────────────────────────────────────────
  ISLN:  { yahoo: "ISLN.L",   currency: "USD" },  // iShares Physical Silver ETC — London, precio en USD

  // ── Sin cotización pública — actualización manual ─────────────────────────
  FNDI:  { yahoo: null,        currency: "EUR" },  // Fondo ING
  WTF2:  { yahoo: null,        currency: "EUR" },  // Fondo Open

};
