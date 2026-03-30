import type { Prisma } from '@ezcounter/database';
import type { HarvestJobData } from '@ezcounter/dto/queues';

import { appLogger } from '~/lib/logger';
import { dbClient } from '~/lib/prisma';

const logger = appLogger.child({ model: 'harvest', scope: 'models' });

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
        dataHostId: item.download.cacheKey,
        forceDownload: item.download.forceDownload,
        id: item.id,
        index: item.insert.index,
        params: item.download.report.params,
        period: item.download.report.period,
        release: item.download.report.release,
        reportId: item.download.report.id,

        status: 'pending',
      })
    ),
  });

  logger.debug({
    action: 'Created',
    count: items.length,
    msg: 'Created multiple harvests',
  });
}
