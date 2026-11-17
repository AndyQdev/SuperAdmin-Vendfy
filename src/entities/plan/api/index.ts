import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type { CatalogoPlanes, DatosPlan, DatosSuscripcion, Plan, PlanDelNegocio } from "../model/types";

export const clavesPlanes = {
  todo: ["planes"] as const,
  listado: ["planes", "listado"] as const,
  negocio: (storeId: string) => ["planes", "negocio", storeId] as const,
};

export function usePlanes() {
  return useQuery({
    queryKey: clavesPlanes.listado,
    queryFn: async () => (await apiFetch<Plan[]>("/api/admin/planes")).data ?? [],
  });
}

export function useCatalogoPlanes() {
  return useQuery({
    queryKey: [...clavesPlanes.todo, "catalogo"],
    queryFn: async () => (await apiFetch<CatalogoPlanes>("/api/admin/planes/catalogo")).data!,
    staleTime: Infinity,
  });
}

export function useGuardarPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: DatosPlan & { id?: string }) =>
      (
        await apiFetch<Plan>(id ? `/api/admin/planes/${id}` : "/api/admin/planes", {
          method: id ? "PATCH" : "POST",
          body: id ? { ...datos, codigo: undefined } : datos,
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: clavesPlanes.todo }),
  });
}

export function usePlanDelNegocio(storeId: string | undefined) {
  return useQuery({
    queryKey: clavesPlanes.negocio(storeId ?? ""),
    queryFn: async () => (await apiFetch<PlanDelNegocio>(`/api/admin/planes/negocio/${storeId}`)).data!,
    enabled: Boolean(storeId),
  });
}

export function useGuardarSuscripcion(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: DatosSuscripcion) =>
      (await apiFetch<PlanDelNegocio>(`/api/admin/planes/negocio/${storeId}`, { method: "PUT", body: datos })).data!,
    onSuccess: (data) => {
      qc.setQueryData(clavesPlanes.negocio(storeId), data);
      qc.invalidateQueries({ queryKey: clavesPlanes.listado });
    },
  });
}

export function useActivarUsuarioNegocio(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, activo }: { userId: string; activo: boolean }) =>
      (await apiFetch<PlanDelNegocio>(`/api/admin/planes/negocio/${storeId}/usuarios/${userId}`, { method: "PATCH", body: { activo } }))
        .data!,
    onSuccess: (data) => {
      qc.setQueryData(clavesPlanes.negocio(storeId), data);
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
