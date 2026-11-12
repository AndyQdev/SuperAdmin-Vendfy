import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useNotasParticipante } from "@/entities/beta/api";
import type { ParticipanteBeta } from "@/entities/beta/model/types";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

/**
 * La bitácora de seguimiento de un negocio: llamadas, visitas, lo que contó.
 * En la beta cerrada, donde se acompaña de cerca, es la parte cualitativa de
 * la evidencia.
 */
export function NotasDialog({ cohorteId, participante, onCerrar }: { cohorteId: string; participante: ParticipanteBeta | null; onCerrar: () => void }) {
  const guardar = useNotasParticipante(cohorteId);
  const [notas, setNotas] = useState("");
  useEffect(() => setNotas(participante?.notas ?? ""), [participante]);

  const sello = () => {
    const hoy = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short" }).format(new Date());
    setNotas((n) => `${n ? `${n.trimEnd()}\n\n` : ""}${hoy}: `);
  };

  return (
    <Dialog open={Boolean(participante)} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Seguimiento de {participante?.nombre}</DialogTitle>
          <DialogDescription>Lo que pasó en cada contacto: qué probó, qué le costó, qué pidió.</DialogDescription>
        </DialogHeader>
        <textarea
          aria-label="Notas de seguimiento"
          rows={10}
          maxLength={8000}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="08 nov: llamada. Ya cargó 12 productos; no encuentra cómo imprimir el ticket."
        />
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" size="sm" onClick={sello}>
            + Anotar con la fecha de hoy
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button
              disabled={guardar.isPending}
              className="gap-2"
              onClick={async () => {
                try {
                  await guardar.mutateAsync({ storeId: participante!.storeId, notas });
                  toast.success("Notas guardadas");
                  onCerrar();
                } catch (e: any) {
                  toast.error(e?.message ?? "No se pudieron guardar las notas");
                }
              }}
            >
              {guardar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
