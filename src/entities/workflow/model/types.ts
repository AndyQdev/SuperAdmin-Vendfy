/**
 * Espejo del contrato de `/api/admin/workflow/*`.
 *
 * Las definiciones viven en `ventas-service/src/agent/workflow/node-registry.ts`.
 * Si cambian allá, cambian acá: no hay generación automática que los mantenga
 * sincronizados, y ese es el primer lugar donde mirar si el grafo se ve raro.
 */
export type FlowId = "agente_whatsapp" | "omnibox_comerciante" | "piloto_voz";

/** Cómo se llama cada flujo en el selector del Studio. */
export const NOMBRE_FLUJO: Record<FlowId, string> = {
  agente_whatsapp: "Agente de WhatsApp",
  omnibox_comerciante: "Omnibox del comerciante",
  piloto_voz: "Piloto de voz («Oye Vendfy»)",
};

/**
 * Lo que el panel guarda de cada sesión del piloto de voz en el
 * `configSnapshot` (POST /api/omnibox/piloto/sesion). El piloto no tiene
 * proveedor ni modelo propios: eso va en la traza del omnibox.
 */
export interface SnapshotPiloto {
  sesion: string | null;
  origen: "palabra" | "atajo" | "boton" | "teclado" | null;
  plataforma: "windows" | "android" | "web" | null;
  version: string | null;
  motivoCierre: string;
  eventos: number;
}

export const NOMBRE_ORIGEN_PILOTO: Record<string, string> = {
  palabra: "«Oye Vendfy»",
  atajo: "F9",
  boton: "Botón",
  teclado: "Teclado",
};

export const NOMBRE_CIERRE_PILOTO: Record<string, string> = {
  terminado: "Terminó lo pedido",
  sin_respuesta: "No contestó a tiempo",
  cerrado: "La cerró la persona",
  error: "Error",
  al_asistente: "Pasó al Asistente",
  falsa_alarma: "Falsa alarma",
  otro: "Se cerró",
};

export type NodeKind = "io" | "llm" | "tool" | "rule";

export interface WorkflowNode {
  id: string;
  kind: NodeKind;
  flow: FlowId;
  label: string;
  description: string;
  group: string;
  source?: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface WorkflowGroup {
  id: string;
  label: string;
  description: string;
}

export interface Grafo {
  flow: FlowId;
  nodos: WorkflowNode[];
  aristas: WorkflowEdge[];
  grupos: WorkflowGroup[];
}

export interface EjecucionResumen {
  id: string;
  flow: string;
  source: string;
  tienda: { id: string; nombre: string } | null;
  entrada: string | null;
  salida: string | null;
  estado: "ok" | "error";
  pasos: number;
  totalMs: number;
  tokens: { entrada: number; salida: number };
  proveedor: string | null;
  modelo: string | null;
  creado: string;
}

export interface PasoEjecucion {
  seq: number;
  nodeId: string;
  etiqueta: string;
  tipo: NodeKind;
  descripcion: string | null;
  grupo: string | null;
  entrada: unknown;
  salida: unknown;
  nota: string | null;
  estado: "ok" | "error";
  ms: number;
}

/**
 * El detalle NO extiende el resumen: allá `pasos` es el conteo y acá es el
 * array. Heredarlo obligaría a un nombre distinto para lo mismo, y el array es
 * el nombre natural en el detalle.
 */
export interface Ejecucion extends Omit<EjecucionResumen, "pasos"> {
  configSnapshot: Record<string, unknown> | null;
  error: string | null;
  pasos: PasoEjecucion[];
}

export interface ListadoEjecuciones {
  items: EjecucionResumen[];
  total: number;
  pagina: number;
  tam: number;
}

export const NOMBRE_FUENTE: Record<string, string> = {
  whatsapp: "Cliente real",
  sandbox: "Chat de prueba",
  studio: "Este panel",
  panel: "Panel del comercio",
};

export const FILTROS_WORKFLOW_POR_DEFECTO = {
  flow: "agente_whatsapp",
  estado: "todos",
  source: "todos",
  pagina: 1,
  tam: 25,
  /** "grafo" (el Studio) o "metricas" (G8: cómo le va al asistente). */
  vista: "grafo",
  dias: 7,
};

/** Espejo de `GET /api/admin/workflow/metricas` (G8 · OE-7). */
export interface MetricasAsistente {
  periodo: { dias: number; desde: string };
  frases: number;
  confirmaciones: number;
  errores: number;
  latencia: { p50: number; p90: number; p99: number };
  porRuta: { ruta: string; n: number; pct: number; p50: number; p90: number }[];
  agente: { n: number; pct: number; porMotivo: { valor: string; n: number }[]; herramientas: { valor: string; n: number }[] };
  callejones: { n: number; pct: number; ejemplos: { entrada: string | null; salida: string | null; tienda: string | null; fecha: string }[] };
  noEncontrados: number;
  intenciones: { valor: string; n: number }[];
  porTienda: { valor: string; n: number }[];
  porDia: { dia: string; n: number; agente: number; callejones: number; errores: number }[];
}
