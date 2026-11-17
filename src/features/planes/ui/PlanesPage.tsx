import { useState } from "react";
import { Crown, Pencil, Plus } from "lucide-react";

import { useCatalogoPlanes, usePlanes } from "@/entities/plan/api";
import type { Plan } from "@/entities/plan/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

import { PlanDialog } from "./PlanDialog";

const bs = (n: number) => `Bs ${n.toLocaleString("es-BO", { maximumFractionDigits: 2 })}`;

/**
 * Los planes: qué funciones prende cada uno y cuántas tiendas, usuarios,
 * consultas y facturas permite. Se asignan desde la ficha de cada negocio.
 */
export function PlanesPage() {
  const { data: planes, isLoading, isError, error } = usePlanes();
  const { data: catalogo } = useCatalogoPlanes();
  const [dialogo, setDialogo] = useState<{ plan?: Plan } | null>(null);

  const nombreFuncion = (c: string) => catalogo?.funciones.find((f) => f.clave === c)?.nombre ?? c;
  const fundadores = (planes ?? []).reduce((s, p) => s + p.fundadores, 0);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-sm text-muted-foreground">
            Lo que incluye cada plan. Un negocio sin suscripción está en el plan por defecto.
            {fundadores ? ` Fundadores hasta hoy: ${fundadores}.` : ""}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogo({})}>
          <Plus className="h-4 w-4" /> Nuevo plan
        </Button>
      </header>

      {isError && <p className="text-sm text-destructive">{(error as Error)?.message ?? "No se pudieron cargar los planes"}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)
          : (planes ?? []).map((p) => (
              <article
                key={p.id}
                data-testid="plan"
                className={cn("flex flex-col gap-3 rounded-xl border bg-background p-5", !p.activo && "opacity-60")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold">
                      {p.nombre}
                      {p.codigo === catalogo?.planPorDefecto ? <Badge variant="outline">Por defecto</Badge> : null}
                      {!p.activo ? <Badge variant="outline">No se ofrece</Badge> : null}
                    </h2>
                    {p.descripcion ? <p className="text-xs text-muted-foreground">{p.descripcion}</p> : null}
                  </div>
                  <p className="whitespace-nowrap text-lg font-bold tabular-nums">{bs(p.precioMensual)}</p>
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  {catalogo?.limites.map((l) => (
                    <div key={l.clave} className="contents">
                      <dt className="text-muted-foreground">{l.nombre}</dt>
                      <dd className="text-right tabular-nums">{p.limites[l.clave] ?? "∞"}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-wrap gap-1">
                  {p.funciones.length ? (
                    p.funciones.map((f) => (
                      <Badge key={f} variant="secondary">
                        {nombreFuncion(f)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Solo lo básico</span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">
                    {p.negocios} {p.negocios === 1 ? "negocio" : "negocios"}
                    {p.fundadores ? (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Crown className="h-3.5 w-3.5" /> {p.fundadores}
                      </span>
                    ) : null}
                  </span>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setDialogo({ plan: p })}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                </div>
              </article>
            ))}
      </div>

      <PlanDialog abierto={!!dialogo} onCerrar={() => setDialogo(null)} plan={dialogo?.plan} />
    </div>
  );
}
