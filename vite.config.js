import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  envPrefix: 'VITE_',
});
