// oxlint-disable-next-line import/no-nodejs-modules
import { resolve } from 'node:path';

import fastify from '@fastify/vite/plugin';
import vue from '@vitejs/plugin-vue';
import autoimport from 'unplugin-auto-import/vite';
import components from 'unplugin-vue-components/vite';
import devTools from 'vite-plugin-vue-devtools';
import vuetify from 'vite-plugin-vuetify';
import { defineConfig } from 'vitest/config';
import router from 'vue-router/vite';

// Vite is only used for the client
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, '../../dist'),
  },

  plugins: [
    fastify({ spa: true }),

    router({
      dts: '.vite/routes.d.ts',
      routesFolder: ['pages/'],
    }),

    vue(),

    components({
      dirs: ['components/'],
      dts: '.vite/components.d.ts',
    }),

    autoimport({
      dirs: ['composables/'],
      dts: '.vite/auto-imports.d.ts',
      imports: ['vue', 'vue-i18n', 'vue-router'],
    }),

    vuetify(),

    devTools(),
  ],

  root: import.meta.dirname,
});
