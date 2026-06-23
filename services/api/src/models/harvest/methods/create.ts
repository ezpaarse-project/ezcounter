import type { Prisma } from '@ezcounter/database';
import type { HarvestJobData } from '@ezcounter/dto/queues';
import { EnrichSource } from '@ezcounter/dto/enrich';

import { appLogger } from '~/lib/logger';
import { dbClient } from '~/lib/prisma';

const logger = appLogger.child({ model: 'harvest', scope: 'models' });

/**
 * Create many Harvest Jobs from data that will be passed in queues
 *
 * @param items - The harvest jobs to create
 * @param requestId - The ID of the request
 * @param tx - The DB client (can be a transaction)
 */
export async function createManyHarvestJob(
  items: HarvestJobData[],
  requestId: string,
  tx: Prisma.TransactionClient = dbClient
): Promise<void> {
  await tx.harvestJob.createMany({
    data: items.map((item): Prisma.HarvestJobCreateManyInput => {
      const enrichSources =
        item.enrich?.sources ?? Object.values(EnrichSource.enum);
      return {
        dataHostId: item.download.cacheKey,
        enrich: { status: enrichSources.length === 0 ? 'skipped' : 'pending' },
        enrichSources,
        forceDownload: item.download.forceDownload,
        id: item.id,
        index: item.insert.index,
        params: item.download.report.params,
        period: item.download.report.period,
        release: item.download.release,
        reportId: item.download.report.id,
        requestId,
        status: 'pending',
      };
    }),
  });

  logger.trace({
    action: 'Created',
    count: items.length,
    msg: 'Created multiple harvests',
  });
}
