import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas E2E de los flujos del brief. Corren contra el build de producción
 * (`npm run build` antes) en el puerto 3100, con Resend y WhatsApp imitados
 * por pruebas/e2e/mock-proveedores.cjs. Usan Supabase de .env.local.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local: corren solo las pruebas que no necesitan base de datos.
}

const PUERTO = 3100;
const URL = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "pruebas/e2e",
  // Comparten la base de datos: una prueba a la vez.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./pruebas/e2e/preparar.ts",
  globalTeardown: "./pruebas/e2e/limpiar.ts",
  use: {
    baseURL: URL,
    trace: "off",
    locale: "es-PE",
    timezoneId: "America/Lima",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    {
      command: "node pruebas/e2e/mock-proveedores.cjs",
      url: "http://localhost:3999/__log",
      reuseExistingServer: false,
    },
    {
      command: `npx next start -p ${PUERTO}`,
      url: URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ...(process.env as Record<string, string>),
        // En contenedores con proxy de salida, Node debe usarlo para llegar a Supabase.
        NODE_USE_ENV_PROXY: "1",
        SITIO_URL: URL,
        RESEND_API_KEY: "clave-prueba",
        RESEND_API_URL: "http://localhost:3999",
        CORREO_REMITENTE: "The Private Barber <citas@example.com>",
        WHATSAPP_TOKEN: "token-prueba",
        WHATSAPP_PHONE_NUMBER_ID: "123456",
        WHATSAPP_API_URL: "http://localhost:3999",
        WHATSAPP_APP_SECRET: "secreto-app",
        WHATSAPP_VERIFY_TOKEN: "verif-prueba",
        ADMIN_CORREO: "admin.e2e@example.com",
        ADMIN_WHATSAPP: "911111111",
        CRON_SECRET: "secreto-cron",
        AVISO_SIN_RESPUESTA_HORAS: "0",
      },
    },
  ],
});
