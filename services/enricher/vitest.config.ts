import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [tsconfigPaths()],
});
