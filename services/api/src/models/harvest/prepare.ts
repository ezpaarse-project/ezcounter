import { randomUUID } from 'node:crypto';

import {
  type Interval,
  addMonths,
  differenceInMonths,
  format,
  max,
  min,
  parse,
} from 'date-fns';

import type {
  HarvestJobData,
  HarvestRequestContent,
  HarvestRequestData,
} from '@ezcounter/dto/queues';
import { PERIOD_FORMAT } from '@ezcounter/counter';

import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
  DataHostWithSupportedData,
} from '~/models/data-host/dto';
import { getDataHostWithSupportedData } from '~/models/data-host';

import type { HarvestReportOptions, HarvestReportPeriod } from './dto';

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
  end: parse(period.end, PERIOD_FORMAT, referenceDate),
  start: parse(period.start, PERIOD_FORMAT, referenceDate),
});

/**
 * Shorthand to format Dates as a HarvestReportPeriod
 *
 * @param period - The period
 *
 * @returns The formatted period
 */
const formatPeriod = (period: Interval): HarvestReportPeriod => ({
  end: format(period.end, PERIOD_FORMAT),
  start: format(period.start, PERIOD_FORMAT),
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

  const parsedPeriod = parsePeriod(period);
  const monthsCount =
    differenceInMonths(parsedPeriod.end, parsedPeriod.start) + 1;

  return Array.from({ length: Math.ceil(monthsCount / monthsPerPart) }, () => {
    // As period is inclusive, remove one month
    const partEndDate = addMonths(parsedPeriod.start, monthsPerPart - 1);

    const startStr = format(parsedPeriod.start, PERIOD_FORMAT);

    if (partEndDate.getTime() <= parsedPeriod.end.getTime()) {
      // As period is inclusive, add back missing month
      parsedPeriod.start = addMonths(partEndDate, 1);

      return {
        end: format(partEndDate, PERIOD_FORMAT),
        start: startStr,
      };
    }

    return {
      end: period.end,
      start: startStr,
    };
  });
}

type SupportedData = {
  release?: DataHostSupportedRelease;
  report?: DataHostSupportedReport;
};

/**
 * Get supported data from report options
 *
 * @param report - The report options
 * @param dataHost - Data host with supported data
 * @param dataHost.supportedReleases - Supported releases
 *
 * @returns The supported data
 */
function getSupportedDataForReport(
  report: HarvestReportOptions,
  { supportedReleases }: DataHostWithSupportedData
): SupportedData {
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
  supportedData: SupportedData
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
  if (!supported) {
    return null;
  }

  // Using parsePeriod on months available cause they're in the same format
  // Empty strings are considered as "no limit", so we fallback on period
  const { start: firstMonthAvailable, end: lastMonthAvailable } = parsePeriod({
    end:
      (supportedData.report.lastMonthAvailableOverride ??
        supportedData.report.lastMonthAvailable) ||
      report.period.end,
    start:
      (supportedData.report.firstMonthAvailableOverride ??
        supportedData.report.firstMonthAvailable) ||
      report.period.start,
  });

  const { start, end } = parsePeriod(report.period);

  return {
    ...report,
    period: formatPeriod({
      end: min([end, lastMonthAvailable]),
      start: max([start, firstMonthAvailable]),
    }),
  };
}

/**
 * Transform a HarvestRequest into a HarvestJob ready to be sent to harvesters
 *
 * @param request - The HarvestRequest
 * @param request.download - The download options of the request
 * @param request.download.reports - The reports to harvest
 * @param request.download.dataHost - The data host options of the request
 * @param request.download.dataHost.id - The ID of data host
 * @param report - The report options
 * @param dataHost - The data host
 *
 *
 * @returns The job
 */
const createJobFromRequest = (
  {
    download: {
      reports: __,
      dataHost: { id: cacheKey, ...dataHostOpts },
      ...downloadOpts
    },
    ...request
  }: HarvestRequestContent,
  report: HarvestReportOptions,
  dataHost: DataHost & {
    supportedData: SupportedData;
  }
): HarvestJobData => ({
  ...request,
  download: {
    ...downloadOpts,
    cacheKey,
    dataHost: {
      ...dataHostOpts,
      baseUrl: dataHost.supportedData.release?.baseUrl || '',
      paramsSeparator: dataHost.paramsSeparator,
      periodFormat: dataHost.periodFormat,
    },
    report: {
      ...report,
      params: {
        ...dataHost.params,
        ...dataHost.supportedData.release?.params,
        ...dataHost.supportedData.report?.params,
        ...report.params,
      },
    },
  },
  id: randomUUID(),
});

/**
 * Transform a HarvestRequest into HarvestJobData ready to be queued
 *
 * @param request - The harvest request
 *
 * @returns The jobs matching request
 */
export async function prepareHarvestJobsFromHarvestRequestContent(
  request: HarvestRequestContent
): Promise<HarvestJobData[]> {
  const dataHost = await getDataHostWithSupportedData(
    request.download.dataHost.id
  );

  if (!dataHost) {
    throw new Error(
      `Data host ${request.download.dataHost.id} is not registered`
    );
  }

  return request.download.reports
    .flatMap(({ splitPeriodBy, ...reportOpts }) => {
      const supportedData = getSupportedDataForReport(reportOpts, dataHost);

      const report = limitHarvestWithSupported(reportOpts, supportedData);
      if (!report) {
        return null;
      }

      const parts = splitPeriodByMonths(report.period, splitPeriodBy ?? 0);
      return parts.map((period) =>
        createJobFromRequest(
          request,
          { ...report, period },
          { ...dataHost, supportedData }
        )
      );
    })
    .filter((job) => job != null);
}

/**
 * Transform many HarvestRequests into HarvestJobData ready to be queued
 *
 * @param requests - The harvest requests
 *
 * @returns The jobs matching requests
 */
export async function prepareHarvestJobsFromHarvestRequest(
  requests: HarvestRequestData
): Promise<HarvestJobData[]> {
  const jobsPerRequest = await Promise.all(
    requests.map((req) => prepareHarvestJobsFromHarvestRequestContent(req))
  );

  return jobsPerRequest.flat();
}
