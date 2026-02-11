import { z } from '@ezcounter/models/lib/zod';

// oxlint-disable import/no-namespace
import * as r5 from '@ezcounter/models/counter/r5';
import * as r51 from '@ezcounter/models/counter/r51';
// oxlint-enable import/no-namespace

/**
 * Type for any report item in report list from any COUNTER release
 */
export type RawReportList = (
  | r5.SUSHIReportList
  // COUNTER 5.1
  | r51.ReportInformation
)[];

/**
 * Validation for any report item in report list from any COUNTER release
 */
export const RawReportList = z.array(
  z.union([
    // COUNTER 5
    // oxlint-disable-next-line no-explicit-any - Zod JSON schema type is not the same one as AJV
    z.fromJSONSchema(r5.SUSHIReportList.schema as any),
    // COUNTER 5.1
    // oxlint-disable-next-line no-explicit-any - Zod JSON schema type is not the same one as AJV
    z.fromJSONSchema(r51.ReportInformation.schema as any),
  ])
) as z.ZodType<RawReportList>;

/**
 * Type for any report header from any COUNTER release
 */
export type RawReportHeader =
  // COUNTER 5
  | r5.SUSHIReportHeader
  // COUNTER 5.1
  //  PR
  | r51.PRReportHeader
  | r51.PRP1ReportHeader
  //  DR
  | r51.DRReportHeader
  | r51.DRD1ReportHeader
  | r51.DRD2ReportHeader
  //  TR
  | r51.TRReportHeader
  | r51.TRB1ReportHeader
  | r51.TRB2ReportHeader
  | r51.TRB3ReportHeader
  | r51.TRJ1ReportHeader
  | r51.TRJ2ReportHeader
  | r51.TRJ3ReportHeader
  | r51.TRJ4ReportHeader
  //  IR
  | r51.IRReportHeader
  | r51.IRA1ReportHeader
  | r51.IRM1ReportHeader;

/**
 * Type for any report item from any COUNTER release
 */
export type RawReportItem =
  // COUNTER 5
  | r5.COUNTERPlatformUsage
  | r5.COUNTERDatabaseUsage
  | r5.COUNTERTitleUsage
  | r5.COUNTERItemUsage
  // COUNTER 5.1
  //  PR
  | r51.PRReportItem
  | r51.PRP1ReportItem
  //  DR
  | r51.DRReportItem
  | r51.DRD1ReportItem
  | r51.DRD2ReportItem
  //  TR
  | r51.TRReportItem
  | r51.TRB1ReportItem
  | r51.TRB2ReportItem
  | r51.TRB3ReportItem
  | r51.TRJ1ReportItem
  | r51.TRJ2ReportItem
  | r51.TRJ3ReportItem
  | r51.TRJ4ReportItem
  //  IR
  | r51.IRReportItem
  | r51.IRA1ReportItem
  | r51.IRM1ReportItem;

/**
 * Type for any report item parent from any COUNTER release
 */
export type RawReportItemParent =
  // COUNTER 5
  | r5.COUNTERItemParent
  // COUNTER 5.1
  //  IR
  | r51.ItemParentItem
  //  IR_A1
  | r51.ItemBaseParentItem;

/**
 * Type for any report exception from any COUNTER release
 */
export type RawReportException =
  // COUNTER 5
  | r5.SUSHIErrorModel
  // COUNTER 5.1
  | r51.Exception;
