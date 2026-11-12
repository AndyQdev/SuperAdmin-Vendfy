import { Link } from "react-router-dom";
import { Check, FlaskConical } from "lucide-react";

import { useBetaDeNegocio } from "@/entities/beta/api";
import type { HitosNegocio } from "@/entities/beta/model/types";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";

import { ESTADO_ACTIVACION, ESTADO_INCIDENCIA, SEVERIDAD, fechaCorta, hace, nombreModulo } from "../model/textos";

const HITOS: Array<{ id: keyof HitosNegocio; texto: string }> = [
  { id: "inscrito", texto: "Entró a la beta" },
  { id: "consentimiento", texto: "Aceptó participar" },
  { id: "configurada", texto: "Terminó el onboarding" },
  { id: "primerProducto", texto: "Primer producto" },
  { id: "catalogoCargado", texto: "Catálogo cargado" },
  { id: "primeraVenta", texto: "Primera venta" },
  { id: "primeraVentaEnLinea", texto: "Primera venta en línea" },
];

/**
 * La beta en la ficha de un negocio: en cuál está, su línea de tiempo, su
 * uso, sus encuestas, sus notas y sus reportes. Si no está en ninguna (o falta
 * la migración) no ocupa lugar.
 */
export function BetaDelNegocio({ storeId }: { storeId: string }) {
  const { data } = useBetaDeNegocio(storeId);
  if (!data) return null;
  const { cohorte, participante: p, reportes } = data;
  const hayReportes = reportes.incidencias.length + reportes.sugerencias.length > 0;
  if (!cohorte && !hayReportes) return null;

  return (
    <section className="space-y-4 rounded-lg border bg-background p-5" data-testid="beta-del-negocio">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical className="h-4 w-4" /> Programa beta
        </h2>
        {cohorte ? (
          <Link to={`/beta/${cohorte.id}`} className="text-sm font-medium hover:underline">
            {cohorte.nombre} →
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">No está en ninguna beta</span>
        )}
      </div>

      {p && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-transparent hover:opacity-100", ESTADO_ACTIVACION[p.activacion.estado].clase)}>
                {ESTADO_ACTIVACION[p.activacion.estado].texto}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {p.activacion.estado === "activado"
                  ? `en ${p.activacion.dias} días`
                  : p.activacion.estado === "en-plazo"
                    ? `le quedan ${p.activacion.quedan} días`
                    : "pasó el plazo"}{" "}
                · uso {p.diasActivos7}/7 días · última actividad {hace(p.ultimaActividad)}
              </span>
            </div>
            <ol className="relative space-y-2 border-l pl-4">
              {HITOS.map((h) => {
                const v = p.hitos[h.id];
                return (
                  <li key={h.id} className="relative text-sm">
                    <span
                      className={cn(
                        "absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border bg-background",
                        v && "border-success bg-success text-success-foreground",
                      )}
                    >
                      {v ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    <span className={v ? "" : "text-muted-foreground"}>{h.texto}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{typeof v === "string" ? fechaCorta(v) : v ? "" : "todavía no"}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">SUS</p>
                <p className="text-xl font-bold tabular-nums">{p.sus ?? "—"}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">NPS (0-10)</p>
                <p className="text-xl font-bold tabular-nums">{p.nps ?? "—"}</p>
              </div>
            </div>
            {Object.keys(p.modulos).length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Días de uso por módulo</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(p.modulos)
                    .sort((a, b) => b[1] - a[1])
                    .map(([m, d]) => (
                      <span key={m} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {nombreModulo(m)} · {d}
                      </span>
                    ))}
                </div>
              </div>
            )}
            {p.notas && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Notas de seguimiento</p>
                <p className="whitespace-pre-line rounded-md bg-muted/40 p-2 text-xs">{p.notas}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hayReportes && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Reportes</p>
            <Link to={`/reportes?storeId=${storeId}&estado=todas`} className="text-xs hover:underline">
              Ver todos →
            </Link>
          </div>
          <ul className="divide-y rounded-md border">
            {reportes.incidencias.slice(0, 5).map((i) => (
              <li key={i.id} className="flex items-center gap-2 p-2 text-sm">
                <Badge className={cn("border-transparent hover:opacity-100", SEVERIDAD[i.severidad].clase)}>{SEVERIDAD[i.severidad].texto}</Badge>
                <span className="min-w-0 flex-1 truncate">{i.titulo}</span>
                <span className="text-xs text-muted-foreground">{ESTADO_INCIDENCIA[i.estado]}</span>
              </li>
            ))}
            {reportes.sugerencias.slice(0, 3).map((s) => (
              <li key={s.id} className="p-2 text-sm text-muted-foreground">
                💡 <span className="text-foreground">{s.comentario?.split("\n")[0]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
