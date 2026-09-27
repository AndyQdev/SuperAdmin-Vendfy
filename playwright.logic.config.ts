import { defineConfig } from "@playwright/test";

/**
 * Pruebas de lógica pura: sin navegador, sin backend, sin base.
 *
 * Corren en milisegundos, así que se pueden ejecutar en cada guardado. Acá van
 * las invariantes del código —contratos, transformaciones, y a partir de la
 * Fase 3 la integridad del grafo de nodos, que es lo que más se desincroniza
 * en silencio—.
 */
export default defineConfig({
  testDir: "./e2e/logic",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  timeout: 10_000,
});
