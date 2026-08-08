import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tremorguard/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@tremorguard/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  server: {
    port: 3002,
  },
});
