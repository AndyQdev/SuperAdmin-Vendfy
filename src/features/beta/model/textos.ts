import type { EstadoActivacion, EstadoCohorte, EstadoIncidencia, Severidad } from "@/entities/beta/model/types";

/**
 * Los módulos del panel como los anota el backend (el primer tramo de la ruta
 * de la API) y como se leen acá. Uno que no esté se muestra tal cual.
 */
const MODULOS: Record<string, string> = {
  product: "Productos",
  products: "Productos",
  category: "Categorías",
  brand: "Marcas",
  inventory: "Inventario",
  "inventory-movements": "Movimientos",
  order: "Pedidos",
  orders: "Pedidos",
  caja: "Caja",
  customer: "Clientes",
  customers: "Clientes",
  "purchase-order": "Compras",
  store: "Tienda",
  stores: "Tienda",
  whatsapp: "WhatsApp",
  inbox: "WhatsApp",
  live: "Lives",
  promotion: "Promociones",
  promotions: "Promociones",
  omnibox: "Asistente IA",
  ai: "IA",
  voz: "Voz",
  reports: "Reportes",
  integrations: "Integraciones",
  review: "Reseñas",
  file: "Archivos",
  users: "Usuarios",
  "exchange-rate": "Dólar",
};

export const nombreModulo = (m: string) => MODULOS[m] ?? m;

export const ESTADO_COHORTE: Record<EstadoCohorte, { texto: string; clase: string }> = {
  planificada: { texto: "Planificada", clase: "bg-muted text-muted-foreground" },
  activa: { texto: "En curso", clase: "bg-success-soft text-success-soft-foreground" },
  cerrada: { texto: "Cerrada", clase: "bg-secondary text-secondary-foreground" },
};

export const ESTADO_ACTIVACION: Record<EstadoActivacion, { texto: string; clase: string }> = {
  activado: { texto: "Activado", clase: "bg-success-soft text-success-soft-foreground" },
  "en-plazo": { texto: "En plazo", clase: "bg-primary-soft text-primary-soft-foreground" },
  "no-activado": { texto: "No se activó", clase: "bg-warning-soft text-warning-soft-foreground" },
};

export const SEVERIDAD: Record<Severidad, { texto: string; clase: string }> = {
  critica: { texto: "Crítica", clase: "bg-destructive text-destructive-foreground" },
  alta: { texto: "Alta", clase: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  media: { texto: "Media", clase: "bg-warning-soft text-warning-soft-foreground" },
  baja: { texto: "Baja", clase: "bg-muted text-muted-foreground" },
};

export const ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = {
  abierta: "Abierta",
  "en-progreso": "En progreso",
  resuelta: "Resuelta",
  descartada: "Descartada",
};

const dia = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short" });
const diaAnio = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", year: "numeric" });
const conHora = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** "2026-11-08" (día sin hora) sin que la zona horaria lo corra al día anterior. */
export const fechaDia = (iso: string) => diaAnio.format(new Date(`${iso}T12:00:00`));
export const fechaCorta = (iso: string) => dia.format(new Date(iso));
export const fechaHora = (iso: string) => conHora.format(new Date(iso));

/** "hace 3 días", "hoy". */
export function hace(iso: string | null): string {
  if (!iso) return "nunca";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}
