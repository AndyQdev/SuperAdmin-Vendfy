import { Search, Users, X } from "lucide-react";

import { useRoles, useUsuarios } from "@/entities/usuario/api";
import { FILTROS_USUARIOS_POR_DEFECTO } from "@/entities/usuario/model/types";
import { useFiltrosUrl } from "@/shared/hooks/use-filtros-url";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const fecha = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function UsuariosPage() {
  const { filtros, borrador, setFiltro, limpiar, hayFiltros } = useFiltrosUrl(
    FILTROS_USUARIOS_POR_DEFECTO,
    { diferidas: ["q"], reiniciar: "pagina", ignorar: ["tam"] },
  );

  const { data: roles } = useRoles();
  const { data, isLoading } = useUsuarios({
    q: filtros.q,
    rol: filtros.rol,
    pagina: filtros.pagina,
    tam: filtros.tam,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / filtros.tam));

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Cargando…" : `${total} en la plataforma`}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar usuario"
            placeholder="Buscar por nombre o correo…"
            className="pl-9"
            value={borrador.q}
            onChange={(e) => setFiltro("q", e.target.value)}
          />
        </div>

        <Select value={borrador.rol} onValueChange={(v) => setFiltro("rol", v)}>
          <SelectTrigger className="w-[220px]" aria-label="Rol">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            {(roles ?? []).map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar} className="gap-1.5">
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Negocios</TableHead>
              <TableHead>Alta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} data-testid="usuario-esqueleto">
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading &&
              items.map((u) => (
                <TableRow key={u.id} data-testid="usuario-fila">
                  <TableCell>
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell>
                    {u.rol ? (
                      <Badge variant="outline">{u.rol}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {u.negocioDe ? (
                      <p className="mt-1 text-xs text-muted-foreground">Equipo de {u.negocioDe.nombre}</p>
                    ) : null}
                    {!u.activo ? <p className="mt-1 text-xs text-destructive">Desactivado</p> : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.telefono ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {u.negocios}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fecha.format(new Date(u.creado))}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && items.length === 0 && (
          <div
            data-testid="usuarios-vacio"
            className="flex flex-col items-center gap-2 py-14 text-center"
          >
            <Users className="h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium">Ningún usuario coincide</p>
            {hayFiltros && (
              <Button variant="outline" size="sm" onClick={limpiar}>
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {paginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Página {filtros.pagina} de {paginas}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filtros.pagina <= 1}
              onClick={() => setFiltro("pagina", filtros.pagina - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filtros.pagina >= paginas}
              onClick={() => setFiltro("pagina", filtros.pagina + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
