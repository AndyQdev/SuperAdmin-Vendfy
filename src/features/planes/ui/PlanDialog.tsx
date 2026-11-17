import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCatalogoPlanes, useGuardarPlan } from "@/entities/plan/api";
import type { ClaveLimite, Plan } from "@/entities/plan/model/types";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

/**
 * Crear o editar un plan: precio, límites y funciones. Un límite vacío es
 * ilimitado. Lo que se cambia acá le llega a todos los negocios del plan en
 * unos segundos (salvo el precio: cada negocio guarda el suyo).
 */
export function PlanDialog({ abierto, onCerrar, plan }: { abierto: boolean; onCerrar: () => void; plan?: Plan }) {
  const { data: catalogo } = useCatalogoPlanes();
  const guardar = useGuardarPlan();

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("0");
  const [limites, setLimites] = useState<Partial<Record<ClaveLimite, string>>>({});
  const [funciones, setFunciones] = useState<string[]>([]);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!abierto) return;
    setCodigo(plan?.codigo ?? "");
    setNombre(plan?.nombre ?? "");
    setDescripcion(plan?.descripcion ?? "");
    setPrecio(String(plan?.precioMensual ?? 0));
    setLimites(Object.fromEntries(Object.entries(plan?.limites ?? {}).map(([k, v]) => [k, String(v)])));
    setFunciones(plan?.funciones ?? []);
    setActivo(plan?.activo ?? true);
  }, [abierto, plan]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await guardar.mutateAsync({
        id: plan?.id,
        codigo: plan ? undefined : codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precioMensual: Number(precio) || 0,
        // Vacío = ilimitado: se manda null y el backend lo saca.
        limites: Object.fromEntries(
          (catalogo?.limites ?? []).map((l) => [l.clave, limites[l.clave]?.trim() ? Number(limites[l.clave]) : null]),
        ),
        funciones,
        activo,
      });
      toast.success(plan ? "Plan actualizado" : "Plan creado");
      onCerrar();
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo guardar");
    }
  };

  const porDefecto = plan?.codigo === catalogo?.planPorDefecto;

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <form onSubmit={enviar} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{plan ? `Editar «${plan.nombre}»` : "Nuevo plan"}</DialogTitle>
            <DialogDescription>
              {porDefecto
                ? "Es el plan de los negocios sin suscripción: lo que cambies acá les llega a todos ellos."
                : "Los cambios les llegan a los negocios del plan en unos segundos. El precio que paga cada uno queda en su suscripción."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-nombre">Nombre</Label>
              <Input id="p-nombre" required minLength={2} maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-precio">Precio (Bs/mes)</Label>
              <Input id="p-precio" type="number" min={0} step="1" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
            {!plan ? (
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="p-codigo">Código</Label>
                <Input
                  id="p-codigo"
                  required
                  pattern="[a-z0-9\-]{2,40}"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toLowerCase())}
                  placeholder="feria"
                />
                <p className="text-xs text-muted-foreground">En minúsculas y guiones. No se cambia después.</p>
              </div>
            ) : null}
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="p-desc">Para quién es</Label>
              <Input id="p-desc" maxLength={500} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </div>

          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">Límites (vacío = ilimitado)</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalogo?.limites.map((l) => (
                <div key={l.clave} className="space-y-1">
                  <Label htmlFor={`p-l-${l.clave}`}>{l.nombre}</Label>
                  <Input
                    id={`p-l-${l.clave}`}
                    type="number"
                    min={0}
                    placeholder="Ilimitado"
                    value={limites[l.clave] ?? ""}
                    onChange={(e) => setLimites((x) => ({ ...x, [l.clave]: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">{l.unidad}</p>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">Funciones que incluye</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {catalogo?.funciones.map((f) => (
                <label key={f.clave} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 text-sm hover:bg-muted/50">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={funciones.includes(f.clave)}
                    onChange={(e) => setFunciones((x) => (e.target.checked ? [...x, f.clave] : x.filter((y) => y !== f.clave)))}
                  />
                  <span>
                    <span className="font-medium">{f.nombre}</span>
                    <span className="block text-xs text-muted-foreground">{f.descripcion}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Caja, productos, inventario, compras, clientes y el asistente los tiene todo plan.</p>
          </fieldset>

          {!porDefecto ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              Se ofrece a negocios nuevos (los que ya lo tienen siguen igual)
            </label>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardar.isPending} className="gap-2">
              {guardar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
