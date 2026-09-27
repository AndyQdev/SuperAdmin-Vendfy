/**
 * Espejo de `MetricasPlataforma` en
 * `ventas-service/src/admin/services/admin-metrics.service.ts`.
 */
export interface PuntoSerie {
  /** YYYY-MM-DD en hora de Bolivia */
  fecha: string;
  facturado: number;
  pedidos: number;
}

export interface MetricasPlataforma {
  periodo: { desde: string; hasta: string; dias: number };
  kpis: {
    facturado: number;
    pedidos: number;
    ticketPromedio: number;
    negociosConVentas: number;
    negociosTotales: number;
    /** % contra el período anterior. null = antes no hubo nada con qué comparar */
    variacionFacturado: number | null;
    variacionPedidos: number | null;
  };
  serie: PuntoSerie[];
  porCanal: { canal: string; pedidos: number; facturado: number }[];
  porNegocio: {
    id: string;
    nombre: string;
    pedidos: number;
    facturado: number;
  }[];
}

export const PERIODOS = [7, 30, 90, 365] as const;
export type Periodo = (typeof PERIODOS)[number];

export const ETIQUETA_PERIODO: Record<Periodo, string> = {
  7: "Últimos 7 días",
  30: "Últimos 30 días",
  90: "Últimos 90 días",
  365: "Último año",
};

/**
 * Nombres legibles de los canales. El backend devuelve el valor crudo de la
 * base, que incluye valores antiguos como "chat" que ya no se escriben pero
 * siguen en pedidos viejos.
 */
export const NOMBRE_CANAL: Record<string, string> = {
  system: "Mostrador",
  web: "Tienda web",
  app: "App",
  storefront: "Tienda propia",
  whatsapp: "WhatsApp",
  live: "Venta en vivo",
  campaign: "Campaña",
  chat: "Chat (histórico)",
};
