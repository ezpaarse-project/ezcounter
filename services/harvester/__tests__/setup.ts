import { glob, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { vol } from 'memfs';
import { afterEach, beforeEach, vi } from 'vitest';

// Mocking RabbitMQ
vi.mock('@ezcounter/rabbitmq', () => import('@ezcounter/rabbitmq/__mocks__'));
// Mocking requests
vi.mock('@ezcounter/counter', () => import('@ezcounter/counter/__mocks__'));
// Mocking FS
vi.mock(import('~/lib/fs'));
// Mocking config
vi.mock(import('~/lib/config'));
// Mocking logger
vi.mock(import('~/lib/logger'));

async function addExamplesToVol(): Promise<void> {
  // Read examples
  const state: Record<string, string> = {};

  const exampleDir = join(import.meta.dirname, 'examples');
  const examplesGlob = join(exampleDir, '**/*.json*');

  for await (const path of glob(examplesGlob)) {
    const filePath = relative(exampleDir, path);
    state[filePath] = await readFile(path, 'utf8');
  }
  // Add them to in-memory fs
  vol.fromJSON(state, '/examples');
}

beforeEach(() => {
  vi.useFakeTimers();
});

beforeEach(async () => {
  await addExamplesToVol();
});

afterEach(() => {
  vol.reset();
  vi.useRealTimers();
});
