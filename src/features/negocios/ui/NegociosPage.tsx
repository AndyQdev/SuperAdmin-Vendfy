import { Link } from "react-router-dom";
import { Building2, Search, X } from "lucide-react";

import { CrearNegocioDialog } from "./CrearNegocioDialog";

import { useNegocios } from "@/entities/negocio/api";
import {
  FILTROS_NEGOCIOS_POR_DEFECTO,
  type FiltrosNegocios,
} from "@/entities/negocio/model/types";
import { useFiltrosUrl } from "@/shared/hooks/use-filtros-url";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const bs = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 0,
});

const fecha = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function NegociosPage() {
  const { filtros, borrador, setFiltro, limpiar, hayFiltros } = useFiltrosUrl(
    FILTROS_NEGOCIOS_POR_DEFECTO,
    {
      // El texto espera a que dejes de escribir; los selects pegan al instante.
      diferidas: ["q"],
      // Cualquier filtro nuevo vuelve a la página 1: quedarse en la 3 de un
      // listado que ahora tiene una página es la forma más rápida de creer que
      // la búsqueda no encontró nada.
      reiniciar: "pagina",
      // El tamaño de página no ensucia la dirección.
      ignorar: ["tam"],
    },
  );

  // La dirección solo sabe de texto: acá se le devuelve el tipo estricto que
  // espera la API, en un solo lugar en vez de a punta de `as` repartidos.
  const [ordenar, direccion] = filtros.orden.split(":");
  const consulta: FiltrosNegocios = {
    q: filtros.q,
    estado: filtros.estado as FiltrosNegocios["estado"],
    actividad: filtros.actividad as FiltrosNegocios["actividad"],
    ordenar: ordenar as FiltrosNegocios["ordenar"],
    direccion: direccion as FiltrosNegocios["direccion"],
    pagina: filtros.pagina,
    tam: filtros.tam,
  };

  const { data, isLoading, isError, error } = useNegocios(consulta);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / consulta.tam));

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Negocios</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Cargando…"
              : `${total} ${total === 1 ? "negocio" : "negocios"} en la plataforma`}
          </p>
        </div>
        <CrearNegocioDialog />
      </header>

      {/* --- filtros --- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar negocio"
            placeholder="Buscar por nombre o slug…"
            className="pl-9"
            value={borrador.q}
            onChange={(e) => setFiltro("q", e.target.value)}
          />
        </div>

        <Select
          value={borrador.estado}
          onValueChange={(v) => setFiltro("estado", v)}
        >
          <SelectTrigger className="w-[150px]" aria-label="Estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={borrador.actividad}
          onValueChange={(v) => setFiltro("actividad", v)}
        >
          <SelectTrigger className="w-[170px]" aria-label="Actividad">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda la actividad</SelectItem>
            <SelectItem value="con-ventas">Con ventas</SelectItem>
            <SelectItem value="sin-ventas">Sin ventas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={borrador.orden}
          onValueChange={(v) => setFiltro("orden", v)}
        >
          <SelectTrigger className="w-[190px]" aria-label="Ordenar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creado:desc">Más recientes</SelectItem>
            <SelectItem value="creado:asc">Más antiguos</SelectItem>
            <SelectItem value="facturado:desc">Mayor facturación</SelectItem>
            <SelectItem value="pedidos:desc">Más pedidos</SelectItem>
            <SelectItem value="nombre:asc">Nombre (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar} className="gap-1.5">
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* --- tabla --- */}
      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negocio</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Facturado</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                // Marcadas aparte de las filas reales: sin esto, cualquier
                // conteo automático (o una prueba) toma los esqueletos por
                // datos y compara contra un número que nunca existió.
                <TableRow key={i} data-testid="negocio-esqueleto">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              items.map((n) => (
                <TableRow key={n.id} data-testid="negocio-fila">
                  <TableCell>
                    {/* El nombre es el enlace y no la fila entera: una fila
                        clicable se lleva por delante cualquier control que
                        pongamos adentro después. */}
                    <Link
                      to={`/negocios/${n.id}`}
                      className="font-medium hover:underline"
                    >
                      {n.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      /{n.slug}
                      {n.ciudad ? ` · ${n.ciudad}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{n.propietario ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.propietarioEmail ?? ""}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n.productos}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {n.pedidos}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {bs.format(n.facturado)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fecha.format(new Date(n.creado))}
                  </TableCell>
                  <TableCell>
                    {n.activo ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && items.length === 0 && (
          <div
            data-testid="negocios-vacio"
            className="flex flex-col items-center gap-2 py-14 text-center"
          >
            <Building2 className="h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium">
              {isError ? "No se pudo cargar" : "Ningún negocio coincide"}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {isError
                ? (error as Error)?.message
                : hayFiltros
                  ? "Probá con otros filtros o limpialos."
                  : "Todavía no hay negocios registrados en la plataforma."}
            </p>
            {hayFiltros && !isError && (
              <Button variant="outline" size="sm" onClick={limpiar}>
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* --- paginación --- */}
      {paginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Página {consulta.pagina} de {paginas}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={consulta.pagina <= 1}
              onClick={() => setFiltro("pagina", consulta.pagina - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={consulta.pagina >= paginas}
              onClick={() => setFiltro("pagina", consulta.pagina + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
