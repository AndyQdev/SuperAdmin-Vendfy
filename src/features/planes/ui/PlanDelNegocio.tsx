import { useEffect, useState } from "react";
import { Crown, Loader2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";

import { useActivarUsuarioNegocio, useCatalogoPlanes, useGuardarSuscripcion, usePlanDelNegocio, usePlanes } from "@/entities/plan/api";
import type { ClaveLimite, DatosSuscripcion, PlanDelNegocio as Datos } from "@/entities/plan/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";

const fecha = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }) : "—");

/**
 * El plan de un negocio en su ficha: qué tiene, cuánto usó y quién entra.
 * Desde acá se asigna el plan, se marca Fundador, se suspende por falta de
 * pago y se dan excepciones (una función o un límite distinto al del plan).
 */
export function PlanDelNegocio({ storeId }: { storeId: string }) {
  const { data, isLoading, isError } = usePlanDelNegocio(storeId);
  const { data: catalogo } = useCatalogoPlanes();
  const activar = useActivarUsuarioNegocio(storeId);
  const [editando, setEditando] = useState(false);

  if (isError) return null;
  if (isLoading || !data) return <Skeleton className="h-48 rounded-lg" />;

  const s = data.suscripcion;
  const nombreFuncion = (c: string) => catalogo?.funciones.find((f) => f.clave === c)?.nombre ?? c;

  return (
    <>
      <section className="space-y-4 rounded-lg border bg-background p-5" data-testid="plan-del-negocio">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            Plan: {data.vigente.plan.nombre}
            {s?.fundador ? (
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" /> Fundador
              </Badge>
            ) : null}
            {data.vigente.suspendida ? <Badge variant="destructive">Suspendida</Badge> : null}
            {!s ? <Badge variant="outline">Sin suscripción</Badge> : null}
          </h2>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditando(true)}>
            <Pencil className="h-3.5 w-3.5" /> Cambiar plan
          </Button>
        </div>

        {s ? (
          <p className="text-sm text-muted-foreground">
            Paga Bs {s.precioMensual ?? s.precioPlan} al mes · desde {fecha(s.desde)} · hasta {fecha(s.hasta)}
            {s.notas ? ` · ${s.notas}` : ""}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {catalogo?.limites.map((l) => {
            const tope = data.vigente.limites[l.clave];
            const usado = data.usado[l.clave] ?? 0;
            const lleno = tope != null && usado >= tope;
            return (
              <div key={l.clave} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  {l.nombre}
                  {l.unidad === "por mes" ? " (este mes)" : ""}
                </p>
                <p className={`mt-1 text-lg font-bold tabular-nums ${lleno ? "text-destructive" : ""}`}>
                  {usado} <span className="text-sm font-normal text-muted-foreground">/ {tope ?? "∞"}</span>
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1">
          {data.vigente.funciones.map((f) => (
            <Badge key={f} variant={s?.funcionesExtra.includes(f) ? "default" : "secondary"} title={s?.funcionesExtra.includes(f) ? "Excepción de este negocio" : undefined}>
              {nombreFuncion(f)}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" /> Equipo ({data.equipo.filter((m) => m.activo).length} activos)
          </h3>
          <ul className="divide-y rounded-md border">
            {data.equipo.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                </span>
                <Badge variant="outline">{m.esDueno ? "Dueño" : m.rol?.name ?? "Sin rol"}</Badge>
                {!m.esDueno ? <span className="text-xs text-muted-foreground">{m.storeIds.length} sucursal{m.storeIds.length === 1 ? "" : "es"}</span> : null}
                {!m.activo ? <Badge variant="destructive">Desactivado</Badge> : null}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activar.isPending}
                  onClick={() =>
                    activar
                      .mutateAsync({ userId: m.id, activo: !m.activo })
                      .then(() => toast.success(m.activo ? `${m.name} ya no puede entrar` : `${m.name} puede volver a entrar`))
                      .catch((e) => toast.error(e?.message ?? "No se pudo cambiar"))
                  }
                >
                  {m.activo ? "Desactivar" : "Activar"}
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            El equipo lo arma el dueño desde su panel. Desde acá solo se desactiva a alguien, por soporte.
          </p>
        </div>
      </section>

      <EditarSuscripcion storeId={storeId} datos={data} abierto={editando} onCerrar={() => setEditando(false)} />
    </>
  );
}

type Excepcion = "plan" | "agregar" | "quitar";

function EditarSuscripcion({ storeId, datos, abierto, onCerrar }: { storeId: string; datos: Datos; abierto: boolean; onCerrar: () => void }) {
  const { data: planes = [] } = usePlanes();
  const { data: catalogo } = useCatalogoPlanes();
  const guardar = useGuardarSuscripcion(storeId);

  const [planId, setPlanId] = useState("");
  const [precio, setPrecio] = useState("");
  const [fundador, setFundador] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [suspendida, setSuspendida] = useState(false);
  const [notas, setNotas] = useState("");
  const [excepciones, setExcepciones] = useState<Record<string, Excepcion>>({});
  const [limites, setLimites] = useState<Partial<Record<ClaveLimite, { valor: string; sinTope: boolean }>>>({});

  useEffect(() => {
    if (!abierto) return;
    const s = datos.suscripcion;
    setPlanId(s?.planId ?? planes.find((p) => p.codigo === catalogo?.planPorDefecto)?.id ?? "");
    setPrecio(s?.precioMensual != null ? String(s.precioMensual) : "");
    setFundador(s?.fundador ?? false);
    setDesde(s?.desde?.slice(0, 10) ?? new Date().toLocaleDateString("en-CA"));
    setHasta(s?.hasta?.slice(0, 10) ?? "");
    setSuspendida(s?.estado === "suspendida");
    setNotas(s?.notas ?? "");
    setExcepciones(
      Object.fromEntries([
        ...(s?.funcionesExtra ?? []).map((f) => [f, "agregar" as const]),
        ...(s?.funcionesQuitadas ?? []).map((f) => [f, "quitar" as const]),
      ]),
    );
    setLimites(
      Object.fromEntries(
        Object.entries(s?.limitesExtra ?? {}).map(([k, v]) => [k, { valor: v == null ? "" : String(v), sinTope: v == null }]),
      ),
    );
  }, [abierto, datos, planes, catalogo]);

  const plan = planes.find((p) => p.id === planId);

  const enviar = async () => {
    const limitesExtra: DatosSuscripcion["limitesExtra"] = {};
    for (const [clave, l] of Object.entries(limites) as [ClaveLimite, { valor: string; sinTope: boolean }][]) {
      if (l.sinTope) limitesExtra[clave] = null;
      else if (l.valor.trim()) limitesExtra[clave] = Number(l.valor);
    }
    try {
      await guardar.mutateAsync({
        planId,
        precioMensual: precio.trim() ? Number(precio) : null,
        fundador,
        desde: desde || null,
        hasta: hasta || null,
        estado: suspendida ? "suspendida" : "activa",
        funcionesExtra: Object.entries(excepciones).filter(([, e]) => e === "agregar").map(([f]) => f),
        funcionesQuitadas: Object.entries(excepciones).filter(([, e]) => e === "quitar").map(([f]) => f),
        limitesExtra,
        notas: notas.trim() || null,
      });
      toast.success("Plan del negocio guardado");
      onCerrar();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar");
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan de {datos.dueno.name}</DialogTitle>
          <DialogDescription>Vale para todas sus tiendas y su equipo. Le llega al panel en unos segundos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-plan">Plan</Label>
              <select
                id="s-plan"
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {planes.map((p) => (
                  <option key={p.id} value={p.id} disabled={!p.activo && p.id !== datos.suscripcion?.planId}>
                    {p.nombre} — Bs {p.precioMensual}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-precio">Paga (Bs/mes)</Label>
              <Input id="s-precio" type="number" min={0} placeholder={plan ? `${plan.precioMensual} (el del plan)` : ""} value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-desde">Desde</Label>
              <Input id="s-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-hasta">Pagado hasta</Label>
              <Input id="s-hasta" type="date" min={desde} value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={fundador} onChange={(e) => setFundador(e.target.checked)} />
              Es Fundador (precio congelado)
            </label>
            <label className="flex items-center gap-2 text-destructive">
              <input type="checkbox" className="h-4 w-4 accent-destructive" checked={suspendida} onChange={(e) => setSuspendida(e.target.checked)} />
              Suspendida (ve sus datos, no opera)
            </label>
          </div>

          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">Funciones: excepciones de este negocio</legend>
            <div className="space-y-1.5">
              {catalogo?.funciones.map((f) => {
                const enPlan = plan?.funciones.includes(f.clave) ?? false;
                return (
                  <div key={f.clave} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {f.nombre} <span className="text-xs text-muted-foreground">{enPlan ? "(en el plan)" : "(no está en el plan)"}</span>
                    </span>
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      value={excepciones[f.clave] ?? "plan"}
                      onChange={(e) => setExcepciones((x) => ({ ...x, [f.clave]: e.target.value as Excepcion }))}
                    >
                      <option value="plan">Como el plan</option>
                      <option value="agregar">Dársela</option>
                      <option value="quitar">Quitársela</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">Límites propios (vacío = los del plan)</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalogo?.limites.map((l) => {
                const v = limites[l.clave] ?? { valor: "", sinTope: false };
                return (
                  <div key={l.clave} className="space-y-1">
                    <Label htmlFor={`s-l-${l.clave}`}>{l.nombre}</Label>
                    <Input
                      id={`s-l-${l.clave}`}
                      type="number"
                      min={0}
                      disabled={v.sinTope}
                      placeholder={plan ? String(plan.limites[l.clave] ?? "∞") : ""}
                      value={v.valor}
                      onChange={(e) => setLimites((x) => ({ ...x, [l.clave]: { ...v, valor: e.target.value } }))}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input type="checkbox" checked={v.sinTope} onChange={(e) => setLimites((x) => ({ ...x, [l.clave]: { ...v, sinTope: e.target.checked } }))} />
                      Sin tope para este negocio
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="s-notas">Notas</Label>
            <Input id="s-notas" maxLength={1000} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Pagó por QR el 16/11; referido por…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button disabled={!planId || guardar.isPending} onClick={enviar} className="gap-2">
            {guardar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
