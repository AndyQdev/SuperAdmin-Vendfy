import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { useAgregarParticipantes } from "@/entities/beta/api";
import { useNegocios } from "@/entities/negocio/api";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";

/** Elegir negocios de la plataforma para sumarlos a la cohorte. */
export function AgregarNegociosDialog({
  abierto,
  onCerrar,
  cohorteId,
  yaInscritos,
}: {
  abierto: boolean;
  onCerrar: () => void;
  cohorteId: string;
  yaInscritos: Set<string>;
}) {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [elegidos, setElegidos] = useState<Map<string, string>>(new Map());
  const agregar = useAgregarParticipantes(cohorteId);

  // La búsqueda espera a que se deje de escribir.
  useEffect(() => {
    const t = setTimeout(() => setQ(texto.trim()), 300);
    return () => clearTimeout(t);
  }, [texto]);
  useEffect(() => {
    if (!abierto) {
      setTexto("");
      setElegidos(new Map());
    }
  }, [abierto]);

  const { data, isLoading } = useNegocios({ q, estado: "activos", actividad: "todos", ordenar: "creado", direccion: "desc", pagina: 1, tam: 30 });
  const negocios = data?.items ?? [];

  const alternar = (id: string, nombre: string) =>
    setElegidos((m) => {
      const n = new Map(m);
      if (n.has(id)) n.delete(id);
      else n.set(id, nombre);
      return n;
    });

  async function confirmar() {
    try {
      const r = await agregar.mutateAsync([...elegidos.keys()]);
      if (r.agregados) toast.success(`${r.agregados} ${r.agregados === 1 ? "negocio sumado" : "negocios sumados"} a la beta`);
      const enOtra = r.yaEstaban.filter((y) => !y.mismaCohorte);
      if (enOtra.length) {
        toast.warning(`No se movieron porque ya están en otra beta: ${enOtra.map((y) => `${y.nombre} (${y.cohorte})`).join(", ")}`, { duration: 8000 });
      }
      onCerrar();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudieron sumar los negocios");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sumar negocios a la beta</DialogTitle>
          <DialogDescription>
            Al entrar a su panel se les pide aceptar la participación. Un negocio está en una sola beta a la vez.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus aria-label="Buscar negocio" placeholder="Buscar por nombre o slug…" className="pl-9" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>

        <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border">
          {isLoading && <li className="p-3 text-sm text-muted-foreground">Buscando…</li>}
          {!isLoading && negocios.length === 0 && <li className="p-3 text-sm text-muted-foreground">No hay negocios con ese nombre.</li>}
          {negocios.map((n) => {
            const inscrito = yaInscritos.has(n.id);
            const marcado = elegidos.has(n.id);
            return (
              <li key={n.id}>
                <label className={cn("flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50", inscrito && "cursor-default opacity-60")}>
                  <input type="checkbox" className="h-4 w-4" disabled={inscrito} checked={inscrito || marcado} onChange={() => alternar(n.id, n.nombre)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {n.propietario ?? "—"} · {n.productos} productos · {n.pedidos} pedidos
                    </span>
                  </span>
                  {inscrito && <span className="text-xs text-muted-foreground">ya está</span>}
                </label>
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button disabled={elegidos.size === 0 || agregar.isPending} onClick={confirmar} className="gap-2">
            {agregar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Sumar {elegidos.size || ""} {elegidos.size === 1 ? "negocio" : "negocios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
