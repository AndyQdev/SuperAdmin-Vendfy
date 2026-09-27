import { expect, test as setup } from "@playwright/test";

import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers/env";

const ARCHIVO_SESION = "e2e/.auth/session.json";

/**
 * Inicia sesión una vez y guarda el estado del navegador.
 *
 * El resto de los tests arrancan ya autenticados. Pasar por el formulario en
 * cada uno agregaría segundos a cada test y, peor, haría que un cambio en el
 * login rompiera toda la suite en vez de un solo test.
 */
setup("autenticar como super admin", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Correo").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  // Que la URL cambie no alcanza: hay que ver la pantalla cargada, si no se
  // guardaría una sesión a medio establecer.
  await expect(page).toHaveURL(/\/negocios/);
  await expect(page.getByRole("heading", { name: "Negocios" })).toBeVisible();

  await page.context().storageState({ path: ARCHIVO_SESION });
});
