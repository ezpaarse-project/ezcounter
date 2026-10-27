import { resolve } from 'node:path';

import fastifyVue from '@fastify/vue/plugin';
import viteVue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// Vite is only used for the client
export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: resolve(import.meta.dirname, 'dist'),
  },

  plugins: [viteVue(), fastifyVue()],

  root: resolve(import.meta.dirname, 'src/client'),
});
