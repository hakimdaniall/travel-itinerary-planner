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
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // UI component library
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
          ],

          // Form and data handling
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],

          // PDF generation
          "pdf-vendor": ["jspdf", "jspdf-autotable"],

          // Drag and drop
          "dnd-vendor": ["@hello-pangea/dnd"],

          // Utilities
          "utils-vendor": [
            "date-fns",
            "clsx",
            "tailwind-merge",
            "lucide-react",
            "sonner",
          ],
        },
      },
    },
    // Increase chunk size warning limit if needed
    chunkSizeWarningLimit: 600,
  },
}));
