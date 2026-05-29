import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    clearMocks: true,
    setupFiles: ['./__tests__/setup.ts'],
  },
});
