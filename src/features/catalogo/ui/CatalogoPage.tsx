import { AlertTriangle, Barcode, Loader2, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  useCatalogo,
  useConstruccionesCatalogo,
  useEstadisticasCatalogo,
} from "@/entities/catalogo/api";
import { FILTROS_CATALOGO_POR_DEFECTO, NOMBRE_FUENTE } from "@/entities/catalogo/model/types";
import { useFiltrosUrl } from "@/shared/hooks/use-filtros-url";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

import { DetalleProducto } from "./DetalleProducto";
import { FuentesYArmados } from "./FuentesYArmados";
import { ImagenProducto } from "./ImagenProducto";

const numero = new Intl.NumberFormat("es-BO");
const relativo = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

function haceCuanto(iso: string): string {
  const minutos = (new Date(iso).getTime() - Date.now()) / 60_000;
  if (Math.abs(minutos) < 60) return relativo.format(Math.round(minutos), "minute");
  const horas = minutos / 60;
  return Math.abs(horas) < 24
    ? relativo.format(Math.round(horas), "hour")
    : relativo.format(Math.round(horas / 24), "day");
}

/**
 * El catálogo de referencia: millones de productos por código de barras que se
 * arman cada día desde fuentes abiertas. Acá se ve qué hay, de dónde salió cada
 * dato y si el trabajo diario está funcionando.
 */
