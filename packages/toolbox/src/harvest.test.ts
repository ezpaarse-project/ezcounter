import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

import { asHarvestError } from './harvest';

describe('Error as HarvestError (asHarvestError)', () => {
  test('should extract informations from custom error', () => {
    const err = new Error('This is an example error', {
      cause: 'The cause of the error, mainly validation errors',
    });

    const result = asHarvestError(err);

    expect(result).toMatchObject({
      cause: err.cause,
      code: `app:ERROR`,
      message: err.message,
    });
  });

  test('should extract informations from system error', () => {
    let err = null;
    try {
      readFileSync('file-that-will-not-exist');
      throw new Error("File shouldn't exist");
    } catch (error) {
      err = error as Error;
    }

    const result = asHarvestError(err);

    expect(result).toMatchObject({
      code: `app:ENOENT`,
      message: err.message,
    });
  });

  test('should return generic Error if not an Error', () => {
    const err = 'This error is weird';

    const result = asHarvestError(err);

    expect(result).toMatchObject({
      code: `app:UNKNOWN_ERROR`,
      message: err,
    });
  });
});
