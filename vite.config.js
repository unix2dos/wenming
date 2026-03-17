import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
  },
  envPrefix: 'VITE_',
});
