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
  // ⚠️ SIN manualChunks: dividir React de sus dependencias CJS (radix, react-query,
  // next-themes, use-sync-external-store, etc.) rompe el bundle con
  // "Cannot read properties of undefined (reading 'createContext'/'useState')".
  // El code-splitting eficaz y seguro lo hace React.lazy por ruta en App.tsx:
  // los paquetes pesados (recharts, exceljs…) quedan en chunks compartidos que
  // SOLO se descargan al abrir la página que los usa.
}));