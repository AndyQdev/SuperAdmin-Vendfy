import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCrearCohorte, useEditarCohorte } from "@/entities/beta/api";
import type { Cohorte, EstadoCohorte, MetasCohorte } from "@/entities/beta/model/types";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const METAS_INICIALES: MetasCohorte = { diasActivacion: 14, productosMinimos: 5, metaActivacion: 70, metaRetencionSemana4: 40, metaSus: 68 };

const hoy = () => new Date().toLocaleDateString("en-CA");

/**
 * Crear o editar una cohorte. Las metas son lo que la beta se compromete a
 * demostrar: al cerrarla, el tablero dice si las cumplió.
 */
export function CohorteDialog({
  abierto,
  onCerrar,
  cohorte,
}: {
  abierto: boolean;
  onCerrar: () => void;
  /** Sin cohorte, crea una nueva. */
  cohorte?: Cohorte;
}) {
  const crear = useCrearCohorte();
  const editar = useEditarCohorte(cohorte?.id ?? "");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [inicio, setInicio] = useState(hoy());
  const [fin, setFin] = useState("");
  const [estado, setEstado] = useState<EstadoCohorte>("planificada");
  const [metas, setMetas] = useState<MetasCohorte>(METAS_INICIALES);

  useEffect(() => {
    if (!abierto) return;
    setNombre(cohorte?.nombre ?? "");
    setDescripcion(cohorte?.descripcion ?? "");
    setInicio(cohorte?.fechaInicio ?? hoy());
    setFin(cohorte?.fechaFin ?? "");
    setEstado(cohorte?.estado ?? "planificada");
    setMetas({ ...METAS_INICIALES, ...cohorte?.metas });
  }, [abierto, cohorte]);

  const guardando = crear.isPending || editar.isPending;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    try {
      if (cohorte) {
        await editar.mutateAsync({ nombre: nombre.trim(), descripcion: descripcion.trim(), fechaInicio: inicio, fechaFin: fin || null, estado, metas });
        toast.success("Cohorte actualizada");
      } else {
        await crear.mutateAsync({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, fechaInicio: inicio, fechaFin: fin || undefined, metas });
        toast.success(`"${nombre.trim()}" creada. Ahora sumale negocios.`);
      }
      onCerrar();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo guardar la cohorte");
    }
  }

  const meta = (clave: keyof MetasCohorte) => ({
    value: String(metas[clave]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setMetas((m) => ({ ...m, [clave]: Number(e.target.value) })),
  });

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={enviar} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{cohorte ? "Editar cohorte" : "Nueva cohorte"}</DialogTitle>
            <DialogDescription>
              Una cohorte es una beta: un grupo de negocios que la prueba en las mismas fechas, con metas que al
              cerrar dicen si funcionó.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="c-nombre">Nombre</Label>
            <Input id="c-nombre" required minLength={2} maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Beta cerrada" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Objetivo</Label>
            <textarea
              id="c-desc"
              rows={2}
              maxLength={2000}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Qué querés demostrar con esta beta"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-inicio">Empieza</Label>
              <Input id="c-inicio" type="date" required value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-fin">Termina</Label>
              <Input id="c-fin" type="date" min={inicio} value={fin} onChange={(e) => setFin(e.target.value)} />
            </div>
          </div>
          {cohorte && (
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v as EstadoCohorte)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planificada">Planificada</SelectItem>
                  <SelectItem value="activa">En curso</SelectItem>
                  <SelectItem value="cerrada">Cerrada (ya no suma negocios ni muestra avisos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-semibold">Metas</legend>
            <p className="text-xs text-muted-foreground">
              <b>Activado</b> = terminó el onboarding, publicó el catálogo mínimo y vendió, dentro del plazo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Plazo para activarse (días)">
                <Input type="number" min={1} max={120} required {...meta("diasActivacion")} />
              </Campo>
              <Campo etiqueta="Catálogo mínimo (productos)">
                <Input type="number" min={1} max={500} required {...meta("productosMinimos")} />
              </Campo>
              <Campo etiqueta="Meta de activación (%)">
                <Input type="number" min={0} max={100} required {...meta("metaActivacion")} />
              </Campo>
              <Campo etiqueta="Meta de uso en la semana 4 (%)">
                <Input type="number" min={0} max={100} required {...meta("metaRetencionSemana4")} />
              </Campo>
              <Campo etiqueta="Meta de usabilidad (SUS, 0-100)">
                <Input type="number" min={0} max={100} required {...meta("metaSus")} />
              </Campo>
            </div>
            <p className="text-[11px] text-muted-foreground">SUS 68 es el promedio de la industria; 80 o más se considera bueno.</p>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando} className="gap-2">
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {cohorte ? "Guardar" : "Crear cohorte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span className="block">{etiqueta}</span>
      {children}
    </label>
  );
}
