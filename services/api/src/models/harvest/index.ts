import { addMonths, differenceInMonths, format, parse } from 'date-fns';

import type { HarvestJobData } from '@ezcounter/models/queues';
import type { Prisma } from '@ezcounter/database/types';

import { dbClient } from '~/lib/prisma';
import { appLogger } from '~/lib/logger';

import type { HarvestError, HarvestReportPeriod } from './types';

const PERIOD_FORMAT = 'yyyy-MM';

const logger = appLogger.child({ scope: 'models', model: 'harvest' });

/**
 * Create many Harvest Jobs from data that will be passed in queues
 *
 * @param items - The harvest jobs to create
 */
export async function createManyHarvestJob(
  items: HarvestJobData[]
): Promise<void> {
  await dbClient.harvestJob.createMany({
    data: items.map(
      (item): Prisma.HarvestJobCreateManyInput => ({
        id: item.id,
        reportId: item.download.report.id,
        period: item.download.report.period,
        periodFormat: item.download.dataHost.periodFormat,
        release: item.download.report.release,
        params: {
          ...item.download.dataHost.additionalParams,
          ...item.download.report.params,
        },
        paramsSeparator: item.download.dataHost.paramsSeparator,
        baseUrl: item.download.dataHost.baseUrl,
        timeout: item.download.timeout,
        forceDownload: item.download.forceDownload,
        index: item.insert.index,

        status: 'pending',
      })
    ),
  });

  logger.debug({
    action: 'Created',
    msg: 'Created multiple harvests',
    count: items.length,
  });

  // return jobs.map((job) => {
  //   const { data, error } = HarvestJob.safeParse(job);
  //   if (!data) {
  //     throw new Error(`Failed to parse ${job.id}`, {
  //       cause: error,
  //     });
  //   }
  //   return data;
  // });
}

/**
 * Mark many Harvest Jobs as failed with provided errors
 *
 * @param items - The harvest jobs IDs with error
 */
export async function failManyHarvestJob(
  items: { id: string; error: HarvestError }[]
): Promise<void> {
  await dbClient.$transaction(
    items.map((item) =>
      dbClient.harvestJob.update({
        where: { id: item.id },
        data: { status: 'error', error: item.error },
      })
    )
  );

  logger.debug({
    action: 'Updated',
    msg: 'Updated multiple harvests',
    count: items.length,
  });
}

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
