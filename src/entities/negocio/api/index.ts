import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type { FiltrosNegocios, ListadoNegocios } from "../model/types";
import { aQueryString } from "./query-string";

export const clavesNegocios = {
  todos: ["negocios"] as const,
  listado: (filtros: FiltrosNegocios) =>
    [...clavesNegocios.todos, "listado", filtros] as const,
};

export function useNegocios(filtros: FiltrosNegocios) {
  return useQuery({
    queryKey: clavesNegocios.listado(filtros),
    queryFn: async () => {
      const respuesta = await apiFetch<ListadoNegocios>(
        `/api/admin/stores?${aQueryString(filtros)}`,
      );
      return respuesta.data;
    },
    // Al cambiar de página se mantiene la tabla anterior en pantalla en vez de
    // parpadear a vacío. Un listado que salta de golpe se lee peor que uno que
    // se actualiza en el lugar.
    placeholderData: keepPreviousData,
  });
}
