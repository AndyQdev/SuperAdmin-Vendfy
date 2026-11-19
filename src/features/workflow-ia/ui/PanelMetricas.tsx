import { AlertTriangle, Bot, Clock, MessagesSquare, XCircle } from "lucide-react";

import { useMetricas } from "@/entities/workflow/api";
import type { FlowId, MetricasAsistente } from "@/entities/workflow/model/types";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

/** Cómo se llama cada ruta para quien mira (las capas del documento de tesis). */
const NOMBRE_RUTA: Record<string, string> = {
  codigo: "C0 · Código de barras",
  router: "C1 · Router (acciones)",
  mesa: "C1 · Venta y compra",
  analisis: "C2 · Análisis",
  herramienta: "N3 · Herramienta a medida",
  agente: "C4 · Agente",
  error: "Error",
};

const NOMBRE_MOTIVO: Record<string, string> = {
  no_encaja: "No encajaba en ninguna acción",
  duda: "El router dudaba",
  sin_ejecutor: "Acción sin ejecutor fijo",
  callejon: "Iba a ser un callejón",
  conversar: "Conversación o varias cosas",
  formulario: "Completar un formulario",
};

const segundos = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/**
 * G8 · OE-7: cómo le va al asistente, desde las trazas. Lo que importa medir
 * es lo que G7 vino a sacar —los callejones ("no entendí", "todavía no sé
 * hacerlo")— y lo que cuesta resolverlo: cuántas frases van al agente y
 * cuánto tardan. Los callejones se listan para leerlos, no solo contarlos.
 */
export function PanelMetricas({ flow, dias, onDias }: { flow: FlowId; dias: number; onDias: (d: number) => void }) {
  // Las métricas por capa (rutas, agente, callejones) salen de los pasos del
  // omnibox: para los otros flujos no se piden, darían todo en cero.
  const { data: m, isLoading } = useMetricas(flow, dias, flow === "omnibox_comerciante");

  if (flow !== "omnibox_comerciante") {
    return (
      <p data-testid="workflow-metricas-no-aplica" className="p-8 text-sm text-muted-foreground">
        Las métricas por capa son del asistente del comercio: elige «Omnibox del comerciante».
        {flow === "piloto_voz" && " Las sesiones del piloto de voz se revisan una por una en la vista Grafo."}
      </p>
    );
  }

  return (
    <div data-testid="workflow-metricas" className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm text-muted-foreground">
            Frases del asistente en los últimos {dias} días{m ? ` · ${m.frases} frases y ${m.confirmaciones} confirmaciones` : ""}
          </p>
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDias(d)}
              className={cn("rounded-md border px-3 py-1.5 text-xs font-medium", d === dias ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent")}
            >
              {d === 1 ? "Hoy" : `${d} días`}
            </button>
          ))}
        </div>

        {isLoading || !m ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : m.frases === 0 ? (
          <p className="rounded-lg border bg-background p-8 text-center text-sm text-muted-foreground">No hubo frases en este período.</p>
        ) : (
          <Contenido m={m} />
        )}
      </div>
    </div>
  );
}

