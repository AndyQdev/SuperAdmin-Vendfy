import { AlertTriangle, ExternalLink } from "lucide-react";

import { useProductoCatalogo } from "@/entities/catalogo/api";
import { NOMBRE_FUENTE, type FuenteProducto } from "@/entities/catalogo/model/types";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

import { ImagenProducto } from "./ImagenProducto";

const numero = new Intl.NumberFormat("es-BO");
const fecha = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", year: "numeric" });

/** Datos extra que trae cada fuente, con su nombre para una persona. */
const ETIQUETA_DATO: Record<string, string> = {
  nombre_generico: "Nombre genérico",
  categorias: "Categorías",
  etiquetas: "Etiquetas",
  envase: "Envase",
  origen: "Origen de los ingredientes",
  fabricado_en: "Fabricado en",
  tiendas: "Tiendas",
  nutriscore: "Nutri-Score",
  ingredientes: "Ingredientes",
};

const CAMPOS_COMPARADOS: Array<{ clave: keyof FuenteProducto; etiqueta: string }> = [
  { clave: "nombre", etiqueta: "Nombre" },
  { clave: "marca", etiqueta: "Marca" },
  { clave: "cantidad", etiqueta: "Cantidad" },
  { clave: "categoria", etiqueta: "Categoría" },
];

export function DetalleProducto({ gtin, onCerrar }: { gtin: string; onCerrar: () => void }) {
  const { data, isLoading, isError, error } = useProductoCatalogo(gtin);
  const p = data?.producto;

  // Todas las fotos distintas que tienen las fuentes, la principal primero.
  const imagenes = [
    ...new Set([p?.imagen_url, ...(data?.fuentes ?? []).map((f) => f.imagen_url)].filter(Boolean) as string[]),
  ];

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="max-w-4xl" data-testid="catalogo-detalle">
        <DialogHeader>
          <DialogTitle className="pr-6">{p?.nombre ?? "Producto"}</DialogTitle>
          <DialogDescription className="font-mono">{gtin}</DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-64 w-full" />}
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}

        {p && data && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
              <div className="space-y-2">
                <ImagenProducto url={imagenes[0] ?? null} nombre={p.nombre} className="h-60 w-full" />
                {imagenes.length > 1 && (
                  <div className="flex gap-2">
                    {imagenes.slice(1, 5).map((u) => (
                      <a key={u} href={u} target="_blank" rel="noreferrer">
                        <ImagenProducto url={u} nombre={p.nombre} className="h-14 w-14" />
                      </a>
                    ))}
                  </div>
                )}
                {p.imagen_url && (
                  <p className="text-[11px] text-muted-foreground">
                    Imagen de {NOMBRE_FUENTE[p.fuente_principal] ?? p.fuente_principal} · CC BY-SA
                  </p>
                )}
              </div>

              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                <Dato etiqueta="Marca">{p.marca}</Dato>
                <Dato etiqueta="Cantidad">
                  {p.cantidad_texto}
                  {p.contenido != null && (
                    <span className="ml-2 text-muted-foreground">
                      ({numero.format(p.contenido)} {p.unidad})
                    </span>
                  )}
                </Dato>
                <Dato etiqueta="Categoría">{p.categoria}</Dato>
                <Dato etiqueta="País del código">
                  {p.pais ?? "—"} {p.prefijo && <span className="text-muted-foreground">(prefijo {p.prefijo})</span>}
                </Dato>
                <Dato etiqueta="Visto a la venta en">
                  {p.paises.length ? p.paises.map((x) => x.charAt(0).toUpperCase() + x.slice(1).replace(/-/g, " ")).join(", ") : null}
                </Dato>
                <Dato etiqueta="Popularidad">
                  {numero.format(p.popularidad)} escaneos · puesto {numero.format(p.ranking)}
                </Dato>
                <Dato etiqueta="Completitud">
                  {p.completitud != null ? `${Math.min(100, Math.round(p.completitud * 100))} %` : null}
                </Dato>
                <Dato etiqueta="Estado">
                  <Badge variant={p.estado === "en_disputa" ? "destructive" : "secondary"}>
                    {p.estado.replace("_", " ")}
                  </Badge>
                </Dato>
                <Dato etiqueta="Última modificación">
                  {p.actualizado ? fecha.format(new Date(p.actualizado * 1000)) : null}
                </Dato>
              </dl>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">
                Qué dijo cada fuente ({data.fuentes.length})
              </h3>
              {data.discrepancias.length > 0 && (
                <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Las fuentes no coinciden en: {data.discrepancias.join(", ")}
                </p>
              )}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Campo</th>
                      {data.fuentes.map((f) => (
                        <th key={f.fuente} className="px-3 py-2 font-medium">
                          {NOMBRE_FUENTE[f.fuente] ?? f.fuente}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CAMPOS_COMPARADOS.map(({ clave, etiqueta }) => (
                      <tr
                        key={clave}
                        className={cn(
                          "border-t",
                          data.discrepancias.includes(clave) && "bg-amber-50 dark:bg-amber-950/30",
                        )}
                      >
                        <td className="px-3 py-2 text-muted-foreground">{etiqueta}</td>
                        {data.fuentes.map((f) => (
                          <td key={f.fuente} className="px-3 py-2">
                            {(f[clave] as string | null) || <span className="text-muted-foreground">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">Ficha original</td>
                      {data.fuentes.map((f) => (
                        <td key={f.fuente} className="px-3 py-2">
                          {f.url_ficha ? (
                            <a
                              href={f.url_ficha}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              Ver <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">Licencia</td>
                      {data.fuentes.map((f) => (
                        <td key={f.fuente} className="px-3 py-2 text-xs text-muted-foreground">
                          {f.licencia ?? "—"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {data.fuentes.some((f) => Object.keys(f.datos).length > 0) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Más datos</h3>
                {data.fuentes
                  .filter((f) => Object.keys(f.datos).length > 0)
                  .map((f) => (
                    <div key={f.fuente} className="rounded-lg border p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {NOMBRE_FUENTE[f.fuente] ?? f.fuente}
                      </p>
                      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                        {Object.entries(f.datos).map(([k, v]) => (
                          <Dato key={k} etiqueta={ETIQUETA_DATO[k] ?? k}>
                            {/* La ficha de la IA trae listas (etiquetas) y pares (especificaciones). */}
                            {Array.isArray(v)
                              ? v.join(", ")
                              : v && typeof v === "object"
                                ? Object.entries(v as Record<string, string>)
                                    .map(([a, b]) => `${a}: ${b}`)
                                    .join(" · ")
                                : String(v)}
                          </Dato>
                        ))}
                      </dl>
                    </div>
                  ))}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 break-words">
        {children === null || children === undefined || children === "" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          children
        )}
      </dd>
    </>
  );
}
