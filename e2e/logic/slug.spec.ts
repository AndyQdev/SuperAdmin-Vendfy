import { expect, test } from "@playwright/test";

import { sugerirSlug } from "../../src/features/negocios/model/slug";

/**
 * El slug es la dirección pública de una tienda: si sale con un acento o un
 * espacio, el backend lo rechaza y quien da el alta no entiende por qué.
 */
test("saca acentos y espacios", () => {
  expect(sugerirSlug("Abarrotes Doña Rosa")).toBe("abarrotes-dona-rosa");
});

test("colapsa separadores y no deja guiones en los bordes", () => {
  expect(sugerirSlug("  ¡¡Tienda   del  Sol!!  ")).toBe("tienda-del-sol");
});

test("respeta el tope de 100 caracteres del backend", () => {
  expect(sugerirSlug("a".repeat(200)).length).toBe(100);
});

test("un nombre sin letras no revienta", () => {
  expect(sugerirSlug("¿¡!?")).toBe("");
});
