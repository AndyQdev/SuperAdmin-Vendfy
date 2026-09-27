import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type { MetricasPlataforma, Periodo } from "../model/types";

export function useMetricas(dias: Periodo) {
  return useQuery({
    queryKey: ["metricas", "overview", dias],
    queryFn: async () => {
      const respuesta = await apiFetch<MetricasPlataforma>(
        `/api/admin/metrics/overview?dias=${dias}`,
      );
      return respuesta.data;
    },
  });
}
