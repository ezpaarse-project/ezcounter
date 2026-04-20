import { describe, expect, test, vi } from 'vitest';

import { updateOneHarvestJob } from './__mocks__/update';
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
        done: true,
        progress: 1,
      },
      id: 'second-job',
      status: 'processing',
    });
    updateOneHarvestJobThrottled({
      download: {
        done: false,
        httpCode: 500,
      },
      id: 'first-job',
      status: 'delayed',
    });
    updateOneHarvestJobThrottled({
      download: {
        done: true,
        httpCode: 200,
      },
      extract: {
        done: true,
      },
      id: 'second-job',
      status: 'done',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(updateOneHarvestJob).toBeCalledWith({
      download: {
        done: true,
        httpCode: 200,
        progress: 1,
      },
      extract: {
        done: true,
      },
      id: 'second-job',
      status: 'done',
    });
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
