import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ofetch } from 'ofetch';

const REPO = `Project-Counter/cop5`;
const JSON_SPACING = 2;

/**
 * Removes unused properties and apply syntax patchs
 *
 * @param def - The definition
 */
// oxlint-disable-next-line typescript/no-explicit-any
const cleanDefinition = (def: any): void => {
  // Skip non records properties
  if (typeof def !== 'object') {
    return;
  }

  for (const [key, value] of Object.entries(def)) {
    // Remove examples (unused for validation and take a lot of space)
    // Remove app specific (x-*)
    if (key === 'examples' || key.startsWith('x-')) {
      // oxlint-disable-next-line typescript/no-dynamic-delete
      delete def[key];
    }
    // Fix refs
    if (key === '$ref' && typeof value === 'string') {
      def[key] = value.replace(/(?<r51>components\/schemas)/v, 'definitions');
    }
    // Fix typo in format
    if (key === 'format' && value === 'dateTime') {
      def[key] = 'date-time';
    }

    // Clean sub properties
    cleanDefinition(value);
  }
};

// Get branches from GitHub
const branches = await ofetch<{ name: string }[]>(
  `https://api.github.com/repos/${REPO}/branches`
);

// Resolve release (r5, r51, etc.) and keep track of last branch
const releases = new Map(
  branches
    .map((branch) => {
      const matches =
        /^(?<major>\d+\.\d+)(?<minor>\.\d+)?(?<patch>\.\d+)?$/v.exec(
          branch.name
        );

      const major = matches?.groups?.major ?? '';
      const release = major.replace(/\.0+$/v, '').replaceAll('.', '');

      return [major && `r${release}`, branch.name];
    })
    .filter(([key]) => Boolean(key)) as [string, string][]
);
process.stdout.write(
  `Got versions: [${[...releases].map(([release, branch]) => `${release} => ${branch}`).join(', ')}]\n`
);

// Update schemas
await Promise.all(
  [...releases].map(async ([release, branch]) => {
    // Path to OpenAPI
    let openApiPath = 'api-specification/COUNTER_API.json';
    switch (release) {
      case 'r5':
        openApiPath = 'sushi-api/sushi.json';
        break;
      default:
        break;
    }

    // Fetch schema
    const schema = await ofetch(
      `https://raw.githubusercontent.com/${REPO}/refs/heads/${branch}/${openApiPath}`,
      { responseType: 'json' }
    );

    // Extract informations
    const { openapi, info } = schema;
    const definitions = schema.definitions || schema.components.schemas;
    cleanDefinition(definitions);

    const definitionCount = Object.keys(definitions).length;
    process.stdout.write('\n');
    process.stdout.write(`Got schema: ${info.version}\n`);
    process.stdout.write(`Got definitions: ${definitionCount}\n`);

    // Write file
    if (definitionCount > 0) {
      const path = join(import.meta.dirname, release);
      await mkdir(path, { recursive: true });

      await writeFile(
        join(path, 'schema.json'),
        JSON.stringify(
          // oxlint-disable-next-line sort-keys
          {
            openapi,
            info,
            definitions,
          },
          undefined,
          JSON_SPACING
        ),
        'utf8'
      );
      process.stdout.write(`Wrote schema.json: ${path}\n`);
    }
  })
);
