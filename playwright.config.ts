import { defineConfig, devices } from "@playwright/test";

import { API_URL, PUERTO_APP } from "./e2e/helpers/env";

/**
 * Pruebas de extremo a extremo del panel de plataforma: navegador real contra
 * la app local, y la app contra un backend de Vendfy real.
 *
 * `webServer` levanta la app sola, así que no hace falta tener `npm run dev`
 * corriendo aparte; si ya está abierto, lo reutiliza.
 *
 * El backend NO lo levanta Playwright a propósito: lo corre el desarrollador
 * (`node dist/main`) y puede estar apuntando a datos que no queremos que un
 * test arranque o detenga por su cuenta. Si no está arriba, los tests fallan
 * con un mensaje claro en vez de colgarse.
 *
 * Los tests de lógica pura —sin navegador ni API— viven en
 * `playwright.logic.config.ts` y corren con `npm run test:logic`.
 */
export default defineConfig({
  testDir: "./e2e",
  // Los de lógica tienen su propia configuración y no deben correr acá: no
  // necesitan navegador y duplicarlos solo los hace más lentos.
  testIgnore: "**/logic/**",

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  // Serial: todos comparten la misma sesión y los mismos datos del backend.
  workers: 1,
  fullyParallel: false,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [["github"], ["list"]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: `http://localhost:${PUERTO_APP}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    // Inicia sesión una vez y guarda el estado; el resto de los tests parten
    // de ahí en vez de pasar por el formulario cada uno.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/session.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run dev",
    port: PUERTO_APP,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // La app tiene que apuntar al mismo backend contra el que se prueba.
    env: { VITE_API_URL: API_URL },
  },
});
