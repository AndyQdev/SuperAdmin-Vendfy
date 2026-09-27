import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type { ListadoUsuarios } from "../model/types";

export interface ConsultaUsuarios {
  q: string;
  rol: string;
  pagina: number;
  tam: number;
}

export function useUsuarios(consulta: ConsultaUsuarios) {
  return useQuery({
    queryKey: ["usuarios", consulta],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (consulta.q.trim()) params.set("q", consulta.q.trim());
      if (consulta.rol !== "todos") params.set("rol", consulta.rol);
      params.set("pagina", String(consulta.pagina));
      params.set("tam", String(consulta.tam));
      const respuesta = await apiFetch<ListadoUsuarios>(
        `/api/admin/users?${params}`,
      );
      return respuesta.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["usuarios", "roles"],
    queryFn: async () => (await apiFetch<string[]>("/api/admin/users/roles")).data,
    // Los roles cambian casi nunca: no vale repreguntarlos en cada visita.
    staleTime: Infinity,
  });
}
