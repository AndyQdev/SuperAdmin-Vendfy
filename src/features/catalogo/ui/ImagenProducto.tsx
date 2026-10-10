import { useState } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Foto del producto, servida desde la fuente (no descargamos millones de
 * imágenes). Si no hay foto, o la URL ya no responde, se muestra la inicial:
 * un ícono de imagen rota en una tabla de miles de filas se ve como un error
 * del panel, no como un dato que falta.
 */
export function ImagenProducto({
  url,
  nombre,
  className,
}: {
  url: string | null;
  nombre: string;
  className?: string;
}) {
  const [fallo, setFallo] = useState(false);

  if (!url || fallo) {
    return (
      <div
        aria-hidden
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-muted text-sm font-semibold uppercase text-muted-foreground",
          className,
        )}
      >
        {nombre.trim().charAt(0) || "?"}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={nombre}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFallo(true)}
      className={cn("shrink-0 rounded-lg bg-muted object-contain", className)}
    />
  );
}
