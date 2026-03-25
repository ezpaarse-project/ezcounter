import { defineConfig } from 'vitest/config';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    setupFiles: ['./__tests__/setup.ts'],
  },
});
