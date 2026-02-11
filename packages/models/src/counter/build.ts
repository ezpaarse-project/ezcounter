import { existsSync } from 'node:fs';
import { readFile, glob, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';

import { compile } from 'json-schema-to-typescript';

const generateTypeName = (from: string): string =>
  from
    // replace chars which are not valid for typescript identifiers
    .replace(/(^\s*[^a-zA-Z_$])|([^a-zA-Z_$\d])/g, '')
    // uppercase leading underscores followed by lowercase
    .replace(/_[a-z]/g, (match) => match.toUpperCase())
    // removes any underscore
    .replace(/_/g, '');

async function readSchema(
  schemaPath: string
): Promise<{ schema: Record<string, unknown>; patched: boolean }> {
  const patchPath = schemaPath.replace('schema.json', 'patch.ts');

  if (existsSync(patchPath)) {
    const { schema } = await import(patchPath);
    return { schema, patched: true };
  }

  return {
    schema: JSON.parse(await readFile(schemaPath, 'utf-8')),
    patched: false,
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
      ? `import { schema } from '../../src/counter/${module}/patch';`
      : `import schema from '../../src/counter/${module}/schema.json' with { type: 'json' };`,
  ].join('\n');

  const typesCode = await compile(openapi, '', {
    customName: (value, key) =>
      generateTypeName(value.title || value.$id || key || ''),
    unreachableDefinitions: true,
    format: false,
  });

  const validationCode = [
    'const ajv = new Ajv({ schemas: [schema], strict: false });',
    'addFormats(ajv);',
    ...Object.entries(openapi.definitions as Record<string, any>).map(
      ([key, value]) => {
        const name = generateTypeName(value.title || value.$id || key);
        return `export const ${name} = ajv.getSchema<${name}>('#/definitions/${key}')!;`;
      }
    ),
  ].join('\n');

  return [dependenciesCode, typesCode, validationCode].join('\n');
}

const outputDir = join(import.meta.dirname, '../../dist/counter');
await mkdir(outputDir, { recursive: true });

const schemas = glob(join(import.meta.dirname, '**/schema.json'));

for await (const schemaPath of schemas) {
  const module = basename(dirname(schemaPath));

  const { schema, patched } = await readSchema(schemaPath);
  const code = await generateTypescriptFile(schema, module, patched);

  const outPath = join(outputDir, `${module}.ts`);
  await writeFile(outPath, code, 'utf-8');
  process.stdout.write(`Validation generated at ${outPath}\n`);
}
