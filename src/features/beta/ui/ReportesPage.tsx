import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, Lightbulb, Loader2, MessageSquareWarning, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { useCohortes, useCrearIncidencia, useEditarIncidencia, useReportes } from "@/entities/beta/api";
import type { EstadoIncidencia, FiltrosReportes, Incidencia, Severidad } from "@/entities/beta/model/types";
import { useNegocios } from "@/entities/negocio/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

import { ESTADO_INCIDENCIA, SEVERIDAD, fechaHora, nombreModulo } from "../model/textos";

/**
 * Lo que reportan los comercios desde su panel (y lo que anota el equipo):
 * problemas, con estado hasta resolverse, y sugerencias. Filtrable por beta y
 * por negocio; el filtro vive en la dirección para poder enlazarlo.
 */
export function ReportesPage() {
  const [params, setParams] = useSearchParams();
  const filtros: FiltrosReportes = {
    cohorteId: params.get("cohorteId") ?? undefined,
    storeId: params.get("storeId") ?? undefined,
    estado: (params.get("estado") as FiltrosReportes["estado"]) ?? "pendientes",
  };
  const [pestana, setPestana] = useState<"incidencias" | "sugerencias">("incidencias");
  const [anotar, setAnotar] = useState(false);
  const { data, isLoading, isError, error } = useReportes(filtros);
  const cohortes = useCohortes().data ?? [];

  const cambiar = (clave: string, valor: string | undefined) => {
    const n = new URLSearchParams(params);
    if (valor) n.set(clave, valor);
    else n.delete(clave);
    setParams(n, { replace: true });
  };

  const incidencias = data?.incidencias ?? [];
  const sugerencias = data?.sugerencias ?? [];
  const negocioFiltrado = filtros.storeId ? [...incidencias, ...sugerencias].find((x) => x.storeId === filtros.storeId)?.negocio : null;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Problemas y sugerencias de los negocios. Los resueltos dicen cuánto tardamos.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setAnotar(true)}>
          <Plus className="h-4 w-4" /> Anotar una incidencia
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="inline-flex rounded-lg border bg-muted/40 p-1">
          {(
            [
              ["incidencias", `Problemas (${incidencias.length})`, MessageSquareWarning],
              ["sugerencias", `Sugerencias (${sugerencias.length})`, Lightbulb],
            ] as const
          ).map(([id, texto, Icono]) => (
            <button
              key={id}
              role="tab"
              aria-selected={pestana === id}
              onClick={() => setPestana(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                pestana === id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icono className="h-4 w-4" /> {texto}
            </button>
          ))}
        </div>

        <Select value={filtros.cohorteId ?? "todas"} onValueChange={(v) => cambiar("cohorteId", v === "todas" ? undefined : v)}>
          <SelectTrigger className="w-[200px]" aria-label="Beta">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las betas</SelectItem>
            {cohortes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pestana === "incidencias" && (
          <Select value={filtros.estado ?? "pendientes"} onValueChange={(v) => cambiar("estado", v === "pendientes" ? undefined : v)}>
            <SelectTrigger className="w-[180px]" aria-label="Estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendientes">Pendientes</SelectItem>
              <SelectItem value="abierta">Abiertas</SelectItem>
              <SelectItem value="en-progreso">En progreso</SelectItem>
              <SelectItem value="resuelta">Resueltas</SelectItem>
              <SelectItem value="descartada">Descartadas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
        )}

        {filtros.storeId && (
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => cambiar("storeId", undefined)}>
            {negocioFiltrado ?? "Un negocio"} <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isError && <p className="text-sm text-destructive">{(error as Error)?.message ?? "No se pudieron cargar los reportes"}</p>}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : pestana === "incidencias" ? (
        incidencias.length === 0 ? (
          <Vacio texto="No hay problemas con estos filtros." />
        ) : (
          <ul className="space-y-3">
            {incidencias.map((i) => (
              <TarjetaIncidencia key={i.id} incidencia={i} />
            ))}
          </ul>
        )
      ) : sugerencias.length === 0 ? (
        <Vacio texto="No hay sugerencias con estos filtros." />
      ) : (
        <ul className="space-y-3">
          {sugerencias.map((s) => (
            <li key={s.id} data-testid="sugerencia" className="rounded-xl border bg-card p-4">
              <p className="whitespace-pre-line text-sm">{s.comentario}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <Link to={`/negocios/${s.storeId}`} className="font-medium text-foreground hover:underline">
                  {s.negocio}
                </Link>
                {s.autor ? ` · ${s.autor}` : ""}
                {s.cohorte ? ` · ${s.cohorte}` : ""}
                {s.modulo ? ` · ${nombreModulo(s.modulo)}` : ""} · {fechaHora(s.creada)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <AnotarDialog abierto={anotar} onCerrar={() => setAnotar(false)} />
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">{texto}</p>;
}

function TarjetaIncidencia({ incidencia: i }: { incidencia: Incidencia }) {
  const editar = useEditarIncidencia();
  const [notas, setNotas] = useState(i.notas ?? "");
  const sev = SEVERIDAD[i.severidad];
  const dias = i.resuelta ? Math.max(0, Math.round((Date.parse(i.resuelta) - Date.parse(i.creada)) / 86_400_000)) : null;

  const guardar = async (cambio: { estado?: EstadoIncidencia; severidad?: Severidad; notas?: string }) => {
    try {
      await editar.mutateAsync({ id: i.id, ...cambio });
      toast.success("Incidencia actualizada");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar");
    }
  };

  return (
    <li data-testid="incidencia" className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border-transparent hover:opacity-100", sev.clase)}>{sev.texto}</Badge>
            <p className="font-semibold">{i.titulo}</p>
            {i.origen === "equipo" && <Badge variant="outline">Lo vio el equipo</Badge>}
          </div>
          {i.descripcion && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{i.descripcion}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            <Link to={`/negocios/${i.storeId}`} className="font-medium text-foreground hover:underline">
              {i.negocio}
            </Link>
            {i.autor ? ` · ${i.autor}` : ""}
            {i.cohorte ? ` · ${i.cohorte}` : ""}
            {i.modulo ? ` · ${nombreModulo(i.modulo)}` : ""} · {fechaHora(i.creada)}
            {i.url && (
              <a href={i.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 hover:underline">
                pantalla <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {dias !== null && ` · cerrada en ${dias} ${dias === 1 ? "día" : "días"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={i.severidad} onValueChange={(v) => guardar({ severidad: v as Severidad })}>
            <SelectTrigger className="h-8 w-[110px] text-xs" aria-label="Severidad">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SEVERIDAD) as Severidad[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SEVERIDAD[s].texto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={i.estado} onValueChange={(v) => guardar({ estado: v as EstadoIncidencia })}>
            <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ESTADO_INCIDENCIA) as EstadoIncidencia[]).map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_INCIDENCIA[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          aria-label="Nota interna"
          placeholder="Nota interna: causa, qué se hizo…"
          className="h-8 text-xs"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
        {notas !== (i.notas ?? "") && (
          <Button size="sm" className="h-8" disabled={editar.isPending} onClick={() => guardar({ notas })}>
            Guardar
          </Button>
        )}
      </div>
    </li>
  );
}

/** Una incidencia que vio el equipo (en una visita, una llamada, por WhatsApp). */
function AnotarDialog({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const crear = useCrearIncidencia();
  const [q, setQ] = useState("");
  const [tienda, setTienda] = useState<{ id: string; nombre: string } | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [severidad, setSeveridad] = useState<Severidad>("media");
  const { data } = useNegocios({ q, estado: "todos", actividad: "todos", ordenar: "nombre", direccion: "asc", pagina: 1, tam: 8 });

  const cerrar = () => {
    setQ("");
    setTienda(null);
    setTitulo("");
    setDescripcion("");
    setSeveridad("media");
    onCerrar();
  };

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && cerrar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Anotar una incidencia</DialogTitle>
          <DialogDescription>Algo que vio el equipo y el negocio no reportó desde el panel.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Negocio</Label>
            {tienda ? (
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setTienda(null)}>
                {tienda.nombre} <X className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <>
                <Input placeholder="Buscar negocio…" value={q} onChange={(e) => setQ(e.target.value)} />
                <ul className="max-h-40 divide-y overflow-y-auto rounded-md border">
                  {(data?.items ?? []).map((n) => (
                    <li key={n.id}>
                      <button type="button" className="w-full p-2 text-left text-sm hover:bg-muted" onClick={() => setTienda({ id: n.id, nombre: n.nombre })}>
                        {n.nombre} <span className="text-xs text-muted-foreground">/{n.slug}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-titulo">Qué pasa</Label>
            <Input id="i-titulo" maxLength={140} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="No le llegan los pedidos de WhatsApp" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-desc">Detalle</Label>
            <textarea id="i-desc" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label>Severidad</Label>
            <Select value={severidad} onValueChange={(v) => setSeveridad(v as Severidad)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEVERIDAD) as Severidad[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEVERIDAD[s].texto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            disabled={!tienda || titulo.trim().length < 3 || crear.isPending}
            className="gap-2"
            onClick={async () => {
              try {
                await crear.mutateAsync({ storeId: tienda!.id, titulo: titulo.trim(), descripcion: descripcion.trim() || undefined, severidad });
                toast.success("Incidencia anotada");
                cerrar();
              } catch (e: any) {
                toast.error(e?.message ?? "No se pudo anotar");
              }
            }}
          >
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Anotar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
