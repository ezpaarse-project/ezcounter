import type { CreateR5Document } from './r5';
import type { CreateR51Document } from './r51';

export * from './r5';
export * from './r51';

/**
 * Type for inserting a COUNTER document
 */
export type CreateCOUNTERDocument = CreateR5Document | CreateR51Document;
