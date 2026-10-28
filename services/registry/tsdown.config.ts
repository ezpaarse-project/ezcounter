import { defineConfig } from 'tsdown';

import { nodeConfigPlugin } from '@ezcounter/rolldown/config';

// Rolldown is only used for the server
export default defineConfig([
  // App
  {
    clean: false,
    entry: 'src/app.ts',
    format: 'esm',
    minify: true,
    outDir: 'dist/',
    platform: 'node',
    sourcemap: true,
  },
  // Config - env can be compiled and default is JSON5
  {
    clean: false,
    entry: ['config/custom-environment-variables.ts', 'config/default.json'],
    format: 'esm',
    outDir: 'dist/config/',
    platform: 'node',
    plugins: [nodeConfigPlugin()],
  },
]);
