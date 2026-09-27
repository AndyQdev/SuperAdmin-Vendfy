/**
 * Configuración de las pruebas, en un solo lugar y con fallo temprano.
 *
 * Una variable que falta tiene que reventar acá con un mensaje que diga cuál,
 * y no diez minutos después como un `expect` que no encuentra un elemento
 * porque la app nunca pudo autenticarse.
 */

function requerida(nombre: string, porDefecto?: string): string {
  const valor = process.env[nombre] ?? porDefecto;
  if (!valor) {
    throw new Error(
      `Falta la variable ${nombre}. Definila en el entorno antes de correr los tests.`,
    );
  }
  return valor;
}

/** Puerto de la app bajo prueba. El mismo que fija vite.config.ts. */
export const PUERTO_APP = 5174;

/**
 * Backend contra el que se prueba. Por defecto el local de desarrollo.
 * Para apuntar a otra instancia: `E2E_API_URL=http://localhost:3099 npm run test:e2e`
 */
export const API_URL = requerida("E2E_API_URL", "http://localhost:3001");

/**
 * Cuenta de plataforma. Las credenciales del seeder sirven en desarrollo; en
 * CI se pasan por variables.
 */
export const ADMIN_EMAIL = requerida("E2E_ADMIN_EMAIL", "super@admin.com");
export const ADMIN_PASSWORD = requerida("E2E_ADMIN_PASSWORD", "12345678");

/**
 * Una cuenta de comerciante, para comprobar que NO entra. Es la prueba más
 * importante del panel: que el rol se verifica de verdad.
 */
export const COMERCIO_EMAIL = requerida("E2E_STORE_EMAIL", "juan@abarrotes.com");
export const COMERCIO_PASSWORD = requerida("E2E_STORE_PASSWORD", "12345678");
