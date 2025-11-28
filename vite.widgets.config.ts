import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Widget entry points - each builds to a self-contained ESM bundle
const widgetEntries = {
  "car-build-card": resolve(__dirname, "src/widgets/car-build-card/index.tsx"),
  "build-list": resolve(__dirname, "src/widgets/build-list/index.tsx"),
  "persona-card": resolve(__dirname, "src/widgets/persona-card/index.tsx"),
  "options-grid": resolve(__dirname, "src/widgets/options-grid/index.tsx"),
};

export default defineConfig({
  plugins: [react()],
  // Serve public folder for test pages
  publicDir: "public",
  build: {
    outDir: "dist/widgets",
    // Build widgets with shared React chunk
    // The shared chunk will be served alongside each widget
    rollupOptions: {
      input: widgetEntries,
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "vendor.js",
        assetFileNames: "[name][extname]",
      },
    },
    // Inline CSS into JS bundles
    cssCodeSplit: false,
    // Minify for production
    minify: true,
  },
  server: {
    port: 5173,
    // Allow reverse tunnel hosts (e.g., Pomerium Zero SSH tunnels)
    allowedHosts: ["ssh", ".pomerium.app", ".pomerium.io"],
    // Serve built widget files from dist/widgets at /widgets path
    fs: {
      allow: ["dist/widgets", "src"],
    },
    proxy: {
      "/mcp": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/widgets": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
