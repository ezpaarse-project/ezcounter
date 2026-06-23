import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { asHarvestError } from './harvest';

describe('transform Error as HarvestError', () => {
  it('should extract informations from custom error', () => {
    expect.assertions(1);

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

  it('should extract informations from system error', () => {
    expect.assertions(1);

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

  it('should return generic Error if not an Error', () => {
    expect.assertions(1);

    const err = 'This error is weird';

    const result = asHarvestError(err);

    expect(result).toMatchObject({
      code: `app:UNKNOWN_ERROR`,
      message: err,
    });
  });
});
