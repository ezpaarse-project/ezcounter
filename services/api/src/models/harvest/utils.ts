import { differenceInMonths, addMonths, parse, format } from 'date-fns';

import type { HarvestReportPeriod } from './types';

const PERIOD_FORMAT = 'yyyy-MM';

/**
 * Split harvest period by a number of months
 *
 * @param period - The harvest period
 * @param monthsPerPart - Number of months per part. Must be at least `0`. If `0`, will return the whole period in an array
 *
 * @returns The periods split by given number of months
 */
export function splitPeriodByMonths(
  period: HarvestReportPeriod,
  monthsPerPart: number
): HarvestReportPeriod[] {
  if (monthsPerPart < 0) {
    throw new Error('monthsPerPart must be at least 0');
  }
  if (monthsPerPart === 0) {
    return [period];
  }

  let startDate = parse(period.start, PERIOD_FORMAT, new Date());
  let endDate = parse(period.end, PERIOD_FORMAT, new Date());

  const monthsCount = differenceInMonths(endDate, startDate) + 1;

  return Array.from({ length: Math.ceil(monthsCount / monthsPerPart) }, () => {
    // As period is inclusive, remove one month
    const partEndDate = addMonths(startDate, monthsPerPart - 1);

    const start = format(startDate, PERIOD_FORMAT);

    if (partEndDate.getTime() <= endDate.getTime()) {
      // As period is inclusive, add back missing month
      startDate = addMonths(partEndDate, 1);

      return {
        start,
        end: format(partEndDate, PERIOD_FORMAT),
      };
    }

    return {
      start,
      end: period.end,
    };
  });
}
