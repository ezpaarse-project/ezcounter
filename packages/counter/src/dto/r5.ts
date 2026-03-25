// oxlint-disable import/no-namespace
import type * as r5 from '../../dist/r5';
// oxlint-enable import/no-namespace

/**
 * Type for report item from COUNTER 5
 */
export type R5ReportItem =
  | r5.COUNTERPlatformUsage
  | r5.COUNTERDatabaseUsage
  | r5.COUNTERTitleUsage
  | r5.COUNTERItemUsage;

/**
 * Type for any item parent from COUNTER 5
 */
export type R5ReportItemParent = r5.COUNTERItemParent;
