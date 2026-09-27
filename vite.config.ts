import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    // 5174 y no 5173: el panel de comercios usa el puerto por defecto de Vite,
    // y los dos se levantan a la vez cuando se prueba contra el mismo backend.
    port: 5174,
    strictPort: true,
  },
});
