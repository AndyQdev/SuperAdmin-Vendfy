import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type {
  ConstruccionesCatalogo,
  DetalleCatalogo,
  EstadisticasCatalogo,
  ListadoCatalogo,
} from "../model/types";

export interface ConsultaCatalogo {
  q: string;
  fuente: string;
  prefijo: string;
  conImagen: string;
  estado: string;
  orden: string;
}

/**
 * Listado con "cargar más" y no con números de página: son millones de filas y
 * el backend pagina por cursor (saltar a la página 40.000 obligaría a recorrer
 * todo lo anterior).
 */
export function useCatalogo(consulta: ConsultaCatalogo) {
  return useInfiniteQuery({
    queryKey: ["catalogo", "listado", consulta],
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (consulta.q.trim()) params.set("q", consulta.q.trim());
      if (consulta.fuente !== "todas") params.set("fuente", consulta.fuente);
      if (consulta.prefijo !== "todos") params.set("prefijo", consulta.prefijo);
      if (consulta.conImagen !== "todas") params.set("conImagen", consulta.conImagen);
      if (consulta.estado !== "todos") params.set("estado", consulta.estado);
      if (consulta.orden !== "popularidad") params.set("orden", consulta.orden);
      if (pageParam) params.set("cursor", pageParam);
      params.set("tam", "50");
      const r = await apiFetch<ListadoCatalogo>(`/api/admin/catalogo?${params}`);
      return r.data!;
    },
    getNextPageParam: (ultima) => ultima.siguiente ?? undefined,
    placeholderData: keepPreviousData,
  });
}

export function useProductoCatalogo(gtin: string) {
  return useQuery({
    queryKey: ["catalogo", "producto", gtin],
    queryFn: async () => (await apiFetch<DetalleCatalogo>(`/api/admin/catalogo/${gtin}`)).data!,
    enabled: Boolean(gtin),
  });
}

export function useEstadisticasCatalogo() {
  return useQuery({
    queryKey: ["catalogo", "estadisticas"],
    queryFn: async () => (await apiFetch<EstadisticasCatalogo>("/api/admin/catalogo/estadisticas")).data!,
    // El archivo cambia una vez por día: no vale repreguntar a cada rato.
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useConstruccionesCatalogo() {
  return useQuery({
    queryKey: ["catalogo", "construcciones"],
    queryFn: async () =>
      (await apiFetch<ConstruccionesCatalogo>("/api/admin/catalogo/construcciones")).data!,
    staleTime: 60_000,
  });
}
