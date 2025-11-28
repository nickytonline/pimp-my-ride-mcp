import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/widgets',
    lib: {
      entry: {
        'car-build-card': resolve(__dirname, 'src/widgets/car-build-card/index.tsx'),
        'build-list': resolve(__dirname, 'src/widgets/build-list/index.tsx'),
        'persona-card': resolve(__dirname, 'src/widgets/persona-card/index.tsx'),
        'options-grid': resolve(__dirname, 'src/widgets/options-grid/index.tsx'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
    cssCodeSplit: false,
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/mcp': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
