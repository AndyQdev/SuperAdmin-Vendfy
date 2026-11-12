import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  MessageSquareWarning,
  NotebookPen,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { useQuitarParticipante, useTablero } from "@/entities/beta/api";
import type { HitosNegocio, ParticipanteBeta } from "@/entities/beta/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/cn";

import { ESTADO_ACTIVACION, ESTADO_COHORTE, fechaCorta, fechaDia, hace, nombreModulo } from "../model/textos";
import { AgregarNegociosDialog } from "./AgregarNegociosDialog";
import { CohorteDialog } from "./CohorteDialog";
import { NotasDialog } from "./NotasDialog";
import { Embudo, Incidencias, Kpis, Metas, Retencion, Satisfaccion } from "./Secciones";

/** Los pasos del embudo que se muestran como puntos en cada negocio. */
const PASOS: Array<{ id: keyof HitosNegocio; corto: string }> = [
  { id: "consentimiento", corto: "Aceptó" },
  { id: "configurada", corto: "Configuró" },
  { id: "primerProducto", corto: "1er producto" },
  { id: "catalogoCargado", corto: "Catálogo" },
  { id: "primeraVenta", corto: "1ra venta" },
  { id: "primeraVentaEnLinea", corto: "Venta en línea" },
];

export function CohortePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useTablero(id);
  const [editar, setEditar] = useState(false);
  const [agregar, setAgregar] = useState(false);
  const [notasDe, setNotasDe] = useState<ParticipanteBeta | null>(null);
  const [quitarA, setQuitarA] = useState<ParticipanteBeta | null>(null);

  if (isError) {
    return (
      <div className="space-y-4 p-6">
        <Volver />
        <p className="text-sm text-destructive">{(error as Error)?.message ?? "No se pudo cargar la cohorte"}</p>
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6">
        <Volver />
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const { cohorte, kpis } = data;
  const estado = ESTADO_COHORTE[cohorte.estado];

  return (
    <div className="space-y-6 p-6">
      <Volver />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{cohorte.nombre}</h1>
            <Badge className={cn("border-transparent hover:opacity-100", estado.clase)}>{estado.texto}</Badge>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {fechaDia(cohorte.fechaInicio)}
            {cohorte.fechaFin ? ` → ${fechaDia(cohorte.fechaFin)}` : " · sin fecha de cierre"}
          </p>
          {cohorte.descripcion && <p className="mt-1 max-w-3xl text-sm">{cohorte.descripcion}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/beta/${cohorte.id}/informe`}>
              <FileText className="h-4 w-4" /> Informe
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/reportes?cohorteId=${cohorte.id}`}>
              <MessageSquareWarning className="h-4 w-4" /> Reportes
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setEditar(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button className="gap-2" onClick={() => setAgregar(true)} disabled={cohorte.estado === "cerrada"}>
            <UserPlus className="h-4 w-4" /> Sumar negocios
          </Button>
        </div>
      </header>

      {kpis.participantes === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Esta beta todavía no tiene negocios"
          description="Sumá los negocios que la van a probar. Cuando entren al panel, se les pide aceptar la participación y empiezan a contar sus números."
          primaryAction={{ label: "Sumar negocios", onClick: () => setAgregar(true), icon: UserPlus }}
        />
      ) : (
        <>
          <Metas metas={data.metas} />
          <Kpis kpis={data.kpis} />
          <div className="grid gap-4 xl:grid-cols-2">
            <Embudo pasos={data.embudo} />
            <Retencion semanas={data.retencion} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
            <Satisfaccion
              datos={data.satisfaccion}
              nombreDe={(id) => data.participantes.find((p) => p.storeId === id)?.nombre ?? "Un negocio"}
            />
            <Incidencias datos={data.incidencias} />
          </div>
          <Negocios participantes={data.participantes} onNotas={setNotasDe} onQuitar={setQuitarA} />
          <Adopcion participantes={data.participantes} />
        </>
      )}

      <CohorteDialog abierto={editar} onCerrar={() => setEditar(false)} cohorte={cohorte} />
      <AgregarNegociosDialog
        abierto={agregar}
        onCerrar={() => setAgregar(false)}
        cohorteId={cohorte.id}
        yaInscritos={new Set(data.participantes.map((p) => p.storeId))}
      />
      <NotasDialog cohorteId={cohorte.id} participante={notasDe} onCerrar={() => setNotasDe(null)} />
      <QuitarDialog cohorteId={cohorte.id} participante={quitarA} onCerrar={() => setQuitarA(null)} />
    </div>
  );
}

function Volver() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5 text-muted-foreground">
      <Link to="/beta">
        <ArrowLeft className="h-4 w-4" /> Programa beta
      </Link>
    </Button>
  );
}

// -------------------------------------------------------------- negocios

