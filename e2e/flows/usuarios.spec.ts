import { expect, test } from "@playwright/test";

test.describe("usuarios", () => {
  const filas = (page: import("@playwright/test").Page) =>
    page.getByTestId("usuario-fila");

  test.beforeEach(async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
    await expect(filas(page).first()).toBeVisible();
  });

  test("lista usuarios de toda la plataforma", async ({ page }) => {
    expect(await filas(page).count()).toBeGreaterThan(0);
  });

  test("buscar filtra y queda en la dirección", async ({ page }) => {
    await page.getByLabel("Buscar usuario").fill("zzz-no-existe-zzz");
    await expect(page.getByTestId("usuarios-vacio")).toBeVisible();
    await expect(page).toHaveURL(/q=zzz-no-existe-zzz/);
  });

  test("filtrar por rol reduce el listado", async ({ page }) => {
    const todos = await filas(page).count();

    await page.getByLabel("Rol").click();
    await page.getByRole("option", { name: "Super Administrador" }).click();

    await expect(page).toHaveURL(/rol=Super/);
    expect(await filas(page).count()).toBeLessThanOrEqual(todos);
  });

  test("nunca expone la contraseña", async ({ page }) => {
    // El backend no la selecciona; esto confirma que tampoco se filtró por
    // algún atajo del camino.
    const respuesta = await page.request.get(
      `${process.env.E2E_API_URL ?? "http://localhost:3001"}/api/admin/users`,
      {
        headers: {
          Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem("vendfyAdminToken"))}`,
        },
      },
    );
    expect(JSON.stringify(await respuesta.json())).not.toContain("password");
  });
});
