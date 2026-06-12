import { describe, expect, test, vi } from 'vitest';

import { mergeUpdateData, updateOneHarvestJob } from './update';
import { updateOneHarvestJobThrottled } from './update-throttled';

vi.mock(import('./update'));

describe(updateOneHarvestJobThrottled, () => {
  test('should merge updates', async () => {
    vi.mocked(updateOneHarvestJob).mockRejectedValueOnce({ status: 'done' });

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

    expect(mergeUpdateData).toHaveBeenCalled();
  });

  test('should throttle updates', async () => {
    vi.mocked(updateOneHarvestJob).mockRejectedValueOnce({ status: 'done' });

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
    expect(updateOneHarvestJob).toHaveBeenCalledTimes(2);
  });
});
