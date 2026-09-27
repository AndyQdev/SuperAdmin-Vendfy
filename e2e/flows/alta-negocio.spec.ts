import { expect, test } from "@playwright/test";

/**
 * El alta de un negocio.
 *
 * NO crea uno de verdad: probar el camino feliz dejaría basura en la base
 * compartida en cada corrida, y borrarla después obligaría a un endpoint de
 * borrado que todavía no existe. Se prueban las validaciones y el rechazo, que
 * es donde están los errores.
 */
test.describe("alta de negocio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/negocios");
    await page.getByRole("button", { name: "Nuevo negocio" }).click();
    await expect(
      page.getByRole("heading", { name: "Registrar un negocio" }),
    ).toBeVisible();
  });

  test("el slug se sugiere desde el nombre, sin acentos", async ({ page }) => {
    await page.getByLabel("Nombre").fill("Abarrotes Doña Rosa");
    await expect(page.getByLabel("Dirección (slug)")).toHaveValue(
      "abarrotes-dona-rosa",
    );
  });

  test("editar el slug a mano lo desengancha del nombre", async ({ page }) => {
    await page.getByLabel("Nombre").fill("Tienda Uno");
    await page.getByLabel("Dirección (slug)").fill("mi-slug-propio");
    await page.getByLabel("Nombre").fill("Tienda Dos");
    await expect(page.getByLabel("Dirección (slug)")).toHaveValue("mi-slug-propio");
  });

  test("un correo sin usuario registrado es rechazado", async ({ page }) => {
    await page.getByLabel("Nombre").fill("E2E-AUTO Negocio");
    await page.getByLabel("Correo del propietario").fill("nadie-aqui@vendfy.shop");
    await page.getByRole("button", { name: "Crear" }).click();

    await expect(page.getByText(/No hay ningún usuario registrado/)).toBeVisible();
  });
});
