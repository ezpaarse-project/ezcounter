import { join } from 'node:path';

import { defineConfig, env } from 'prisma/config';

const url = new URL(env('POSTGRES_URL'));
url.username = env('POSTGRES_USERNAME');
url.password = env('POSTGRES_PASSWORD');

export default defineConfig({
  datasource: {
    url: url.href,
  },

  schema: join('prisma'),
});
