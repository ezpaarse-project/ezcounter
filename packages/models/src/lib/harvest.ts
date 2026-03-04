import { z } from './zod';
import { HarvestError } from '../types/harvest';

/**
 * Normalise error from execution
 *
 * @param err - The error that was thrown
 *
 * @returns The normalised error
 */
export function asHarvestError(err: unknown): HarvestError {
  // If a application error
  if (err instanceof Error) {
    const code = 'code' in err ? err.code : err.name.toUpperCase();

    const { data: cause } = z.json().safeParse(err.cause);

    return {
      code: `app:${code}`,
      message: err.message,
      cause,
    };
  }

  // If HarvestError
  const { data } = HarvestError.safeParse(err);
  if (data) {
    return data;
  }

  // Fallback
  return {
    code: `app:UNKNOWN_ERROR`,
    message: `${err}`,
  };
}
