import type { Grafo, NodeKind, WorkflowNode } from "@/entities/workflow/model/types";

/**
 * Dónde va cada nodo en el lienzo.
 *
 * Las posiciones se CALCULAN, no se guardan. El grafo vive en el código del
 * backend; unas coordenadas fijas se desincronizarían la primera vez que
 * alguien agregue un nodo, y quedaría flotando encima de otro sin que nadie lo
 * note hasta abrirlo.
 *
 * El módulo es puro —no importa React ni @xyflow— para poder probar la
 * geometría sin navegador: que no haya solapamientos es una propiedad que se
 * verifica, no que se mira.
 */

export const ANCHO_NODO = 190;
export const ALTO_NODO = 74;

const SEPARACION_X = 280;
const SEPARACION_Y = 96;

/** Orden de las columnas. Lo que no esté acá cae en la de herramientas. */
const COLUMNAS: Record<string, number> = {
  entrada: 0,
  razonamiento: 1,
  catalogo: 2,
  carrito: 2,
  pedido: 2,
  mensajeria: 2,
  validacion: 3,
  salida: 4,
  // El piloto de voz: un grupo por columna, en el orden de la sesión.
  p_entrada: 0,
  p_servidor: 1,
  p_piloto: 2,
  p_pantalla: 3,
  p_salida: 4,
};

export interface Posicion {
  id: string;
  x: number;
  y: number;
}

export interface CajaGrupo {
  id: string;
  label: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface Disposicion {
  posiciones: Map<string, Posicion>;
  cajas: CajaGrupo[];
  ancho: number;
  alto: number;
}

/**
 * Los cuatro bloques de herramientas van en UNA sola columna, apilados.
 *
 * Repartirlos en dos bandas a los costados del modelo se ve más equilibrado
 * pero es ilegible: como todos cuelgan del mismo nodo, las aristas hacia la
 * banda derecha cruzan por encima de los nodos de la izquierda. Es el error que
 * glow tuvo que deshacer.
 */
export function calcularDisposicion(grafo: Grafo): Disposicion {
  const porGrupo = new Map<string, WorkflowNode[]>();
  for (const nodo of grafo.nodos) {
    const lista = porGrupo.get(nodo.group) ?? [];
    lista.push(nodo);
    porGrupo.set(nodo.group, lista);
  }

  // Los grupos, ordenados por columna y después por su orden en el grafo: así
  // el apilado es estable entre renders y entre despliegues.
  const grupos = [...porGrupo.keys()].sort((a, b) => {
    const ca = COLUMNAS[a] ?? 2;
    const cb = COLUMNAS[b] ?? 2;
    if (ca !== cb) return ca - cb;
    return a.localeCompare(b);
  });

  const posiciones = new Map<string, Posicion>();
  const cajas: CajaGrupo[] = [];
  const siguienteYPorColumna = new Map<number, number>();

  for (const grupo of grupos) {
    const nodos = porGrupo.get(grupo)!;
    const columna = COLUMNAS[grupo] ?? 2;
    const x = columna * SEPARACION_X;
    const y = siguienteYPorColumna.get(columna) ?? 0;

    nodos.forEach((nodo, i) => {
      posiciones.set(nodo.id, {
        id: nodo.id,
        x,
        y: y + i * SEPARACION_Y,
      });
    });

    const alto = nodos.length * SEPARACION_Y;
    cajas.push({
      id: grupo,
      label: grafo.grupos.find((g) => g.id === grupo)?.label ?? grupo,
      x: x - 16,
      y: y - 34,
      ancho: ANCHO_NODO + 32,
      alto: alto + 44,
    });

    // 72 px entre bloques: menos y las cajas se tocan y parecen una sola.
    siguienteYPorColumna.set(columna, y + alto + 72);
  }

  const ancho = Math.max(...[...posiciones.values()].map((p) => p.x)) + ANCHO_NODO;
  const alto = Math.max(...[...posiciones.values()].map((p) => p.y)) + ALTO_NODO;

  return { posiciones, cajas, ancho, alto };
}

/**
 * ¿Se solapan dos nodos?
 *
 * Existe para el test: la validación de que el lienzo es legible tiene que ser
 * automática, porque el grafo crece y nadie va a revisar a ojo veinte nodos
 * cada vez.
 */
export function haySolapamiento(a: Posicion, b: Posicion): boolean {
  return (
    Math.abs(a.x - b.x) < ANCHO_NODO && Math.abs(a.y - b.y) < ALTO_NODO
  );
}

/** El color de cada tipo de nodo. Se usa en la card y en la leyenda. */
export const COLOR_POR_TIPO: Record<NodeKind, { borde: string; fondo: string; texto: string }> = {
  io: { borde: "#94a3b8", fondo: "#94a3b81a", texto: "#475569" },
  llm: { borde: "#8b5cf6", fondo: "#8b5cf61a", texto: "#6d28d9" },
  tool: { borde: "#3d87f5", fondo: "#3d87f51a", texto: "#1d4ed8" },
  rule: { borde: "#f59e0b", fondo: "#f59e0b1a", texto: "#b45309" },
};

export const NOMBRE_TIPO: Record<NodeKind, string> = {
  io: "Entrada/Salida",
  llm: "Modelo",
  tool: "Herramienta",
  rule: "Regla del sistema",
};
