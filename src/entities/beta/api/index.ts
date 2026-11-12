import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/shared/api/client";
import type {
  CambioCohorte,
  BetaDeNegocio,
  Cohorte,
  EstadoIncidencia,
  FiltrosReportes,
  FilaComparacion,
  NuevaCohorte,
  Reportes,
  ResultadoAgregar,
  Severidad,
  TableroCohorte,
} from "../model/types";

export const clavesBeta = {
  todo: ["beta"] as const,
  cohortes: ["beta", "cohortes"] as const,
  tablero: (id: string) => ["beta", "tablero", id] as const,
  reportes: (f: FiltrosReportes) => ["beta", "reportes", f] as const,
};

export function useCohortes() {
  return useQuery({
    queryKey: clavesBeta.cohortes,
    queryFn: async () => (await apiFetch<Cohorte[]>("/api/admin/beta/cohortes")).data ?? [],
  });
}

export function useTablero(id: string | undefined) {
  return useQuery({
    queryKey: clavesBeta.tablero(id ?? ""),
    queryFn: async () => (await apiFetch<TableroCohorte>(`/api/admin/beta/cohortes/${id}`)).data!,
    enabled: Boolean(id),
  });
}

export function useComparacion() {
  return useQuery({
    queryKey: ["beta", "comparacion"] as const,
    queryFn: async () => (await apiFetch<FilaComparacion[]>("/api/admin/beta/comparacion")).data ?? [],
  });
}

export function useBetaDeNegocio(storeId: string | undefined) {
  return useQuery({
    queryKey: ["beta", "negocio", storeId] as const,
    queryFn: async () => (await apiFetch<BetaDeNegocio>(`/api/admin/beta/negocios/${storeId}`)).data!,
    enabled: Boolean(storeId),
    // Sin la migración (503) la ficha del negocio no se rompe: solo no muestra la beta.
    retry: false,
  });
}

export function useReportes(filtros: FiltrosReportes) {
  return useQuery({
    queryKey: clavesBeta.reportes(filtros),
    queryFn: async () => {
      const qs = new URLSearchParams(Object.entries(filtros).filter(([, v]) => Boolean(v)) as [string, string][]);
      return (await apiFetch<Reportes>(`/api/admin/beta/reportes?${qs}`)).data!;
    },
  });
}

/**
 * Cualquier cambio invalida todo lo de la beta: una incidencia resuelta cambia
 * el tablero y el listado de cohortes, y son pocas consultas.
 */
function useMutacionBeta<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: clavesBeta.todo }) });
}

export const useCrearCohorte = () =>
  useMutacionBeta(async (d: NuevaCohorte) => (await apiFetch<Cohorte>("/api/admin/beta/cohortes", { method: "POST", body: d })).data!);

export const useEditarCohorte = (id: string) =>
  useMutacionBeta(async (d: CambioCohorte) => (await apiFetch<Cohorte>(`/api/admin/beta/cohortes/${id}`, { method: "PATCH", body: d })).data!);

export const useAgregarParticipantes = (id: string) =>
  useMutacionBeta(
    async (storeIds: string[]) =>
      (await apiFetch<ResultadoAgregar>(`/api/admin/beta/cohortes/${id}/participantes`, { method: "POST", body: { storeIds } })).data!,
  );

export const useQuitarParticipante = (id: string) =>
  useMutacionBeta(async (storeId: string) => apiFetch(`/api/admin/beta/cohortes/${id}/participantes/${storeId}`, { method: "DELETE" }));

export const useNotasParticipante = (id: string) =>
  useMutacionBeta(async ({ storeId, notas }: { storeId: string; notas: string }) =>
    apiFetch(`/api/admin/beta/cohortes/${id}/participantes/${storeId}`, { method: "PATCH", body: { notas } }),
  );

export const useEditarIncidencia = () =>
  useMutacionBeta(
    async ({ id, ...cambio }: { id: string; estado?: EstadoIncidencia; severidad?: Severidad; notas?: string }) =>
      apiFetch(`/api/admin/beta/incidencias/${id}`, { method: "PATCH", body: cambio }),
  );

export const useCrearIncidencia = () =>
  useMutacionBeta(
    async (d: { storeId: string; titulo: string; descripcion?: string; severidad?: Severidad }) =>
      apiFetch("/api/admin/beta/incidencias", { method: "POST", body: d }),
  );
