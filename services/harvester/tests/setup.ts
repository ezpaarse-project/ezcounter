import { glob, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { afterEach, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';

// Mocking FS
vi.mock(import('~/lib/fs'));
// Mocking logger
vi.mock(import('~/lib/logger'));

async function addExamplesToVol(): Promise<void> {
  // read examples
  const state: Record<string, string> = {};

  const exampleDir = join(import.meta.dirname, 'examples');
  const examplesGlob = join(exampleDir, '**/*.json*');

  for await (const path of glob(examplesGlob)) {
    const filePath = relative(exampleDir, path);
    state[filePath] = await readFile(path, 'utf-8');
  }
  // add them to in-memory fs
  vol.fromJSON(state, '/examples');
}

beforeEach(async () => {
  // add default state of in-memory fs
  await addExamplesToVol();
});

afterEach(() => {
  // reset the state of in-memory fs
  vol.reset();
});
