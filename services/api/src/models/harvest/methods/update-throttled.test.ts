import { describe, expect, test, vi } from 'vitest';

import { mergeUpdateData, updateOneHarvestJob } from './__mocks__/update';
import { updateOneHarvestJobThrottled } from './update-throttled';

vi.mock(import('./update'));

describe(updateOneHarvestJobThrottled, () => {
  test('should merge updates', async () => {
    updateOneHarvestJob.mockRejectedValueOnce({ status: 'done' });

    // Send events of 2 jobs to check if updates are correctly merged by job id
    updateOneHarvestJobThrottled({
      id: 'first-job',
      status: 'pending',
    });
    updateOneHarvestJobThrottled({
      download: {
        progress: 1,
        status: 'done',
      },
      id: 'second-job',
      status: 'processing',
    });
    updateOneHarvestJobThrottled({
      download: {
        httpCode: 500,
        status: 'processing',
      },
      id: 'first-job',
      status: 'delayed',
    });
    updateOneHarvestJobThrottled({
      download: {
        httpCode: 200,
        status: 'done',
      },
      extract: {
        status: 'done',
      },
      id: 'second-job',
      status: 'done',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    // TODO: missing steps should NOT be undefined (just absent)
    expect(updateOneHarvestJob).toBeCalledWith(
      expect.objectContaining({
        download: {
          httpCode: 500,
          status: 'processing',
        },
        id: 'first-job',
        status: 'delayed',
      })
    );
    expect(updateOneHarvestJob).toBeCalledWith(
      expect.objectContaining({
        download: {
          httpCode: 200,
          progress: 1,
          status: 'done',
        },
        extract: {
          status: 'done',
        },
        id: 'second-job',
        status: 'done',
      })
    );
  });

  test.only('should properly merge tricky steps', async () => {
    updateOneHarvestJob.mockRejectedValueOnce({ status: 'done' });

    // Send events of 2 jobs to check if updates are correctly merged by job id
    updateOneHarvestJobThrottled({
      id: 'first-job',
      status: 'pending',
    });
    updateOneHarvestJobThrottled({
      download: {
        progress: 1,
        status: 'done',
      },
      id: 'second-job',
      status: 'processing',
    });
    updateOneHarvestJobThrottled({
      enrich: { status: 'pending' },
      id: 'second-job',
      insert: { status: 'pending' },
      status: 'processing',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(mergeUpdateData).toBeCalled();
  });

  test('should throttle updates', async () => {
    updateOneHarvestJob.mockRejectedValueOnce({ status: 'done' });

    // Send events of 2 jobs to check if updates are correctly throttled by job id
    updateOneHarvestJobThrottled({
      id: 'first-job',
      status: 'pending',
    });
    updateOneHarvestJobThrottled({
      id: 'second-job',
      status: 'processing',
    });
    updateOneHarvestJobThrottled({
      id: 'first-job',
      status: 'delayed',
    });
    updateOneHarvestJobThrottled({
      id: 'second-job',
      status: 'done',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    // Should have been called 1 per job id
    expect(updateOneHarvestJob).toBeCalledTimes(2);
  });
});
