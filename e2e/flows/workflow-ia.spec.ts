import { expect, test } from "@playwright/test";

/**
 * El Studio: el grafo y el reproductor de un turno ya ejecutado.
 *
 * Es una REPRODUCCIÓN, no una pausa en vivo: el modelo no se puede frenar a
 * mitad de una respuesta. Lo que se recorre es la traza que dejó.
 */
test.describe("workflow ia", () => {
  /**
   * Espera a que el listado RESUELVA, con datos o vacío, y dice cuántos hay.
   *
   * Contar apenas carga la página da 0 mientras se ven los esqueletos, y de ahí
   * salen tests que fallan según lo rápido que conteste el backend.
   */
  async function esperarEjecuciones(page: import("@playwright/test").Page) {
    const filas = page.getByTestId("workflow-ejecucion");
    const vacio = page.getByTestId("workflow-sin-ejecuciones");
    await expect(filas.first().or(vacio)).toBeVisible();
    return filas.count();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/workflow-ia");
    await expect(page.getByRole("heading", { name: "Workflow IA" })).toBeVisible();
  });

  test("dibuja el grafo del agente", async ({ page }) => {
    const nodos = page.getByTestId("workflow-nodo");
    await expect(nodos.first()).toBeVisible();
    // 5 de entrada + 1 modelo + 15 herramientas + 3 reglas + 2 de salida
    expect(await nodos.count()).toBeGreaterThanOrEqual(20);
  });

  test("el modelo y las herramientas están en el lienzo", async ({ page }) => {
    await expect(page.locator('[data-node-id="llm_turn"]')).toBeVisible();
    await expect(page.locator('[data-node-id="search_products"]')).toBeVisible();
    await expect(page.locator('[data-node-id="out_respuesta"]')).toBeVisible();
  });

  test("al elegir un nodo, el inspector explica qué hace", async ({ page }) => {
    await page.locator('[data-node-id="search_products"]').click();

    const inspector = page.getByRole("complementary").last();
    await expect(inspector.getByText("Buscar productos")).toBeVisible();
    await expect(inspector.getByText(/Busca en el catálogo/)).toBeVisible();
  });

  test("abrir una ejecución enciende los nodos por los que pasó", async ({ page }) => {
    // Puede no haber ninguna si nadie usó el agente: el test se salta en ese
    // caso en vez de fallar por algo que no es un defecto.
    const cuantas = await esperarEjecuciones(page);
    test.skip(cuantas === 0, "Sin turnos registrados todavía");

    await page.getByTestId("workflow-ejecucion").first().click();

    // El nodo de entrada SIEMPRE se ejecuta: si la traza se guardó, está verde.
    await expect(
      page.locator('[data-node-id="in_mensaje"][data-ejecutado="true"]'),
    ).toBeVisible();
    await expect(page.getByText(/paso \d+ de \d+/)).toBeVisible();
  });

  test("el reproductor avanza paso a paso", async ({ page }) => {
    const cuantas = await esperarEjecuciones(page);
    test.skip(cuantas === 0, "Sin turnos registrados");

    await page.getByTestId("workflow-ejecucion").first().click();
    await expect(page.getByText(/paso \d+ de \d+/)).toBeVisible();

    await page.getByRole("button", { name: "Paso a paso" }).click();
    await expect(page.getByText(/paso 1 de \d+/)).toBeVisible();

    // En el paso 1 solo el primer nodo está encendido.
    await expect(
      page.locator('[data-testid="workflow-nodo"][data-ejecutado="true"]'),
    ).toHaveCount(1);

    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText(/paso 2 de \d+/)).toBeVisible();
  });

  test("el flujo elegido queda en la dirección", async ({ page }) => {
    await page.getByLabel("Flujo").click();
    await page.getByRole("option", { name: "Omnibox del comerciante" }).click();
    await expect(page).toHaveURL(/flow=omnibox_comerciante/);
  });

  /** G8: cómo le va al asistente, desde las trazas (y la vista queda en la dirección). */
  test("las métricas del asistente: por dónde se resolvió cada frase y los callejones", async ({ page }) => {
    await page.goto("/workflow-ia?flow=omnibox_comerciante");
    await page.getByTestId("workflow-vista-metricas").click();
    await expect(page).toHaveURL(/vista=metricas/);
    const metricas = page.getByTestId("workflow-metricas");
    await expect(metricas).toBeVisible();
    // Con frases en el período, las rutas y los callejones; sin frases, lo dice.
    await expect(metricas.getByTestId("metricas-rutas").or(metricas.getByText("No hubo frases en este período."))).toBeVisible();
    await page.getByRole("button", { name: "30 días" }).click();
    await expect(page).toHaveURL(/dias=30/);
    await page.getByTestId("workflow-vista-grafo").click();
    await expect(page.getByTestId("workflow-lienzo")).toBeVisible();
  });
});
