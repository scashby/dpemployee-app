import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['pdf-lib']
  },
  build: {
    rollupOptions: {
      external: ['pdf-lib']  // ✅ Tell Vite not to try to bundle this module
    }
  }
});
