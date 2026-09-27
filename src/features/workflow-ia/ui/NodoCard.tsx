import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { WorkflowNode } from "@/entities/workflow/model/types";
import { cn } from "@/shared/lib/cn";

import { COLOR_POR_TIPO, NOMBRE_TIPO } from "../model/layout";

interface Datos {
  nodo: WorkflowNode;
  /** Cuántas veces se ejecutó en el turno abierto. 0 = no se ejecutó. */
  veces: number;
  esActual: boolean;
  elegido: boolean;
}

/**
 * La tarjeta de un nodo.
 *
 * El color del BORDE superior siempre es el del tipo, aunque la card esté
 * encendida en verde: si no, al recorrer una ejecución se pierde de vista qué
 * es cada paso, que es la mitad de la información.
 */
export function NodoCard({ data }: NodeProps) {
  const { nodo, veces, esActual, elegido } = data as unknown as Datos;
  const color = COLOR_POR_TIPO[nodo.kind];
  const ejecutado = veces > 0;

  return (
    <div
      data-testid="workflow-nodo"
      data-node-id={nodo.id}
      data-ejecutado={ejecutado}
      className={cn(
        "h-full w-full overflow-hidden rounded-lg border-2 bg-background px-2.5 py-1.5 shadow-sm transition-colors",
        esActual && "ring-2 ring-emerald-400 ring-offset-1",
        elegido && !esActual && "ring-2 ring-primary/40",
      )}
      style={{
        borderColor: ejecutado ? "#34d399" : color.borde,
        background: ejecutado ? "#34d39929" : color.fondo,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />

      <p
        className="truncate text-[9px] font-semibold uppercase tracking-wider"
        style={{ color: color.texto }}
      >
        {NOMBRE_TIPO[nodo.kind]}
        {veces > 1 && ` · ${veces}×`}
      </p>
      <p className="truncate text-[13px] font-medium leading-tight">{nodo.label}</p>
      <p className="truncate text-[10px] text-muted-foreground">{nodo.id}</p>

      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
    </div>
  );
}
