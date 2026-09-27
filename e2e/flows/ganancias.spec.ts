import { expect, test } from "@playwright/test";

test.describe("ganancias", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ganancias");
    await expect(page.getByRole("heading", { name: "Ganancias" })).toBeVisible();
  });

  test("muestra los cuatro KPIs y el gráfico", async ({ page }) => {
    // Acotado a la fila de KPIs: "Facturado" y "Pedidos" también son
    // cabeceras de la tabla de abajo, y sin acotar la búsqueda es ambigua.
    const kpis = page.getByTestId("kpis");
    for (const kpi of ["Facturado", "Pedidos", "Ticket promedio", "Negocios con ventas"]) {
      await expect(kpis.getByText(kpi, { exact: true })).toBeVisible();
    }
    await expect(page.getByTestId("grafico-facturacion")).toBeVisible();
  });

  test("cambiar el período recarga y queda en la dirección", async ({ page }) => {
    await page.getByLabel("Período").click();
    await page.getByRole("option", { name: "Último año" }).click();

    await expect(page).toHaveURL(/dias=365/);
    // Con un año de ventana los datos sembrados sí caen adentro: la tabla por
    // negocio tiene que traer filas.
    await expect(page.getByTestId("ganancia-fila").first()).toBeVisible();
  });

  test("el período viaja en la dirección al recargar", async ({ page }) => {
    await page.goto("/ganancias?dias=90");
    await expect(page.getByLabel("Período")).toContainText("90 días");
  });
});
