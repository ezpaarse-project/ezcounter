import { describe, expect, test } from 'vitest';

import { readFileSync } from 'node:fs';

import { asHarvestError } from './harvest';

describe('Error as HarvestError (asHarvestError)', () => {
  test('should extract informations from custom error', () => {
    const err = new Error('This is an example error', {
      cause: 'The cause of the error, mainly validation errors',
    });

    let result = asHarvestError(err);

    expect(result).toMatchObject({
      code: `app:ERROR`,
      message: err.message,
      cause: err.cause,
    });
  });

  test('should extract informations from system error', () => {
    let error;
    try {
      readFileSync('file-that-will-not-exist');
      throw new Error("File shouldn't exist");
    } catch (err) {
      error = err as Error;
    }

    const result = asHarvestError(error);

    expect(result).toMatchObject({
      code: `app:ENOENT`,
      message: error.message,
    });
  });

  test('should return generic Error if not an Error', () => {
    const err = 'This error is weird';

    let result = asHarvestError(err);

    expect(result).toMatchObject({
      code: `app:UNKNOWN_ERROR`,
      message: err,
    });
  });
});
