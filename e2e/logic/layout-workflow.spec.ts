import { expect, test } from "@playwright/test";

import {
  ALTO_NODO,
  ANCHO_NODO,
  calcularDisposicion,
  haySolapamiento,
} from "../../src/features/workflow-ia/model/layout";
import type { Grafo } from "../../src/entities/workflow/model/types";

/**
 * La geometría del lienzo.
 *
 * Esto se verifica y no se mira: el grafo crece con cada nodo que alguien
 * agrega en el backend, y nadie va a revisar a ojo veinte tarjetas cada vez
 * para ver si dos quedaron encimadas.
 */
const grafo: Grafo = {
  flow: "agente_whatsapp",
  grupos: [
    { id: "entrada", label: "Entrada", description: "" },
    { id: "razonamiento", label: "Razonamiento", description: "" },
    { id: "catalogo", label: "Catálogo", description: "" },
    { id: "carrito", label: "Carrito", description: "" },
    { id: "validacion", label: "Reglas", description: "" },
    { id: "salida", label: "Salida", description: "" },
  ],
  aristas: [],
  nodos: [
    ...["in_mensaje", "in_contexto", "in_historial", "in_prompt"].map((id) => n(id, "io", "entrada")),
    n("llm_turn", "llm", "razonamiento"),
    ...["search_products", "get_product", "get_store_info"].map((id) => n(id, "tool", "catalogo")),
    ...["add_to_cart", "view_cart"].map((id) => n(id, "tool", "carrito")),
    ...["rule_a", "rule_b"].map((id) => n(id, "rule", "validacion")),
    n("out_respuesta", "io", "salida"),
  ],
};

function n(id: string, kind: any, group: string) {
  return {
    id,
    kind,
    flow: "agente_whatsapp" as const,
    label: id,
    description: "x".repeat(30),
    group,
  };
}

test("todos los nodos reciben posición", () => {
  const { posiciones } = calcularDisposicion(grafo);
  expect(posiciones.size).toBe(grafo.nodos.length);
});

test("ningún nodo se encima con otro", () => {
  const { posiciones } = calcularDisposicion(grafo);
  const lista = [...posiciones.values()];

  const encimados: string[] = [];
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      if (haySolapamiento(lista[i], lista[j])) {
        encimados.push(`${lista[i].id} ↔ ${lista[j].id}`);
      }
    }
  }
  expect(encimados).toEqual([]);
});

test("los bloques de herramientas van en UNA sola columna", () => {
  // Repartirlos a los dos lados del modelo hace que las aristas crucen por
  // encima de los nodos de la izquierda. Es el error que glow tuvo que deshacer.
  const { posiciones } = calcularDisposicion(grafo);
  const xsDeTools = new Set(
    grafo.nodos
      .filter((nodo) => nodo.kind === "tool")
      .map((nodo) => posiciones.get(nodo.id)!.x),
  );
  expect(xsDeTools.size).toBe(1);
});

test("el orden de las columnas respeta el flujo del proceso", () => {
  const { posiciones } = calcularDisposicion(grafo);
  const x = (id: string) => posiciones.get(id)!.x;

  expect(x("in_mensaje")).toBeLessThan(x("llm_turn"));
  expect(x("llm_turn")).toBeLessThan(x("search_products"));
  expect(x("search_products")).toBeLessThan(x("rule_a"));
  expect(x("rule_a")).toBeLessThan(x("out_respuesta"));
});

test("cada caja de grupo contiene a sus nodos", () => {
  const { posiciones, cajas } = calcularDisposicion(grafo);

  for (const caja of cajas) {
    const suyos = grafo.nodos.filter((nodo) => nodo.group === caja.id);
    for (const nodo of suyos) {
      const p = posiciones.get(nodo.id)!;
      expect(p.x).toBeGreaterThanOrEqual(caja.x);
      expect(p.y).toBeGreaterThanOrEqual(caja.y);
      expect(p.x + ANCHO_NODO).toBeLessThanOrEqual(caja.x + caja.ancho);
      expect(p.y + ALTO_NODO).toBeLessThanOrEqual(caja.y + caja.alto);
    }
  }
});

test("la disposición es estable entre llamadas", () => {
  // Si cambia entre renders, el lienzo salta solo mientras se lo mira.
  const a = calcularDisposicion(grafo).posiciones;
  const b = calcularDisposicion(grafo).posiciones;
  for (const [id, p] of a) {
    expect(b.get(id)).toEqual(p);
  }
});

/**
 * El piloto de voz («Oye Vendfy»): cinco grupos, uno por columna, en el orden
 * de la sesión. Sin columnas propias caían todos en la de herramientas, uno
 * debajo del otro, y el ciclo escucha → pregunta → escucha no se leía.
 */
const piloto: Grafo = {
  flow: "piloto_voz",
  grupos: [
    { id: "p_entrada", label: "Se abre y escucha", description: "" },
    { id: "p_servidor", label: "Servidor", description: "" },
    { id: "p_piloto", label: "El piloto decide", description: "" },
    { id: "p_pantalla", label: "Pantalla", description: "" },
    { id: "p_salida", label: "Habla y se cierra", description: "" },
  ],
  aristas: [],
  nodos: [
    ...["p_apertura", "p_escucha", "p_sin_voz"].map((id) => np(id, "io", "p_entrada")),
    ...["p_transcripcion", "p_palabra_rescatada", "p_interpretacion"].map((id) => np(id, "llm", "p_servidor")),
    ...["p_respuesta_corta", "p_repregunta", "p_plan"].map((id) => np(id, "rule", "p_piloto")),
    ...["p_pantalla", "p_llena", "p_pregunta", "p_guarda"].map((id) => np(id, "tool", "p_pantalla")),
    ...["p_asistente", "p_habla", "p_error", "p_cierre"].map((id) => np(id, "io", "p_salida")),
  ],
};

function np(id: string, kind: any, group: string) {
  return { ...n(id, kind, group), flow: "piloto_voz" as const };
}

test("el piloto de voz: un grupo por columna, en el orden de la sesión, sin encimarse", () => {
  const { posiciones } = calcularDisposicion(piloto);
  expect(posiciones.size).toBe(piloto.nodos.length);
  const x = (id: string) => posiciones.get(id)!.x;

  expect(x("p_apertura")).toBeLessThan(x("p_transcripcion"));
  expect(x("p_transcripcion")).toBeLessThan(x("p_plan"));
  expect(x("p_plan")).toBeLessThan(x("p_pantalla"));
  expect(x("p_pantalla")).toBeLessThan(x("p_cierre"));

  const lista = [...posiciones.values()];
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      expect(haySolapamiento(lista[i], lista[j]), `${lista[i].id} ↔ ${lista[j].id}`).toBe(false);
    }
  }
});
