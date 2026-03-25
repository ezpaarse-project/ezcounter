// oxlint-disable import/no-namespace
import type * as r51 from '../../dist/r51';
// oxlint-enable import/no-namespace

/**
 * Type for report header from COUNTER 5.1 release
 */
export type R51ReportHeader =
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
 * Type for any report item from COUNTER 5.1
 */
export type R51ReportItem =
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
 * Type for any item parent from COUNTER 5.1
 */
export type R51ReportItemParent =
  //  IR
  | r51.ItemParentItem
  //  IR_A1
  | r51.ItemBaseParentItem;
