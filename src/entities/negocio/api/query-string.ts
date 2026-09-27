import type { FiltrosNegocios } from "../model/types";

/**
 * Arma el query string mandando solo lo que hace falta.
 *
 * Los valores en su defecto no se envían: la URL de la API queda corta y, sobre
 * todo, la clave de caché de react-query no cambia por un `estado=todos` que no
 * cambia nada. Sin esto, dos estados equivalentes producirían dos entradas de
 * caché distintas y una consulta de más.
 *
 * Vive en su propio archivo, sin importar React ni react-query, para poder
 * probarlo sin navegador ni backend (`npm run test:logic`).
 */
export function aQueryString(filtros: FiltrosNegocios): string {
  const params = new URLSearchParams();
  if (filtros.q.trim()) params.set("q", filtros.q.trim());
  if (filtros.estado !== "todos") params.set("estado", filtros.estado);
  if (filtros.actividad !== "todos") params.set("actividad", filtros.actividad);
  params.set("ordenar", filtros.ordenar);
  params.set("direccion", filtros.direccion);
  params.set("pagina", String(filtros.pagina));
  params.set("tam", String(filtros.tam));
  return params.toString();
}
