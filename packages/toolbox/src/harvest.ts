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

    const cause = z.validate(z.json(), error.cause) ? error.cause : undefined;

    return {
      cause,
      code: `app:${code}`,
      message: error.message,
    };
  }

  // If HarvestError
  if (z.validate(HarvestError, error)) {
    return error;
  }

  // Fallback
  return {
    code: `app:UNKNOWN_ERROR`,
    message: `${error}`,
  };
}
