import { readFile } from 'node:fs/promises';

import type { RolldownPlugin } from 'rolldown';
import json5 from 'json5';

/**
 * Custom plugin to handle node-config files
 *
 * - JSON files are actually JSON5 (node-config supports theses, rolldown doesn't)
 * - Compile environment definition (less code, doesn't need ts-node at runtime)
 *
 * @returns Rolldown plugin
 */
export const nodeConfigPlugin = (): RolldownPlugin =>
  ({
    async load(id) {
      // Compile env definition
      if (id.endsWith('custom-environment-variables.ts')) {
        const { default: envDefinition } = await import(id);
        return {
          code: JSON.stringify(envDefinition),
          moduleType: 'json',
        };
      }
      // Treat json files as JSON5
      if (id.endsWith('.json')) {
        const data = json5.parse(await readFile(id, 'utf8'));
        return {
          code: JSON.stringify(data),
          moduleType: 'json',
        };
      }
    },
    name: 'node-config',
  }) as RolldownPlugin;
