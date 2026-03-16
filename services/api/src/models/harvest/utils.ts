import { randomUUID } from 'node:crypto';

import {
  differenceInMonths,
  addMonths,
  parse,
  format,
  max,
  min,
  type Interval,
} from 'date-fns';

import type { HarvestJobData } from '@ezcounter/models/queues';

import type {
  DataHostSupportedRelease,
  DataHostSupportedReport,
  DataHostWithSupportedData,
} from '~/models/data-host/types';
import { getDataHostWithSupportedData } from '~/models/data-host';

import type {
  HarvestReportOptions,
  HarvestReportPeriod,
  HarvestRequest,
} from './types';

const PERIOD_FORMAT = 'yyyy-MM';

/**
 * Shorthand to parse a HarvestReportPeriod as Dates
 *
 * @param period - The period
 * @param referenceDate - The date of reference
 *
 * @returns The parsed period
 */
const parsePeriod = (
  period: HarvestReportPeriod,
  referenceDate = new Date()
): Interval<Date, Date> => ({
  start: parse(period.start, PERIOD_FORMAT, referenceDate),
  end: parse(period.end, PERIOD_FORMAT, referenceDate),
});

/**
 * Shorthand to format Dates as a HarvestReportPeriod
 *
 * @param period - The period
 *
 * @returns The formatted period
 */
const formatPeriod = (period: Interval): HarvestReportPeriod => ({
  start: format(period.start, PERIOD_FORMAT),
  end: format(period.end, PERIOD_FORMAT),
});

/**
 * Split harvest period by a number of months
 *
 * @param period - The harvest period
 * @param monthsPerPart - Number of months per part. Must be at least `0`. If `0`, will return the whole period in an array
 *
 * @returns The periods split by given number of months
 */
function splitPeriodByMonths(
  period: HarvestReportPeriod,
  monthsPerPart: number
): HarvestReportPeriod[] {
  if (monthsPerPart < 0) {
    throw new Error('monthsPerPart must be at least 0');
  }
  if (monthsPerPart === 0) {
    return [period];
  }

  let { start, end } = parsePeriod(period);
  const monthsCount = differenceInMonths(end, start) + 1;

  return Array.from({ length: Math.ceil(monthsCount / monthsPerPart) }, () => {
    // As period is inclusive, remove one month
    const partEndDate = addMonths(start, monthsPerPart - 1);

    const startStr = format(start, PERIOD_FORMAT);

    if (partEndDate.getTime() <= end.getTime()) {
      // As period is inclusive, add back missing month
      start = addMonths(partEndDate, 1);

      return {
        start: startStr,
        end: format(partEndDate, PERIOD_FORMAT),
      };
    }

    return {
      start: startStr,
      end: period.end,
    };
  });
}

/**
 * Get supported data from report options
 *
 * @param report - The report options
 * @param dataHost - Data host with supported data
 *
 * @returns The supported data
 */
function getSupportedDataForReport(
  report: HarvestReportOptions,
  { supportedReleases }: DataHostWithSupportedData
): {
  release?: DataHostSupportedRelease;
  report?: DataHostSupportedReport;
} {
  const supportedRelease = supportedReleases.find(
    ({ release }) => release === report.release
  );

  const supportedReport = supportedRelease?.supportedReports.find(
    ({ id }) => id === report.id
  );

  return {
    release: supportedRelease,
    report: supportedReport,
  };
}

/**
 * Limit options to harvest report by the supported data of data host
 *
 * @param report - The report options
 * @param supportedData - Supported data
 *
 * @returns The limited report options, or `null` if we must skip the report
 */
function limitHarvestWithSupported(
  report: HarvestReportOptions,
  supportedData: {
    release?: DataHostSupportedRelease;
    report?: DataHostSupportedReport;
  }
): HarvestReportOptions | null {
  // If release is not supported by endpoint -> Skip report
  if (!supportedData.release) {
    return null;
  }
  // If we don't have info about report -> Consider it as valid
  if (!supportedData.report) {
    return report;
  }

  const supported =
    supportedData.report.supportedOverride ?? supportedData.report.supported;
  // If marked as unsupported -> Skip report
  if (supported === false) {
    return null;
  }

  // Using parsePeriod on months available cause they're in the same format
  // Empty strings are considered as "no limit", so we fallback on period
  const { start: firstMonthAvailable, end: lastMonthAvailable } = parsePeriod({
    start:
      (supportedData.report.firstMonthAvailableOverride ??
        supportedData.report.firstMonthAvailable) ||
      report.period.start,
    end:
      (supportedData.report.lastMonthAvailableOverride ??
        supportedData.report.lastMonthAvailable) ||
      report.period.end,
  });

  let { start, end } = parsePeriod(report.period);

  return {
    ...report,
    period: formatPeriod({
      start: max([start, firstMonthAvailable]),
      end: min([end, lastMonthAvailable]),
    }),
  };
}

/**
 * Transform a HarvestRequest into a HarvestJobData ready to be queued
 *
 * @param request - The harvest request
 *
 * @return The jobs matching request
 */
export async function prepareHarvestJobs(
  request: HarvestRequest
): Promise<HarvestJobData[]> {
  const {
    reports,
    dataHost: { id: dataHostId, ...dataHostOpts },
    ...downloadOpts
  } = request.download;

  const dataHost = await getDataHostWithSupportedData(dataHostId);
  if (!dataHost) {
    throw new Error(`Data host ${dataHostId} is not registered`);
  }

  return reports
    .flatMap(({ splitPeriodBy, ...reportOpts }) => {
      const supportedData = getSupportedDataForReport(reportOpts, dataHost);

      const report = limitHarvestWithSupported(reportOpts, supportedData);
      if (!report) {
        return null;
      }

      const parts = splitPeriodByMonths(report.period, splitPeriodBy || 0);
      // oxlint-disable-next-line no-map-spread - avoid updating request
      return parts.map((period) => ({
        ...request,
        id: randomUUID(),
        download: {
          ...downloadOpts,
          cacheKey: dataHostId,
          report: {
            ...report,
            period,
          },
          dataHost: {
            ...dataHostOpts,
            baseUrl: supportedData.release!.baseUrl,
            periodFormat: dataHost.periodFormat,
            paramsSeparator: dataHost.paramsSeparator,
            additionalParams: dataHost.params,
          },
        },
      }));
    })
    .filter((job) => job != null);
}
