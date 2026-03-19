// oxlint-disable import/no-namespace
import type * as r5 from '@ezcounter/counter/schemas/r5';
import type * as r51 from '@ezcounter/counter/schemas/r51';
// oxlint-enable import/no-namespace
import type {
  R5ReportItem,
  R51ReportHeader,
  R51ReportItem,
  R51ReportItemParent,
} from '@ezcounter/counter/types';

/**
 * Type for any report header from any COUNTER release
 */
export type COUNTERReportHeader = r5.SUSHIReportHeader | R51ReportHeader;

/**
 * Type for any report item from any COUNTER release
 */
export type COUNTERReportItem = R5ReportItem | R51ReportItem;

/**
 * Type for any report item parent from any COUNTER release
 */
export type COUNTERReportItemParent =
  | r5.COUNTERItemParent
  | R51ReportItemParent;

/**
 * Type for any report exception from any COUNTER release
 */
export type COUNTERReportException = r5.SUSHIErrorModel | r51.Exception;