export function CatalogoPage() {
  const navigate = useNavigate();
  const { filtros, borrador, setFiltro, limpiar, hayFiltros } = useFiltrosUrl(
    FILTROS_CATALOGO_POR_DEFECTO,
    { diferidas: ["q"], ignorar: ["vista", "codigo", "orden"] },
  );

  const estadisticas = useEstadisticasCatalogo();
  const construcciones = useConstruccionesCatalogo();
  const listado = useCatalogo({
    q: filtros.q,
    fuente: filtros.fuente,
    prefijo: filtros.prefijo,
    conImagen: filtros.conImagen,
    estado: filtros.estado,
    orden: filtros.orden,
  });

  const resumen = estadisticas.data?.resumen ?? null;
  const items = listado.data?.pages.flatMap((p) => p.items) ?? [];
  const total = listado.data?.pages[0]?.total;
  const sinCatalogo = estadisticas.isError;
  const bolivia = estadisticas.data?.porPais.find((p) => p.prefijo === "777")?.n ?? 0;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de productos</h1>
          <p className="text-sm text-muted-foreground">
            {resumen
              ? `Armado ${haceCuanto(resumen.construidoEn)} desde ${resumen.fuentesIds.length} fuentes abiertas. Se actualiza solo todos los días.`
              : "Productos por código de barras, armados cada día desde fuentes abiertas."}
          </p>
        </div>
      </header>

      {construcciones.data?.alerta && (
        <div
          role="alert"
          data-testid="catalogo-alerta"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">{construcciones.data.alerta}</p>
            <button
              type="button"
              className="mt-1 text-xs underline"
              onClick={() => setFiltro("vista", "armados")}
            >
              Ver el historial de armados
            </button>
          </div>
        </div>
      )}

      {sinCatalogo && (
        <div className="rounded-lg border bg-background p-6 text-sm">
          <p className="font-medium">El catálogo todavía no está disponible en este servidor.</p>
          <p className="mt-1 text-muted-foreground">
            Falta el archivo <code>catalogo.db</code>. Se genera con el trabajo diario de GitHub o, en
            desarrollo, con <code>npm run construir</code> dentro de <code>catalogo/</code>.
          </p>
        </div>
      )}

      {resumen && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Cifra etiqueta="Productos" valor={numero.format(resumen.total)} />
          <Cifra
            etiqueta="Con imagen"
            valor={`${Math.round((resumen.conImagen / Math.max(1, resumen.total)) * 100)} %`}
            nota={numero.format(resumen.conImagen)}
          />
          <Cifra
            etiqueta="Marca boliviana (777)"
            valor={numero.format(bolivia)}
            // Navega a la dirección final de una vez: dos setFiltro seguidos se
            // pisarían (React Router arma el segundo con los parámetros viejos).
            onClick={() => navigate({ search: "?prefijo=777" })}
          />
          <Cifra
            etiqueta="Nuevos en el último armado"
            valor={`+${numero.format(resumen.cambios.nuevos)}`}
            nota={`${numero.format(resumen.cambios.actualizados)} actualizados`}
          />
          <Cifra
            etiqueta="Archivo"
            valor={`${((estadisticas.data?.archivo.bytes ?? 0) / 1024 / 1024 / 1024).toFixed(2)} GB`}
            nota={`armado en ${Math.round(resumen.duracionSeg / 60)} min`}
          />
        </div>
      )}

      <div role="tablist" className="flex gap-1 border-b">
        {[
          { id: "productos", etiqueta: "Productos" },
          { id: "armados", etiqueta: "Fuentes y armados" },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={filtros.vista === t.id}
            onClick={() => setFiltro("vista", t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              filtros.vista === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {filtros.vista === "armados" ? (
        <FuentesYArmados resumen={resumen} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar producto"
                placeholder="Nombre, marca o código (7771609…)"
                className="pl-9"
                value={borrador.q}
                onChange={(e) => setFiltro("q", e.target.value)}
              />
            </div>

            <Select value={borrador.prefijo} onValueChange={(v) => setFiltro("prefijo", v)}>
              <SelectTrigger className="w-[190px]" aria-label="País del código">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los países</SelectItem>
                {(estadisticas.data?.porPais ?? []).map((p) => (
                  <SelectItem key={p.prefijo} value={p.prefijo}>
                    {/* Un país puede tener varios prefijos (EE. UU.: 000, 001…):
                        sin el número, el selector mostraría dos opciones iguales. */}
                    {p.pais ?? "Prefijo"} {p.prefijo} · {numero.format(p.n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={borrador.fuente} onValueChange={(v) => setFiltro("fuente", v)}>
              <SelectTrigger className="w-[180px]" aria-label="Fuente">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las fuentes</SelectItem>
                {(resumen?.fuentesIds ?? []).map((id) => (
                  <SelectItem key={id} value={id}>
                    {NOMBRE_FUENTE[id] ?? id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={borrador.conImagen} onValueChange={(v) => setFiltro("conImagen", v)}>
              <SelectTrigger className="w-[150px]" aria-label="Imagen">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Con y sin foto</SelectItem>
                <SelectItem value="si">Con foto</SelectItem>
                <SelectItem value="no">Sin foto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={borrador.estado} onValueChange={(v) => setFiltro("estado", v)}>
              <SelectTrigger className="w-[150px]" aria-label="Estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="importado">Importado</SelectItem>
                <SelectItem value="en_disputa">En disputa</SelectItem>
                <SelectItem value="aportado">Aportado</SelectItem>
                <SelectItem value="verificado">Verificado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={borrador.orden} onValueChange={(v) => setFiltro("orden", v)}>
              <SelectTrigger className="w-[190px]" aria-label="Orden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularidad">Más escaneados primero</SelectItem>
                <SelectItem value="nombre">Por nombre</SelectItem>
                <SelectItem value="actualizado">Modificados recientemente</SelectItem>
              </SelectContent>
            </Select>

            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiar} className="gap-1.5">
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          {total && (
            <p className="text-sm text-muted-foreground" data-testid="catalogo-total">
              {total.exacto ? numero.format(total.n) : `Más de ${numero.format(total.n)}`} productos
              {hayFiltros ? " coinciden" : ""}
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[64px]" />
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="text-right">Escaneos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listado.isLoading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {items.map((p) => (
                  <TableRow
                    key={p.gtin}
                    data-testid="catalogo-fila"
                    className="cursor-pointer"
                    onClick={() => setFiltro("codigo", p.gtin)}
                  >
                    <TableCell>
                      <ImagenProducto url={p.imagen_chica_url ?? p.imagen_url} nombre={p.nombre} className="h-12 w-12" />
                    </TableCell>
                    <TableCell className="max-w-[360px]">
                      <p className="truncate font-medium">{p.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[p.marca, p.cantidad_texto].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="font-mono text-xs">{p.gtin}</p>
                      <p className="text-xs text-muted-foreground">{p.pais ?? ""}</p>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {p.categoria ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="whitespace-nowrap">
                          {NOMBRE_FUENTE[p.fuente_principal] ?? p.fuente_principal}
                        </Badge>
                        {p.n_fuentes > 1 && <Badge variant="secondary">+{p.n_fuentes - 1}</Badge>}
                        {p.estado === "en_disputa" && <Badge variant="destructive">En disputa</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{numero.format(p.popularidad)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!listado.isLoading && items.length === 0 && !sinCatalogo && (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <Barcode className="h-9 w-9 text-muted-foreground/50" />
                <p className="font-medium">Ningún producto coincide</p>
                {hayFiltros && (
                  <Button variant="outline" size="sm" onClick={limpiar}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </div>

          {listado.hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => listado.fetchNextPage()}
                disabled={listado.isFetchingNextPage}
                className="gap-2"
              >
                {listado.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                Cargar 50 más
              </Button>
            </div>
          )}
        </>
      )}

      {filtros.codigo && <DetalleProducto gtin={filtros.codigo} onCerrar={() => setFiltro("codigo", "")} />}
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  nota,
  onClick,
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-background p-4 text-left",
        onClick && "transition-colors hover:border-primary/50",
      )}
    >
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{valor}</p>
      {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
    </Comp>
  );
}
