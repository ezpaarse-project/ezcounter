import {
  type Interval,
  addMonths,
  differenceInMonths,
  format,
  parse,
} from 'date-fns';

import type { HarvestReportPeriod } from '@ezcounter/dto/harvest';
import { PERIOD_FORMAT } from '@ezcounter/counter';

/**
 * Shorthand to parse a HarvestReportPeriod as Dates
 *
 * @param period - The period
 * @param referenceDate - The date of reference
 *
 * @returns The parsed period
 */
export const parsePeriod = (
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
export const formatPeriod = (period: Interval): HarvestReportPeriod => ({
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
