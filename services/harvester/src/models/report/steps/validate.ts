import type { ValidateFunction } from '@ezcounter/models/lib/ajv';

// oxlint-disable import/no-namespace
import * as r5 from '@ezcounter/models/counter/r5';
import * as r51 from '@ezcounter/models/counter/r51';
// oxlint-enable import/no-namespace

import type {
  RawReportHeader,
  RawReportItem,
  RawReportException,
  RawReportItemParent,
} from '../types';

/**
 * Type for a COUNTER Report validation
 */
type CounterReportValidation = {
  header: ValidateFunction<RawReportHeader>;
  item: ValidateFunction<RawReportItem>;
  parent?: ValidateFunction<RawReportItemParent>;
};

/**
 * Type for a COUNTER validation
 *
 * Report can be unknown (custom report) and validation will be skipped, except for some cases where
 * validation should occur normally even for custom reports
 */
type CounterValidation = Partial<CounterReportValidation> & {
  exception: ValidateFunction<RawReportException>;
};

/**
 * Get validation for a COUNTER 5.1 PR report
 *
 * @param reportId - The id of the report
 *
 * @returns The validation for report parts, or `undefined` if not validation is registered for this report
 */
function getR51PRValidation(
  reportId: string
): CounterReportValidation | undefined {
  switch (reportId) {
    case 'PR':
      return {
        header: r51.PRReportHeader,
        item: r51.PRReportItem,
      };
    case 'PR_P1':
      return {
        header: r51.PRP1ReportHeader,
        item: r51.PRP1ReportItem,
      };

    default:
  }
}

/**
 * Get validation for a COUNTER 5.1 DR report
 *
 * @param reportId - The id of the report
 *
 * @returns The validation for report parts, or `undefined` if not validation is registered for this report
 */
function getR51DRValidation(
  reportId: string
): CounterReportValidation | undefined {
  switch (reportId) {
    case 'DR':
      return {
        header: r51.DRReportHeader,
        item: r51.DRReportItem,
      };
    case 'DR_D1':
      return {
        header: r51.DRD1ReportHeader,
        item: r51.DRD1ReportItem,
      };
    case 'DR_D2':
      return {
        header: r51.DRD2ReportHeader,
        item: r51.DRD2ReportItem,
      };

    default:
  }
}

/**
 * Get validation for a COUNTER 5.1 TR report
 *
 * @param reportId - The id of the report
 *
 * @returns The validation for report parts, or `undefined` if not validation is registered for this report
 */
function getR51TRValidation(
  reportId: string
): CounterReportValidation | undefined {
  switch (reportId) {
    case 'TR':
      return {
        header: r51.TRReportHeader,
        item: r51.TRReportItem,
      };
    case 'TR_B1':
      return {
        header: r51.TRB1ReportHeader,
        item: r51.TRB1ReportItem,
      };
    case 'TR_B2':
      return {
        header: r51.TRB2ReportHeader,
        item: r51.TRB2ReportItem,
      };
    case 'TR_B3':
      return {
        header: r51.TRB3ReportHeader,
        item: r51.TRB3ReportItem,
      };
    case 'TR_J1':
      return {
        header: r51.TRJ1ReportHeader,
        item: r51.TRJ1ReportItem,
      };
    case 'TR_J2':
      return {
        header: r51.TRJ2ReportHeader,
        item: r51.TRJ2ReportItem,
      };
    case 'TR_J3':
      return {
        header: r51.TRJ3ReportHeader,
        item: r51.TRJ3ReportItem,
      };
    case 'TR_J4':
      return {
        header: r51.TRJ4ReportHeader,
        item: r51.TRJ4ReportItem,
      };

    default:
  }
}

/**
 * Get validation for a COUNTER 5.1 IR report
 *
 * @param reportId - The id of the report
 *
 * @returns The validation for report parts, or `undefined` if not validation is registered for this report
 */
function getR51IRValidation(
  reportId: string
): CounterReportValidation | undefined {
  switch (reportId) {
    case 'IR':
      return {
        header: r51.IRReportHeader,
        item: r51.IRReportItem,
        parent: r51.ItemParentItem,
      };
    case 'IR_A1':
      return {
        header: r51.IRA1ReportHeader,
        item: r51.IRA1ReportItem,
        parent: r51.ItemBaseParentItem,
      };
    case 'IR_M1':
      return {
        header: r51.IRM1ReportHeader,
        item: r51.IRM1ReportItem,
      };

    default:
  }
}

/**
 * Get validation for a COUNTER 5.1 report
 *
 * @param reportId - The id of the report
 *
 * @returns The validation for report parts, or `undefined` if not validation is registered for this report
 */
function getR51Validation(
  reportId: string
): CounterReportValidation | undefined {
  switch (reportId) {
    case 'PR':
    case 'PR_P1':
      return getR51PRValidation(reportId);

    case 'DR':
    case 'DR_D1':
    case 'DR_D2':
      return getR51DRValidation(reportId);

    case 'TR':
    case 'TR_B1':
    case 'TR_B2':
    case 'TR_B3':
    case 'TR_J1':
    case 'TR_J2':
    case 'TR_J3':
    case 'TR_J4':
      return getR51TRValidation(reportId);

    case 'IR':
    case 'IR_A1':
    case 'IR_M1':
      return getR51IRValidation(reportId);

    default:
  }
}

/**
 * Get validation for a COUNTER 5 report
 *
 * @param reportId - The id of the report
 *
 * @returns The validation for report parts, or `undefined` if not validation is registered for this report
 */
function getR5Validation(
  reportId: string
): CounterReportValidation | undefined {
  const header = r5.SUSHIReportHeader;

  switch (reportId) {
    case 'PR':
    case 'PR_P1':
      return {
        header,
        item: r5.COUNTERPlatformUsage,
      };

    case 'DR':
    case 'DR_D1':
    case 'DR_D2':
      return {
        header,
        item: r5.COUNTERDatabaseUsage,
      };

    case 'TR':
    case 'TR_B1':
    case 'TR_B2':
    case 'TR_B3':
    case 'TR_J1':
    case 'TR_J2':
    case 'TR_J3':
    case 'TR_J4':
      return {
        header,
        item: r5.COUNTERTitleUsage,
      };

    case 'IR':
    case 'IR_A1':
    case 'IR_M1':
      return {
        header,
        item: r5.COUNTERItemUsage,
        parent: r5.COUNTERItemParent,
      };

    default:
  }
}

/**
 * Get validation for COUNTER report
 *
 * @param reportId - The id of the report
 *
 * @returns The validation for report parts
 */
export function getCounterValidation(
  release: string,
  reportId: string
): CounterValidation {
  switch (release) {
    case '5':
      return {
        ...getR5Validation(reportId),
        exception: r5.SUSHIErrorModel,
      };

    case '5.1':
      return {
        ...getR51Validation(reportId),
        exception: r51.Exception,
      };

    default:
      throw new Error(`COUNTER Release ${release} is unknown`);
  }
}