function Contenido({ m }: { m: MetricasAsistente }) {
  const maxRuta = Math.max(...m.porRuta.map((r) => r.n), 1);
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icono={MessagesSquare} titulo="Frases" valor={String(m.frases)} detalle={`${m.noEncontrados} con «no encontré»`} />
        <Kpi icono={AlertTriangle} titulo="Callejones" valor={`${m.callejones.pct} %`} detalle={`${m.callejones.n} sin salida`} alerta={m.callejones.n > 0} />
        <Kpi icono={Bot} titulo="Las resolvió el agente" valor={`${m.agente.pct} %`} detalle={`${m.agente.n} frases`} />
        <Kpi icono={Clock} titulo="Tiempo de respuesta" valor={segundos(m.latencia.p50)} detalle={`9 de cada 10 en menos de ${segundos(m.latencia.p90)}`} />
      </div>

      <section className="rounded-lg border bg-background p-5">
        <h2 className="text-sm font-semibold">Por dónde se resolvió cada frase</h2>
        <p className="mb-4 text-xs text-muted-foreground">Mediana y percentil 90 del tiempo de cada camino</p>
        <ul className="space-y-2.5" data-testid="metricas-rutas">
          {m.porRuta.map((r) => (
            <li key={r.ruta} className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate">{NOMBRE_RUTA[r.ruta] ?? r.ruta}</span>
              <span className="h-2.5 rounded-full bg-muted">
                <span
                  className={cn("block h-2.5 rounded-full", r.ruta === "error" ? "bg-red-500" : r.ruta === "agente" ? "bg-violet-500" : "bg-primary")}
                  style={{ width: `${(100 * r.n) / maxRuta}%` }}
                />
              </span>
              <span className="w-56 text-right tabular-nums text-muted-foreground">
                {r.n} · {r.pct} % · {segundos(r.p50)} / {segundos(r.p90)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Lista titulo="Por qué fue al agente" items={m.agente.porMotivo.map((x) => ({ etiqueta: NOMBRE_MOTIVO[x.valor] ?? x.valor, n: x.n }))} />
        <Lista titulo="Herramientas que usó el agente" items={m.agente.herramientas.map((x) => ({ etiqueta: x.valor.replace(/_/g, " "), n: x.n }))} />
        <Lista titulo="Intenciones más pedidas" items={m.intenciones.map((x) => ({ etiqueta: x.valor.replace(/_/g, " "), n: x.n }))} />
        <Lista titulo="Tiendas" items={m.porTienda.map((x) => ({ etiqueta: x.valor, n: x.n }))} />
      </div>

      <section className="rounded-lg border bg-background p-5">
        <h2 className="text-sm font-semibold">Día por día</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Día</th>
              <th className="py-1 text-right font-medium">Frases</th>
              <th className="py-1 text-right font-medium">Agente</th>
              <th className="py-1 text-right font-medium">Callejones</th>
              <th className="py-1 text-right font-medium">Errores</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {[...m.porDia].reverse().map((d) => (
              <tr key={d.dia} className="border-t">
                <td className="py-1.5">{new Date(`${d.dia}T12:00:00`).toLocaleDateString("es-BO", { weekday: "short", day: "numeric", month: "short" })}</td>
                <td className="py-1.5 text-right">{d.n}</td>
                <td className="py-1.5 text-right">{d.agente}</td>
                <td className={cn("py-1.5 text-right", d.callejones > 0 && "font-semibold text-amber-600")}>{d.callejones}</td>
                <td className={cn("py-1.5 text-right", d.errores > 0 && "font-semibold text-red-600")}>{d.errores}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-background p-5" data-testid="metricas-callejones">
        <h2 className="text-sm font-semibold">Callejones: para leerlos</h2>
        <p className="mb-3 text-xs text-muted-foreground">Respuestas que no llevaron a ningún lado («no entendí», «todavía no sé hacerlo», «no pude»)</p>
        {m.callejones.ejemplos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguno en este período.</p>
        ) : (
          <ul className="divide-y">
            {m.callejones.ejemplos.map((e, i) => (
              <li key={i} className="py-2.5 text-sm">
                <p className="font-medium">«{e.entrada}»</p>
                <p className="mt-0.5 flex items-start gap-1.5 text-muted-foreground">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                  {e.salida}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {e.tienda ?? "—"} · {new Date(e.fecha).toLocaleString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Kpi({ icono: Icono, titulo, valor, detalle, alerta }: { icono: typeof Bot; titulo: string; valor: string; detalle: string; alerta?: boolean }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icono className={cn("size-3.5", alerta && "text-amber-600")} />
        {titulo}
      </p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", alerta && "text-amber-600")}>{valor}</p>
      <p className="text-xs text-muted-foreground">{detalle}</p>
    </div>
  );
}

function Lista({ titulo, items }: { titulo: string; items: { etiqueta: string; n: number }[] }) {
  const max = Math.max(...items.map((i) => i.n), 1);
  return (
    <section className="rounded-lg border bg-background p-5">
      <h2 className="mb-3 text-sm font-semibold">{titulo}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada en este período.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 10).map((i) => (
            <li key={i.etiqueta} className="grid grid-cols-[minmax(0,1fr)_6rem_2.5rem] items-center gap-3 text-sm">
              <span className="truncate">{i.etiqueta}</span>
              <span className="h-2 rounded-full bg-muted">
                <span className="block h-2 rounded-full bg-primary/70" style={{ width: `${(100 * i.n) / max}%` }} />
              </span>
              <span className="text-right tabular-nums text-muted-foreground">{i.n}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
