/**
 * Un negocio de la plataforma, con sus números.
 *
 * Espejo exacto de `NegocioResumen` en
 * `ventas-service/src/admin/services/admin-store.service.ts`. Si cambia allá,
 * cambia acá: es el contrato entre los dos proyectos y no hay generación
 * automática que los mantenga sincronizados.
 */
export interface Negocio {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  /** ISO 8601 */
  creado: string;
  propietario: string | null;
  propietarioEmail: string | null;
  ciudad: string | null;
  /** Productos publicados (los deshabilitados no cuentan) */
  productos: number;
  /** Pedidos sin contar los cancelados */
  pedidos: number;
  /** Suma de esos pedidos, en Bs */
  facturado: number;
  /** ISO 8601, o null si nunca vendió */
  ultimaVenta: string | null;
}

export interface ListadoNegocios {
  items: Negocio[];
  total: number;
  pagina: number;
  tam: number;
}

/** Lo que viaja a la API: campo y dirección por separado, como los espera. */
export interface FiltrosNegocios {
  q: string;
  estado: "activos" | "inactivos" | "todos";
  actividad: "con-ventas" | "sin-ventas" | "todos";
  ordenar: "nombre" | "creado" | "pedidos" | "facturado";
  direccion: "asc" | "desc";
  pagina: number;
  tam: number;
}

/**
 * En la dirección el orden va como UN solo filtro, `campo:direccion`.
 *
 * No es cosmético. `setFiltro` escribe en la URL con `setSearchParams`, y React
 * Router no refleja el valor recién escrito hasta el siguiente render: dos
 * llamadas seguidas en el mismo manejador hacen que la segunda parta del estado
 * viejo y borre a la primera. Además el usuario elige "mayor facturación" de
 * una vez, no un campo y después un sentido: un filtro modela mejor lo que pasa.
 */
export type OrdenNegocios =
  | "creado:desc"
  | "creado:asc"
  | "facturado:desc"
  | "pedidos:desc"
  | "nombre:asc";

/**
 * Sin anotar con `FiltrosNegocios` a propósito.
 *
 * `useFiltrosUrl` infiere el tipo de cada filtro del valor por defecto y lo
 * amplía ("" pasa a `string`, 1 pasa a `number`). Anotarlo con las uniones
 * literales de `FiltrosNegocios` rompe esa inferencia, porque una unión de
 * literales no encaja en el `Record<string, ValorFiltro>` que el hook pide.
 * El tipo estricto se recupera al armar la consulta, que es donde importa.
 */
export const FILTROS_NEGOCIOS_POR_DEFECTO = {
  q: "",
  estado: "todos",
  actividad: "todos",
  orden: "creado:desc",
  pagina: 1,
  tam: 20,
};

/** Lo que pide `POST /api/admin/stores`. */
export interface CrearNegocio {
  nombre: string;
  slug: string;
  propietarioEmail: string;
  descripcion?: string;
}
