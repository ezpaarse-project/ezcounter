import { max, min } from 'date-fns';

import type { HarvestReportOptions } from '@ezcounter/dto/harvest';

import type { DataHostSupportedReport } from '~/models/data-host/dto';

import { formatPeriod, parsePeriod } from './period';

/**
 * Limit options to harvest report by the supported data of data host
 *
 * @param report - The report options
 * @param supported - Supported reports for report's release
 *
 * @returns The limited report options, or `null` if we must skip the report
 */
export function limitReportOptionsWithSupported(
  report: HarvestReportOptions,
  supported: DataHostSupportedReport | undefined
): HarvestReportOptions | null {
  // If we don't have info about report -> Consider it as valid
  if (!supported) {
    return report;
  }

  // If marked as unsupported -> Skip report
  if (!supported.supported) {
    return null;
  }

  // Using parsePeriod on months available cause they're in the same format
  // Empty strings are considered as "no limit", so we fallback on period
  const { start: firstMonthAvailable, end: lastMonthAvailable } = parsePeriod({
    end: supported.lastMonthAvailable || report.period.end,
    start: supported.firstMonthAvailable || report.period.start,
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
