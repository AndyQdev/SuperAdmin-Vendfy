import { expect, test } from "@playwright/test";

import { COMERCIO_EMAIL, COMERCIO_PASSWORD } from "../helpers/env";

/**
 * Quién entra al panel de plataforma.
 *
 * Es la prueba más importante del proyecto: este panel ve la facturación de
 * todos los comercios. Que un comerciante con credenciales válidas NO pase es
 * más importante que cualquier funcionalidad que tenga adentro.
 *
 * Corre sin la sesión guardada (`storageState: undefined`) porque justamente
 * prueba el camino de entrada.
 */
test.describe("acceso", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sin sesión, cualquier ruta lleva al login", async ({ page }) => {
    await page.goto("/negocios");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Vendfy Plataforma" }),
    ).toBeVisible();
  });

  test("una cuenta de comercio NO entra", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo").fill(COMERCIO_EMAIL);
    await page.getByLabel("Contraseña").fill(COMERCIO_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toContainText(
      /no tiene acceso al panel/i,
    );
    // Y se queda donde estaba: ni un parpadeo dentro del panel.
    await expect(page).toHaveURL(/\/login/);
  });

  test("credenciales incorrectas muestran el error y no entran", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Correo").fill("no-existe@vendfy.shop");
    await page.getByLabel("Contraseña").fill("incorrecta");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
