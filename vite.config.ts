import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: parseInt(process.env.FRONTEND_PORT || "5173", 10),
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || "3001"}`,
        changeOrigin: false,
      },
      "/uploads": {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || "3001"}`,
        changeOrigin: false,
      },
    },
  },
});
