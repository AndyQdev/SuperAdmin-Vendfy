import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type { CrearNegocio, FiltrosNegocios, ListadoNegocios, Negocio } from "../model/types";
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

export function useNegocio(id: string | undefined) {
  return useQuery({
    queryKey: [...clavesNegocios.todos, "detalle", id],
    queryFn: async () =>
      (await apiFetch<Negocio>(`/api/admin/stores/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useCrearNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CrearNegocio) =>
      (
        await apiFetch<{ id: string; slug: string }>("/api/admin/stores", {
          method: "POST",
          body: datos,
        })
      ).data,
    // Invalida TODO lo de negocios, no solo el listado actual: el alta cambia
    // los totales y cualquier combinación de filtros guardada en caché.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clavesNegocios.todos }),
  });
}
