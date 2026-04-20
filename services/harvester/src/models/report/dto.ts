import type {
  R51ReportHeader,
  R51ReportItem,
  R51ReportItemParent,
  R5ReportItem,
} from '@ezcounter/counter/dto';
import type {
  SUSHIErrorModel as R5ReportException,
  SUSHIReportHeader as R5ReportHeader,
  COUNTERItemParent as R5ReportItemParent,
} from '@ezcounter/counter/schemas/r5';
import type { Exception as R51ReportException } from '@ezcounter/counter/schemas/r51';

/**
 * Type for any report header from any COUNTER release
 */
export type COUNTERReportHeader = R5ReportHeader | R51ReportHeader;

/**
 * Type for any report item from any COUNTER release
 */
export type COUNTERReportItem = R5ReportItem | R51ReportItem;

/**
 * Type for any report item parent from any COUNTER release
 */
export type COUNTERReportItemParent = R5ReportItemParent | R51ReportItemParent;

/**
 * Type for any report exception from any COUNTER release
 */
export type COUNTERReportException = R5ReportException | R51ReportException;
