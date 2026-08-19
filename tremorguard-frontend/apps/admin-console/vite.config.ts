import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@tremorguard/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
        '@tremorguard/utils': path.resolve(__dirname, '../../packages/utils/src'),
      },
    },
    server: {
      port: 3002,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    define: {
      __API_BASE__: JSON.stringify(env.VITE_API_BASE_URL ?? '/api/v1'),
    },
  };
});