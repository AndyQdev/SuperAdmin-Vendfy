import { Check, CircleDashed, X } from "lucide-react";

import type { TableroCohorte } from "@/entities/beta/model/types";
import { cn } from "@/shared/lib/cn";

import { SEVERIDAD } from "../model/textos";

/**
 * Las piezas del tablero que también usa el informe de cierre: si cumplió las
 * metas, el embudo, la retención, la satisfacción y las incidencias.
 */

export function Metas({ metas }: { metas: TableroCohorte["metas"] }) {
  return (
    <section aria-label="Metas de la cohorte" className="grid gap-3 md:grid-cols-3">
      {metas.map((m) => (
        <div
          key={m.id}
          data-testid="meta"
          className={cn(
            "flex items-center gap-4 rounded-xl border bg-card p-4",
            m.cumple === true && "border-success/40 bg-success-soft/40",
            m.cumple === false && "border-warning/50 bg-warning-soft/40",
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 flex-none items-center justify-center rounded-full print:border",
              m.cumple === true ? "bg-success text-success-foreground" : m.cumple === false ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {m.cumple === true ? <Check className="h-5 w-5" /> : m.cumple === false ? <X className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{m.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {m.valor === null ? (
                "Todavía sin datos"
              ) : (
                <>
                  <b className="text-foreground">{m.valor}{m.id === "sus" ? "" : "%"}</b> logrado
                </>
              )}{" "}
              · meta {m.meta}
              {m.id === "sus" ? "" : "%"}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function Kpis({ kpis }: { kpis: TableroCohorte["kpis"] }) {
  const items = [
    { titulo: "Negocios", valor: kpis.participantes, detalle: `${kpis.consentidos} aceptaron participar` },
    {
      titulo: "Activados",
      valor: kpis.tasaActivacion === null ? "—" : `${kpis.tasaActivacion}%`,
      detalle: `${kpis.activados} activados · ${kpis.enPlazo} en plazo · ${kpis.noActivados} no`,
    },
    {
      titulo: "Tiempo hasta activarse",
      valor: kpis.medianaDiasActivacion === null ? "—" : `${kpis.medianaDiasActivacion} d`,
      detalle: "mediana de los activados",
    },
    { titulo: "Activos esta semana", valor: kpis.activosUltimos7, detalle: `de ${kpis.participantes}, en los últimos 7 días` },
    { titulo: "Incidencias abiertas", valor: kpis.incidenciasAbiertas, detalle: "abiertas o en progreso", alerta: kpis.incidenciasAbiertas > 0 },
  ];
  return (
    <section aria-label="Indicadores" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((k) => (
        <div key={k.titulo} data-testid="kpi" className={cn("break-inside-avoid rounded-xl border bg-card p-4", k.alerta && "border-warning/50")}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.titulo}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{k.valor}</p>
          <p className="text-xs text-muted-foreground">{k.detalle}</p>
        </div>
      ))}
    </section>
  );
}

export function Embudo({ pasos }: { pasos: TableroCohorte["embudo"] }) {
  return (
    <section className="break-inside-avoid rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Embudo de activación</h2>
      <p className="mb-4 text-xs text-muted-foreground">Cuántos negocios llegaron a cada paso. Cada paso se cuenta por separado.</p>
      <ol className="space-y-2.5">
        {pasos.map((p) => (
          <li key={p.id} data-testid="paso-embudo">
            <div className="mb-1 flex justify-between text-sm">
              <span>{p.nombre}</span>
              <span className="tabular-nums text-muted-foreground">
                <b className="text-foreground">{p.negocios}</b> · {p.porcentaje}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted print:border">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.porcentaje}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Retencion({ semanas }: { semanas: TableroCohorte["retencion"] }) {
  return (
    <section className="break-inside-avoid rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Retención por semana</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        De los negocios que ya completaron esa semana desde que entraron, cuántos usaron el panel al menos un día en ella.
      </p>
      <div className="flex h-44 items-end gap-4">
        {semanas.map((s) => (
          <div key={s.semana} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" data-testid="semana-retencion">
            <span className="text-sm font-semibold tabular-nums">{s.porcentaje === null ? "—" : `${s.porcentaje}%`}</span>
            <div className="flex w-full flex-1 items-end rounded-md bg-muted print:border">
              <div className="w-full rounded-md bg-primary transition-all" style={{ height: `${s.porcentaje ?? 0}%` }} />
            </div>
            <span className="text-xs">Semana {s.semana}</span>
            <span className="text-[11px] text-muted-foreground">{s.elegibles ? `${s.activos} de ${s.elegibles}` : "nadie llegó aún"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const MOMENTO = { dia14: "A las 2 semanas", cierre: "Al cierre" } as const;

export function Satisfaccion({ datos, nombreDe }: { datos: TableroCohorte["satisfaccion"]; nombreDe: (storeId: string) => string }) {
  const { sus, nps } = datos;
  const total = Math.max(1, nps.n);
  return (
    <section className="break-inside-avoid space-y-4 rounded-xl border bg-card p-5" data-testid="satisfaccion">
      <div>
        <h2 className="font-semibold">Satisfacción</h2>
        <p className="text-xs text-muted-foreground">
          SUS (usabilidad, 0 a 100; 68 es el promedio de la industria) y NPS (recomendación, de −100 a 100). De cada negocio vale su
          última respuesta.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SUS promedio</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{sus.promedio ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{sus.n ? `${sus.adjetivo} · ${sus.n} ${sus.n === 1 ? "respuesta" : "respuestas"}` : "Todavía nadie contestó"}</p>
          {sus.promedio !== null && (
            <div className="relative mt-3 h-2 rounded-full bg-gradient-to-r from-red-300 via-amber-300 to-emerald-400">
              <span className="absolute -top-1 h-4 w-1 rounded bg-foreground" style={{ left: `calc(${sus.promedio}% - 2px)` }} />
              <span className="absolute -bottom-4 text-[10px] text-muted-foreground" style={{ left: "calc(68% - 8px)" }}>
                68
              </span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">NPS</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{nps.valor === null ? "—" : nps.valor > 0 ? `+${nps.valor}` : nps.valor}</p>
          <p className="text-sm text-muted-foreground">{nps.n ? `${nps.n} ${nps.n === 1 ? "respuesta" : "respuestas"}` : "Todavía nadie contestó"}</p>
          {nps.n > 0 && (
            <>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
                <span className="bg-emerald-500" style={{ width: `${(nps.promotores / total) * 100}%` }} />
                <span className="bg-slate-300" style={{ width: `${(nps.pasivos / total) * 100}%` }} />
                <span className="bg-red-400" style={{ width: `${(nps.detractores / total) * 100}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {nps.promotores} promotores (9-10) · {nps.pasivos} pasivos (7-8) · {nps.detractores} detractores (0-6)
              </p>
            </>
          )}
        </div>
      </div>
      {datos.porMomento.some((m) => m.sus.n > 0) && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 font-medium">Momento</th>
              <th className="py-1 text-right font-medium">SUS</th>
              <th className="py-1 text-right font-medium">NPS</th>
              <th className="py-1 text-right font-medium">Respuestas</th>
            </tr>
          </thead>
          <tbody>
            {datos.porMomento.map((m) => (
              <tr key={m.momento} className="border-t">
                <td className="py-1.5">{MOMENTO[m.momento]}</td>
                <td className="py-1.5 text-right tabular-nums">{m.sus.promedio ?? "—"}</td>
                <td className="py-1.5 text-right tabular-nums">{m.nps.valor ?? "—"}</td>
                <td className="py-1.5 text-right tabular-nums">{m.sus.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {datos.comentarios.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lo primero que cambiarían</p>
          <ul className="space-y-2">
            {datos.comentarios.slice(0, 8).map((c, i) => (
              <li key={i} className="rounded-lg border-l-4 border-primary/40 bg-muted/30 px-3 py-2 text-sm">
                “{c.comentario}”
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {nombreDe(c.storeId)} · NPS {c.nps} · {MOMENTO[c.momento as keyof typeof MOMENTO] ?? c.momento}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function Incidencias({ datos }: { datos: TableroCohorte["incidencias"] }) {
  return (
    <section className="break-inside-avoid space-y-3 rounded-xl border bg-card p-5" data-testid="incidencias-resumen">
      <div>
        <h2 className="font-semibold">Incidencias</h2>
        <p className="text-xs text-muted-foreground">Los problemas que reportaron los negocios o vio el equipo, y cuánto se tardó en resolverlos.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra titulo="Reportadas" valor={datos.total} />
        <Cifra titulo="Resueltas" valor={datos.resueltas} detalle={datos.total ? `${Math.round((datos.resueltas / datos.total) * 100)}%` : undefined} />
        <Cifra titulo="Abiertas" valor={datos.abiertas} detalle={datos.gravesAbiertas ? `${datos.gravesAbiertas} graves` : undefined} alerta={datos.gravesAbiertas > 0} />
        <Cifra titulo="Tiempo de resolución" valor={datos.diasPromedioResolucion === null ? "—" : `${datos.diasPromedioResolucion} d`} detalle="promedio" />
      </div>
      {datos.total > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {(["critica", "alta", "media", "baja"] as const).map((s) => (
            <span key={s} className={cn("rounded-full px-2.5 py-1 font-medium", SEVERIDAD[s].clase)}>
              {SEVERIDAD[s].texto}: {datos.porSeveridad[s]}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Cifra({ titulo, valor, detalle, alerta }: { titulo: string; valor: number | string; detalle?: string; alerta?: boolean }) {
  return (
    <div className={cn("rounded-lg bg-muted/40 p-3", alerta && "bg-warning-soft text-warning-soft-foreground")}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="text-xl font-bold tabular-nums">{valor}</p>
      {detalle && <p className="text-[11px] text-muted-foreground">{detalle}</p>}
    </div>
  );
}
