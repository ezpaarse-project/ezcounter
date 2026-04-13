import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    setupFiles: ['./__tests__/setup.ts'],
  },
});
