import { join } from 'node:path';
import { env } from 'node:process';

import { defineConfig } from 'prisma/config';

const url = URL.parse(env.POSTGRES_URL || '');
if (url) {
  url.username = env.POSTGRES_USERNAME || '';
  url.password = env.POSTGRES_PASSWORD || '';
}

export default defineConfig({
  datasource: {
    url: url?.href,
  },

  schema: join('prisma'),
});
