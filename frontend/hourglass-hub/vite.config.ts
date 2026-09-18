import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // ⚡ SPLIT DE VENDORS: separa las librerías pesadas en chunks cacheados,
    // así el navegador no descarga todo de nuevo cuando cambia nuestro código.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) {
            return "react-vendor";
          }
          if (id.includes("react-router") || id.includes("react-hook-form") || id.includes("@tanstack")) {
            return "react-vendor";
          }
          // next-themes usa require('react') (CJS): DEBE compartir chunk con React
          // o se rompe con "Cannot read properties of undefined (reading 'createContext')"
          if (id.includes("next-themes")) {
            return "react-vendor";
          }
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) {
            return "charts";
          }
          if (id.includes("framer-motion")) {
            return "animations";
          }
          if (id.includes("date-fns")) {
            return "date";
          }
          if (id.includes("lucide-react") || id.includes("react-icons")) {
            return "icons";
          }
          // 📦 UI primitives (radix + compañeros) — se reutilizan en todas las páginas
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("embla-carousel") ||
              id.includes("vaul") || id.includes("sonner") || id.includes("react-day-picker") ||
              id.includes("react-resizable-panels") || id.includes("input-otp")) {
            return "ui-vendor";
          }
          // 📊 Librerías pesadas de reportes — SOLO se descargan al entrar a
          // la página que las usa (ej. Projects), no en la carga inicial.
          if (id.includes("exceljs") || id.includes("file-saver") || id.includes("/xlsx") ||
              id.includes("jspdf") || id.includes("jszip") || id.includes("xlsx-populate")) {
            return "reports";
          }
          if (id.includes("@supabase")) {
            return "supabase";
          }
          return "vendor";
        },
      },
    },
  },
}));
