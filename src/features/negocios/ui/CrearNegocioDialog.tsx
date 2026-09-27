import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { useCrearNegocio } from "@/entities/negocio/api";
import { sugerirSlug } from "../model/slug";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function CrearNegocioDialog() {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  // Mientras nadie toque el slug, sigue al nombre. En cuanto se edita a mano,
  // deja de pisarse: nada más molesto que escribir algo y que se reescriba solo.
  const [slugTocado, setSlugTocado] = useState(false);
  const [email, setEmail] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const crear = useCrearNegocio();

  function limpiar() {
    setNombre("");
    setSlug("");
    setSlugTocado(false);
    setEmail("");
    setDescripcion("");
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    try {
      await crear.mutateAsync({
        nombre: nombre.trim(),
        slug: slug.trim(),
        propietarioEmail: email.trim(),
        descripcion: descripcion.trim() || undefined,
      });
      toast.success(`"${nombre}" quedó registrado`);
      limpiar();
      setAbierto(false);
    } catch (error: any) {
      // El backend distingue "ese correo no existe" (404) de "el slug ya está
      // usado" (409); su mensaje es más útil que uno genérico nuestro.
      toast.error(error?.message ?? "No se pudo crear el negocio");
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) limpiar();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo negocio
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar un negocio</DialogTitle>
          <DialogDescription>
            El propietario tiene que estar registrado antes. Se lo identifica
            por su correo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="negocio-nombre">Nombre</Label>
            <Input
              id="negocio-nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (!slugTocado) setSlug(sugerirSlug(e.target.value));
              }}
              placeholder="Abarrotes Doña Rosa"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="negocio-slug">Dirección (slug)</Label>
            <Input
              id="negocio-slug"
              value={slug}
              onChange={(e) => {
                setSlugTocado(true);
                setSlug(e.target.value);
              }}
              placeholder="abarrotes-dona-rosa"
              pattern="[a-z0-9\-]+"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              Solo minúsculas, números y guiones. Es la dirección pública de su
              tienda.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="negocio-email">Correo del propietario</Label>
            <Input
              id="negocio-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rosa@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="negocio-descripcion">Descripción (opcional)</Label>
            <Input
              id="negocio-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {crear.isPending ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
