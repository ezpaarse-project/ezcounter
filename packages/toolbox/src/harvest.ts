import { z } from '@ezcounter/dto';
import { HarvestError } from '@ezcounter/dto/harvest';

/**
 * Normalise error from execution
 *
 * @param error - The error that was thrown
 *
 * @returns The normalised error
 */
export function asHarvestError(error: unknown): HarvestError {
  // If a application error
  if (error instanceof Error) {
    const code = 'code' in error ? error.code : error.name.toUpperCase();

    const { data: cause } = z.json().safeParse(error.cause);

    return {
      cause,
      code: `app:${code}`,
      message: error.message,
    };
  }

  // If HarvestError
  const { data } = HarvestError.safeParse(error);
  if (data) {
    return data;
  }

  // Fallback
  return {
    code: `app:UNKNOWN_ERROR`,
    message: `${error}`,
  };
}
