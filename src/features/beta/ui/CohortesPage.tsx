import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarDays, CheckCircle2, Columns3, FlaskConical, Plus, Users } from "lucide-react";

import { useCohortes } from "@/entities/beta/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

import { ESTADO_COHORTE, fechaDia } from "../model/textos";
import { CohorteDialog } from "./CohorteDialog";

/**
 * Las betas del emprendimiento. Cada una junta un grupo de negocios con metas
 * propias; su tablero es la evidencia que reemplaza a la carta de empresa.
 */
export function CohortesPage() {
  const { data, isLoading, isError, error } = useCohortes();
  const [nueva, setNueva] = useState(false);
  const cohortes = data ?? [];

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Programa beta</h1>
          <p className="text-sm text-muted-foreground">
            Cada beta con sus negocios y sus metas: si se activan solos, si lo siguen usando y qué reportan.
          </p>
        </div>
        <div className="flex gap-2">
          {cohortes.length > 1 && (
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/beta/comparar">
                <Columns3 className="h-4 w-4" /> Comparar betas
              </Link>
            </Button>
          )}
          <Button className="gap-2" onClick={() => setNueva(true)}>
            <Plus className="h-4 w-4" /> Nueva cohorte
          </Button>
        </div>
      </header>

      {isError && <p className="text-sm text-destructive">{(error as Error)?.message ?? "No se pudieron cargar las cohortes"}</p>}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : cohortes.length === 0 && !isError ? (
        <EmptyState
          icon={FlaskConical}
          title="Todavía no hay ninguna beta"
          description="Creá la primera cohorte (por ejemplo, la beta cerrada), sumale los negocios que la van a probar y seguí sus números desde acá."
          primaryAction={{ label: "Crear la primera cohorte", onClick: () => setNueva(true), icon: Plus }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cohortes.map((c) => {
            const estado = ESTADO_COHORTE[c.estado];
            return (
              <Link
                key={c.id}
                to={`/beta/${c.id}`}
                data-testid="cohorte-tarjeta"
                className="group space-y-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold group-hover:underline">{c.nombre}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {fechaDia(c.fechaInicio)}
                      {c.fechaFin ? ` → ${fechaDia(c.fechaFin)}` : " · sin fecha de cierre"}
                    </p>
                  </div>
                  <Badge className={cn("border-transparent hover:opacity-100", estado.clase)}>{estado.texto}</Badge>
                </div>
                {c.descripcion && <p className="line-clamp-2 text-sm text-muted-foreground">{c.descripcion}</p>}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Dato icono={Users} valor={c.participantes} texto="negocios" />
                  <Dato icono={CheckCircle2} valor={`${c.consentidos}/${c.participantes}`} texto="aceptaron" />
                  <Dato icono={AlertTriangle} valor={c.incidenciasAbiertas} texto="incidencias" alerta={c.incidenciasAbiertas > 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Meta: {c.metas.metaActivacion}% activados en {c.metas.diasActivacion} días · {c.metas.metaRetencionSemana4}% usándolo en la semana 4
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <CohorteDialog abierto={nueva} onCerrar={() => setNueva(false)} />
    </div>
  );
}

function Dato({ icono: Icono, valor, texto, alerta }: { icono: typeof Users; valor: number | string; texto: string; alerta?: boolean }) {
  return (
    <div className={cn("rounded-lg bg-muted/50 px-2 py-2", alerta && "bg-warning-soft text-warning-soft-foreground")}>
      <p className="flex items-center justify-center gap-1 text-base font-semibold tabular-nums">
        <Icono className="h-3.5 w-3.5 opacity-60" />
        {valor}
      </p>
      <p className="text-[11px] text-muted-foreground">{texto}</p>
    </div>
  );
}
