import {
  endOfMonth,
  format as formatDate,
  parse as parseDate,
  startOfMonth,
} from 'date-fns';

const PERIOD_FORMAT = 'yyyy-MM';

/**
 * Format start date to request report
 *
 * @param dateMonth - The month from DownloadOptions
 * @param [format] - The format, default to `yyyy-MM-dd`
 *
 * @returns The formatted date
 */
function formatStartReportDate(
  dateMonth: string,
  format = 'yyyy-MM-dd'
): string {
  const date = parseDate(dateMonth, PERIOD_FORMAT, new Date());

  return formatDate(startOfMonth(date), format);
}

/**
 * Format end date to request report
 *
 * @param dateMonth - The month from DownloadOptions
 * @param [format] - The format, default to `yyyy-MM-dd`
 *
 * @returns The formatted date
 */
function formatEndReportDate(dateMonth: string, format = 'yyyy-MM-dd'): string {
  const date = parseDate(dateMonth, PERIOD_FORMAT, new Date());

  return formatDate(endOfMonth(date), format);
}

/**
 * Format period to request report
 *
 * @param period - The period from DownloadOptions
 * @param [format] - The format, default to `yyyy-MM-dd`
 *
 * @returns The formatted period
 */
export const formatReportPeriod = (
  period: { start: string; end: string },
  format = 'yyyy-MM-dd'
): { begin_date: string; end_date: string } => ({
  begin_date: formatStartReportDate(period.start, format),
  end_date: formatEndReportDate(period.end, format),
});
