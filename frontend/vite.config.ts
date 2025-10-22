// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,   // ให้ dev server รันที่พอร์ต 3000
    host: true,   // เปิดให้เข้าจากภายนอก container ได้ (ถ้าใช้ Docker)
  },
  preview: {
    port: 3000,   // ให้ `vite preview` ใช้พอร์ต 3000 ด้วย
    host: true,
  },
  define: {
    "import.meta.env.VITE_API_BASE": JSON.stringify("http://localhost:8081"),
    "import.meta.env.REACT_APP_API_BASE": JSON.stringify(""),
  },
});
