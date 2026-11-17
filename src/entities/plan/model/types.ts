export type ClaveLimite = "tiendas" | "usuarios" | "consultasAsistente" | "facturas";
export type Limites = Partial<Record<ClaveLimite, number>>;

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioMensual: number;
  limites: Limites;
  funciones: string[];
  activo: boolean;
  orden: number;
  /** Negocios en este plan (los sin suscripción cuentan en el plan por defecto). */
  negocios: number;
  fundadores: number;
}

export interface CatalogoPlanes {
  funciones: { clave: string; nombre: string; descripcion: string }[];
  limites: { clave: ClaveLimite; nombre: string; unidad: string }[];
  planPorDefecto: string;
}

export interface DatosPlan {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  precioMensual: number;
  limites: Partial<Record<ClaveLimite, number | null>>;
  funciones: string[];
  activo?: boolean;
  orden?: number;
}

export interface Suscripcion {
  planId: string;
  plan: { codigo: string; nombre: string };
  precioMensual: number | null;
  precioPlan: number;
  fundador: boolean;
  desde: string | null;
  hasta: string | null;
  estado: "activa" | "suspendida";
  funcionesExtra: string[];
  funcionesQuitadas: string[];
  limitesExtra: Partial<Record<ClaveLimite, number | null>>;
  notas: string | null;
}

export interface MiembroNegocio {
  id: string;
  name: string;
  email: string;
  esDueno: boolean;
  activo: boolean;
  debeCambiarClave: boolean;
  rol: { id: string; name: string } | null;
  storeIds: string[];
}

export interface PlanDelNegocio {
  dueno: { id: string; name: string; email: string };
  suscripcion: Suscripcion | null;
  vigente: { plan: { codigo: string; nombre: string }; funciones: string[]; limites: Limites; suspendida: boolean };
  usado: Record<ClaveLimite, number>;
  equipo: MiembroNegocio[];
}

export interface DatosSuscripcion {
  planId: string;
  precioMensual?: number | null;
  fundador?: boolean;
  desde?: string | null;
  hasta?: string | null;
  estado?: "activa" | "suspendida";
  funcionesExtra?: string[];
  funcionesQuitadas?: string[];
  limitesExtra?: Partial<Record<ClaveLimite, number | null>>;
  notas?: string | null;
}
