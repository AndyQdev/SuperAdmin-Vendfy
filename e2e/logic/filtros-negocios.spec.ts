import { expect, test } from "@playwright/test";

import type { FiltrosNegocios } from "../../src/entities/negocio/model/types";
import { aQueryString } from "../../src/entities/negocio/api/query-string";

/** La consulta tal como la arma la pantalla sin que nadie toque un filtro. */
const consultaBase = (): FiltrosNegocios => ({
  q: "",
  estado: "todos",
  actividad: "todos",
  ordenar: "creado",
  direccion: "desc",
  pagina: 1,
  tam: 20,
});

/**
 * El armado del query string.
 *
 * Importa por dos motivos que no se ven en la pantalla: la dirección queda
 * corta y legible, y —sobre todo— la clave de caché de react-query no cambia
 * por filtros que no cambian nada. Sin esto, `estado=todos` y "sin estado"
 * serían dos entradas de caché distintas y una consulta de más.
 */
test("los valores por defecto no se mandan", () => {
  const qs = aQueryString(consultaBase());
  expect(qs).not.toContain("q=");
  expect(qs).not.toContain("estado=");
  expect(qs).not.toContain("actividad=");
  // El orden y la página sí van siempre: la API necesita saberlos.
  expect(qs).toContain("ordenar=creado");
  expect(qs).toContain("direccion=desc");
  expect(qs).toContain("pagina=1");
});

test("un filtro puesto sí se manda", () => {
  const qs = aQueryString({ ...consultaBase(), q: "abarrotes", estado: "activos" });
  expect(qs).toContain("q=abarrotes");
  expect(qs).toContain("estado=activos");
});

test("la busqueda se recorta", () => {
  const qs = aQueryString({ ...consultaBase(), q: "   don juan   " });
  expect(qs).toContain("q=don+juan");
});

test("una busqueda de solo espacios no se manda", () => {
  const qs = aQueryString({ ...consultaBase(), q: "    " });
  expect(qs).not.toContain("q=");
});