function Negocios({
  participantes,
  onNotas,
  onQuitar,
}: {
  participantes: ParticipanteBeta[];
  onNotas: (p: ParticipanteBeta) => void;
  onQuitar: (p: ParticipanteBeta) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Negocios de la beta</h2>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <TooltipProvider delayDuration={150}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Activación</TableHead>
                <TableHead>Hitos</TableHead>
                <TableHead className="text-right">Productos</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Uso 7 días</TableHead>
                <TableHead className="text-right">SUS</TableHead>
                <TableHead className="text-right">NPS</TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead className="text-right">Incid.</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {participantes.map((p) => {
                const act = ESTADO_ACTIVACION[p.activacion.estado];
                return (
                  <TableRow key={p.storeId} data-testid="participante-fila">
                    <TableCell>
                      <Link to={`/negocios/${p.storeId}`} className="font-medium hover:underline">
                        {p.nombre}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.propietario ?? `/${p.slug}`}</p>
                      <p className="text-[11px] text-muted-foreground">Entró el {fechaCorta(p.hitos.inscrito)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-transparent hover:opacity-100", act.clase)}>{act.texto}</Badge>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {p.activacion.estado === "activado"
                          ? `en ${p.activacion.dias} ${p.activacion.dias === 1 ? "día" : "días"}`
                          : p.activacion.estado === "en-plazo"
                            ? `quedan ${p.activacion.quedan} días`
                            : "pasó el plazo"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {PASOS.map((paso) => {
                          const valor = p.hitos[paso.id];
                          return (
                            <Tooltip key={paso.id}>
                              <TooltipTrigger asChild>
                                <span
                                  aria-label={`${paso.corto}: ${valor ? "sí" : "todavía no"}`}
                                  className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                                    valor ? "border-success bg-success text-success-foreground" : "border-dashed border-muted-foreground/40",
                                  )}
                                >
                                  {valor ? <Check className="h-3 w-3" /> : null}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {paso.corto}
                                {typeof valor === "string" ? ` · ${fechaCorta(valor)}` : valor ? "" : " · todavía no"}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.productos}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.ventas}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.diasActivos7}/7</TableCell>
                    <TableCell className="text-right tabular-nums">{p.sus ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.nps ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{hace(p.ultimaActividad)}</TableCell>
                    <TableCell className="text-right">
                      {p.incidenciasAbiertas > 0 ? (
                        <Link
                          to={`/reportes?storeId=${p.storeId}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-warning-soft-foreground hover:underline"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> {p.incidenciasAbiertas}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 w-8 p-0", p.notas && "text-primary")}
                          onClick={() => onNotas(p)}
                          aria-label={`Notas de seguimiento de ${p.nombre}`}
                          title={p.notas ?? "Notas de seguimiento"}
                        >
                          <NotebookPen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => onQuitar(p)}
                          aria-label={`Sacar a ${p.nombre} de la beta`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </section>
  );
}

// -------------------------------------------------------------- adopción

/** Negocio × módulo: cuántos días usó cada módulo desde que entró. Lo que nadie toca salta a la vista. */
function Adopcion({ participantes }: { participantes: ParticipanteBeta[] }) {
  const modulos = useMemo(() => {
    const total = new Map<string, number>();
    for (const p of participantes) for (const [m, d] of Object.entries(p.modulos)) total.set(m, (total.get(m) ?? 0) + d);
    return [...total.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
  }, [participantes]);
  const maximo = Math.max(1, ...participantes.flatMap((p) => Object.values(p.modulos)));

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold">Uso por módulo</h2>
        <p className="text-xs text-muted-foreground">Días que cada negocio usó cada parte del panel desde que entró a la beta.</p>
      </div>
      {modulos.length === 0 ? (
        <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          Todavía no hay uso registrado. Se anota solo cuando los negocios usan el panel.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                {modulos.map((m) => (
                  <TableHead key={m} className="text-center">
                    {nombreModulo(m)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {participantes.map((p) => (
                <TableRow key={p.storeId}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  {modulos.map((m) => {
                    const dias = p.modulos[m] ?? 0;
                    return (
                      <TableCell key={m} className="p-1 text-center">
                        <span
                          className="mx-auto flex h-8 w-full min-w-10 items-center justify-center rounded text-xs tabular-nums"
                          style={{ background: dias ? `hsl(var(--primary) / ${0.12 + (dias / maximo) * 0.6})` : undefined, color: dias / maximo > 0.55 ? "white" : undefined }}
                          title={`${p.nombre} · ${nombreModulo(m)}: ${dias} ${dias === 1 ? "día" : "días"}`}
                        >
                          {dias || "·"}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- quitar

function QuitarDialog({ cohorteId, participante, onCerrar }: { cohorteId: string; participante: ParticipanteBeta | null; onCerrar: () => void }) {
  const quitar = useQuitarParticipante(cohorteId);
  return (
    <Dialog open={Boolean(participante)} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Sacar a {participante?.nombre} de la beta?</DialogTitle>
          <DialogDescription>
            Deja de contar en los números de esta cohorte y se pierde su consentimiento y sus notas de seguimiento. Su
            tienda, su uso y sus reportes no se borran.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={quitar.isPending}
            onClick={async () => {
              try {
                await quitar.mutateAsync(participante!.storeId);
                toast.success(`${participante!.nombre} salió de la beta`);
                onCerrar();
              } catch (e: any) {
                toast.error(e?.message ?? "No se pudo sacar el negocio");
              }
            }}
          >
            Sacar de la beta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
