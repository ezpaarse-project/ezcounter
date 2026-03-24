import type { Prisma } from '@ezcounter/database';
import type { HarvestJobData } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { dbClient } from '~/lib/prisma';

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
        release: item.download.report.release,
        params: item.download.report.params,
        dataHostId: item.download.cacheKey,
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
}
