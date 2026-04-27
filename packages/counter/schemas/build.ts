import { existsSync } from 'node:fs';
import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import { compile } from 'json-schema-to-typescript';

const generateTypeName = (from: string): string =>
  from
    // Replace chars which are not valid for typescript identifiers
    .replaceAll(/(^\s*[^a-zA-Z_$])|([^a-zA-Z_$\d])/g, '')
    // Uppercase leading underscores followed by lowercase
    .replaceAll(/_[a-z]/g, (match) => match.toUpperCase())
    // Removes any underscore
    .replaceAll('_', '');

async function readSchema(
  schemaPath: string
): Promise<{ schema: Record<string, unknown>; patched: boolean }> {
  const tsPatchPath = schemaPath.replace('schema.json', 'patch.ts');
  const jsPatchPath = schemaPath.replace('schema.json', 'patch.js');

  if (existsSync(tsPatchPath)) {
    const { schema } = await import(tsPatchPath);
    return { patched: true, schema };
  }

  if (existsSync(jsPatchPath)) {
    const { schema } = await import(jsPatchPath);
    return { patched: true, schema };
  }

  return {
    patched: false,
    schema: JSON.parse(await readFile(schemaPath, 'utf8')),
  };
}

async function generateTypescriptFile(
  openapi: Record<string, unknown>,
  module: string,
  patched: boolean
): Promise<string> {
  const dependenciesCode = [
    "import Ajv from 'ajv';",
    "import addFormats from 'ajv-formats';",
    patched
      ? `import { schema } from '../schemas/${module}/patch.js';`
      : `import schema from '../schemas/${module}/schema.json' with { type: 'json' };`,
  ].join('\n');

  const typesCode = await compile(openapi, '', {
    // Don't allow for additional properties in the schema
    additionalProperties: false,
    // Match type name with validation
    customName: (value, key) =>
      generateTypeName(((value.title ?? value.$id) || key) ?? ''),
    // Don't format dist files
    format: false,
    // Ignore min/max items in types to simplify
    ignoreMinAndMaxItems: true,
    // Don't use any
    unknownAny: true,
    // Include unreachable types
    unreachableDefinitions: true,
  });

  const validationCode = [
    'const ajv = new Ajv({ schemas: [schema], strict: false });',
    'addFormats(ajv);',
    // oxlint-disable-next-line no-explicit-any
    ...Object.entries(openapi.definitions as Record<string, any>).map(
      ([key, value]) => {
        const name = generateTypeName(value.title ?? value.$id ?? key);
        return `export const ${name} = ajv.getSchema<${name}>('#/definitions/${key}')!;`;
      }
    ),
  ].join('\n');

  return [dependenciesCode, typesCode, validationCode].join('\n');
}

const outputDir = join(import.meta.dirname, '../dist');
await mkdir(outputDir, { recursive: true });

const schemas = glob(join(import.meta.dirname, '**/schema.json'));

for await (const schemaPath of schemas) {
  const module = basename(dirname(schemaPath));

  const { schema, patched } = await readSchema(schemaPath);
  const code = await generateTypescriptFile(schema, module, patched);

  const outPath = join(outputDir, `${module}.ts`);
  await writeFile(outPath, code, 'utf8');
  process.stdout.write(`Validation generated at ${outPath}\n`);
}
