import { describe, expect, it, vi } from 'vitest';

import { dbClient } from '~/lib/prisma';

import { mergeUpdateData, updateOneHarvestJob } from './update';
import { updateOneHarvestJobThrottled } from './update-throttled';

vi.mock(import('./update'));

describe('update one harvest job - throttled', () => {
  it('should merge updates', async () => {
    expect.assertions(1);
    vi.mocked(updateOneHarvestJob).mockRejectedValueOnce({ status: 'done' });

    // Send events of 2 jobs to check if updates are correctly merged by job id
    updateOneHarvestJobThrottled(
      {
        id: 'first-job',
        status: 'pending',
      },
      dbClient
    );
    updateOneHarvestJobThrottled(
      {
        download: {
          progress: 1,
          status: 'done',
        },
        id: 'second-job',
        status: 'processing',
      },
      dbClient
    );
    updateOneHarvestJobThrottled(
      {
        download: {
          httpCode: 500,
          status: 'processing',
        },
        id: 'first-job',
        status: 'delayed',
      },
      dbClient
    );
    updateOneHarvestJobThrottled(
      {
        download: {
          httpCode: 200,
          status: 'done',
        },
        extract: {
          status: 'done',
        },
        id: 'second-job',
        status: 'done',
      },
      dbClient
    );

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(mergeUpdateData).toHaveBeenCalledTimes(2);
  });

  it('should throttle updates', async () => {
    expect.assertions(1);
    vi.mocked(updateOneHarvestJob).mockRejectedValueOnce({ status: 'done' });

    // Send events of 2 jobs to check if updates are correctly throttled by job id
    updateOneHarvestJobThrottled(
      {
        id: 'first-job',
        status: 'pending',
      },
      dbClient
    );
    updateOneHarvestJobThrottled(
      {
        id: 'second-job',
        status: 'processing',
      },
      dbClient
    );
    updateOneHarvestJobThrottled(
      {
        id: 'first-job',
        status: 'delayed',
      },
      dbClient
    );
    updateOneHarvestJobThrottled(
      {
        id: 'second-job',
        status: 'done',
      },
      dbClient
    );

    // Let throttled function run
    await vi.runAllTimersAsync();

    // Should have been called 1 per job id
    expect(updateOneHarvestJob).toHaveBeenCalledTimes(2);
  });
});
