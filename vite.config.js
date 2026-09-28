import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  optimizeDeps: {
    exclude: ['jeep-sqlite']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2019'
  }
});
