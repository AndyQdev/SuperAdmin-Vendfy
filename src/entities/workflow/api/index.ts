import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type {
  Ejecucion,
  FlowId,
  Grafo,
  ListadoEjecuciones,
} from "../model/types";

export interface ConsultaEjecuciones {
  flow: string;
  estado: string;
  source: string;
  pagina: number;
  tam: number;
}

export function useGrafo(flow: FlowId) {
  return useQuery({
    queryKey: ["workflow", "grafo", flow],
    queryFn: async () =>
      (await apiFetch<Grafo>(`/api/admin/workflow/graph?flow=${flow}`)).data,
    // El grafo sale del código del backend: solo cambia con un despliegue.
    staleTime: Infinity,
  });
}

export function useEjecuciones(consulta: ConsultaEjecuciones) {
  return useQuery({
    queryKey: ["workflow", "runs", consulta],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("flow", consulta.flow);
      if (consulta.estado !== "todos") params.set("estado", consulta.estado);
      if (consulta.source !== "todos") params.set("source", consulta.source);
      params.set("pagina", String(consulta.pagina));
      params.set("tam", String(consulta.tam));
      return (
        await apiFetch<ListadoEjecuciones>(`/api/admin/workflow/runs?${params}`)
      ).data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useEjecucion(id: string | null) {
  return useQuery({
    queryKey: ["workflow", "run", id],
    queryFn: async () =>
      (await apiFetch<Ejecucion>(`/api/admin/workflow/runs/${id}`)).data,
    enabled: Boolean(id),
  });
}
