// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  define: {
    "import.meta.env.VITE_API_BASE": JSON.stringify("/api"),
    "import.meta.env.REACT_APP_API_BASE": JSON.stringify(""),
  },
});
