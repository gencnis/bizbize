import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// build v2
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { port: 5174, host: true },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
