import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@schofy/shared': path.resolve(__dirname, '../shared/src')
    }
  },
  server: {
    port: 4201,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('jspdf') || id.includes('xlsx') || id.includes('html2canvas')) return 'vendor-export';
            if (id.includes('dompurify')) return 'vendor-sanitize';
          }
        }
      }
    }
  }
});
