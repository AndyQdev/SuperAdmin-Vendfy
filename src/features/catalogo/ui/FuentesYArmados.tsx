import { CheckCircle2, CircleAlert, ExternalLink, History, XCircle } from "lucide-react";

import { useConstruccionesCatalogo } from "@/entities/catalogo/api";
import {
  MOTIVO_DESCARTE,
  NOMBRE_FUENTE,
  type ResumenArmado,
} from "@/entities/catalogo/model/types";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const numero = new Intl.NumberFormat("es-BO");
const fechaHora = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const mb = (b: number | string | null) => (b == null ? "—" : `${(Number(b) / 1024 / 1024).toFixed(0)} MB`);

const ICONO_ESTADO = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  con_avisos: <CircleAlert className="h-4 w-4 text-amber-600" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
};
const TEXTO_ESTADO = { ok: "Correcto", con_avisos: "Con avisos", error: "Falló" };

export function FuentesYArmados({ resumen }: { resumen: ResumenArmado | null }) {
  const { data, isLoading } = useConstruccionesCatalogo();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Qué aportó cada fuente</h2>
          <p className="text-sm text-muted-foreground">
            Del archivo que está en uso. "Válidas" son las que entraron al catálogo; el resto se
            descartó por el motivo indicado.
          </p>
        </div>

        {!resumen ? (
          <p className="text-sm text-muted-foreground">Todavía no hay un catálogo armado.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="text-right">Leídas</TableHead>
                  <TableHead className="text-right">Válidas</TableHead>
                  <TableHead className="text-right">Sin nombre</TableHead>
                  <TableHead>Descartadas por código</TableHead>
                  <TableHead className="text-right">Fuente principal de</TableHead>
                  <TableHead>Descarga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumen.fuentes.map((f) => (
                  <TableRow key={f.id} data-testid="catalogo-fuente-fila">
                    <TableCell>
                      <p className="font-medium">{NOMBRE_FUENTE[f.id] ?? f.nombre}</p>
                      {f.aviso && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
                          <CircleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                          {f.aviso}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{numero.format(f.leidas)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{numero.format(f.validas)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {numero.format(f.sinNombre)}
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-0.5 text-xs text-muted-foreground">
                        {Object.entries(f.descartes)
                          .sort((a, b) => b[1] - a[1])
                          .map(([motivo, n]) => (
                            <li key={motivo}>
                              <span className="tabular-nums">{numero.format(n)}</span>{" "}
                              {MOTIVO_DESCARTE[motivo] ?? motivo}
                            </li>
                          ))}
                        {f.repetidasEnLaFuente > 0 && (
                          <li>
                            <span className="tabular-nums">{numero.format(f.repetidasEnLaFuente)}</span>{" "}
                            repetidas dentro de la misma fuente
                          </li>
                        )}
                      </ul>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{numero.format(f.principalDe)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {f.descargado ? "Descargada" : "Sin cambios"} · {mb(f.bytes)}
                      {f.lastModified && (
                        <p>publicada {fechaHora.format(new Date(f.lastModified))}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Historial de armados</h2>
          <p className="text-sm text-muted-foreground">
            El trabajo corre todos los días a las 09:37 (hora de Bolivia). Si un armado falla, el
            servidor sigue usando el archivo anterior.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuándo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right">Productos</TableHead>
                <TableHead className="text-right">Nuevos</TableHead>
                <TableHead className="text-right">Actualizados</TableHead>
                <TableHead className="text-right">Eliminados</TableHead>
                <TableHead className="text-right">Archivo</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {data?.items.map((c) => {
                const duracion = c.terminado_en
                  ? Math.round((new Date(c.terminado_en).getTime() - new Date(c.iniciado_en).getTime()) / 60_000)
                  : null;
                return (
                  <TableRow key={c.id} data-testid="catalogo-armado-fila">
                    <TableCell className="whitespace-nowrap text-sm">
                      {fechaHora.format(new Date(c.iniciado_en))}
                      {duracion != null && (
                        <p className="text-xs text-muted-foreground">{duracion} min</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        {ICONO_ESTADO[c.estado]}
                        {TEXTO_ESTADO[c.estado]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.total != null ? numero.format(c.total) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                      {c.nuevos != null ? `+${numero.format(c.nuevos)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.actualizados != null ? numero.format(c.actualizados) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {c.eliminados != null ? `−${numero.format(c.eliminados)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{mb(c.bytes)}</TableCell>
                    <TableCell className="max-w-[320px] text-xs">
                      {c.error && <p className="text-destructive">{c.error}</p>}
                      {c.ejecucion_url && (
                        <a
                          href={c.ejecucion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Ver en GitHub <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {c.commit_sha && (
                        <Badge variant="outline" className="ml-2 font-mono">
                          {c.commit_sha.slice(0, 7)}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {!isLoading && !data?.items.length && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <History className="h-9 w-9 text-muted-foreground/50" />
              <p className="font-medium">Todavía no hay armados registrados</p>
              <p className="max-w-md text-sm text-muted-foreground">
                El trabajo diario escribe acá cada corrida, también las que fallan. Mientras no
                esté configurado, el archivo se arma a mano.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
