// oxlint-disable-next-line import/no-nodejs-modules
import { resolve } from 'node:path';

import fastify from '@fastify/vite/plugin';
import i18n from '@intlify/unplugin-vue-i18n/vite';
import vue from '@vitejs/plugin-vue';
import fonts from 'unplugin-fonts/vite';
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
      root: import.meta.dirname,
      routesFolder: ['pages/'],
    }),

    i18n({
      include: resolve(import.meta.dirname, 'locales/**'),
    }),

    fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            styles: ['normal', 'italic'],
            // oxlint-disable-next-line no-magic-numbers
            weights: [100, 300, 400, 500, 700, 900],
          },
        ],
      },
    }),

    vue(),

    vuetify(),
  ],

  root: import.meta.dirname,
});
