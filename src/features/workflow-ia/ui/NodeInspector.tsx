import { useState } from "react";
import { ChevronRight, MousePointerClick } from "lucide-react";

import type { Ejecucion, Grafo } from "@/entities/workflow/model/types";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";

import { NOMBRE_TIPO } from "../model/layout";

/**
 * El panel de la derecha. Responde tres preguntas, en este orden:
 *
 * 1. Qué ES el nodo — siempre, aunque no se haya ejecutado nunca.
 * 2. Cuántas veces se ejecutó en el turno abierto.
 * 3. Qué pasó en cada pasada, en castellano ANTES del JSON.
 *
 * El orden importa: quien abre esto casi nunca sabe qué hace el nodo, y
 * arrancar por el JSON obliga a deducirlo.
 */
export function NodeInspector({
  grafo,
  ejecucion,
  nodeId,
  hastaPaso,
}: {
  grafo: Grafo | undefined;
  ejecucion: Ejecucion | undefined;
  nodeId: string | null;
  hastaPaso: number | null;
}) {
  const nodo = grafo?.nodos.find((n) => n.id === nodeId);

  if (!nodo) {
    return (
      <aside className="hidden w-80 shrink-0 border-l bg-background xl:block">
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
          <MousePointerClick className="h-8 w-8 opacity-40" />
          <p>Elegí un nodo del lienzo para ver qué hace y qué pasó en él.</p>
        </div>
      </aside>
    );
  }

  const pasos = (ejecucion?.pasos ?? [])
    .filter((p) => p.nodeId === nodo.id)
    .filter((p) => hastaPaso === null || p.seq <= hastaPaso);

  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background xl:block">
      <div className="space-y-4 p-4">
        {/* 1. qué es */}
        <div>
          <Badge variant="outline" className="mb-2 text-[10px]">
            {NOMBRE_TIPO[nodo.kind]}
          </Badge>
          <h2 className="text-base font-semibold">{nodo.label}</h2>
          <p className="font-mono text-[11px] text-muted-foreground">{nodo.id}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {nodo.description}
          </p>
          {nodo.source && (
            <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">
              {nodo.source}
            </p>
          )}
        </div>

        {/* 2. cuántas veces */}
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          {!ejecucion ? (
            <span className="text-muted-foreground">
              Abrí una ejecución para ver qué pasó acá.
            </span>
          ) : pasos.length === 0 ? (
            <span className="text-muted-foreground">
              No se ejecutó en este turno.
            </span>
          ) : (
            <span>
              Se ejecutó <strong>{pasos.length}</strong>{" "}
              {pasos.length === 1 ? "vez" : "veces"} en este turno.
            </span>
          )}
        </div>

        {/* 3. qué pasó en cada pasada */}
        {pasos.map((paso) => {
          const siguiente = ejecucion?.pasos.find((p) => p.seq === paso.seq + 1);
          return (
            <div key={paso.seq} className="rounded-md border p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Paso {paso.seq}</span>
                <span className="tabular-nums">{paso.ms} ms</span>
              </div>

              {paso.nota && <p className="mt-1 text-sm">{paso.nota}</p>}

              <Plegable titulo="Entrada" valor={paso.entrada} />
              <Plegable titulo="Salida" valor={paso.salida} />

              {siguiente && (
                <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
                  Esta salida siguió a → <strong>{siguiente.etiqueta}</strong>{" "}
                  (paso {siguiente.seq})
                </p>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/**
 * El JSON va plegado.
 *
 * Desplegado empuja fuera de pantalla la explicación en castellano, que es lo
 * que de verdad se lee. Quien necesita el crudo lo abre.
 */
function Plegable({ titulo, valor }: { titulo: string; valor: unknown }) {
  const [abierto, setAbierto] = useState(false);
  if (valor === null || valor === undefined) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", abierto && "rotate-90")}
        />
        {titulo}
      </button>
      {abierto && (
        <pre className="mt-1 max-h-56 overflow-auto rounded bg-muted p-2 text-[10px] leading-relaxed">
          {JSON.stringify(valor, null, 2)}
        </pre>
      )}
    </div>
  );
}
