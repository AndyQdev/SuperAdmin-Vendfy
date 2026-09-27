/**
 * Espejo del contrato de `/api/admin/workflow/*`.
 *
 * Las definiciones viven en `ventas-service/src/agent/workflow/node-registry.ts`.
 * Si cambian allá, cambian acá: no hay generación automática que los mantenga
 * sincronizados, y ese es el primer lugar donde mirar si el grafo se ve raro.
 */
export type FlowId = "agente_whatsapp" | "omnibox_comerciante";
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
};
