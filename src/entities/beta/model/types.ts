/**
 * El Programa beta. Espejo de `ecomerce-backend/src/beta/services/admin-beta.service.ts`
 * y de `src/beta/model/metricas-beta.ts`: si cambia allá, cambia acá.
 */

export interface MetasCohorte {
  diasActivacion: number;
  productosMinimos: number;
  metaActivacion: number;
  metaRetencionSemana4: number;
  /** SUS promedio esperado (68 = promedio de la industria). */
  metaSus: number;
}

export type EstadoCohorte = "planificada" | "activa" | "cerrada";

export interface Cohorte {
  id: string;
  nombre: string;
  descripcion: string | null;
  /** YYYY-MM-DD */
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoCohorte;
  metas: MetasCohorte;
  participantes: number;
  consentidos: number;
  incidenciasAbiertas: number;
}

export interface HitosNegocio {
  inscrito: string;
  tiendaCreada: string;
  consentimiento: string | null;
  configurada: boolean;
  primerProducto: string | null;
  catalogoCargado: string | null;
  primeraVenta: string | null;
  primeraVentaEnLinea: string | null;
}

export type EstadoActivacion = "activado" | "no-activado" | "en-plazo";

export interface ParticipanteBeta {
  storeId: string;
  nombre: string;
  slug: string;
  propietario: string | null;
  propietarioEmail: string | null;
  hitos: HitosNegocio;
  activacion: { estado: EstadoActivacion; dias: number | null; quedan?: number };
  productos: number;
  ventas: number;
  diasActivos7: number;
  ultimaActividad: string | null;
  modulos: Record<string, number>;
  incidenciasAbiertas: number;
  notas: string | null;
  /** Su última respuesta: SUS de 0 a 100 y NPS de 0 a 10. */
  sus: number | null;
  nps: number | null;
}

export interface ResumenSus {
  n: number;
  promedio: number | null;
  adjetivo: string | null;
}

export interface ResumenNps {
  n: number;
  promotores: number;
  pasivos: number;
  detractores: number;
  valor: number | null;
}

export interface TableroCohorte {
  cohorte: Cohorte;
  kpis: {
    participantes: number;
    consentidos: number;
    activados: number;
    enPlazo: number;
    noActivados: number;
    tasaActivacion: number | null;
    medianaDiasActivacion: number | null;
    activosUltimos7: number;
    incidenciasAbiertas: number;
  };
  embudo: Array<{ id: keyof HitosNegocio | "inscrito"; nombre: string; negocios: number; porcentaje: number }>;
  retencion: Array<{ semana: number; elegibles: number; activos: number; porcentaje: number | null }>;
  satisfaccion: {
    sus: ResumenSus;
    nps: ResumenNps;
    porMomento: Array<{ momento: "dia14" | "cierre"; sus: ResumenSus; nps: ResumenNps }>;
    comentarios: Array<{ storeId: string; nps: number; momento: string; comentario: string; creada: string }>;
  };
  incidencias: {
    total: number;
    abiertas: number;
    resueltas: number;
    descartadas: number;
    gravesAbiertas: number;
    diasPromedioResolucion: number | null;
    porSeveridad: Record<"critica" | "alta" | "media" | "baja", number>;
  };
  metas: Array<{ id: string; nombre: string; meta: number; valor: number | null; cumple: boolean | null }>;
  participantes: ParticipanteBeta[];
}

export interface NuevaCohorte {
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  metas?: Partial<MetasCohorte>;
}

export type CambioCohorte = Partial<Omit<NuevaCohorte, "fechaFin">> & {
  fechaFin?: string | null;
  estado?: EstadoCohorte;
};

export interface ResultadoAgregar {
  agregados: number;
  yaEstaban: Array<{ storeId: string; nombre: string; cohorte: string; mismaCohorte: boolean }>;
  noExisten: string[];
}

export type Severidad = "baja" | "media" | "alta" | "critica";
export type EstadoIncidencia = "abierta" | "en-progreso" | "resuelta" | "descartada";

export interface Incidencia {
  id: string;
  storeId: string;
  negocio: string;
  cohorte: string | null;
  autor: string | null;
  titulo: string;
  descripcion: string | null;
  severidad: Severidad;
  estado: EstadoIncidencia;
  origen: "comercio" | "equipo";
  modulo: string | null;
  url: string | null;
  notas: string | null;
  creada: string;
  resuelta: string | null;
}

export interface Sugerencia {
  id: string;
  storeId: string;
  negocio: string;
  cohorte: string | null;
  autor: string | null;
  tipo: "comentario" | "sus" | "nps";
  puntaje: number | null;
  comentario: string | null;
  modulo: string | null;
  url: string | null;
  creada: string;
}

export interface Reportes {
  incidencias: Incidencia[];
  sugerencias: Sugerencia[];
}

export interface FiltrosReportes {
  cohorteId?: string;
  storeId?: string;
  estado?: EstadoIncidencia | "pendientes" | "todas";
}

export interface FilaComparacion {
  cohorte: Pick<Cohorte, "id" | "nombre" | "estado" | "fechaInicio" | "fechaFin">;
  participantes: number;
  tasaActivacion: number | null;
  medianaDiasActivacion: number | null;
  /** % de uso en las semanas 1 a 4 (null: nadie llegó). */
  retencion: Array<number | null>;
  sus: number | null;
  nps: number | null;
  incidencias: number;
  diasPromedioResolucion: number | null;
  metasCumplidas: number;
  metasEvaluadas: number;
}

export interface BetaDeNegocio {
  cohorte: Cohorte | null;
  participante: ParticipanteBeta | null;
  reportes: Reportes;
}
