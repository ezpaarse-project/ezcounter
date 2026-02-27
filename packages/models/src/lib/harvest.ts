import { z } from './zod';
import type { HarvestError } from '../types/harvest';

/**
 * Normalise error from execution
 *
 * @param err - The error that was thrown
 *
 * @returns The normalised error
 */
export function asHarvestError(err: unknown): HarvestError {
  if (err instanceof Error) {
    const code = 'code' in err ? err.code : err.name.toUpperCase();

    const { data: cause } = z.json().safeParse(err.cause);

    return {
      code: `app:${code}`,
      message: err.message,
      cause,
    };
  }

  return {
    code: `app:UNKNOWN_ERROR`,
    message: `${err}`,
  };
}
