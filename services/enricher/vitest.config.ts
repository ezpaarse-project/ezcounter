import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [tsconfigPaths()],
});
