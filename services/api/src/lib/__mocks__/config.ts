import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse } from 'json5';

const configPath = join(import.meta.dirname, '../../../config/default.json');

export const appConfig = parse(readFileSync(configPath, 'utf8'));
