import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { useNegocio } from "@/entities/negocio/api";
import { BetaDelNegocio } from "@/features/beta/ui/BetaDelNegocio";
import { PlanDelNegocio } from "@/features/planes/ui/PlanDelNegocio";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

const bs = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});
const fecha = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function NegocioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useNegocio(id);

  if (isError) {
    return (
      <div className="space-y-4 p-6">
        <Volver />
        <p className="text-sm text-destructive">
          {(error as Error)?.message ?? "No se pudo cargar el negocio"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Volver />

      {isLoading || !data ? (
        <Skeleton className="h-9 w-64" />
      ) : (
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{data.nombre}</h1>
              {data.activo ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                  Activo
                </Badge>
              ) : (
                <Badge variant="outline">Inactivo</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              /{data.slug}
              {data.ciudad ? ` · ${data.ciudad}` : ""}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://${data.slug}.vendfy.shop`}
              target="_blank"
              rel="noreferrer"
              className="gap-2"
            >
              Ver su tienda
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </header>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Dato titulo="Productos publicados" valor={data && String(data.productos)} cargando={isLoading} />
        <Dato titulo="Pedidos" valor={data && String(data.pedidos)} cargando={isLoading} />
        <Dato titulo="Facturado" valor={data && bs.format(data.facturado)} cargando={isLoading} />
        <Dato
          titulo="Última venta"
          valor={
            data
              ? data.ultimaVenta
                ? fecha.format(new Date(data.ultimaVenta))
                : "Nunca vendió"
              : undefined
          }
          cargando={isLoading}
        />
      </div>

      <section className="rounded-lg border bg-background p-5">
        <h2 className="mb-3 text-sm font-semibold">Propietario</h2>
        {isLoading || !data ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <>
            <p className="font-medium">{data.propietario ?? "Sin asignar"}</p>
            <p className="text-sm text-muted-foreground">
              {data.propietarioEmail ?? "—"}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Registrado el {fecha.format(new Date(data.creado))}
            </p>
          </>
        )}
      </section>

      {/* El plan es del dueño: vale para todas sus tiendas y su equipo. */}
      {id && <PlanDelNegocio storeId={id} />}

      {id && <BetaDelNegocio storeId={id} />}
    </div>
  );
}

function Volver() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2">
      <Link to="/negocios">
        <ArrowLeft className="h-4 w-4" />
        Negocios
      </Link>
    </Button>
  );
}

function Dato({
  titulo,
  valor,
  cargando,
}: {
  titulo: string;
  valor: string | undefined;
  cargando: boolean;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      {cargando ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className="mt-1 text-2xl font-bold tabular-nums">{valor ?? "—"}</p>
      )}
    </div>
  );
}
