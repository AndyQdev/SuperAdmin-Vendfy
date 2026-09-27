import { expect, test } from "@playwright/test";

/**
 * El listado de negocios y sus filtros.
 *
 * Los filtros se prueban a través de la DIRECCIÓN además de la pantalla: que
 * queden escritos en la URL es la mitad del comportamiento —volver con el botón
 * de atrás tiene que restaurarlos— y es lo primero que se rompe al tocar el
 * hook.
 */
test.describe("negocios", () => {
  /**
   * Las filas de datos, nunca las del esqueleto de carga. Contar `tbody tr` a
   * secas mezcla las dos y da números que cambian según lo rápido que conteste
   * el backend.
   */
  const filas = (page: import("@playwright/test").Page) =>
    page.getByTestId("negocio-fila");

  test.beforeEach(async ({ page }) => {
    await page.goto("/negocios");
    await expect(page.getByRole("heading", { name: "Negocios" })).toBeVisible();
    // Esperar a que haya datos: si no, cada test arranca contra el esqueleto.
    await expect(filas(page).first()).toBeVisible();
  });

  test("lista negocios con sus números", async ({ page }) => {
    expect(await filas(page).count()).toBeGreaterThan(0);

    // La cabecera cuenta lo mismo que la tabla muestra.
    await expect(page.getByText(/negocios? en la plataforma/)).toBeVisible();
  });

  test("buscar filtra y queda en la dirección", async ({ page }) => {
    const antes = await filas(page).count();

    await page.getByLabel("Buscar negocio").fill("zzz-no-existe-zzz");

    // La búsqueda es diferida: se espera al estado vacío, no a un tiempo fijo.
    await expect(page.getByTestId("negocios-vacio")).toBeVisible();
    await expect(page).toHaveURL(/q=zzz-no-existe-zzz/);

    await page.getByRole("button", { name: "Limpiar", exact: true }).click();
    await expect(filas(page)).toHaveCount(antes);
    // Al limpiar, el filtro desaparece de la dirección en vez de quedar vacío.
    await expect(page).not.toHaveURL(/q=/);
  });

  test("el filtro de actividad reduce el listado", async ({ page }) => {
    const todos = await filas(page).count();

    await page.getByLabel("Actividad").click();
    await page.getByRole("option", { name: "Con ventas" }).click();

    await expect(page).toHaveURL(/actividad=con-ventas/);
    const conVentas = await filas(page).count();
    expect(conVentas).toBeLessThanOrEqual(todos);
  });

  test("el orden viaja en la dirección", async ({ page }) => {
    await page.getByLabel("Ordenar").click();
    await page.getByRole("option", { name: "Mayor facturación" }).click();

    await expect(page).toHaveURL(/orden=facturado/);
    await expect(filas(page).first()).toBeVisible();
  });

  test("recargar conserva los filtros", async ({ page }) => {
    await page.getByLabel("Estado").click();
    // exact: sin esto "Activos" también casa con "Inactivos".
    await page.getByRole("option", { name: "Activos", exact: true }).click();
    await expect(page).toHaveURL(/estado=activos/);

    await page.reload();

    // Después de recargar, el select sigue mostrando lo elegido: la dirección
    // es la fuente de verdad, no un estado en memoria que se pierde.
    await expect(page.getByLabel("Estado")).toContainText("Activos");
  });
});
