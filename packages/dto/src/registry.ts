import { z } from '.';

/**
 * Validation for information on registry
 */
export const RegistryInfo = z.object({
  baseURL: z.url(),
  hosts: z.number(),
  version: z.string(),
});

/**
 * Type for information on registry
 */
export type RegistryInfo = z.infer<typeof RegistryInfo>;

/**
 * Base validation for route including registry
 */
export const RouteResponseWithRegistry = z.looseObject({
  ezcRegistry: RegistryInfo,
});
