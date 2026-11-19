import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useEjecucion, useEjecuciones, useGrafo } from "@/entities/workflow/api";
import {
  FILTROS_WORKFLOW_POR_DEFECTO,
  NOMBRE_CIERRE_PILOTO,
  NOMBRE_FLUJO,
  NOMBRE_FUENTE,
  NOMBRE_ORIGEN_PILOTO,
  type Ejecucion,
  type FlowId,
  type SnapshotPiloto,
} from "@/entities/workflow/model/types";
import { useFiltrosUrl } from "@/shared/hooks/use-filtros-url";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

import {
  ALTO_NODO,
  ANCHO_NODO,
  COLOR_POR_TIPO,
  NOMBRE_TIPO,
  calcularDisposicion,
} from "../model/layout";
import { NodeInspector } from "./NodeInspector";
import { NodoCard } from "./NodoCard";
import { PanelMetricas } from "./PanelMetricas";

/**
 * Una sesión del piloto de voz en una línea: cómo se abrió, en qué, y por qué
 * terminó (sale del `configSnapshot` que guarda el endpoint del panel).
 */
function resumenPiloto(ejecucion: Ejecucion): string {
  const s = (ejecucion.configSnapshot ?? {}) as Partial<SnapshotPiloto>;
  return [
    s.origen ? (NOMBRE_ORIGEN_PILOTO[s.origen] ?? s.origen) : null,
    s.plataforma ?? null,
    s.version ? `v${s.version}` : null,
    s.motivoCierre ? (NOMBRE_CIERRE_PILOTO[s.motivoCierre] ?? s.motivoCierre) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Los nodos modelo que invocan herramientas: el agente de WhatsApp y el agente del asistente (G7). */
const MODELOS_CON_HERRAMIENTAS = new Set(["llm_turn", "c4_agente_turno"]);

const tiposDeNodo = { vendfy: NodoCard };

export function WorkflowStudio() {
  const { filtros, setFiltro } = useFiltrosUrl(FILTROS_WORKFLOW_POR_DEFECTO, {
    reiniciar: "pagina",
    ignorar: ["tam"],
  });
  const flow = filtros.flow as FlowId;
  const enMetricas = filtros.vista === "metricas";

  const { data: grafo, isLoading: cargandoGrafo } = useGrafo(flow);
  const { data: listado } = useEjecuciones({
    flow: filtros.flow,
    estado: filtros.estado,
    source: filtros.source,
    pagina: filtros.pagina,
    tam: filtros.tam,
  });

  const [runId, setRunId] = useState<string | null>(null);
  const { data: cargada } = useEjecucion(runId);
  // Una ejecución de otro flujo no se muestra sobre este grafo (quedaba elegida al cambiar de flujo).
  const ejecucion = cargada && cargada.flow === flow ? cargada : undefined;

  /** Hasta qué paso se muestra encendido. null = el recorrido completo. */
  const [hastaPaso, setHastaPaso] = useState<number | null>(null);
  const [nodoElegido, setNodoElegido] = useState<string | null>(null);

  const pasosVisibles = useMemo(() => {
    if (!ejecucion) return [];
    return hastaPaso === null
      ? ejecucion.pasos
      : ejecucion.pasos.slice(0, hastaPaso);
  }, [ejecucion, hastaPaso]);

  const ejecutados = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const p of pasosVisibles) {
      cuenta.set(p.nodeId, (cuenta.get(p.nodeId) ?? 0) + 1);
    }
    return cuenta;
  }, [pasosVisibles]);

  const nodoActual = pasosVisibles.at(-1)?.nodeId ?? null;

  const { nodes, edges } = useMemo(() => {
    if (!grafo) return { nodes: [] as Node[], edges: [] as Edge[] };
    const { posiciones } = calcularDisposicion(grafo);

    const nodes: Node[] = grafo.nodos.map((n) => ({
      id: n.id,
      type: "vendfy",
      position: posiciones.get(n.id) ?? { x: 0, y: 0 },
      data: {
        nodo: n,
        veces: ejecutados.get(n.id) ?? 0,
        esActual: hastaPaso !== null && n.id === nodoActual,
        elegido: n.id === nodoElegido,
      },
      draggable: false,
      style: { width: ANCHO_NODO, height: ALTO_NODO },
    }));

    /**
     * Las 15 aristas modelo→herramienta se COLAPSAN a una por grupo.
     *
     * El registry declara la verdad completa (ida y vuelta por cada
     * herramienta), pero dibujar treinta líneas saliendo del mismo nodo no
     * comunica nada. Una por bloque, etiquetada "invoca ⇄ resultado", dice lo
     * mismo y se lee.
     */
    const vistas = new Set<string>();
    const edges: Edge[] = [];
    for (const a of grafo.aristas) {
      const nodoDestino = grafo.nodos.find((n) => n.id === a.to);
      const nodoOrigen = grafo.nodos.find((n) => n.id === a.from);
      const esToolDelModelo =
        (MODELOS_CON_HERRAMIENTAS.has(a.from) && nodoDestino?.kind === "tool") ||
        (MODELOS_CON_HERRAMIENTAS.has(a.to) && nodoOrigen?.kind === "tool");

      if (esToolDelModelo) {
        const modelo = MODELOS_CON_HERRAMIENTAS.has(a.from) ? a.from : a.to;
        const grupo = (nodoDestino?.kind === "tool" ? nodoDestino : nodoOrigen)!.group;
        const clave = `${modelo}::${grupo}`;
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        const representante = grafo.nodos.find(
          (n) => n.group === grupo && n.kind === "tool",
        )!;
        edges.push({
          id: clave,
          source: modelo,
          target: representante.id,
          label: "invoca ⇄ resultado",
          animated: ejecutados.has(representante.id),
          style: { stroke: "hsl(var(--border))" },
          labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
        });
        continue;
      }

      edges.push({
        id: `${a.from}->${a.to}`,
        source: a.from,
        target: a.to,
        label: a.label,
        animated: ejecutados.has(a.from) && ejecutados.has(a.to),
        style: { stroke: "hsl(var(--border))" },
        labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
      });
    }

    return { nodes, edges };
  }, [grafo, ejecutados, nodoActual, hastaPaso, nodoElegido]);

  function abrir(id: string) {
    setRunId(id);
    setHastaPaso(null);
    setNodoElegido(null);
  }

  return (
    <div className="flex h-[calc(100dvh-0px)] flex-col">
      {/* --- cabecera --- */}
      <header className="flex flex-wrap items-center gap-3 border-b bg-background px-6 py-4">
        <div className="mr-auto">
          <h1 className="text-xl font-bold">Workflow IA</h1>
          <p className="text-xs text-muted-foreground">
            El proceso de la IA, y cada turno que pasó por él
          </p>
        </div>

        {/* G8: el proceso (grafo) o cómo le va al asistente (métricas). */}
        <div className="flex rounded-md border p-0.5" role="tablist" aria-label="Vista">
          {(["grafo", "metricas"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={filtros.vista === v}
              data-testid={`workflow-vista-${v}`}
              onClick={() => setFiltro("vista", v)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium",
                filtros.vista === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {v === "grafo" ? "Grafo" : "Métricas"}
            </button>
          ))}
        </div>

        <Select value={filtros.flow} onValueChange={(v) => setFiltro("flow", v)}>
          <SelectTrigger className="w-[240px]" aria-label="Flujo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(NOMBRE_FLUJO) as FlowId[]).map((f) => (
              <SelectItem key={f} value={f}>
                {NOMBRE_FLUJO[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.estado}
          onValueChange={(v) => setFiltro("estado", v)}
        >
          <SelectTrigger className="w-[150px]" aria-label="Estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ok">Correctas</SelectItem>
            <SelectItem value="error">Con error</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {enMetricas ? (
        <PanelMetricas flow={flow} dias={Number(filtros.dias) || 7} onDias={(d) => setFiltro("dias", d)} />
      ) : (
      <div className="flex min-h-0 flex-1">
        {/* --- ejecuciones --- */}
        <aside className="flex w-72 shrink-0 flex-col border-r bg-background">
          <p className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ejecuciones {listado ? `(${listado.total})` : ""}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!listado &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mx-3 my-2 h-14" />
              ))}

            {listado?.items.length === 0 && (
              <p
                data-testid="workflow-sin-ejecuciones"
                className="p-6 text-center text-sm text-muted-foreground"
              >
                {flow === "piloto_voz"
                  ? "Todavía no hay sesiones del asistente de voz registradas."
                  : "Todavía no hay turnos registrados para este flujo."}
              </p>
            )}

            {listado?.items.map((r) => (
              <button
                key={r.id}
                data-testid="workflow-ejecucion"
                onClick={() => abrir(r.id)}
                className={cn(
                  "block w-full border-b px-4 py-3 text-left transition-colors hover:bg-accent",
                  runId === r.id && "bg-accent",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      r.estado === "ok" ? "bg-emerald-500" : "bg-red-500",
                    )}
                  />
                  <span className="truncate text-sm font-medium">
                    {r.entrada ?? "(sin texto)"}
                  </span>
                </div>
                {/* Lo que se le contestó (G7f): sin esto había que abrir cada turno para saberlo. */}
                {r.salida ? (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/70">{r.salida}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {NOMBRE_FUENTE[r.source] ?? r.source} · {r.pasos} pasos ·{" "}
                  {(r.totalMs / 1000).toFixed(1)}s
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {r.tienda?.nombre ?? "—"} ·{" "}
                  {new Date(r.creado).toLocaleString("es-BO", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))}
          </div>
        </aside>

        {/* --- lienzo --- */}
        <main className="relative min-w-0 flex-1 bg-muted/20">
          {cargandoGrafo ? (
            <Skeleton className="m-6 h-[80%]" />
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={tiposDeNodo}
              fitView
              minZoom={0.2}
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_, n) => setNodoElegido(n.id)}
              data-testid="workflow-lienzo"
            >
              <Background gap={18} size={1} />
              <Controls showInteractive={false} position="top-left" />
            </ReactFlow>
          )}

          {/* leyenda de tipos */}
          <div className="pointer-events-none absolute right-3 top-3 space-y-1 rounded-md border bg-background/90 px-3 py-2 text-[11px] backdrop-blur">
            {(Object.keys(NOMBRE_TIPO) as (keyof typeof NOMBRE_TIPO)[]).map(
              (tipo) => (
                <div key={tipo} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: COLOR_POR_TIPO[tipo].borde }}
                  />
                  {NOMBRE_TIPO[tipo]}
                </div>
              ),
            )}
          </div>

          {/* reproductor */}
          {ejecucion && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-lg">
              <Button
                variant="outline"
                size="sm"
                disabled={hastaPaso !== null && hastaPaso <= 1}
                onClick={() =>
                  setHastaPaso((p) =>
                    p === null ? ejecucion.pasos.length - 1 : Math.max(1, p - 1),
                  )
                }
              >
                Anterior
              </Button>
              <span className="min-w-[90px] text-center text-xs tabular-nums text-muted-foreground">
                paso {hastaPaso ?? ejecucion.pasos.length} de{" "}
                {ejecucion.pasos.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={hastaPaso === null}
                onClick={() =>
                  setHastaPaso((p) =>
                    p === null || p >= ejecucion.pasos.length
                      ? null
                      : p + 1 >= ejecucion.pasos.length
                        ? null
                        : p + 1,
                  )
                }
              >
                Siguiente
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHastaPaso(hastaPaso === null ? 1 : null)}
              >
                {hastaPaso === null ? "Paso a paso" : "Ver todo"}
              </Button>
              {/* El piloto no tiene modelo propio: se muestra cómo se abrió y por qué terminó. */}
              {ejecucion.flow === "piloto_voz" ? (
                <Badge variant="outline" className="ml-1 whitespace-nowrap" data-testid="workflow-sesion-piloto">
                  {resumenPiloto(ejecucion)}
                </Badge>
              ) : ejecucion.proveedor || ejecucion.modelo ? (
                <Badge variant="outline" className="ml-1">
                  {ejecucion.proveedor}/{ejecucion.modelo}
                </Badge>
              ) : null}
            </div>
          )}
        </main>

        {/* --- inspector --- */}
        <NodeInspector
          grafo={grafo}
          ejecucion={ejecucion}
          nodeId={nodoElegido ?? nodoActual}
          hastaPaso={hastaPaso}
        />
      </div>
      )}
    </div>
  );
}
